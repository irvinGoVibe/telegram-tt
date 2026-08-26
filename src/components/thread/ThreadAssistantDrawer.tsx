import type {
  ChangeEvent, DragEvent, FormEvent, KeyboardEvent,
} from 'react';
import { parse } from 'marked';
import type { TeactNode } from '../../lib/teact/teact';
import {
  memo, useEffect, useRef, useState,
} from '../../lib/teact/teact';
import { getActions, getGlobal, withGlobal } from '../../global';

import type { ApiChat, ApiMessage, ApiPeer } from '../../api/types';
import type {
  ThreadAiChatContext,
  ThreadAiSettings,
  ThreadAiSkill,
  ThreadModel,
} from '../../thread/api';
import type { ThreadId } from '../../types';
import { MAIN_THREAD_ID } from '../../api/types';

import { requestForcedReflow, requestMutation } from '../../lib/fasterdom/fasterdom';
import { getMessageLink } from '../../global/helpers';
import { getPeerTitle } from '../../global/helpers/peers';
import {
  selectChat, selectChatMessages, selectPeer, selectSender,
} from '../../global/selectors';
import { formatDateTime } from '../../util/localization/dateFormat';
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
import SafeLink from '../common/SafeLink';
import Button from '../ui/Button';
import ThreadAssistantSkills, { type ThreadAssistantSkill } from './ThreadAssistantSkills';

import './ThreadAssistantDrawer.scss';

const CHAT_STORAGE_PREFIX = 'telegram-thread.ai-chat';
const MODEL_STORAGE_KEY = 'telegram-thread.ai-model';
const MAX_STORED_CHATS = 20;
const MAX_ACTIVE_SKILLS = 5;
const MAX_CHAT_TITLE_WORDS = 5;
const MAX_CHAT_TITLE_LENGTH = 32;
const MAX_ATTACHMENT_COUNT = 4;
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_BYTES = 12 * 1024 * 1024;
const MAX_ATTACHMENT_PREVIEW_WIDTH = 320;
const MAX_ATTACHMENT_PREVIEW_HEIGHT = 240;
const ATTACHMENT_PREVIEW_QUALITY = 0.72;
const MAX_CONTEXT_MESSAGES = 250;
const MAX_HISTORY_CONTEXT_MESSAGES = 2500;
const HISTORY_PAGE_SIZE = 100;
const ARTICLE_MIN_TEXT_LENGTH = 800;
const CONTEXT_STORAGE_PREFIX = 'telegram-thread.ai-context';
const ATTACHMENT_MIME_TYPES_BY_EXTENSION = new Map([
  ['.csv', 'text/csv'],
  ['.doc', 'application/msword'],
  ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['.gif', 'image/gif'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.json', 'application/json'],
  ['.md', 'text/markdown'],
  ['.pdf', 'application/pdf'],
  ['.png', 'image/png'],
  ['.ppt', 'application/vnd.ms-powerpoint'],
  ['.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  ['.rtf', 'application/rtf'],
  ['.txt', 'text/plain'],
  ['.webp', 'image/webp'],
  ['.xls', 'application/vnd.ms-excel'],
  ['.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
]);
const ALLOWED_ATTACHMENT_TYPES = new Set(ATTACHMENT_MIME_TYPES_BY_EXTENSION.values());
const IMAGE_ATTACHMENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ATTACHMENT_ACCEPT = [
  ...ATTACHMENT_MIME_TYPES_BY_EXTENSION.keys(),
  ...ALLOWED_ATTACHMENT_TYPES,
].join(',');
const RE_BLOCK_MARKDOWN_FORMATTING = /(?:^|\n)\s*(?:#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```|\|.+\|)/m;
const RE_INLINE_MARKDOWN_FORMATTING = /\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|`[^`\n]+`|\[[^\]\n]+\]\([^)\n]+\)/;
const RE_MESSAGE_CITATION = /\[#(\d+)\](?!\()/g;
const RE_ASSISTANT_COMMENTARY_LINE = /^\s*>/;
const RE_MARKDOWN_FENCE_LINE = /^\s*(?:```|~~~)/;
const RE_EXCESSIVE_LINE_BREAKS = /\n{3,}/g;

type ContextMode = 'recent' | 'since' | 'until' | 'range' | 'all';
type DateContextMode = Extract<ContextMode, 'since' | 'until' | 'range'>;

type ContextSelection = {
  mode: ContextMode;
  from?: string;
  to?: string;
};

type ContextDateField = 'from' | 'to' | 'range';
type MessageAction = 'copy' | 'download' | 'insert';

type PendingAttachment = {
  name: string;
  mimeType: string;
  byteSize: number;
  dataUrl: string;
  previewUrl?: string;
  data: string;
};

type LocalAssistantAttachment = {
  name: string;
  mimeType?: string;
  previewUrl?: string;
};

type LocalAssistantMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  createdAt: string;
  attachments?: LocalAssistantAttachment[];
};

type LocalAssistantChat = {
  id: string;
  title: string;
  draft: string;
  messages: LocalAssistantMessage[];
  skills: ThreadAssistantSkill[];
};

type StoredAssistantChats = {
  activeChatId: string;
  chats: LocalAssistantChat[];
};

const EMPTY_ASSISTANT_MESSAGES: LocalAssistantMessage[] = [];
const EMPTY_ASSISTANT_SKILLS: ThreadAssistantSkill[] = [];

type OwnProps = {
  currentChatId?: string;
  currentThreadId?: ThreadId;
  draft?: string;
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
  answerModel: '',
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function localMessageId(role: LocalAssistantMessage['role']) {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function localChatId() {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createAssistantChat(): LocalAssistantChat {
  return {
    id: localChatId(),
    title: '',
    draft: '',
    messages: [],
    skills: [],
  };
}

function createChatTitle(prompt: string) {
  const title = prompt.replace(/\s+/g, ' ').trim().split(' ').slice(0, MAX_CHAT_TITLE_WORDS).join(' ');
  if (title.length <= MAX_CHAT_TITLE_LENGTH) return title;
  return `${title.slice(0, MAX_CHAT_TITLE_LENGTH - 1).trimEnd()}…`;
}

function chatStorageKey(chatId?: string) {
  return `${CHAT_STORAGE_PREFIX}.${chatId || 'global'}`;
}

function contextStorageKey(chatId?: string) {
  return `${CONTEXT_STORAGE_PREFIX}.${chatId || 'global'}`;
}

function replaceMessageCitationsWithLinks(markdown: string, peer: ApiPeer, threadId?: ThreadId) {
  return markdown.replace(RE_MESSAGE_CITATION, (_citation, messageId: string) => {
    return `[\\[#${messageId}\\]](${getMessageLink(peer, threadId, Number(messageId))})`;
  });
}

function extractAssistantAnswer(markdown: string) {
  let isInsideCodeBlock = false;
  const answerLines = markdown.split('\n').filter((line) => {
    if (RE_MARKDOWN_FENCE_LINE.test(line)) {
      isInsideCodeBlock = !isInsideCodeBlock;
      return true;
    }

    return isInsideCodeBlock || !RE_ASSISTANT_COMMENTARY_LINE.test(line);
  });

  return answerLines.join('\n').replace(RE_EXCESSIVE_LINE_BREAKS, '\n\n').trim();
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

function readStoredChats(key: string): StoredAssistantChats {
  const fallbackChat = createAssistantChat();
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(value)) {
      const messages = value.slice(-100);
      const firstPrompt = messages.find((message) => message?.role === 'user')?.content || '';
      const chat = {
        ...fallbackChat,
        title: createChatTitle(firstPrompt),
        messages,
      };
      return { activeChatId: chat.id, chats: [chat] };
    }

    const chats: LocalAssistantChat[] = Array.isArray(value?.chats)
      ? value.chats.slice(-MAX_STORED_CHATS).map((chat: LocalAssistantChat) => ({
        id: String(chat.id || localChatId()),
        title: String(chat.title || ''),
        draft: String(chat.draft || ''),
        messages: Array.isArray(chat.messages) ? chat.messages.slice(-100) : [],
        skills: Array.isArray(chat.skills) ? chat.skills.slice(0, MAX_ACTIVE_SKILLS) : [],
      }))
      : [];
    if (!chats.length) return { activeChatId: fallbackChat.id, chats: [fallbackChat] };
    const activeChatId = chats.some(({ id }) => id === value.activeChatId)
      ? value.activeChatId : chats[0].id;
    return { activeChatId, chats };
  } catch {
    return { activeChatId: fallbackChat.id, chats: [fallbackChat] };
  }
}

function readAttachment(file: File) {
  return new Promise<PendingAttachment>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(file.name));
    reader.onload = async () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      const mimeType = resolveAttachmentMimeType(file);
      resolve({
        name: file.name,
        mimeType,
        byteSize: file.size,
        dataUrl,
        previewUrl: await createAttachmentPreview(dataUrl, mimeType),
        data: dataUrl.split(',', 2)[1] || '',
      });
    };
    reader.readAsDataURL(file);
  });
}

function createAttachmentPreview(dataUrl: string, mimeType: string) {
  if (!IMAGE_ATTACHMENT_TYPES.has(mimeType)) return Promise.resolve(undefined);

  return new Promise<string | undefined>((resolve) => {
    const image = new Image();
    image.onerror = () => resolve(undefined);
    image.onload = () => {
      const scale = Math.min(
        1,
        MAX_ATTACHMENT_PREVIEW_WIDTH / image.naturalWidth,
        MAX_ATTACHMENT_PREVIEW_HEIGHT / image.naturalHeight,
      );
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        resolve(undefined);
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/webp', ATTACHMENT_PREVIEW_QUALITY));
    };
    image.src = dataUrl;
  });
}

function resolveAttachmentMimeType(file: File) {
  if (ALLOWED_ATTACHMENT_TYPES.has(file.type)) return file.type;
  const extension = file.name.match(/\.[^.]+$/)?.[0].toLowerCase();
  return extension ? (ATTACHMENT_MIME_TYPES_BY_EXTENSION.get(extension) || file.type) : file.type;
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

const ThreadAssistantDrawer = ({
  currentChatId, currentThreadId, draft, isActive, onClose, contextChat, contextPeer, contextMessages,
}: OwnProps & StateProps) => {
  const lang = useLang();
  const {
    focusMessage, openChatWithDraft, setIsRichInputExpanded, setThreadAssistantDraft,
  } = getActions();

  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isTestingSettings, setIsTestingSettings] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [view, setView] = useState<'chat' | 'settings'>('chat');
  const [chats, setChats] = useState<LocalAssistantChat[]>([]);
  const [activeChatId, setActiveChatId] = useState('');
  const [hydratedStorageKey, setHydratedStorageKey] = useState('');
  const [models, setModels] = useState<ThreadModel[]>([]);
  const [activeModel, setActiveModel] = useState('');
  const [settings, setSettings] = useState<ThreadAiSettings>(EMPTY_SETTINGS);
  const [settingsModel, setSettingsModel] = useState('');
  const [settingsAnswerModel, setSettingsAnswerModel] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isDraggingAttachments, setIsDraggingAttachments] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState('');
  const [hoveredMessageAction, setHoveredMessageAction] = useState<{
    messageId: string;
    action: MessageAction;
  }>();
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [contextSelection, setContextSelection] = useState<ContextSelection>({ mode: 'recent' });
  const [draftContextSelection, setDraftContextSelection] = useState<ContextSelection>({ mode: 'recent' });
  const [historyMessages, setHistoryMessages] = useState<Record<number, ApiMessage>>({});
  const [isHistoryLimited, setIsHistoryLimited] = useState(false);
  const [activeContextDateField, setActiveContextDateField] = useState<ContextDateField>();
  const [calendarMaxAt, setCalendarMaxAt] = useState(0);

  const messagesRef = useRef<HTMLDivElement>();
  const questionInputRef = useRef<HTMLTextAreaElement>();
  const attachmentInputRef = useRef<HTMLInputElement>();
  const contextMenuRef = useRef<HTMLDivElement>();
  const contextLoadIdRef = useRef(0);
  const attachmentDragDepthRef = useRef(0);
  const shouldScrollQuestionToEndRef = useRef(false);
  const currentStorageKey = chatStorageKey(currentChatId);
  const activeChat = chats.find(({ id }) => id === activeChatId);
  const messages = activeChat?.messages || EMPTY_ASSISTANT_MESSAGES;
  const activeSkills = activeChat?.skills || EMPTY_ASSISTANT_SKILLS;
  const question = activeChat?.draft || '';
  const canSend = Boolean(
    settings.apiKeyConfigured
    && activeModel
    && (question.trim() || pendingAttachments.length)
    && !isSending,
  );

  const setQuestion = useLastCallback((value: string) => {
    setChats((current) => current.map((chat) => (
      chat.id === activeChatId ? { ...chat, draft: value } : chat
    )));
  });

  const updateChatMessages = useLastCallback((
    chatId: string,
    update: (current: LocalAssistantMessage[]) => LocalAssistantMessage[],
  ) => {
    setChats((current) => current.map((chat) => (
      chat.id === chatId ? { ...chat, messages: update(chat.messages) } : chat
    )));
  });

  const setActiveSkills = useLastCallback((skills: ThreadAssistantSkill[]) => {
    setChats((current) => current.map((chat) => (
      chat.id === activeChatId ? { ...chat, skills } : chat
    )));
  });

  const resizeQuestionInput = useLastCallback((element: HTMLTextAreaElement, shouldScrollToEnd?: boolean) => {
    requestMutation(() => {
      element.style.height = '0';
      requestForcedReflow(() => {
        const newHeight = element.scrollHeight;
        const textLength = element.value.length;
        return () => {
          element.style.height = `${newHeight}px`;
          if (shouldScrollToEnd) {
            element.focus();
            element.setSelectionRange(textLength, textLength);
            element.scrollTop = newHeight;
          }
        };
      });
    });
  });

  useEffect(() => {
    if (!draft || hydratedStorageKey !== currentStorageKey) return;

    shouldScrollQuestionToEndRef.current = true;
    setQuestion(draft);
    setView('chat');
    setThreadAssistantDraft({ draft: undefined });

    if (questionInputRef.current && draft === question) {
      resizeQuestionInput(questionInputRef.current, true);
      shouldScrollQuestionToEndRef.current = false;
    }
  }, [currentStorageKey, draft, hydratedStorageKey, question]);

  useEffect(() => {
    const questionInput = questionInputRef.current;
    if (!questionInput) return;
    const shouldScrollToEnd = shouldScrollQuestionToEndRef.current;
    shouldScrollQuestionToEndRef.current = false;
    resizeQuestionInput(questionInput, shouldScrollToEnd);
  }, [question]);

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
    const storedChats = readStoredChats(storageKey);
    setChats(storedChats.chats);
    setActiveChatId(storedChats.activeChatId);
    setHydratedStorageKey(storageKey);
    setPendingAttachments([]);
    setIsDraggingAttachments(false);
    attachmentDragDepthRef.current = 0;
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
      setSettingsAnswerModel(settingsResult.value.answerModel || settingsResult.value.defaultModel);
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
      setSettingsAnswerModel(settingsResult.status === 'fulfilled'
        ? (settingsResult.value.answerModel || configuredModel || catalog.defaultModel || nextModel)
        : (configuredModel || catalog.defaultModel || nextModel));
    } else if (settingsResult.status === 'fulfilled') {
      const storedModel = localStorage.getItem(MODEL_STORAGE_KEY) || '';
      const configuredModel = settingsResult.value.defaultModel || storedModel;
      setActiveModel(configuredModel);
      setSettingsModel(configuredModel);
      setSettingsAnswerModel(settingsResult.value.answerModel || configuredModel);
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
    localStorage.setItem(hydratedStorageKey, JSON.stringify({
      activeChatId,
      chats: chats.slice(-MAX_STORED_CHATS).map((chat) => ({
        ...chat,
        messages: chat.messages.slice(-100),
      })),
    } satisfies StoredAssistantChats));
  }, [activeChatId, chats, currentStorageKey, hydratedStorageKey]);

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

  const openContextDateField = useLastCallback((field: ContextDateField) => {
    setCalendarMaxAt(Date.now());
    setActiveContextDateField(field);
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

  const addAttachments = useLastCallback(async (files: File[]) => {
    if (!files.length) return;
    if (pendingAttachments.length + files.length > MAX_ATTACHMENT_COUNT) {
      setError(lang('ThreadAIAttachmentCountError'));
      return;
    }
    if (files.some((file) => (
      !ALLOWED_ATTACHMENT_TYPES.has(resolveAttachmentMimeType(file)) || file.size > MAX_ATTACHMENT_BYTES
    ))) {
      setError(lang('ThreadAIAttachmentTypeError'));
      return;
    }
    const totalBytes = pendingAttachments.reduce((total, attachment) => total + attachment.byteSize, 0)
      + files.reduce((total, file) => total + file.size, 0);
    if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
      setError(lang('ThreadAIAttachmentTotalError'));
      return;
    }
    try {
      const attachments = await Promise.all(files.map(readAttachment));
      setPendingAttachments((current) => [...current, ...attachments]);
      setError('');
    } catch (nextError) {
      setError(errorMessage(nextError));
    }
  });

  const handleAttachments = useLastCallback((event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files || []);
    event.currentTarget.value = '';
    void addAttachments(files);
  });

  const handleAttachmentDragEnter = useLastCallback((event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    if (isSending) return;
    attachmentDragDepthRef.current += 1;
    setIsDraggingAttachments(true);
  });

  const handleAttachmentDragOver = useLastCallback((event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    if (isSending) return;
    event.dataTransfer.dropEffect = 'copy';
  });

  const handleAttachmentDragLeave = useLastCallback((event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    attachmentDragDepthRef.current = Math.max(0, attachmentDragDepthRef.current - 1);
    if (!attachmentDragDepthRef.current) setIsDraggingAttachments(false);
  });

  const handleAttachmentDrop = useLastCallback((event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    attachmentDragDepthRef.current = 0;
    setIsDraggingAttachments(false);
    if (isSending) return;
    void addAttachments(Array.from(event.dataTransfer.files));
  });

  const submitQuestion = useLastCallback(async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!canSend) {
      if (!settings.apiKeyConfigured) setView('settings');
      return;
    }

    const nextQuestion = question.trim() || lang('ThreadAIAttachmentPrompt');
    const userMessage: LocalAssistantMessage = {
      id: localMessageId('user'),
      role: 'user',
      content: nextQuestion,
      createdAt: new Date().toISOString(),
      attachments: pendingAttachments.map(({ name, mimeType, previewUrl }) => ({
        name,
        mimeType,
        previewUrl,
      })),
    };
    const history = messages.slice(-20).map((message) => ({ role: message.role, text: message.content }));
    const attachments = pendingAttachments.map(({ name, mimeType, data }) => ({ name, mimeType, data }));
    const skills: ThreadAiSkill[] = activeSkills.map(({ title, instructions }) => ({
      name: title,
      instructions,
    }));
    const submittedChatId = activeChatId;
    setChats((current) => current.map((chat) => (
      chat.id === submittedChatId ? {
        ...chat,
        title: chat.title || createChatTitle(nextQuestion),
        draft: '',
        messages: [...chat.messages, userMessage],
      } : chat
    )));
    setPendingAttachments([]);
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
        skills,
      });
      updateChatMessages(submittedChatId, (current) => [...current, {
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
    if (!settingsModel || !settingsAnswerModel || settings.canEdit === false) return;
    const requestedModel = settingsModel;
    const requestedAnswerModel = settingsAnswerModel;
    setIsSavingSettings(true);
    setError('');
    setNotice('');
    try {
      const nextSettings = await updateThreadAiSettings({
        defaultModel: requestedModel,
        answerModel: requestedAnswerModel,
      });
      const persistedSettings = await getThreadAiSettings();
      if (
        nextSettings.defaultModel !== requestedModel
        || nextSettings.answerModel !== requestedAnswerModel
        || persistedSettings.defaultModel !== requestedModel
        || persistedSettings.answerModel !== requestedAnswerModel
      ) {
        setSettings(persistedSettings);
        setSettingsModel(persistedSettings.defaultModel || requestedModel);
        setSettingsAnswerModel(persistedSettings.answerModel || requestedAnswerModel);
        throw new Error(lang('ThreadAISettingsNotSaved'));
      }
      setSettings(persistedSettings);
      setSettingsModel(requestedModel);
      setSettingsAnswerModel(requestedAnswerModel);
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

  const fillAssistantSuggestion = useLastCallback((suggestion: string) => {
    setQuestion(suggestion);
    requestMutation(() => {
      const questionInput = questionInputRef.current;
      if (!questionInput) return;

      questionInput.focus();
      questionInput.setSelectionRange(suggestion.length, suggestion.length);
    });
  });

  const renderAssistantTextPart = (text: string, key: string): TeactNode[] => {
    return text.split(/(\[#\d+\])/g).filter(Boolean).map((part, index) => {
      const match = part.match(/^\[#(\d+)\]$/);
      if (!match || !currentChatId) return <span key={`${key}-text-${index}`}>{part}</span>;
      const messageId = Number(match[1]);
      return (
        <button
          key={`${key}-citation-${messageId}-${index}`}
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

  const renderMarkdownChildren = (
    node: ChildNode,
    key: string,
    isAssistantCommentary?: boolean,
  ): TeactNode[] => {
    return Array.from(node.childNodes).map((child, index) => (
      renderMarkdownNode(child, `${key}-${index}`, isAssistantCommentary)
    ));
  };

  const renderMarkdownNode = (
    node: ChildNode,
    key: string,
    isAssistantCommentary?: boolean,
  ): TeactNode => {
    if (node.nodeType === Node.TEXT_NODE) {
      return renderAssistantTextPart(node.textContent || '', key);
    }
    if (!(node instanceof HTMLElement)) return undefined;

    if (node.tagName === 'BLOCKQUOTE') {
      const commentaryChildren = renderMarkdownChildren(node, key, true);
      return (
        <blockquote key={key} className="ThreadAssistantDrawer-markdownQuote">
          {commentaryChildren}
        </blockquote>
      );
    }

    const children = renderMarkdownChildren(node, key, isAssistantCommentary);
    switch (node.tagName) {
      case 'P':
        return <p key={key} className="ThreadAssistantDrawer-markdownParagraph">{children}</p>;
      case 'STRONG':
      case 'B':
        return <strong key={key} className="ThreadAssistantDrawer-markdownStrong">{children}</strong>;
      case 'EM':
      case 'I':
        return <em key={key} className="ThreadAssistantDrawer-markdownEmphasis">{children}</em>;
      case 'DEL':
        return <del key={key} className="ThreadAssistantDrawer-markdownDeleted">{children}</del>;
      case 'UL':
        return <ul key={key} className="ThreadAssistantDrawer-markdownList">{children}</ul>;
      case 'OL':
        return (
          <ol
            key={key}
            className="ThreadAssistantDrawer-markdownList"
            start={Number(node.getAttribute('start')) || undefined}
          >
            {children}
          </ol>
        );
      case 'LI': {
        const suggestion = node.textContent?.trim();
        if (isAssistantCommentary && suggestion) {
          return (
            <li key={key} className="ThreadAssistantDrawer-markdownListItem">
              <button
                type="button"
                className="ThreadAssistantDrawer-commentarySuggestion"
                onClick={() => fillAssistantSuggestion(suggestion)}
              >
                {suggestion}
              </button>
            </li>
          );
        }

        return <li key={key} className="ThreadAssistantDrawer-markdownListItem">{children}</li>;
      }
      case 'H1':
      case 'H2':
        return <h2 key={key} className="ThreadAssistantDrawer-markdownHeading">{children}</h2>;
      case 'H3':
      case 'H4':
      case 'H5':
      case 'H6':
        return <h3 key={key} className="ThreadAssistantDrawer-markdownSubheading">{children}</h3>;
      case 'PRE':
        return <pre key={key} className="ThreadAssistantDrawer-markdownCodeBlock">{node.textContent}</pre>;
      case 'CODE':
        return <code key={key} className="ThreadAssistantDrawer-markdownCode">{children}</code>;
      case 'A': {
        const url = node.getAttribute('href') || '';
        return (
          <SafeLink
            key={key}
            url={url}
            text={node.textContent || url}
            className="ThreadAssistantDrawer-markdownLink"
          >
            {children}
          </SafeLink>
        );
      }
      case 'IMG': {
        const url = node.getAttribute('src') || '';
        const label = node.getAttribute('alt') || url;
        return (
          <SafeLink key={key} url={url} text={label} className="ThreadAssistantDrawer-markdownLink">
            {label}
          </SafeLink>
        );
      }
      case 'HR':
        return <hr key={key} className="ThreadAssistantDrawer-markdownRule" />;
      case 'TABLE':
        return (
          <div key={key} className="ThreadAssistantDrawer-markdownTableWrap custom-scroll-x">
            <table className="ThreadAssistantDrawer-markdownTable">{children}</table>
          </div>
        );
      case 'TH':
        return <th key={key} className="ThreadAssistantDrawer-markdownTableCell">{children}</th>;
      case 'TD':
        return <td key={key} className="ThreadAssistantDrawer-markdownTableCell">{children}</td>;
      case 'BR':
        return <br key={key} />;
      case 'INPUT':
        return (
          <span key={key} className="ThreadAssistantDrawer-markdownCheckbox">
            {node.hasAttribute('checked') ? '☑' : '☐'}
          </span>
        );
      case 'SCRIPT':
      case 'STYLE':
        return undefined;
      default:
        return children;
    }
  };

  const renderAssistantText = (message: LocalAssistantMessage): TeactNode[] => {
    const html = parse(message.content, { async: false, breaks: true, gfm: true });
    if (typeof html !== 'string') return renderAssistantTextPart(message.content, message.id);

    const document = new DOMParser().parseFromString(html, 'text/html');
    return renderMarkdownChildren(document.body, message.id);
  };

  const copyAnswer = useLastCallback(async (message: LocalAssistantMessage) => {
    const answer = extractAssistantAnswer(message.content);
    if (!answer) return;

    await navigator.clipboard.writeText(answer);
    setCopiedMessageId(message.id);
    window.setTimeout(() => setCopiedMessageId(''), 1500);
  });

  const downloadAnswer = useLastCallback((message: LocalAssistantMessage) => {
    const answer = extractAssistantAnswer(message.content);
    if (!answer) return;

    const activeContext = buildTelegramContext();
    const markdown = [
      '# AI chat',
      `- Telegram chat: ${activeContext.title}`,
      `- Model: ${message.model || activeModel || 'AI'}`,
      '',
      answer,
      '',
    ].join('\n');
    const blobUrl = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'ai-chat-answer.md';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  });

  const insertAnswerInChat = useLastCallback((message: LocalAssistantMessage) => {
    if (!currentChatId) return;

    const answer = extractAssistantAnswer(message.content);
    if (!answer) return;

    const articleMarkdown = contextPeer
      ? replaceMessageCitationsWithLinks(answer, contextPeer, currentThreadId)
      : answer;
    const shouldOpenAsArticle = articleMarkdown.length >= ARTICLE_MIN_TEXT_LENGTH
      && (
        RE_BLOCK_MARKDOWN_FORMATTING.test(articleMarkdown)
        || RE_INLINE_MARKDOWN_FORMATTING.test(articleMarkdown)
      );
    if (shouldOpenAsArticle) {
      setIsRichInputExpanded({ isRichInputExpanded: true });
    }

    openChatWithDraft({
      chatId: currentChatId,
      threadId: currentThreadId,
      text: { text: shouldOpenAsArticle ? articleMarkdown : answer },
      isMarkdown: shouldOpenAsArticle,
    });
  });

  const startNewChat = useLastCallback(() => {
    if (isSending) return;
    const chat = createAssistantChat();
    setChats((current) => [...current, chat].slice(-MAX_STORED_CHATS));
    setActiveChatId(chat.id);
    setPendingAttachments([]);
    setError('');
    setNotice('');
    setView('chat');
  });

  const openAssistantChat = useLastCallback((chatId: string) => {
    if (isSending || chatId === activeChatId) return;
    setActiveChatId(chatId);
    setPendingAttachments([]);
    setError('');
    setNotice('');
    setView('chat');
  });

  const closeAssistantChat = useLastCallback((chatId: string) => {
    if (isSending) return;
    const chatIndex = chats.findIndex(({ id }) => id === chatId);
    if (chatIndex < 0) return;

    const nextChats = chats.filter(({ id }) => id !== chatId);
    if (!nextChats.length) {
      const replacement = createAssistantChat();
      setChats([replacement]);
      setActiveChatId(replacement.id);
    } else {
      setChats(nextChats);
      if (activeChatId === chatId) {
        setActiveChatId(nextChats[Math.max(0, chatIndex - 1)].id);
      }
    }
    setPendingAttachments([]);
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
            openContextDateField(nextMode === 'since' ? 'from' : nextMode === 'until' ? 'to' : 'range');
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
          disabled={isSending}
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

  const renderChatTabs = () => (
    <div className="ThreadAssistantDrawer-tabs custom-scroll-x">
      {chats.map((chat) => (
        <div
          key={chat.id}
          className={`ThreadAssistantDrawer-tab${chat.id === activeChatId ? ' active' : ''}`}
        >
          <button
            type="button"
            className="ThreadAssistantDrawer-tabLabel"
            disabled={isSending}
            onClick={() => openAssistantChat(chat.id)}
          >
            {chat.title || lang('ThreadAINewChat')}
          </button>
          <button
            type="button"
            className="ThreadAssistantDrawer-tabClose"
            aria-label={lang('ThreadAICloseChat')}
            disabled={isSending}
            onClick={() => closeAssistantChat(chat.id)}
          >
            <Icon name="close" />
          </button>
        </div>
      ))}
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
              <span>{resolveModelDisplayName(message.model)}</span>
            </div>
          )}
          <div
            className={`ThreadAssistantDrawer-copy${
              message.role === 'assistant' ? ' ThreadAssistantDrawer-markdown' : ''
            }`}
          >
            {message.role === 'assistant' ? renderAssistantText(message) : message.content}
          </div>
          {Boolean(message.attachments?.length) && (
            <div className="ThreadAssistantDrawer-attachmentNames">
              {message.attachments.map((attachment, index) => {
                const { name, mimeType, previewUrl } = attachment;
                const isImagePreview = Boolean(
                  previewUrl && mimeType && IMAGE_ATTACHMENT_TYPES.has(mimeType),
                );

                if (isImagePreview) {
                  return (
                    <div key={`${name}-${index}`} className="ThreadAssistantDrawer-messageImage">
                      <img
                        className="ThreadAssistantDrawer-messageImagePreview"
                        src={previewUrl}
                        alt={name}
                      />
                      <span className="ThreadAssistantDrawer-messageImageName">{name}</span>
                    </div>
                  );
                }

                return (
                  <span key={`${name}-${index}`} className="ThreadAssistantDrawer-attachmentName">
                    <Icon name="attach" />
                    {name}
                  </span>
                );
              })}
            </div>
          )}
          {message.role === 'assistant' && (
            <div className="ThreadAssistantDrawer-messageActions">
              <button
                type="button"
                aria-label={copiedMessageId === message.id ? lang('ThreadAICopied') : lang('Copy')}
                onMouseEnter={() => setHoveredMessageAction({ messageId: message.id, action: 'copy' })}
                onMouseLeave={() => setHoveredMessageAction(undefined)}
                onFocus={() => setHoveredMessageAction({ messageId: message.id, action: 'copy' })}
                onBlur={() => setHoveredMessageAction(undefined)}
                onClick={() => void copyAnswer(message)}
              >
                <Icon name="copy" />
              </button>
              <button
                type="button"
                aria-label={lang('ThreadAIDownload')}
                onMouseEnter={() => setHoveredMessageAction({ messageId: message.id, action: 'download' })}
                onMouseLeave={() => setHoveredMessageAction(undefined)}
                onFocus={() => setHoveredMessageAction({ messageId: message.id, action: 'download' })}
                onBlur={() => setHoveredMessageAction(undefined)}
                onClick={() => downloadAnswer(message)}
              >
                <Icon name="download" />
              </button>
              <button
                type="button"
                aria-label={lang('ThreadAIAddToMessage')}
                disabled={!currentChatId}
                onMouseEnter={() => setHoveredMessageAction({ messageId: message.id, action: 'insert' })}
                onMouseLeave={() => setHoveredMessageAction(undefined)}
                onFocus={() => setHoveredMessageAction({ messageId: message.id, action: 'insert' })}
                onBlur={() => setHoveredMessageAction(undefined)}
                onClick={() => insertAnswerInChat(message)}
              >
                <Icon name="send-outline" className="ThreadAssistantDrawer-insertIcon" />
              </button>
              <span className="ThreadAssistantDrawer-messageActionLabel">
                {resolveMessageActionLabel(message)}
              </span>
            </div>
          )}
        </article>
      ))}
      {isSending && (
        <div className="ThreadAssistantDrawer-thinking" role="status">
          {lang('ThreadAIThinking')}
          <span className="ThreadAssistantDrawer-thinkingDots" aria-hidden="true">
            <span className="ThreadAssistantDrawer-thinkingDot" />
            <span className="ThreadAssistantDrawer-thinkingDot" />
            <span className="ThreadAssistantDrawer-thinkingDot" />
          </span>
        </div>
      )}
    </div>
  );

  const renderComposer = () => (
    <form className="ThreadAssistantDrawer-composer" onSubmit={submitQuestion}>
      {Boolean(activeSkills.length) && (
        <div className="ThreadAssistantDrawer-skillChips">
          {activeSkills.map((skill) => (
            <button
              key={skill.id}
              type="button"
              className="ThreadAssistantDrawer-skillChip"
              aria-label={lang('ThreadAIRemoveSkill', { skill: skill.title })}
              disabled={isSending}
              onClick={() => setActiveSkills(activeSkills.filter(({ id }) => id !== skill.id))}
            >
              <Icon name="tools" className="ThreadAssistantDrawer-skillChipIcon" />
              <span className="ThreadAssistantDrawer-skillChipTitle">{skill.title}</span>
              <Icon name="close" className="ThreadAssistantDrawer-skillChipRemove" />
            </button>
          ))}
        </div>
      )}
      {Boolean(pendingAttachments.length) && (
        <div className="ThreadAssistantDrawer-previews">
          {pendingAttachments.map((attachment, index) => {
            const isImage = IMAGE_ATTACHMENT_TYPES.has(attachment.mimeType);
            return (
              <button
                key={`${attachment.name}-${index}`}
                type="button"
                className={!isImage ? 'ThreadAssistantDrawer-filePreview' : undefined}
                aria-label={lang('ThreadAIRemoveAttachment')}
                onClick={() => setPendingAttachments((current) => (
                  current.filter((_, attachmentIndex) => attachmentIndex !== index)
                ))}
              >
                {isImage ? (
                  <img src={attachment.dataUrl} alt={attachment.name} />
                ) : (
                  <span className="ThreadAssistantDrawer-fileMeta">
                    <Icon name="document" className="ThreadAssistantDrawer-fileIcon" />
                    <em className="ThreadAssistantDrawer-fileName">{attachment.name}</em>
                  </span>
                )}
                <Icon name="close" className="ThreadAssistantDrawer-removeAttachment" />
              </button>
            );
          })}
        </div>
      )}
      <textarea
        ref={questionInputRef}
        className="custom-scroll"
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
            ref={attachmentInputRef}
            type="file"
            accept={ATTACHMENT_ACCEPT}
            multiple
            hidden
            onChange={handleAttachments}
          />
          <button
            type="button"
            className="ThreadAssistantDrawer-attach"
            aria-label={lang('ThreadAIAttachFile')}
            disabled={isSending}
            onClick={() => attachmentInputRef.current?.click()}
          >
            <Icon name="attach" />
          </button>
          <ThreadAssistantSkills
            skills={activeSkills}
            isDisabled={isSending}
            onChange={setActiveSkills}
          />
          <label className="ThreadAssistantDrawer-model">
            <Icon name="bot-command" className="ThreadAssistantDrawer-modelIcon" />
            {models.length ? (
              <select
                value={activeModel}
                aria-label={lang('ThreadAIModel')}
                disabled={isSending}
                onChange={(event) => setActiveModel(event.currentTarget.value)}
              >
                {models.map((model) => (
                  <option
                    key={model.apiName}
                    value={model.apiName}
                    selected={model.apiName === activeModel}
                  >
                    {model.displayName}
                  </option>
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
              <option
                key={model.apiName}
                value={model.apiName}
                selected={model.apiName === settingsModel}
              >
                {model.displayName}
              </option>
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
      <label className="ThreadAssistantDrawer-field">
        <span>{lang('ThreadAIAnswerModel')}</span>
        {models.length ? (
          <select value={settingsAnswerModel} onChange={(event) => setSettingsAnswerModel(event.currentTarget.value)}>
            {models.map((model) => (
              <option
                key={model.apiName}
                value={model.apiName}
                selected={model.apiName === settingsAnswerModel}
              >
                {model.displayName}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={settingsAnswerModel}
            placeholder={lang('ThreadAIModelApiNamePlaceholder')}
            onChange={(event) => setSettingsAnswerModel(event.currentTarget.value)}
          />
        )}
      </label>

      <div className="ThreadAssistantDrawer-settingsActions">
        <button
          type="button"
          className="primary"
          disabled={isSavingSettings || !settingsModel || !settingsAnswerModel || settings.canEdit === false}
          onClick={() => void saveSettings(false)}
        >
          {lang('ThreadAISaveSettings')}
        </button>
        <button
          type="button"
          disabled={isSavingSettings || !settingsModel || !settingsAnswerModel || settings.canEdit === false}
          onClick={() => void saveSettings(true)}
        >
          {isTestingSettings ? lang('ThreadAITestingConnection') : lang('ThreadAITestConnection')}
        </button>
      </div>
    </div>
  );

  function resolveModelDisplayName(modelApiName?: string) {
    if (!modelApiName) return 'AI';
    return models.find(({ apiName }) => apiName === modelApiName)?.displayName || modelApiName;
  }

  function resolveMessageActionLabel(message: LocalAssistantMessage) {
    const action = hoveredMessageAction?.messageId === message.id ? hoveredMessageAction.action : undefined;
    if (action === 'copy') {
      return copiedMessageId === message.id ? lang('ThreadAICopied') : lang('Copy');
    }
    if (action === 'download') return lang('ThreadAIDownload');
    if (action === 'insert') return lang('ThreadAIAddToMessage');
    return formatDateTime(lang, new Date(message.createdAt), { time: 'short' });
  }

  return (
    <div className="ThreadAssistantDrawer">
      {renderToolbar()}
      {renderChatTabs()}
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
          ? contextDateToTimestamp(draftContextSelection.to) : calendarMaxAt}
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
                  openContextDateField(mode === 'since' ? 'from' : mode === 'until' ? 'to' : 'range');
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
            <div
              className="ThreadAssistantDrawer-chat"
              onDragEnter={handleAttachmentDragEnter}
              onDragOver={handleAttachmentDragOver}
              onDragLeave={handleAttachmentDragLeave}
              onDrop={handleAttachmentDrop}
            >
              {renderMessages()}
              {renderComposer()}
              {isDraggingAttachments && (
                <div className="ThreadAssistantDrawer-dropZone">
                  <Icon name="attach" className="ThreadAssistantDrawer-dropZoneIcon" />
                  <span>{lang('ThreadAIDropFiles')}</span>
                </div>
              )}
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
