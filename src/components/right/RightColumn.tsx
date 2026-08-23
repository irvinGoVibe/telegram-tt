import type { FC } from '@teact';
import { memo, useEffect, useRef, useState } from '@teact';
import { getActions, withGlobal } from '../../global';

import type { AnimationLevel, ProfileTabType, ThreadId } from '../../types';
import { ManagementScreens, NewChatMembersProgress, ProfileState, RightColumnContent } from '../../types';

import { ANIMATION_END_DELAY, MIN_SCREEN_WIDTH_FOR_STATIC_RIGHT_COLUMN } from '../../config';
import { getIsSavedDialog } from '../../global/helpers';
import {
  selectAreActiveChatsLoaded,
  selectCurrentMessageList,
  selectIsChatWithSelf,
  selectRightColumnContentKey,
  selectTabState,
} from '../../global/selectors';
import { selectSharedSettings } from '../../global/selectors/sharedState.ts';
import captureEscKeyListener from '../../util/captureEscKeyListener';
import { resolveTransitionName } from '../../util/resolveTransitionName.ts';

import useCurrentOrPrev from '../../hooks/useCurrentOrPrev';
import useHistoryBack from '../../hooks/useHistoryBack';
import useLastCallback from '../../hooks/useLastCallback';
import useLayoutEffectWithPrevDeps from '../../hooks/useLayoutEffectWithPrevDeps';
import useScrollNotch from '../../hooks/useScrollNotch.ts';
import useWindowSize from '../../hooks/window/useWindowSize';

import ThreadAssistantDrawer from '../thread/ThreadAssistantDrawer';
import Transition from '../ui/Transition';
import AddChatMembers from './AddChatMembers';
import CreateTopic from './CreateTopic.async';
import EditTopic from './EditTopic.async';
import GifSearch from './GifSearch.async';
import Management from './management/Management.async';
import PollResults from './PollResults.async';
import Profile from './Profile';
import RightHeader from './RightHeader';
import BoostStatistics from './statistics/BoostStatistics';
import MessageStatistics from './statistics/MessageStatistics.async';
import MonetizationStatistics from './statistics/MonetizationStatistics';
import Statistics from './statistics/Statistics.async';
import StoryStatistics from './statistics/StoryStatistics.async';
import StickerSearch from './StickerSearch.async';

import './RightColumn.scss';

interface OwnProps {
  isMobile?: boolean;
}

type StateProps = {
  contentKey?: RightColumnContent;
  chatId?: string;
  threadId?: ThreadId;
  isChatSelected: boolean;
  animationLevel: AnimationLevel;
  shouldSkipHistoryAnimations?: boolean;
  nextManagementScreen?: ManagementScreens;
  nextProfileTab?: ProfileTabType;
  shouldCloseRightColumn?: boolean;
  isSavedMessages?: boolean;
  isSavedDialog?: boolean;
};

const ANIMATION_DURATION = 450 + ANIMATION_END_DELAY;
const MAIN_SCREENS_COUNT = Object.keys(RightColumnContent).length / 2;
const MANAGEMENT_SCREENS_COUNT = Object.keys(ManagementScreens).length / 2;
const ASSISTANT_WIDTH_STORAGE_KEY = 'telegram-thread.assistant-width';
const MIN_ASSISTANT_WIDTH = 320;
const MAX_ASSISTANT_WIDTH = 720;
const MIN_MIDDLE_COLUMN_WIDTH = 480;

function blurSearchInput() {
  const searchInput = document.querySelector('.RightHeader .SearchInput input') as HTMLInputElement;
  if (searchInput) {
    searchInput.blur();
  }
}

const RightColumn: FC<OwnProps & StateProps> = ({
  contentKey,
  chatId,
  threadId,
  isMobile,
  isChatSelected,
  animationLevel,
  shouldSkipHistoryAnimations,
  nextManagementScreen,
  nextProfileTab,
  shouldCloseRightColumn,
  isSavedMessages,
  isSavedDialog,
}) => {
  const {
    toggleChatInfo,
    toggleManagement,
    setStickerSearchQuery,
    setGifSearchQuery,
    closePollResults,
    addChatMembers,
    setNewChatMembersDialogState,
    setEditingExportedInvite,
    toggleStatistics,
    toggleMessageStatistics,
    toggleStoryStatistics,
    setOpenedInviteInfo,
    requestNextManagementScreen,
    resetNextProfileTab,
    closeCreateTopicPanel,
    closeEditTopicPanel,
    closeBoostStatistics,
    setShouldCloseRightColumn,
    closeMonetizationStatistics,
    toggleThreadAssistant,
  } = getActions();

  const containerRef = useRef<HTMLDivElement>();
  const assistantResizeStartXRef = useRef(0);
  const assistantResizeStartWidthRef = useRef(0);

  const { width: windowWidth } = useWindowSize();
  const [profileState, setProfileState] = useState<ProfileState>(
    isSavedMessages && !isSavedDialog ? ProfileState.SavedDialogs : ProfileState.Profile,
  );
  const [managementScreen, setManagementScreen] = useState<ManagementScreens>(ManagementScreens.Initial);
  const [selectedChatMemberId, setSelectedChatMemberId] = useState<string | undefined>();
  const [isPromotedByCurrentUser, setIsPromotedByCurrentUser] = useState<boolean | undefined>();
  const isScrolledDown = profileState !== ProfileState.Profile;

  const isOpen = contentKey !== undefined;
  const isThreadAssistant = contentKey === RightColumnContent.ThreadAssistant;
  const isProfile = contentKey === RightColumnContent.ChatInfo;
  const isManagement = contentKey === RightColumnContent.Management;
  const isStatistics = contentKey === RightColumnContent.Statistics;
  const isMessageStatistics = contentKey === RightColumnContent.MessageStatistics;
  const isStoryStatistics = contentKey === RightColumnContent.StoryStatistics;
  const isBoostStatistics = contentKey === RightColumnContent.BoostStatistics;
  const isMonetizationStatistics = contentKey === RightColumnContent.MonetizationStatistics;
  const isStickerSearch = contentKey === RightColumnContent.StickerSearch;
  const isGifSearch = contentKey === RightColumnContent.GifSearch;
  const isPollResults = contentKey === RightColumnContent.PollResults;
  const isAddingChatMembers = contentKey === RightColumnContent.AddingMembers;
  const isCreatingTopic = contentKey === RightColumnContent.CreateTopic;
  const isEditingTopic = contentKey === RightColumnContent.EditTopic;
  const isOverlaying = windowWidth <= MIN_SCREEN_WIDTH_FOR_STATIC_RIGHT_COLUMN;

  const getAssistantWidthBounds = useLastCallback(() => {
    const leftColumnWidth = document.querySelector<HTMLElement>('#LeftColumn')?.offsetWidth || 0;
    const availableWidth = window.innerWidth - leftColumnWidth - MIN_MIDDLE_COLUMN_WIDTH;

    return {
      min: MIN_ASSISTANT_WIDTH,
      max: Math.max(MIN_ASSISTANT_WIDTH, Math.min(MAX_ASSISTANT_WIDTH, availableWidth)),
    };
  });

  const setAssistantWidth = useLastCallback((width: number) => {
    const { min, max } = getAssistantWidthBounds();
    const nextWidth = Math.max(min, Math.min(max, width));
    document.documentElement.style.setProperty('--right-column-width', `${nextWidth}px`);

    return nextWidth;
  });

  const stopAssistantResize = useLastCallback(() => {
    document.body.classList.remove('cursor-ew-resize');
    document.removeEventListener('mousemove', handleAssistantResize);
    document.removeEventListener('mouseup', stopAssistantResize);
    window.removeEventListener('blur', stopAssistantResize);

    const currentWidth = document.querySelector<HTMLElement>('#RightColumn')?.offsetWidth;
    if (currentWidth) {
      localStorage.setItem(ASSISTANT_WIDTH_STORAGE_KEY, String(currentWidth));
    }
  });

  const handleAssistantResize = useLastCallback((event: MouseEvent) => {
    event.preventDefault();
    const delta = assistantResizeStartXRef.current - event.clientX;
    setAssistantWidth(assistantResizeStartWidthRef.current + delta);
  });

  const startAssistantResize = useLastCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    assistantResizeStartXRef.current = event.clientX;
    assistantResizeStartWidthRef.current = document.querySelector<HTMLElement>('#RightColumn')!.offsetWidth;
    document.body.classList.add('cursor-ew-resize');
    document.addEventListener('mousemove', handleAssistantResize);
    document.addEventListener('mouseup', stopAssistantResize);
    window.addEventListener('blur', stopAssistantResize);
  });

  const resetAssistantWidth = useLastCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    localStorage.removeItem(ASSISTANT_WIDTH_STORAGE_KEY);
    document.documentElement.style.removeProperty('--right-column-width');
  });

  const [shouldSkipTransition, setShouldSkipTransition] = useState(!isOpen);

  const renderingContentKey = useCurrentOrPrev(contentKey, true, !isChatSelected) ?? -1;

  useScrollNotch({
    containerRef,
    selector: ':scope .custom-scroll, :scope .panel-content',
  }, [contentKey, managementScreen, chatId, threadId]);

  const close = useLastCallback((shouldScrollUp = true) => {
    switch (contentKey) {
      case RightColumnContent.ThreadAssistant:
        toggleThreadAssistant({ force: false });
        break;
      case RightColumnContent.AddingMembers:
        setNewChatMembersDialogState({ newChatMembersProgress: NewChatMembersProgress.Closed });
        break;
      case RightColumnContent.ChatInfo:
        if (isScrolledDown && shouldScrollUp && !isSavedMessages) {
          setProfileState(ProfileState.Profile);
          break;
        }
        toggleChatInfo({ force: false }, { forceSyncOnIOs: true });
        break;
      case RightColumnContent.Management: {
        switch (managementScreen) {
          case ManagementScreens.Initial:
            toggleManagement();
            break;
          case ManagementScreens.ChatPrivacyType:
          case ManagementScreens.Discussion:
          case ManagementScreens.GroupPermissions:
          case ManagementScreens.GroupType:
          case ManagementScreens.ChatAdministrators:
          case ManagementScreens.ChannelSubscribers:
          case ManagementScreens.GroupMembers:
          case ManagementScreens.Invites:
          case ManagementScreens.Reactions:
          case ManagementScreens.JoinRequests:
          case ManagementScreens.ChannelRemovedUsers:
            setManagementScreen(ManagementScreens.Initial);
            break;
          case ManagementScreens.GroupUserPermissionsCreate:
          case ManagementScreens.GroupRemovedUsers:
          case ManagementScreens.GroupUserPermissions:
            setManagementScreen(ManagementScreens.GroupPermissions);
            setSelectedChatMemberId(undefined);
            setIsPromotedByCurrentUser(undefined);
            break;
          case ManagementScreens.NewDiscussionGroup:
            setManagementScreen(ManagementScreens.Discussion);
            break;
          case ManagementScreens.ChatAdminRights:
          case ManagementScreens.ChatNewAdminRights:
          case ManagementScreens.GroupAddAdmins:
          case ManagementScreens.GroupRecentActions:
            setManagementScreen(ManagementScreens.ChatAdministrators);
            break;
          case ManagementScreens.EditInvite:
          case ManagementScreens.InviteInfo:
            setManagementScreen(ManagementScreens.Invites);
            setOpenedInviteInfo({ chatId: chatId!, invite: undefined });
            setEditingExportedInvite({ chatId: chatId!, invite: undefined });
            break;
        }

        break;
      }
      case RightColumnContent.MessageStatistics:
        toggleMessageStatistics();
        break;
      case RightColumnContent.StoryStatistics:
        toggleStoryStatistics();
        break;
      case RightColumnContent.Statistics:
        toggleStatistics();
        break;
      case RightColumnContent.BoostStatistics:
        closeBoostStatistics();
        break;
      case RightColumnContent.MonetizationStatistics:
        closeMonetizationStatistics();
        break;
      case RightColumnContent.StickerSearch:
        blurSearchInput();
        setStickerSearchQuery({ query: undefined });
        break;
      case RightColumnContent.GifSearch: {
        blurSearchInput();
        setGifSearchQuery({ query: undefined });
        break;
      }
      case RightColumnContent.PollResults:
        closePollResults();
        break;
      case RightColumnContent.CreateTopic:
        closeCreateTopicPanel();
        break;
      case RightColumnContent.EditTopic:
        closeEditTopicPanel();
        break;
    }
  });

  const handleSelectChatMember = useLastCallback((memberId, isPromoted) => {
    setSelectedChatMemberId(memberId);
    setIsPromotedByCurrentUser(isPromoted);
  });

  const handleAppendingChatMembers = useLastCallback((memberIds: string[]) => {
    addChatMembers({ chatId: chatId!, memberIds });
  });

  useEffect(() => (isOpen && chatId ? captureEscKeyListener(close) : undefined), [isOpen, close, chatId]);

  useEffect(() => {
    setTimeout(() => {
      setShouldSkipTransition(!isOpen);
    }, ANIMATION_DURATION);
  }, [isOpen]);

  useEffect(() => {
    if (!isThreadAssistant || isOverlaying) {
      document.documentElement.style.removeProperty('--right-column-width');
      return undefined;
    }

    const storedWidth = Number(localStorage.getItem(ASSISTANT_WIDTH_STORAGE_KEY));
    if (storedWidth) {
      setAssistantWidth(storedWidth);
    }

    return () => {
      stopAssistantResize();
      document.documentElement.style.removeProperty('--right-column-width');
    };
  }, [isOverlaying, isThreadAssistant, setAssistantWidth, stopAssistantResize]);

  useEffect(() => {
    if (nextManagementScreen) {
      setManagementScreen(nextManagementScreen);
      requestNextManagementScreen(undefined);
    }
  }, [nextManagementScreen]);

  useEffect(() => {
    if (!nextProfileTab) return;

    resetNextProfileTab();
  }, [nextProfileTab]);

  useEffect(() => {
    if (shouldCloseRightColumn) {
      close();
      setShouldCloseRightColumn({ value: undefined });
    }
  }, [shouldCloseRightColumn]);

  // Close Right Column when it transforms into overlayed state on screen resize
  useEffect(() => {
    if (isOpen && isOverlaying) {
      close();
    }
    // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [isOverlaying]);

  // We need to clear profile state and management screen state, when changing chats
  useLayoutEffectWithPrevDeps(([prevChatId, prevThreadId]) => {
    if (prevChatId !== chatId || prevThreadId !== threadId) {
      setProfileState(
        isSavedMessages && !isSavedDialog ? ProfileState.SavedDialogs : ProfileState.Profile,
      );
      setManagementScreen(ManagementScreens.Initial);
    }
  }, [chatId, threadId, isSavedDialog, isSavedMessages]);

  useHistoryBack({
    isActive: isChatSelected && (
      contentKey === RightColumnContent.ThreadAssistant
      || contentKey === RightColumnContent.ChatInfo
      || contentKey === RightColumnContent.Management
      || contentKey === RightColumnContent.AddingMembers
      || contentKey === RightColumnContent.CreateTopic
      || contentKey === RightColumnContent.EditTopic),
    onBack: () => close(false),
  });

  function renderContent(isActive: boolean) {
    if (renderingContentKey === -1) {
      return undefined;
    }

    switch (renderingContentKey) {
      case RightColumnContent.ThreadAssistant:
        return (
          <ThreadAssistantDrawer
            key={`thread_assistant_${chatId!}`}
            currentChatId={chatId}
            isActive={isOpen && isActive}
            onClose={close}
          />
        );
      case RightColumnContent.AddingMembers:
        return (
          <AddChatMembers
            key={`add_chat_members_${chatId!}`}
            chatId={chatId!}
            isActive={isOpen && isActive}
            onNextStep={handleAppendingChatMembers}
            onClose={close}
          />
        );
      case RightColumnContent.ChatInfo:
        return (
          <Profile
            key={`profile_${chatId!}_${threadId}`}
            chatId={chatId!}
            threadId={threadId}
            profileState={profileState}
            isMobile={isMobile}
            isActive={isOpen && isActive}
            onProfileStateChange={setProfileState}
          />
        );
      case RightColumnContent.Management:
        return (
          <Management
            key={`management_${chatId!}_${managementScreen}`}
            chatId={chatId!}
            currentScreen={managementScreen}
            isPromotedByCurrentUser={isPromotedByCurrentUser}
            selectedChatMemberId={selectedChatMemberId}
            isActive={isOpen && isActive}
            onScreenSelect={setManagementScreen}
            onChatMemberSelect={handleSelectChatMember}
            onClose={close}
          />
        );

      case RightColumnContent.Statistics:
        return <Statistics chatId={chatId!} />;
      case RightColumnContent.BoostStatistics:
        return <BoostStatistics />;
      case RightColumnContent.MonetizationStatistics:
        return <MonetizationStatistics />;
      case RightColumnContent.MessageStatistics:
        return <MessageStatistics chatId={chatId!} isActive={isOpen && isActive} />;
      case RightColumnContent.StoryStatistics:
        return <StoryStatistics chatId={chatId!} isActive={isOpen && isActive} />;
      case RightColumnContent.StickerSearch:
        return <StickerSearch onClose={close} isActive={isOpen && isActive} />;
      case RightColumnContent.GifSearch:
        return <GifSearch onClose={close} isActive={isOpen && isActive} />;
      case RightColumnContent.PollResults:
        return <PollResults onClose={close} isActive={isOpen && isActive} />;
      case RightColumnContent.CreateTopic:
        return <CreateTopic onClose={close} isActive={isOpen && isActive} />;
      case RightColumnContent.EditTopic:
        return <EditTopic onClose={close} isActive={isOpen && isActive} />;
    }

    return undefined; // Unreachable
  }

  return (
    <div
      id="RightColumn-wrapper"
      className={!isChatSelected ? 'is-hidden' : undefined}
    >
      {isOverlaying && (
        <div className="overlay-backdrop" onClick={close} />
      )}
      <div id="RightColumn">
        {isThreadAssistant && !isOverlaying && (
          <button
            type="button"
            className="RightColumn-resizeHandle"
            aria-label="Resize AI panel"
            onMouseDown={startAssistantResize}
            onDoubleClick={resetAssistantWidth}
          />
        )}
        {!isThreadAssistant && (
          <RightHeader
            chatId={chatId}
            threadId={threadId}
            isColumnOpen={isOpen}
            isProfile={isProfile}
            isManagement={isManagement}
            isStatistics={isStatistics}
            isBoostStatistics={isBoostStatistics}
            isMonetizationStatistics={isMonetizationStatistics}
            isMessageStatistics={isMessageStatistics}
            isStoryStatistics={isStoryStatistics}
            isStickerSearch={isStickerSearch}
            isGifSearch={isGifSearch}
            isPollResults={isPollResults}
            isCreatingTopic={isCreatingTopic}
            isEditingTopic={isEditingTopic}
            isAddingChatMembers={isAddingChatMembers}
            profileState={profileState}
            managementScreen={managementScreen}
            onClose={close}
            onScreenSelect={setManagementScreen}
          />
        )}
        <Transition
          ref={containerRef}
          name={resolveTransitionName('layers', animationLevel, shouldSkipTransition || shouldSkipHistoryAnimations)}
          renderCount={MAIN_SCREENS_COUNT + MANAGEMENT_SCREENS_COUNT}
          activeKey={isManagement ? MAIN_SCREENS_COUNT + managementScreen : renderingContentKey}
          shouldCleanup
          cleanupExceptionKey={
            (renderingContentKey === RightColumnContent.MessageStatistics
              || renderingContentKey === RightColumnContent.StoryStatistics)
              ? RightColumnContent.Statistics : undefined
          }
        >
          {renderContent}
        </Transition>
      </div>
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global, { isMobile }): Complete<StateProps> => {
    const { chatId, threadId } = selectCurrentMessageList(global) || {};

    const areActiveChatsLoaded = selectAreActiveChatsLoaded(global);
    const { animationLevel } = selectSharedSettings(global);
    const {
      management, shouldSkipHistoryAnimations, nextProfileTab, shouldCloseRightColumn,
    } = selectTabState(global);
    const nextManagementScreen = chatId ? management.byChatId[chatId]?.nextScreen : undefined;

    const isSavedMessages = chatId ? selectIsChatWithSelf(global, chatId) : undefined;
    const isSavedDialog = chatId ? getIsSavedDialog(chatId, threadId, global.currentUserId) : undefined;

    return {
      contentKey: selectRightColumnContentKey(global, isMobile),
      chatId,
      threadId,
      isChatSelected: Boolean(chatId && areActiveChatsLoaded),
      animationLevel,
      shouldSkipHistoryAnimations,
      nextManagementScreen,
      nextProfileTab,
      shouldCloseRightColumn,
      isSavedMessages,
      isSavedDialog,
    };
  },
)(RightColumn));
