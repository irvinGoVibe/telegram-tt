import type {
  ChangeEvent, FormEvent, KeyboardEvent,
} from 'react';
import type { FC, TeactNode } from '../../lib/teact/teact';
import {
  memo, useEffect, useRef, useState,
} from '../../lib/teact/teact';
import { getActions, getGlobal } from '../../global';

import type { ApiMessage } from '../../api/types';
import type {
  ThreadAiChatContext,
  ThreadAiSettings,
  ThreadModel,
} from '../../thread/api';

import { getPeerTitle } from '../../global/helpers/peers';
import {
  selectChatMessages, selectPeer, selectSender,
} from '../../global/selectors';
import {
  askStandaloneThreadAssistant,
  getThreadAiSettings,
  getThreadModels,
  testThreadAiSettings,
  updateThreadAiSettings,
} from '../../thread/api';

import useLang from '../../hooks/useLang';
import useLastCallback from '../../hooks/useLastCallback';

import Icon from '../common/icons/Icon';
import Button from '../ui/Button';

import './ThreadAssistantDrawer.scss';

const CHAT_STORAGE_PREFIX = 'telegram-thread.ai-chat';
const MODEL_STORAGE_KEY = 'telegram-thread.ai-model';
const ACTIVE_PROJECT_KEY = 'telegram-thread.active-project';
const MAX_IMAGE_COUNT = 4;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_CONTEXT_MESSAGES = 250;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

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

const ThreadAssistantDrawer: FC<OwnProps> = ({ currentChatId, isActive, onClose }) => {
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
  const [settingsProjectId, setSettingsProjectId] = useState('');
  const [settingsModel, setSettingsModel] = useState('');
  const [question, setQuestion] = useState('');
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState('');

  const messagesRef = useRef<HTMLDivElement>();
  const imageInputRef = useRef<HTMLInputElement>();
  const currentStorageKey = chatStorageKey(currentChatId);
  const canSend = Boolean(
    settings.apiKeyConfigured
    && activeModel
    && (question.trim() || pendingImages.length)
    && !isSending,
  );

  const buildTelegramContext = useLastCallback((): ThreadAiChatContext => {
    const global = getGlobal();
    const peer = currentChatId ? selectPeer(global, currentChatId) : undefined;
    const byId = currentChatId ? selectChatMessages(global, currentChatId) : undefined;
    const contextMessages = Object.values(byId || {})
      .sort((left, right) => left.date - right.date || left.id - right.id)
      .slice(-MAX_CONTEXT_MESSAGES)
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
      title: peer ? (getPeerTitle(lang, peer) || 'Telegram chat') : 'Telegram',
      messages: contextMessages,
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
    setIsLoading(true);
    const projectId = localStorage.getItem(ACTIVE_PROJECT_KEY) || '';
    setSettingsProjectId(projectId);

    const [settingsResult, modelsResult] = await Promise.allSettled([
      getThreadAiSettings(projectId || undefined),
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
    if (!settingsModel || !settingsProjectId || settings.canEdit === false) return;
    const requestedModel = settingsModel;
    setIsSavingSettings(true);
    setError('');
    setNotice('');
    try {
      const nextSettings = await updateThreadAiSettings(settingsProjectId, { defaultModel: requestedModel });
      const persistedSettings = await getThreadAiSettings(settingsProjectId);
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
        <span>
          <strong>{context.title}</strong>
          <em>{lang('ThreadAIContextMessages', { count: context.messages.length })}</em>
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

      {!settingsProjectId && <small>{lang('ThreadAIProjectRequired')}</small>}
      {settingsProjectId && settings.canEdit === false && <small>{lang('ThreadAIProjectOwnerOnly')}</small>}

      <div className="ThreadAssistantDrawer-settingsActions">
        <button
          type="button"
          className="primary"
          disabled={isSavingSettings || !settingsModel || !settingsProjectId || settings.canEdit === false}
          onClick={() => void saveSettings(false)}
        >
          {lang('ThreadAISaveSettings')}
        </button>
        <button
          type="button"
          disabled={isSavingSettings || !settingsModel || !settingsProjectId || settings.canEdit === false}
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

export default memo(ThreadAssistantDrawer);
