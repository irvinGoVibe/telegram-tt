import type {
  ChangeEvent, FormEvent, KeyboardEvent,
} from 'react';
import type { FC, TeactNode } from '../../lib/teact/teact';
import {
  memo, useEffect, useRef, useState,
} from '../../lib/teact/teact';
import { getActions, getGlobal, withGlobal } from '../../global';

import type { ApiChat, ApiMessage, ApiPeer } from '../../api/types';
import type {
  ThreadAiChatContext,
  ThreadAiSettings,
  ThreadModel,
} from '../../thread/api';
import { MAIN_THREAD_ID } from '../../api/types';

import { getPeerTitle } from '../../global/helpers/peers';
import {
  selectChat, selectChatMessages, selectPeer, selectSender,
} from '../../global/selectors';
import { callApi } from '../../api/gramjs';
import {
  askStandaloneThreadAssistant,
  getThreadAiSettings,
  getThreadModels,
  testThreadAiSettings,
  updateThreadAiSettings,
} from '../../thread/api';

import useLang from '../../hooks/useLang';
import useLastCallback from '../../hooks/useLastCallback';

import CalendarModal from '../common/CalendarModal';
import Icon from '../common/icons/Icon';
import Button from '../ui/Button';

import './ThreadAssistantDrawer.scss';

const CHAT_STORAGE_PREFIX = 'telegram-thread.ai-chat';
const MODEL_STORAGE_KEY = 'telegram-thread.ai-model';
const MAX_IMAGE_COUNT = 4;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_CONTEXT_MESSAGES = 250;
const MAX_HISTORY_CONTEXT_MESSAGES = 2500;
const HISTORY_PAGE_SIZE = 100;
const CONTEXT_STORAGE_PREFIX = 'telegram-thread.ai-context';
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

type ContextMode = 'recent' | 'since' | 'until' | 'range' | 'all';
type DateContextMode = Extract<ContextMode, 'since' | 'until' | 'range'>;

type ContextSelection = {
  mode: ContextMode;
  from?: string;
  to?: string;
};

type ContextDateField = 'from' | 'to' | 'range';

type PendingImage = {
  name: string;
  mimeType: string;
  byteSize: number;
  dataUrl: string;
  data: string;
};

type LocalAssistantMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  createdAt: string;
  attachments?: { name: string }[];
};

type OwnProps = {
  currentChatId?: string;
  isActive: boolean;
  onClose: () => void;
};

type StateProps = {
  contextChat?: ApiChat;
  contextPeer?: ApiPeer;
  contextMessages?: Record<number, ApiMessage>;
};

const EMPTY_SETTINGS: ThreadAiSettings = {
  provider: 'r2',
  providerName: 'R2 Copilot',
  apiUrl: 'https://api-chat.r2copilot.ai',
  apiKeyConfigured: false,
  defaultModel: '',
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function localMessageId(role: LocalAssistantMessage['role']) {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function chatStorageKey(chatId?: string) {
  return `${CHAT_STORAGE_PREFIX}.${chatId || 'global'}`;
}

function contextStorageKey(chatId?: string) {
  return `${CONTEXT_STORAGE_PREFIX}.${chatId || 'global'}`;
}

function readStoredContextSelection(chatId?: string): ContextSelection {
  try {
    const value = JSON.parse(localStorage.getItem(contextStorageKey(chatId)) || '{}');
    if (['recent', 'since', 'until', 'range', 'all'].includes(value.mode)) return value;
  } catch {
    // Ignore invalid local context preferences.
  }
  return { mode: 'recent' };
}

function startOfLocalDay(value?: string) {
  return value ? new Date(`${value}T00:00:00`).getTime() / 1000 : undefined;
}

function endOfLocalDay(value?: string) {
  return value ? new Date(`${value}T23:59:59.999`).getTime() / 1000 : undefined;
}

function formatContextDate(value?: string) {
  if (!value) return '';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(`${value}T00:00:00`));
}

function formatContextDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function contextDateToTimestamp(value?: string) {
  return value ? new Date(`${value}T12:00:00`).getTime() : undefined;
}

function isDateContextMode(mode: ContextMode): mode is DateContextMode {
  return mode === 'since' || mode === 'until' || mode === 'range';
}

function readStoredMessages(key: string): LocalAssistantMessage[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value.slice(-100) : [];
  } catch {
    return [];
  }
}

function readImage(file: File) {
  return new Promise<PendingImage>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(file.name));
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      resolve({
        name: file.name,
        mimeType: file.type,
        byteSize: file.size,
        dataUrl,
        data: dataUrl.split(',', 2)[1] || '',
      });
    };
    reader.readAsDataURL(file);
  });
}

function messageMediaLabel(message: ApiMessage) {
  const { content } = message;
  if (content.photo) return 'Photo';
  if (content.video) return content.video.isRound ? 'Video message' : 'Video';
  if (content.voice) return 'Voice message';
  if (content.audio) return 'Audio';
  if (content.document) return `Document: ${content.document.fileName || 'file'}`;
  if (content.sticker) return `Sticker${content.sticker.emoji ? ` ${content.sticker.emoji}` : ''}`;
  if (content.pollId) return 'Poll';
  if (content.location) return 'Location';
  if (content.contact) return 'Contact';
  if (content.storyData) return 'Story';
  if (content.action) return 'Service message';
  return '';
}

const ThreadAssistantDrawer: FC<OwnProps & StateProps> = ({
  currentChatId, isActive, onClose, contextChat, contextPeer, contextMessages,
}) => {
  const lang = useLang();
  const { focusMessage } = getActions();

  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isTestingSettings, setIsTestingSettings] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [view, setView] = useState<'chat' | 'settings'>('chat');
  const [messages, setMessages] = useState<LocalAssistantMessage[]>([]);
  const [hydratedStorageKey, setHydratedStorageKey] = useState('');
  const [models, setModels] = useState<ThreadModel[]>([]);
  const [activeModel, setActiveModel] = useState('');
  const [settings, setSettings] = useState<ThreadAiSettings>(EMPTY_SETTINGS);
  const [settingsModel, setSettingsModel] = useState('');
  const [question, setQuestion] = useState('');
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState('');
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [contextSelection, setContextSelection] = useState<ContextSelection>({ mode: 'recent' });
  const [draftContextSelection, setDraftContextSelection] = useState<ContextSelection>({ mode: 'recent' });
  const [historyMessages, setHistoryMessages] = useState<Record<number, ApiMessage>>({});
  const [isHistoryLimited, setIsHistoryLimited] = useState(false);
  const [activeContextDateField, setActiveContextDateField] = useState<ContextDateField>();

  const messagesRef = useRef<HTMLDivElement>();
  const imageInputRef = useRef<HTMLInputElement>();
  const contextMenuRef = useRef<HTMLDivElement>();
  const contextLoadIdRef = useRef(0);
  const currentStorageKey = chatStorageKey(currentChatId);
  const canSend = Boolean(
    settings.apiKeyConfigured
    && activeModel
    && (question.trim() || pendingImages.length)
    && !isSending,
  );

  const getSelectedTelegramMessages = useLastCallback(() => {
    const from = startOfLocalDay(contextSelection.from);
    const to = endOfLocalDay(contextSelection.to);
    const allMessages = Object.values({ ...contextMessages, ...historyMessages })
      .sort((left, right) => left.date - right.date || left.id - right.id);

    if (contextSelection.mode === 'recent') return allMessages.slice(-MAX_CONTEXT_MESSAGES);
    return allMessages.filter((message) => {
      if (contextSelection.mode === 'since') return from === undefined || message.date >= from;
      if (contextSelection.mode === 'until') return to === undefined || message.date <= to;
      if (contextSelection.mode === 'range') {
        return (from === undefined || message.date >= from) && (to === undefined || message.date <= to);
      }
      return true;
    });
  });

  const buildTelegramContext = useLastCallback((): ThreadAiChatContext => {
    const global = getGlobal();
    const telegramMessages = getSelectedTelegramMessages()
      .map((message) => {
        const messageText = message.content.text?.text?.trim() || '';
        const media = messageMediaLabel(message);
        const sender = selectSender(global, message);
        const links = messageText.match(/https?:\/\/[^\s<>]+/g)?.slice(0, 8);
        return {
          id: message.id,
          from: sender ? (getPeerTitle(lang, sender) || 'Telegram participant') : 'Telegram participant',
          date: new Date(message.date * 1000).toISOString(),
          text: messageText,
          ...(links?.length ? { links } : undefined),
          ...(media ? { media } : undefined),
          ...(message.replyInfo && 'replyToMsgId' in message.replyInfo && message.replyInfo.replyToMsgId
            ? { replyTo: message.replyInfo.replyToMsgId }
            : undefined),
        };
      })
      .filter(({ text, media }) => text || media);

    return {
      chatId: currentChatId,
      title: contextPeer ? (getPeerTitle(lang, contextPeer) || 'Telegram chat') : 'Telegram',
      messages: telegramMessages,
    };
  });

  const loadDrawer = useLastCallback(async () => {
    const storageKey = chatStorageKey(currentChatId);
    setMessages(readStoredMessages(storageKey));
    setHydratedStorageKey(storageKey);
    setPendingImages([]);
    setQuestion('');
    setError('');
    setNotice('');
    contextLoadIdRef.current += 1;
    setIsLoadingContext(false);
    const storedContextSelection = readStoredContextSelection(currentChatId);
    setContextSelection(storedContextSelection);
    setDraftContextSelection(storedContextSelection);
    setHistoryMessages({});
    setIsHistoryLimited(false);
    setIsContextMenuOpen(false);
    setActiveContextDateField(undefined);
    void loadContextHistory(storedContextSelection);
    setIsLoading(true);
    const [settingsResult, modelsResult] = await Promise.allSettled([
      getThreadAiSettings(),
      getThreadModels(),
    ]);

    if (settingsResult.status === 'fulfilled') {
      setSettings(settingsResult.value);
      setSettingsModel(settingsResult.value.defaultModel);
      if (!settingsResult.value.apiKeyConfigured) setView('settings');
    } else {
      setError(errorMessage(settingsResult.reason));
    }

    if (modelsResult.status === 'fulfilled') {
      const catalog = modelsResult.value;
      const storedModel = localStorage.getItem(MODEL_STORAGE_KEY) || '';
      const configuredModel = settingsResult.status === 'fulfilled'
        ? settingsResult.value.defaultModel : '';
      const nextModel = [configuredModel, storedModel, catalog.defaultModel, catalog.models[0]?.apiName]
        .find((candidate) => candidate && catalog.models.some(({ apiName }) => apiName === candidate)) || '';
      setModels(catalog.models);
      setActiveModel(nextModel);
      setSettingsModel(configuredModel || catalog.defaultModel || nextModel);
    } else if (settingsResult.status === 'fulfilled') {
      const storedModel = localStorage.getItem(MODEL_STORAGE_KEY) || '';
      const configuredModel = settingsResult.value.defaultModel || storedModel;
      setActiveModel(configuredModel);
      setSettingsModel(configuredModel);
      setView('settings');
      setError(errorMessage(modelsResult.reason));
    }

    setIsLoading(false);
  });

  useEffect(() => {
    if (!isActive) return undefined;
    void loadDrawer();
    return undefined;
  }, [currentChatId, isActive]);

  useEffect(() => {
    if (!hydratedStorageKey || hydratedStorageKey !== currentStorageKey) return;
    localStorage.setItem(hydratedStorageKey, JSON.stringify(messages.slice(-100)));
  }, [currentStorageKey, hydratedStorageKey, messages]);

  useEffect(() => {
    if (!activeModel) return;
    localStorage.setItem(MODEL_STORAGE_KEY, activeModel);
  }, [activeModel]);

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, isSending]);

  useEffect(() => {
    if (!isContextMenuOpen || activeContextDateField) return undefined;
    const handlePointerDown = (event: MouseEvent) => {
      if (!contextMenuRef.current?.contains(event.target as Node)) setIsContextMenuOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [activeContextDateField, isContextMenuOpen]);

  const handleContextDateSelect = useLastCallback((date: Date) => {
    if (!activeContextDateField || activeContextDateField === 'range') return;
    setDraftContextSelection((current) => ({
      ...current,
      [activeContextDateField]: formatContextDateValue(date),
    }));
    setActiveContextDateField(undefined);
  });

  const handleContextRangeSelect = useLastCallback((from: Date, to: Date) => {
    setDraftContextSelection((current) => ({
      ...current,
      from: formatContextDateValue(from),
      to: formatContextDateValue(to),
    }));
    setActiveContextDateField(undefined);
  });

  const loadContextHistory = useLastCallback(async (selection: ContextSelection) => {
    if (!contextChat) {
      setHistoryMessages({});
      setIsHistoryLimited(false);
      return;
    }

    setIsLoadingContext(true);
    setError('');
    const loadId = contextLoadIdRef.current + 1;
    contextLoadIdRef.current = loadId;
    const collected: Record<number, ApiMessage> = { ...contextMessages };
    let offsetId: number | undefined;
    let reachedBeginning = false;
    const messageLimit = selection.mode === 'recent'
      ? MAX_CONTEXT_MESSAGES : MAX_HISTORY_CONTEXT_MESSAGES;
    const earliestRequiredDate = selection.mode === 'since' || selection.mode === 'range'
      ? startOfLocalDay(selection.from) : undefined;

    try {
      while (Object.keys(collected).length < messageLimit) {
        const result = await callApi('fetchMessages', {
          chat: contextChat,
          threadId: MAIN_THREAD_ID,
          offsetId,
          addOffset: offsetId ? -1 : undefined,
          limit: HISTORY_PAGE_SIZE,
        });
        const page = result?.messages || [];
        if (!page.length) {
          reachedBeginning = true;
          break;
        }
        page.forEach((message) => {
          collected[message.id] = message;
        });
        const oldestMessage = page.reduce((oldest, message) => message.date < oldest.date ? message : oldest);
        const nextOffsetId = Math.min(...page.map(({ id }) => id));
        const hasReachedRequiredDate = earliestRequiredDate !== undefined
          && oldestMessage.date <= earliestRequiredDate;
        if (nextOffsetId === offsetId || hasReachedRequiredDate) {
          reachedBeginning = nextOffsetId === offsetId;
          break;
        }
        offsetId = nextOffsetId;
        if (result?.count && Object.keys(collected).length >= result.count) {
          reachedBeginning = true;
          break;
        }
      }
      if (contextLoadIdRef.current === loadId) {
        setHistoryMessages(collected);
        setIsHistoryLimited((selection.mode === 'all' || selection.mode === 'until') && !reachedBeginning);
      }
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      if (contextLoadIdRef.current === loadId) setIsLoadingContext(false);
    }
  });

  const applyContextSelection = useLastCallback(async () => {
    const selection = draftContextSelection;
    if (selection.mode === 'since' && !selection.from) return;
    if (selection.mode === 'until' && !selection.to) return;
    if (selection.mode === 'range' && (!selection.from || !selection.to)) return;
    if (selection.mode === 'range' && selection.from! > selection.to!) return;
    setContextSelection(selection);
    localStorage.setItem(contextStorageKey(currentChatId), JSON.stringify(selection));
    await loadContextHistory(selection);
    setIsContextMenuOpen(false);
  });

  const handleImages = useLastCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files || []);
    event.currentTarget.value = '';
    if (!files.length) return;
    if (pendingImages.length + files.length > MAX_IMAGE_COUNT) {
      setError(lang('ThreadAIImageCountError'));
      return;
    }
    if (files.some((file) => !ALLOWED_IMAGE_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES)) {
      setError(lang('ThreadAIImageTypeError'));
      return;
    }
    const totalBytes = pendingImages.reduce((total, image) => total + image.byteSize, 0)
      + files.reduce((total, file) => total + file.size, 0);
    if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
      setError(lang('ThreadAIImageTotalError'));
      return;
    }
    try {
      const images = await Promise.all(files.map(readImage));
      setPendingImages((current) => [...current, ...images]);
      setError('');
    } catch (nextError) {
      setError(errorMessage(nextError));
    }
  });

  const submitQuestion = useLastCallback(async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!canSend) {
      if (!settings.apiKeyConfigured) setView('settings');
      return;
    }

    const nextQuestion = question.trim() || lang('ThreadAIImagePrompt');
    const userMessage: LocalAssistantMessage = {
      id: localMessageId('user'),
      role: 'user',
      content: nextQuestion,
      createdAt: new Date().toISOString(),
      attachments: pendingImages.map(({ name }) => ({ name })),
    };
    const history = messages.slice(-20).map((message) => ({ role: message.role, text: message.content }));
    const attachments = pendingImages.map(({ name, mimeType, data }) => ({ name, mimeType, data }));
    setMessages((current) => [...current, userMessage]);
    setQuestion('');
    setPendingImages([]);
    setIsSending(true);
    setError('');
    setNotice('');

    try {
      const result = await askStandaloneThreadAssistant({
        question: nextQuestion,
        model: activeModel,
        history,
        context: buildTelegramContext(),
        attachments,
      });
      setMessages((current) => [...current, {
        id: localMessageId('assistant'),
        role: 'assistant',
        content: result.answer,
        model: result.model,
        createdAt: new Date().toISOString(),
      }]);
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setIsSending(false);
    }
  });

  const handleQuestionKeyDown = useLastCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    void submitQuestion();
  });

  const saveSettings = useLastCallback(async (shouldTest = false) => {
    if (!settingsModel || settings.canEdit === false) return;
    const requestedModel = settingsModel;
    setIsSavingSettings(true);
    setError('');
    setNotice('');
    try {
      const nextSettings = await updateThreadAiSettings({ defaultModel: requestedModel });
      const persistedSettings = await getThreadAiSettings();
      if (nextSettings.defaultModel !== requestedModel || persistedSettings.defaultModel !== requestedModel) {
        setSettings(persistedSettings);
        setSettingsModel(persistedSettings.defaultModel || requestedModel);
        throw new Error(lang('ThreadAISettingsNotSaved'));
      }
      setSettings(persistedSettings);
      setSettingsModel(requestedModel);
      setActiveModel(requestedModel);
      localStorage.setItem(MODEL_STORAGE_KEY, requestedModel);
      setNotice(lang('ThreadAISettingsSaved'));
      if (shouldTest) {
        setIsTestingSettings(true);
        const result = await testThreadAiSettings(requestedModel);
        setNotice(lang('ThreadAIConnectionReady', { model: result.model }));
      }
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setIsSavingSettings(false);
      setIsTestingSettings(false);
    }
  });

  const focusCitation = useLastCallback((messageId: number) => {
    if (!currentChatId) return;
    focusMessage({ chatId: currentChatId, messageId });
  });

  const renderAssistantText = (message: LocalAssistantMessage): TeactNode[] => {
    return message.content.split(/(\[#\d+\])/g).filter(Boolean).map((part, index) => {
      const match = part.match(/^\[#(\d+)\]$/);
      if (!match || !currentChatId) return <span key={`${message.id}-text-${index}`}>{part}</span>;
      const messageId = Number(match[1]);
      return (
        <button
          key={`${message.id}-citation-${messageId}-${index}`}
          type="button"
          className="ThreadAssistantDrawer-citation"
          aria-label={lang('ThreadAIOpenCitation', { id: messageId })}
          onClick={() => focusCitation(messageId)}
        >
          {part}
        </button>
      );
    });
  };

  const copyAnswer = useLastCallback(async (message: LocalAssistantMessage) => {
    await navigator.clipboard.writeText(message.content);
    setCopiedMessageId(message.id);
    window.setTimeout(() => setCopiedMessageId(''), 1500);
  });

  const downloadAnswer = useLastCallback((message: LocalAssistantMessage) => {
    const activeContext = buildTelegramContext();
    const markdown = [
      '# AI chat',
      `- Telegram chat: ${activeContext.title}`,
      `- Model: ${message.model || activeModel || 'AI'}`,
      '',
      message.content,
      '',
    ].join('\n');
    const blobUrl = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'ai-chat-answer.md';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  });

  const startNewChat = useLastCallback(() => {
    setMessages([]);
    setQuestion('');
    setPendingImages([]);
    setError('');
    setNotice('');
  });

  const context = buildTelegramContext();
  const contextSummary = contextSelection.mode === 'recent'
    ? lang('ThreadAIContextRecent', { count: context.messages.length })
    : contextSelection.mode === 'since'
      ? lang('ThreadAIContextSinceSummary', {
        count: context.messages.length, date: formatContextDate(contextSelection.from),
      })
      : contextSelection.mode === 'until'
        ? lang('ThreadAIContextUntilSummary', {
          count: context.messages.length, date: formatContextDate(contextSelection.to),
        })
        : contextSelection.mode === 'range'
          ? lang('ThreadAIContextRangeSummary', {
            count: context.messages.length,
            from: formatContextDate(contextSelection.from),
            to: formatContextDate(contextSelection.to),
          })
          : lang('ThreadAIContextEntireSummary', { count: context.messages.length });
  const isContextSelectionInvalid = (draftContextSelection.mode === 'since' && !draftContextSelection.from)
    || (draftContextSelection.mode === 'until' && !draftContextSelection.to)
    || (draftContextSelection.mode === 'range' && (
      !draftContextSelection.from || !draftContextSelection.to
      || draftContextSelection.from > draftContextSelection.to
    ));
  const isDraftDateMode = isDateContextMode(draftContextSelection.mode);
  const draftDateButtonText = draftContextSelection.mode === 'since'
    ? (draftContextSelection.from
      ? formatContextDate(draftContextSelection.from) : lang('ThreadAIContextChooseDate'))
    : draftContextSelection.mode === 'until'
      ? (draftContextSelection.to
        ? formatContextDate(draftContextSelection.to) : lang('ThreadAIContextChooseDate'))
      : draftContextSelection.from && draftContextSelection.to
        ? `${formatContextDate(draftContextSelection.from)} – ${formatContextDate(draftContextSelection.to)}`
        : lang('ThreadAIContextChooseRange');

  const renderContextMenu = () => (
    <div ref={contextMenuRef} className="ThreadAssistantDrawer-contextMenu">
      <div className="ThreadAssistantDrawer-contextMenuHeading">
        <strong>{lang('ThreadAIContextTitle')}</strong>
        <span>{lang('ThreadAIContextDescription')}</span>
      </div>
      {(['recent', 'date', 'all'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          className={(mode === 'date' ? isDraftDateMode : draftContextSelection.mode === mode) ? 'active' : undefined}
          onClick={() => {
            if (mode !== 'date') {
              setDraftContextSelection((current) => ({ ...current, mode }));
              return;
            }

            const nextMode = isDateContextMode(draftContextSelection.mode)
              ? draftContextSelection.mode : 'since';
            setDraftContextSelection((current) => ({ ...current, mode: nextMode }));
            setActiveContextDateField(nextMode === 'since' ? 'from' : nextMode === 'until' ? 'to' : 'range');
          }}
        >
          <span>
            <strong>
              {lang(mode === 'recent' ? 'ThreadAIContextRecentOption'
                : mode === 'date' ? 'ThreadAIContextByDateOption' : 'ThreadAIContextEntireOption')}
            </strong>
            <em>
              {mode === 'date' && isDraftDateMode
                ? draftDateButtonText
                : lang(mode === 'recent' ? 'ThreadAIContextRecentHint'
                  : mode === 'date' ? 'ThreadAIContextByDateHint' : 'ThreadAIContextEntireHint')}
            </em>
          </span>
          {(mode === 'date' ? isDraftDateMode : draftContextSelection.mode === mode) && <Icon name="check" />}
        </button>
      ))}
      {isHistoryLimited && (
        <p>{lang('ThreadAIContextLimited', { count: MAX_HISTORY_CONTEXT_MESSAGES })}</p>
      )}
      <button
        type="button"
        className="ThreadAssistantDrawer-contextApply"
        disabled={isContextSelectionInvalid || isLoadingContext}
        onClick={() => void applyContextSelection()}
      >
        {isLoadingContext ? lang('ThreadAIContextLoading') : lang('ThreadAIContextApply')}
      </button>
    </div>
  );

  const renderToolbar = () => (
    <div className="ThreadAssistantDrawer-toolbar">
      <div className="ThreadAssistantDrawer-context">
        <Button
          round
          color="translucent"
          size="smaller"
          ariaLabel={lang('Close')}
          onClick={onClose}
        >
          <Icon name="close" />
        </Button>
        <span className="ThreadAssistantDrawer-contextCopy">
          <strong>{context.title}</strong>
          <button
            type="button"
            className={isContextMenuOpen ? 'active' : undefined}
            aria-expanded={isContextMenuOpen}
            onClick={() => {
              setDraftContextSelection(contextSelection);
              setIsContextMenuOpen(!isContextMenuOpen);
            }}
          >
            <em>{isLoadingContext ? lang('ThreadAIContextLoading') : contextSummary}</em>
            <Icon name="down" />
          </button>
          {isContextMenuOpen && renderContextMenu()}
        </span>
      </div>
      <div className="ThreadAssistantDrawer-toolbarActions">
        <button
          type="button"
          aria-label={lang('ThreadAINewChat')}
          title={lang('ThreadAINewChat')}
          onClick={startNewChat}
        >
          <Icon name="add" />
        </button>
        <button
          type="button"
          className={view === 'settings' ? 'active' : undefined}
          aria-label={lang('ThreadAISettings')}
          title={lang('ThreadAISettings')}
          onClick={() => setView(view === 'settings' ? 'chat' : 'settings')}
        >
          <Icon name="settings" />
        </button>
      </div>
    </div>
  );

  const renderMessages = () => (
    <div ref={messagesRef} className="ThreadAssistantDrawer-messages custom-scroll">
      {!messages.length && !isLoading && (
        <div className="ThreadAssistantDrawer-empty">
          <span><Icon name="bot-command" /></span>
          <h2>{lang('ThreadAIEmptyTitle')}</h2>
          <p>{lang('ThreadAIEmptyText')}</p>
          {!settings.apiKeyConfigured && (
            <button type="button" onClick={() => setView('settings')}>{lang('ThreadAIConfigure')}</button>
          )}
        </div>
      )}
      {messages.map((message) => (
        <article key={message.id} className={`ThreadAssistantDrawer-message ${message.role}`}>
          {message.role === 'assistant' && (
            <div className="ThreadAssistantDrawer-byline">
              <strong>{lang('ThreadAIResearcher')}</strong>
              <span>{message.model || 'AI'}</span>
            </div>
          )}
          <div className="ThreadAssistantDrawer-copy">
            {message.role === 'assistant' ? renderAssistantText(message) : message.content}
          </div>
          {Boolean(message.attachments?.length) && (
            <div className="ThreadAssistantDrawer-attachmentNames">
              {message.attachments.map(({ name }) => (
                <span key={name}>
                  <Icon name="attach" />
                  {name}
                </span>
              ))}
            </div>
          )}
          {message.role === 'assistant' && (
            <div className="ThreadAssistantDrawer-messageActions">
              <button type="button" onClick={() => void copyAnswer(message)}>
                <Icon name="copy" />
                {copiedMessageId === message.id ? lang('ThreadAICopied') : lang('Copy')}
              </button>
              <button type="button" onClick={() => downloadAnswer(message)}>
                <Icon name="download" />
                {lang('ThreadAIDownload')}
              </button>
            </div>
          )}
        </article>
      ))}
      {isSending && (
        <div className="ThreadAssistantDrawer-thinking" role="status">
          <span />
          <span />
          <span />
          {lang('ThreadAIThinking')}
        </div>
      )}
    </div>
  );

  const renderComposer = () => (
    <form className="ThreadAssistantDrawer-composer" onSubmit={submitQuestion}>
      {Boolean(pendingImages.length) && (
        <div className="ThreadAssistantDrawer-previews">
          {pendingImages.map((image, index) => (
            <button
              key={`${image.name}-${index}`}
              type="button"
              aria-label={lang('ThreadAIRemoveImage')}
              onClick={() => setPendingImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}
            >
              <img src={image.dataUrl} alt={image.name} />
              <Icon name="close" />
            </button>
          ))}
        </div>
      )}
      <textarea
        rows={2}
        value={question}
        aria-label={lang('ThreadAIAskPlaceholder')}
        placeholder={lang('ThreadAIAskPlaceholder')}
        disabled={isSending}
        onChange={(event) => setQuestion(event.currentTarget.value)}
        onKeyDown={handleQuestionKeyDown}
      />
      <div className="ThreadAssistantDrawer-composerTools">
        <div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            hidden
            onChange={(event) => void handleImages(event)}
          />
          <button
            type="button"
            className="ThreadAssistantDrawer-attach"
            aria-label={lang('ThreadAIAttachImage')}
            disabled={isSending}
            onClick={() => imageInputRef.current?.click()}
          >
            <Icon name="attach" />
          </button>
          <label className="ThreadAssistantDrawer-model">
            <Icon name="bot-command" />
            <span className="sr-only">{lang('ThreadAIModel')}</span>
            {models.length ? (
              <select
                value={activeModel}
                disabled={isSending}
                onChange={(event) => setActiveModel(event.currentTarget.value)}
              >
                {models.map((model) => (
                  <option key={model.apiName} value={model.apiName}>{model.displayName}</option>
                ))}
              </select>
            ) : <em>{activeModel || lang('ThreadAIUnavailable')}</em>}
          </label>
        </div>
        <button
          type="submit"
          className="ThreadAssistantDrawer-send"
          aria-label={lang('Send')}
          disabled={!canSend}
        >
          <Icon name="send" />
        </button>
      </div>
    </form>
  );

  const renderSettings = () => (
    <div className="ThreadAssistantDrawer-settings custom-scroll">
      <div className="ThreadAssistantDrawer-settingsHeading">
        <span><Icon name="settings" /></span>
        <div>
          <h2>{lang('ThreadAISettingsTitle')}</h2>
          <p>{lang('ThreadAISettingsText')}</p>
        </div>
      </div>

      <div className="ThreadAssistantDrawer-provider">
        <div>
          <small>{lang('ThreadAIProvider')}</small>
          <strong>{settings.providerName}</strong>
        </div>
        <span className={settings.apiKeyConfigured ? 'ready' : 'missing'}>
          {settings.apiKeyConfigured ? lang('ThreadAIApiKeyConfigured') : lang('ThreadAIApiKeyMissing')}
        </span>
      </div>

      <label className="ThreadAssistantDrawer-field">
        <span>{lang('ThreadAIApiUrl')}</span>
        <input type="url" value={settings.apiUrl} readOnly />
      </label>
      <label className="ThreadAssistantDrawer-field">
        <span>{lang('ThreadAIDefaultModel')}</span>
        {models.length ? (
          <select value={settingsModel} onChange={(event) => setSettingsModel(event.currentTarget.value)}>
            {models.map((model) => (
              <option key={model.apiName} value={model.apiName}>{model.displayName}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={settingsModel}
            placeholder={lang('ThreadAIModelApiNamePlaceholder')}
            onChange={(event) => setSettingsModel(event.currentTarget.value)}
          />
        )}
        {!models.length && <small>{lang('ThreadAIModelCatalogUnavailable')}</small>}
      </label>

      <div className="ThreadAssistantDrawer-settingsActions">
        <button
          type="button"
          className="primary"
          disabled={isSavingSettings || !settingsModel || settings.canEdit === false}
          onClick={() => void saveSettings(false)}
        >
          {lang('ThreadAISaveSettings')}
        </button>
        <button
          type="button"
          disabled={isSavingSettings || !settingsModel || settings.canEdit === false}
          onClick={() => void saveSettings(true)}
        >
          {isTestingSettings ? lang('ThreadAITestingConnection') : lang('ThreadAITestConnection')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="ThreadAssistantDrawer">
      {renderToolbar()}
      <CalendarModal
        isOpen={Boolean(activeContextDateField)}
        selectedAt={contextDateToTimestamp(
          activeContextDateField && activeContextDateField !== 'range'
            ? draftContextSelection[activeContextDateField] : draftContextSelection.from,
        )}
        rangeStartAt={contextDateToTimestamp(draftContextSelection.from)}
        rangeEndAt={contextDateToTimestamp(draftContextSelection.to)}
        minAt={activeContextDateField === 'to'
          ? contextDateToTimestamp(draftContextSelection.from) : undefined}
        maxAt={activeContextDateField === 'from'
          ? contextDateToTimestamp(draftContextSelection.to) : Date.now()}
        isPastMode
        isRangeMode={activeContextDateField === 'range'}
        topContent={(
          <div className="ThreadAssistantDrawer-calendarModes">
            {(['since', 'until', 'range'] as DateContextMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className={draftContextSelection.mode === mode ? 'active' : undefined}
                onClick={() => {
                  setDraftContextSelection((current) => ({ ...current, mode }));
                  setActiveContextDateField(mode === 'since' ? 'from' : mode === 'until' ? 'to' : 'range');
                }}
              >
                {lang(mode === 'since' ? 'ThreadAIContextSinceTab'
                  : mode === 'until' ? 'ThreadAIContextUntilTab' : 'ThreadAIContextRangeTab')}
              </button>
            ))}
          </div>
        )}
        submitButtonLabel={lang(activeContextDateField === 'range'
          ? 'ThreadAIContextSelectRange' : 'ThreadAIContextSelectDate')}
        onClose={() => setActiveContextDateField(undefined)}
        onSubmit={handleContextDateSelect}
        onRangeSubmit={handleContextRangeSelect}
      />
      {error && <div className="ThreadAssistantDrawer-alert error" role="alert">{error}</div>}
      {notice && <div className="ThreadAssistantDrawer-alert notice" role="status">{notice}</div>}
      {isLoading
        ? <div className="ThreadAssistantDrawer-loading">{lang('ThreadAILoading')}</div>
        : view === 'settings'
          ? renderSettings()
          : (
            <div className="ThreadAssistantDrawer-chat">
              {renderMessages()}
              {renderComposer()}
            </div>
          )}
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global, { currentChatId }): StateProps => ({
    contextChat: currentChatId ? selectChat(global, currentChatId) : undefined,
    contextPeer: currentChatId ? selectPeer(global, currentChatId) : undefined,
    contextMessages: currentChatId ? selectChatMessages(global, currentChatId) : undefined,
  }),
)(ThreadAssistantDrawer));
