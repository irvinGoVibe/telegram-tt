import type { ChangeEvent } from 'react';
import type { FC } from '../../lib/teact/teact';
import {
  memo, useEffect, useMemo, useState,
} from '../../lib/teact/teact';

import type {
  LinearCatalog,
  ThreadTask,
  ThreadUser,
  ThreadWorkspacePayload,
} from '../../thread/api';
import type { ThreadSource } from '../../thread/events';

import {
  beginLinearConnection,
  beginThreadTelegramSignIn,
  createClientTask,
  getLinearCatalog,
  getThreadSession,
  getThreadTelegramAuthConfig,
  getThreadWorkspace,
  publishTaskToLinear,
  setLinearDestination,
  signOutFromThread,
} from '../../thread/api';
import { buildThreadTaskDescription, buildThreadTaskTitle } from '../../thread/draft';
import { THREAD_WORKSPACE_EVENT } from '../../thread/events';

import useLastCallback from '../../hooks/useLastCallback';

import Icon from '../common/icons/Icon';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';

import './ThreadWorkspace.scss';

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

const ThreadWorkspace: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<ThreadUser>();
  const [workspace, setWorkspace] = useState<ThreadWorkspacePayload>();
  const [sources, setSources] = useState<ThreadSource[]>([]);
  const [activeChat, setActiveChat] = useState<{ id: string; title: string }>();
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [createdTask, setCreatedTask] = useState<ThreadTask>();
  const [isTelegramAuthEnabled, setIsTelegramAuthEnabled] = useState(false);
  const [catalog, setCatalog] = useState<LinearCatalog>();
  const [linearTeamId, setLinearTeamId] = useState('');
  const [linearProjectId, setLinearProjectId] = useState('');

  const linearIntegration = workspace?.integrations.find(({ provider }) => provider === 'linear');
  const isLinearReady = Boolean(linearIntegration?.status === 'connected'
    && linearIntegration.config.teamId && linearIntegration.config.projectId);
  const availableLinearProjects = useMemo(() => catalog?.projects.filter(
    (project) => project.teamIds.includes(linearTeamId),
  ) || [], [catalog, linearTeamId]);

  const loadWorkspace = useLastCallback(async () => {
    const nextWorkspace = await getThreadWorkspace();
    setWorkspace(nextWorkspace);
  });

  const bootstrap = useLastCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [session, authConfig] = await Promise.all([
        getThreadSession(),
        getThreadTelegramAuthConfig().catch(() => ({ enabled: false })),
      ]);
      setIsTelegramAuthEnabled(authConfig.enabled);
      setUser(session.user || undefined);
      if (session.user) {
        await loadWorkspace();
      }
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const nextSources = (event as CustomEvent<{ sources?: ThreadSource[] }>).detail?.sources;
      setIsOpen(true);
      setCreatedTask(undefined);
      setError('');
      if (nextSources?.length) {
        setSources(nextSources);
        setActiveChat({ id: nextSources[0].telegramChatId, title: nextSources[0].chatTitle });
        setTaskTitle(buildThreadTaskTitle(nextSources));
        setTaskDescription(buildThreadTaskDescription(nextSources));
      }
      void bootstrap();
    };
    window.addEventListener(THREAD_WORKSPACE_EVENT, handleOpen);

    const params = new URLSearchParams(window.location.search);
    if (params.has('linear') || params.has('telegramAuth')) {
      setIsOpen(true);
      if (params.get('linear') === 'error') setError(params.get('message') || 'Linear connection failed.');
      if (params.get('telegramAuth') === 'error') setError(params.get('message') || 'Telegram sign-in failed.');
      void bootstrap();
      params.delete('linear');
      params.delete('telegramAuth');
      params.delete('message');
      const query = params.toString();
      const cleanLocation = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', cleanLocation);
    }

    return () => window.removeEventListener(THREAD_WORKSPACE_EVENT, handleOpen);
  }, [bootstrap]);

  const close = useLastCallback(() => setIsOpen(false));

  const handleTelegramSignIn = useLastCallback(() => {
    if (!isTelegramAuthEnabled || isLoading) return;
    setIsLoading(true);
    setError('');
    beginThreadTelegramSignIn();
  });

  const handleCreateTask = useLastCallback(async (publishToLinear: boolean) => {
    if (isLoading || !sources.length) return;
    if (!taskTitle.trim()) {
      setError('Enter a task title.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const result = await createClientTask(taskTitle, taskDescription, sources);
      let nextTask = result.task;
      if (publishToLinear) {
        const published = await publishTaskToLinear(result.task.id);
        nextTask = published.task;
      }
      setCreatedTask(nextTask);
      setSources([]);
      await loadWorkspace();
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setIsLoading(false);
    }
  });

  const handleConnectLinear = useLastCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { authorizeUrl } = await beginLinearConnection();
      window.location.assign(authorizeUrl);
    } catch (nextError) {
      setError(errorMessage(nextError));
      setIsLoading(false);
    }
  });

  const handleLoadCatalog = useLastCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const nextCatalog = await getLinearCatalog();
      setCatalog(nextCatalog);
      const nextTeamId = linearIntegration?.config.teamId || nextCatalog.teams[0]?.id || '';
      setLinearTeamId(nextTeamId);
      const nextProjectId = linearIntegration?.config.projectId
        || nextCatalog.projects.find((project) => project.teamIds.includes(nextTeamId))?.id || '';
      setLinearProjectId(nextProjectId);
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setIsLoading(false);
    }
  });

  const handleTeamChange = useLastCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const teamId = event.currentTarget.value;
    setLinearTeamId(teamId);
    setLinearProjectId(catalog?.projects.find((project) => project.teamIds.includes(teamId))?.id || '');
  });

  const handleSaveDestination = useLastCallback(async () => {
    if (!linearTeamId || !linearProjectId) return;
    setIsLoading(true);
    setError('');
    try {
      await setLinearDestination(linearTeamId, linearProjectId);
      setCatalog(undefined);
      await loadWorkspace();
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setIsLoading(false);
    }
  });

  const handleSignOut = useLastCallback(async () => {
    setIsLoading(true);
    try {
      await signOutFromThread();
      setUser(undefined);
      setWorkspace(undefined);
    } finally {
      setIsLoading(false);
    }
  });

  const renderAuth = () => (
    <div className="ThreadWorkspace-auth">
      <div className="ThreadWorkspace-heroIcon"><Icon name="user" /></div>
      <h3>Continue with Telegram</h3>
      <p>Your Telegram identity opens the workspace. Chat access remains a separate permission.</p>
      <Button
        fluid
        isLoading={isLoading}
        disabled={!isTelegramAuthEnabled}
        onClick={handleTelegramSignIn}
      >
        Sign in with Telegram
      </Button>
      {!isTelegramAuthEnabled && (
        <small className="ThreadWorkspace-authHint">Telegram sign-in is not configured on this server yet.</small>
      )}
    </div>
  );

  const renderLinear = () => (
    <section className="ThreadWorkspace-linear">
      <div className="ThreadWorkspace-sectionHeading">
        <div>
          <span>Delivery</span>
          <strong>Linear</strong>
        </div>
        <span className={isLinearReady ? 'ready' : ''}>
          {isLinearReady ? 'Ready' : (linearIntegration ? 'Setup needed' : 'Not connected')}
        </span>
      </div>
      {isLinearReady ? (
        <div className="ThreadWorkspace-linearPath">
          <Icon name="check" />
          <span>{linearIntegration?.external_workspace_name}</span>
          <i>·</i>
          <strong>
            {linearIntegration?.config.teamKey}
            {' '}
            /
            {' '}
            {linearIntegration?.config.projectName}
          </strong>
          <button type="button" onClick={handleLoadCatalog}>Change</button>
        </div>
      ) : linearIntegration ? (
        <>
          {!catalog ? (
            <Button color="secondary" onClick={handleLoadCatalog} isLoading={isLoading}>
              Choose Linear destination
            </Button>
          ) : (
            <div className="ThreadWorkspace-linearForm">
              <Select id="threadLinearTeam" label="Team" value={linearTeamId} hasArrow onChange={handleTeamChange}>
                {catalog.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </Select>
              <Select
                id="threadLinearProject"
                label="Project"
                value={linearProjectId}
                hasArrow
                onChange={(event) => setLinearProjectId(event.currentTarget.value)}
              >
                {availableLinearProjects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </Select>
              <Button onClick={handleSaveDestination} disabled={!linearProjectId}>Save destination</Button>
            </div>
          )}
        </>
      ) : (
        <Button color="secondary" onClick={handleConnectLinear} isLoading={isLoading}>
          Connect Linear
        </Button>
      )}
    </section>
  );

  const renderTaskComposer = () => sources.length > 0 && (
    <section className="ThreadWorkspace-taskComposer">
      <div className="ThreadWorkspace-sectionHeading">
        <div>
          <span>Telegram source</span>
          <strong>Review task</strong>
        </div>
        <button type="button" aria-label="Remove source" onClick={() => setSources([])}>
          <Icon name="close" />
        </button>
      </div>
      <div className="ThreadWorkspace-sources">
        {sources.map((source) => (
          <div className="ThreadWorkspace-source" key={`${source.telegramChatId}-${source.telegramMessageId}`}>
            <div>
              <strong>{source.senderName}</strong>
              <span>{source.chatTitle}</span>
            </div>
            <p>{source.text || 'Media message'}</p>
            {source.telegramUrl && (
              <a href={source.telegramUrl} target="_blank" rel="noreferrer">
                Open message
                <Icon name="open-in-new-tab" />
              </a>
            )}
          </div>
        ))}
      </div>
      <label className="input-group touched with-label">
        <input
          className="form-control"
          value={taskTitle}
          required
          maxLength={300}
          onChange={(event) => setTaskTitle(event.currentTarget.value)}
        />
        <span>Task title</span>
      </label>
      <TextArea
        value={taskDescription}
        label="Description · Markdown"
        maxLength={50000}
        noReplaceNewlines
        onChange={(event) => setTaskDescription(event.currentTarget.value)}
      />
      <div className="ThreadWorkspace-taskActions">
        <Button color="secondary" onClick={() => void handleCreateTask(false)} isLoading={isLoading}>
          Save draft
        </Button>
        <Button onClick={() => void handleCreateTask(true)} disabled={!isLinearReady} isLoading={isLoading}>
          Create in Linear
        </Button>
      </div>
      {!isLinearReady && <small>Connect Linear and choose a destination to publish immediately.</small>}
    </section>
  );

  const visibleTasks = workspace?.tasks.filter((task) => !activeChat
    || task.client_sources?.some((source) => source.telegram_chat_id === activeChat.id)) || [];

  const renderTasks = () => (
    <section className="ThreadWorkspace-tasks">
      <div className="ThreadWorkspace-sectionHeading">
        <div>
          <span>{activeChat?.title || 'All chats'}</span>
          <strong>Recent Linear tasks</strong>
        </div>
        <span>{visibleTasks.length}</span>
      </div>
      {createdTask && (
        <div className="ThreadWorkspace-success">
          <Icon name="check" />
          <span>
            <strong>{createdTask.external_id || 'Draft saved'}</strong>
            {createdTask.title}
          </span>
          {createdTask.external_url && (
            <a href={createdTask.external_url} target="_blank" rel="noreferrer">Open</a>
          )}
        </div>
      )}
      {visibleTasks.length ? visibleTasks.slice(0, 8).map((task) => (
        <a
          key={task.id}
          className="ThreadWorkspace-taskRow"
          href={task.external_url || undefined}
          target={task.external_url ? '_blank' : undefined}
          rel={task.external_url ? 'noreferrer' : undefined}
        >
          <span className={task.external_url ? 'published' : ''}>
            <Icon name={task.external_url ? 'check' : 'document'} />
          </span>
          <div>
            <strong>{task.title}</strong>
            <small>{task.external_id || 'Telegram Tasks draft'}</small>
          </div>
          {task.external_url && <Icon name="arrow-right" />}
        </a>
      )) : (
        <div className="ThreadWorkspace-empty">
          Create a task from any Telegram message using its context menu.
        </div>
      )}
    </section>
  );

  const renderWorkspace = () => (
    <div className="ThreadWorkspace-body">
      <div className="ThreadWorkspace-chatContext">
        <span>Telegram chat</span>
        <strong>{activeChat?.title || 'Open a message to create a task'}</strong>
        <small>Each chat is its own task stream. Linear and AI settings are shared.</small>
      </div>
      {renderTaskComposer()}
      {renderLinear()}
      {renderTasks()}
      <button className="ThreadWorkspace-signOut" type="button" onClick={handleSignOut}>
        Sign out of Telegram Tasks
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      hasCloseButton
      className="ThreadWorkspace"
      contentClassName="ThreadWorkspace-content"
      title="Chat tasks & Linear"
      dialogStyle="width: min(46rem, calc(100vw - 2rem));"
    >
      {error && <div className="ThreadWorkspace-error" role="alert">{error}</div>}
      {user === undefined && isLoading
        ? <div className="ThreadWorkspace-loading">Loading Telegram Tasks…</div>
        : (user ? renderWorkspace() : renderAuth())}
    </Modal>
  );
};

export default memo(ThreadWorkspace);
