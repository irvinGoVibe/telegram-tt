import type { ThreadSource } from './events';

export type ThreadUser = {
  id: string;
  email?: string;
  displayName?: string;
  telegramUserId?: string;
  username?: string;
  avatarUrl?: string;
};

export type ThreadModel = {
  apiName: string;
  displayName: string;
};

export type ThreadModelCatalog = {
  models: ThreadModel[];
  defaultModel?: string;
};

export type ThreadAiSettings = {
  provider: 'r2';
  providerName: string;
  apiUrl: string;
  apiKeyConfigured: boolean;
  defaultModel: string;
  answerModel: string;
  scope?: 'server';
  canEdit?: boolean;
};

export type ThreadAiChatHistoryItem = {
  role: 'user' | 'assistant';
  text: string;
};

export type ThreadAiChatContextMessage = {
  id: number | string;
  from: string;
  date: string;
  text: string;
  links?: string[];
  media?: string;
  replyTo?: number | string;
};

export type ThreadAiChatContext = {
  chatId?: string;
  title: string;
  messages: ThreadAiChatContextMessage[];
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
  client_sources?: {
    telegram_chat_id: string;
    telegram_message_id: number;
    chat_title: string;
  }[];
};

export type ThreadWorkspacePayload = {
  tasks: ThreadTask[];
  integrations: ThreadIntegration[];
};

export type LinearCatalog = {
  workspace: { id: string; name: string };
  teams: { id: string; name: string; key: string }[];
  projects: { id: string; name: string; teamIds: string[] }[];
};

const API_BASE = String(import.meta.env.TG_THREAD_API_URL || '').replace(/\/+$/, '');

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

export async function getThreadTelegramAuthConfig() {
  return request<{ enabled: boolean }>('/api/auth/telegram/config');
}

export function beginThreadTelegramSignIn(returnTo?: string) {
  const path = returnTo || `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.assign(`${API_BASE}/api/auth/telegram/start?returnTo=${encodeURIComponent(path)}`);
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

export async function getThreadWorkspace() {
  return request<ThreadWorkspacePayload>('/api/workspace');
}

export async function getThreadModels() {
  return request<ThreadModelCatalog>('/api/models');
}

export async function getThreadAiSettings() {
  return request<ThreadAiSettings>('/api/ai/settings', { cache: 'no-store' });
}

export async function updateThreadAiSettings(payload: { defaultModel: string; answerModel: string }) {
  return request<ThreadAiSettings>('/api/ai/settings', {
    method: 'PUT', body: JSON.stringify(payload),
  });
}

export async function generateThreadAiAnswer(payload: { message: ThreadAiChatContextMessage }) {
  return request<{ answer: string; model: string }>('/api/assistant/reply', {
    method: 'POST', body: JSON.stringify(payload),
  });
}

export async function testThreadAiSettings(model?: string) {
  return request<{ connected: boolean; model: string; modelsCount: number }>('/api/ai/settings/test', {
    method: 'POST', body: JSON.stringify({ model }),
  });
}

export async function askStandaloneThreadAssistant(payload: {
  question: string;
  model: string;
  history: ThreadAiChatHistoryItem[];
  context: ThreadAiChatContext;
  attachments?: { name: string; mimeType: string; data: string }[];
}) {
  return request<{ answer: string; model: string }>('/api/assistant/chat', {
    method: 'POST', body: JSON.stringify(payload),
  });
}

export async function createClientTask(
  title: string,
  description: string,
  sources: ThreadSource[],
) {
  return request<{ task: ThreadTask }>('/api/tasks', {
    method: 'POST', body: JSON.stringify({ title, description, sources: sources.slice(0, 20) }),
  });
}

export async function publishTaskToLinear(taskId: string) {
  return request<{ task: ThreadTask; issue: { identifier: string; url: string } }>(
    `/api/tasks/${encodeURIComponent(taskId)}/linear`,
    { method: 'POST' },
  );
}

export async function beginLinearConnection() {
  return request<{ authorizeUrl: string }>(
    '/api/integrations/linear/connect',
    { method: 'POST' },
  );
}

export async function getLinearCatalog() {
  const result = await request<{ catalog: LinearCatalog }>(
    '/api/integrations/linear/catalog',
  );
  return result.catalog;
}

export async function setLinearDestination(teamId: string, linearProjectId: string) {
  return request<{ integration: ThreadIntegration }>(
    '/api/integrations/linear',
    { method: 'PATCH', body: JSON.stringify({ teamId, projectId: linearProjectId }) },
  );
}
