import type { ThreadSource } from './events';

function cleanLine(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function buildThreadTaskTitle(source: ThreadSource) {
  const firstLine = cleanLine(source.text.split('\n').find(Boolean) || 'Telegram follow-up');
  return firstLine.length > 96 ? `${firstLine.slice(0, 93).trim()}…` : firstLine;
}

export function buildThreadTaskDescription(source: ThreadSource) {
  const sentAt = new Date(source.sentAt).toISOString();
  const sourceLink = source.telegramUrl
    ? `[Open source message in Telegram](${source.telegramUrl})`
    : `Telegram message #${source.telegramMessageId}`;
  const quote = source.text
    .split('\n')
    .map((line) => `> ${line || ' '}`)
    .join('\n');

  return [
    '## Context',
    '',
    quote,
    '',
    '## Source',
    '',
    `- Chat: ${source.chatTitle}`,
    `- Sender: ${source.senderName}`,
    `- Sent: ${sentAt}`,
    `- ${sourceLink}`,
    '',
    '## Definition of done',
    '',
    '- [ ] Confirm the expected outcome',
    '- [ ] Implement and verify the change',
  ].join('\n');
}
