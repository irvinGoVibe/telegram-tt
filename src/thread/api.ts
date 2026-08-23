import type { ThreadSource } from './events';

export type ThreadUser = {
  id: string;
  email: string;
  displayName?: string;
};

export type ThreadProject = {
  id: string;
  name: string;
  description: string;
};

export type ThreadIntegration = {
  id: string;
  provider: string;
  status: string;
  external_workspace_name?: string | null;
  config: {
    teamId?: string | null;
    teamName?: string | null;
    teamKey?: string | null;
    projectId?: string | null;
    projectName?: string | null;
  };
};

export type ThreadTask = {
  id: string;
  title: string;
  description: string;
  status: string;
  external_id?: string | null;
  external_url?: string | null;
  created_at: string;
};

export type ThreadWorkspacePayload = {
  project: ThreadProject;
  tasks: ThreadTask[];
  integrations: ThreadIntegration[];
};

export type LinearCatalog = {
  workspace: { id: string; name: string };
  teams: { id: string; name: string; key: string }[];
  projects: { id: string; name: string; teamIds: string[] }[];
};

const API_BASE = String(process.env.THREAD_API_URL || '').replace(/\/+$/, '');

export class ThreadApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ThreadApiError(payload.error || 'Thread request failed.', response.status);
  }
  return payload as T;
}

export async function getThreadSession() {
  return request<{ user: ThreadUser | null }>('/api/auth/session');
}

export async function signInToThread(email: string, password: string) {
  return request<{ user: ThreadUser }>('/api/auth/signin', {
    method: 'POST', body: JSON.stringify({ email, password }),
  });
}

export async function signUpForThread(displayName: string, email: string, password: string) {
  return request<{ user: ThreadUser }>('/api/auth/signup', {
    method: 'POST', body: JSON.stringify({ displayName, email, password }),
  });
}

export async function signOutFromThread() {
  return request<{ signedOut: boolean }>('/api/auth/signout', { method: 'POST' });
}

export async function listThreadProjects() {
  return request<{ projects: ThreadProject[] }>('/api/projects');
}

export async function createThreadProject(name: string, description: string) {
  return request<{ project: ThreadProject }>('/api/projects', {
    method: 'POST', body: JSON.stringify({ name, description }),
  });
}

export async function getThreadWorkspace(projectId: string) {
  return request<ThreadWorkspacePayload>(`/api/projects/${encodeURIComponent(projectId)}/workspace`);
}

export async function createClientTask(
  projectId: string,
  title: string,
  description: string,
  source: ThreadSource,
) {
  return request<{ task: ThreadTask }>(`/api/projects/${encodeURIComponent(projectId)}/client-tasks`, {
    method: 'POST', body: JSON.stringify({ title, description, sources: [source] }),
  });
}

export async function publishTaskToLinear(taskId: string) {
  return request<{ task: ThreadTask; issue: { identifier: string; url: string } }>(
    `/api/tasks/${encodeURIComponent(taskId)}/linear`,
    { method: 'POST' },
  );
}

export async function beginLinearConnection(projectId: string) {
  return request<{ authorizeUrl: string }>(
    `/api/projects/${encodeURIComponent(projectId)}/integrations/linear/connect`,
    { method: 'POST' },
  );
}

export async function getLinearCatalog(projectId: string) {
  const result = await request<{ catalog: LinearCatalog }>(
    `/api/projects/${encodeURIComponent(projectId)}/integrations/linear/catalog`,
  );
  return result.catalog;
}

export async function setLinearDestination(projectId: string, teamId: string, linearProjectId: string) {
  return request<{ integration: ThreadIntegration }>(
    `/api/projects/${encodeURIComponent(projectId)}/integrations/linear`,
    { method: 'PATCH', body: JSON.stringify({ teamId, projectId: linearProjectId }) },
  );
}
