import type { ThreadSource } from './events';

function cleanLine(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeSources(source: ThreadSource | ThreadSource[]) {
  return Array.isArray(source) ? source : [source];
}

export function buildThreadTaskTitle(source: ThreadSource | ThreadSource[]) {
  const [firstSource] = normalizeSources(source);
  if (!firstSource) return 'Telegram follow-up';
  const firstLine = cleanLine(firstSource.text.split('\n').find(Boolean) || 'Telegram follow-up');
  return firstLine.length > 96 ? `${firstLine.slice(0, 93).trim()}…` : firstLine;
}

export function buildThreadTaskDescription(source: ThreadSource | ThreadSource[]) {
  const sources = normalizeSources(source);
  const context = sources.flatMap((item, index) => {
    const quote = item.text
      .split('\n')
      .map((line) => `> ${line || ' '}`)
      .join('\n');
    return [
      ...(sources.length > 1 ? [`### ${index + 1}. ${item.senderName}`, ''] : []),
      quote,
      '',
    ];
  });
  const sourceLines = sources.map((item) => {
    const sentAt = new Date(item.sentAt).toISOString();
    const label = `${item.chatTitle} · ${item.senderName} · ${sentAt}`;
    return item.telegramUrl
      ? `- [${label}](${item.telegramUrl})`
      : `- ${label} · Telegram message #${item.telegramMessageId}`;
  });

  return [
    '## Context',
    '',
    ...context,
    '## Sources',
    '',
    ...sourceLines,
    '',
    '## Definition of done',
    '',
    '- [ ] Confirm the expected outcome',
    '- [ ] Implement and verify the change',
  ].join('\n');
}
