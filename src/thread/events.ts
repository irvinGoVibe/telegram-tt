export const THREAD_WORKSPACE_EVENT = 'thread:open-workspace';

export type ThreadSource = {
  telegramChatId: string;
  telegramMessageId: number;
  chatTitle: string;
  senderName: string;
  text: string;
  sentAt: number;
  telegramUrl?: string;
};

export function openThreadWorkspace(source?: ThreadSource) {
  window.dispatchEvent(new CustomEvent(THREAD_WORKSPACE_EVENT, {
    detail: source ? { source } : {},
  }));
}
