import type { ChangeEvent, FormEvent } from 'react';
import type { FC } from '../../lib/teact/teact';
import {
  memo, useEffect, useMemo, useState,
} from '../../lib/teact/teact';

import type {
  LinearCatalog,
  ThreadProject,
  ThreadTask,
  ThreadUser,
  ThreadWorkspacePayload,
} from '../../thread/api';
import type { ThreadSource } from '../../thread/events';

import {
  beginLinearConnection,
  beginThreadTelegramSignIn,
  createClientTask,
  createThreadProject,
  getLinearCatalog,
  getThreadSession,
  getThreadTelegramAuthConfig,
  getThreadWorkspace,
  listThreadProjects,
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

const ACTIVE_PROJECT_KEY = 'telegram-thread.active-project';

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

const ThreadWorkspace: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<ThreadUser>();
  const [projects, setProjects] = useState<ThreadProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState('');
  const [workspace, setWorkspace] = useState<ThreadWorkspacePayload>();
  const [sources, setSources] = useState<ThreadSource[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [createdTask, setCreatedTask] = useState<ThreadTask>();
  const [isTelegramAuthEnabled, setIsTelegramAuthEnabled] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [catalog, setCatalog] = useState<LinearCatalog>();
  const [linearTeamId, setLinearTeamId] = useState('');
  const [linearProjectId, setLinearProjectId] = useState('');

  const linearIntegration = workspace?.integrations.find(({ provider }) => provider === 'linear');
  const isLinearReady = Boolean(linearIntegration?.status === 'connected'
    && linearIntegration.config.teamId && linearIntegration.config.projectId);
  const availableLinearProjects = useMemo(() => catalog?.projects.filter(
    (project) => project.teamIds.includes(linearTeamId),
  ) || [], [catalog, linearTeamId]);

  const loadWorkspace = useLastCallback(async (projectId: string) => {
    if (!projectId) {
      setWorkspace(undefined);
      return;
    }
    const nextWorkspace = await getThreadWorkspace(projectId);
    setWorkspace(nextWorkspace);
  });

  const loadProjects = useLastCallback(async (preferredProjectId?: string) => {
    const result = await listThreadProjects();
    setProjects(result.projects);
    const storedProjectId = preferredProjectId || localStorage.getItem(ACTIVE_PROJECT_KEY) || '';
    const nextProjectId = result.projects.some(({ id }) => id === storedProjectId)
      ? storedProjectId : (result.projects[0]?.id || '');
    setActiveProjectId(nextProjectId);
    if (nextProjectId) localStorage.setItem(ACTIVE_PROJECT_KEY, nextProjectId);
    await loadWorkspace(nextProjectId);
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
        const callbackProject = new URLSearchParams(window.location.search).get('project') || undefined;
        await loadProjects(callbackProject);
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
      params.delete('project');
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

  const handleProjectChange = useLastCallback(async (event: ChangeEvent<HTMLSelectElement>) => {
    const projectId = event.currentTarget.value;
    setActiveProjectId(projectId);
    setCatalog(undefined);
    localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
    setIsLoading(true);
    setError('');
    try {
      await loadWorkspace(projectId);
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setIsLoading(false);
    }
  });

  const submitProject = useLastCallback(async () => {
    if (isLoading) return;
    if (!projectName.trim()) {
      setError('Enter a project name.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const result = await createThreadProject(projectName, projectDescription);
      setProjectName('');
      setProjectDescription('');
      setIsCreatingProject(false);
      await loadProjects(result.project.id);
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setIsLoading(false);
    }
  });

  const handleCreateProject = useLastCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitProject();
  });

  const handleCreateTask = useLastCallback(async (publishToLinear: boolean) => {
    if (isLoading || !sources.length || !activeProjectId) return;
    if (!taskTitle.trim()) {
      setError('Enter a task title.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const result = await createClientTask(activeProjectId, taskTitle, taskDescription, sources);
      let nextTask = result.task;
      if (publishToLinear) {
        const published = await publishTaskToLinear(result.task.id);
        nextTask = published.task;
      }
      setCreatedTask(nextTask);
      setSources([]);
      await loadWorkspace(activeProjectId);
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setIsLoading(false);
    }
  });

  const handleConnectLinear = useLastCallback(async () => {
    if (!activeProjectId) return;
    setIsLoading(true);
    setError('');
    try {
      localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
      const { authorizeUrl } = await beginLinearConnection(activeProjectId);
      window.location.assign(authorizeUrl);
    } catch (nextError) {
      setError(errorMessage(nextError));
      setIsLoading(false);
    }
  });

  const handleLoadCatalog = useLastCallback(async () => {
    if (!activeProjectId) return;
    setIsLoading(true);
    setError('');
    try {
      const nextCatalog = await getLinearCatalog(activeProjectId);
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
    if (!activeProjectId || !linearTeamId || !linearProjectId) return;
    setIsLoading(true);
    setError('');
    try {
      await setLinearDestination(activeProjectId, linearTeamId, linearProjectId);
      setCatalog(undefined);
      await loadWorkspace(activeProjectId);
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
      setProjects([]);
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

  const renderProjectCreator = () => (
    <form action="" className="ThreadWorkspace-projectForm" onSubmit={handleCreateProject}>
      <div>
        <strong>New project</strong>
        <p>Group the chats and Linear work that belong to one outcome.</p>
      </div>
      <label className="input-group touched with-label">
        <input
          className="form-control"
          value={projectName}
          required
          maxLength={120}
          onChange={(event) => setProjectName(event.currentTarget.value)}
        />
        <span>Project name</span>
      </label>
      <TextArea
        value={projectDescription}
        label="Description"
        maxLength={4000}
        noReplaceNewlines
        onChange={(event) => setProjectDescription(event.currentTarget.value)}
      />
      <div className="ThreadWorkspace-rowEnd">
        {projects.length > 0 && (
          <Button color="translucent" onClick={() => setIsCreatingProject(false)}>Cancel</Button>
        )}
        <Button isLoading={isLoading} onClick={() => void submitProject()}>Create project</Button>
      </div>
    </form>
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

  const renderTasks = () => (
    <section className="ThreadWorkspace-tasks">
      <div className="ThreadWorkspace-sectionHeading">
        <div>
          <span>Project trail</span>
          <strong>Recent tasks</strong>
        </div>
        <span>{workspace?.tasks.length || 0}</span>
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
      {workspace?.tasks.length ? workspace.tasks.slice(0, 8).map((task) => (
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

  const renderWorkspace = () => {
    if (isCreatingProject || !projects.length) return renderProjectCreator();
    return (
      <div className="ThreadWorkspace-body">
        <div className="ThreadWorkspace-projectBar">
          <Select
            id="threadProject"
            label="Active project"
            value={activeProjectId}
            hasArrow
            onChange={handleProjectChange}
          >
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </Select>
          <Button
            round
            size="smaller"
            color="translucent"
            ariaLabel="Create project"
            onClick={() => setIsCreatingProject(true)}
          >
            <Icon name="add" />
          </Button>
        </div>
        {renderTaskComposer()}
        {renderLinear()}
        {renderTasks()}
        <button className="ThreadWorkspace-signOut" type="button" onClick={handleSignOut}>
          Sign out of Telegram Tasks
        </button>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      hasCloseButton
      className="ThreadWorkspace"
      contentClassName="ThreadWorkspace-content"
      title="Projects & Linear"
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
