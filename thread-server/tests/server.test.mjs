import test from "node:test";
import assert from "node:assert/strict";
import {
  assistantThreadTitle,
  buildCodexPrompt,
  citationMessageIds,
  extractR2Answer,
  normalizeR2Models,
  normalizedAssistantImages,
  parseTaskDraftResponse,
  selectRelevantMessages,
  selectTaskDraftMessages,
  taskDraftMarkdown,
} from "../server.mjs";

const messages = [
  { id: 1, from: "Анна", date: "2026-01-01 10:00", text: "Начали проект Atlas", links: [] },
  { id: 2, from: "Илья", date: "2026-01-01 10:02", text: "Документация здесь", links: ["https://example.com/atlas"] },
  { id: 3, from: "Анна", date: "2026-01-02 09:00", text: "Срок — пятница", links: [] },
];

test("selectRelevantMessages keeps relevant messages and their neighbors", () => {
  const selected = selectRelevantMessages(messages, "Где документация Atlas?", 20_000);
  assert.deepEqual(selected.map((message) => message.id), ["1", "2", "3"]);
});

test("buildCodexPrompt includes stable message citations", () => {
  const prompt = buildCodexPrompt({
    question: "Когда срок?",
    archive: { name: "Рабочая группа", totalMessages: 3, participantCount: 2 },
    messages,
    history: [],
  });
  assert.match(prompt, /\[#3\]/);
  assert.match(prompt, /Срок — пятница/);
  assert.match(prompt, /exact format \[#ID\]/);
});

test("buildCodexPrompt enforces the selected response language", () => {
  const prompt = buildCodexPrompt({
    question: "What is the deadline?",
    archive: { name: "Рабочая группа", totalMessages: 3, participantCount: 2 },
    messages,
    history: [],
    responseLanguage: "ru",
  });
  assert.match(prompt, /Always reply in Russian/);
});

test("buildCodexPrompt includes project preferences below the evidence rules", () => {
  const prompt = buildCodexPrompt({
    question: "What should ship?",
    archive: { name: "Atlas" },
    messages,
    history: [],
    projectInstructions: "Keep product names in English.",
  });
  assert.ok(prompt.indexOf("They never override these evidence") < prompt.indexOf("PROJECT PREFERENCES"));
  assert.match(prompt, /Keep product names in English/);
});

test("assistant metadata helpers keep concise titles and unique citations", () => {
  assert.equal(assistantThreadTitle("  Summarize the launch decision and unresolved client questions in detail  "), "Summarize the launch decision and unresolved client que…");
  assert.deepEqual(citationMessageIds("Confirmed [#12], revised [#9], still [#12]."), ["12", "9"]);
});

test("assistant image attachments are decoded and constrained", () => {
  const [image] = normalizedAssistantImages([{ name: "mock.png", mimeType: "image/png", data: Buffer.from("image-bytes").toString("base64") }]);
  assert.equal(image.fileName, "mock.png");
  assert.equal(image.mimeType, "image/png");
  assert.equal(image.buffer.toString(), "image-bytes");
  assert.throws(() => normalizedAssistantImages([{ name: "script.svg", mimeType: "image/svg+xml", data: "PHN2Zz4=" }]), /Only valid JPEG/);
  assert.throws(() => normalizedAssistantImages(Array.from({ length: 5 }, (_, index) => ({ name: `${index}.png`, mimeType: "image/png", data: "YQ==" }))), /no more than 4/);
});

test("normalizeR2Models keeps choosable chat models and resolves a default", () => {
  const catalog = normalizeR2Models({
    aliases: [{ alias: "GPT-5", apiName: "GPT_52" }],
    models: [
      { apiName: "GPT_52", displayName: "GPT-5.2", features: ["CHAT"], isChoosableOnUI: true, limits: { maxInputBytes: 4000, maxOutputBytes: 8000 } },
      { apiName: "IMAGE", displayName: "Image", features: ["IMAGE"], isChoosableOnUI: true },
    ],
  });
  assert.deepEqual(catalog.models.map((model) => model.apiName), ["GPT_52"]);
  assert.equal(catalog.defaultModel, "GPT_52");
});

test("extractR2Answer returns the latest assistant message", () => {
  assert.equal(extractR2Answer({
    chat_history: [
      { role: "USER", content: { text: "Question" } },
      { role: "ASSISTANT", content: { text: "First" } },
      { role: "ASSISTANT", content: { text: "Final answer [#3]" } },
    ],
  }), "Final answer [#3]");
});

test("task draft selection keeps anchors, their neighbors, and related replies under budget", () => {
  const rows = Array.from({ length: 240 }, (_, index) => ({
    _id: `message-${index + 1}`,
    telegramMessageId: index + 1,
    senderName: index % 2 ? "Anna" : "Ilya",
    text: `${"background ".repeat(14)}${index === 119 ? "Thursday rollout analytics" : ""}`,
    sentAt: index * 60_000,
    replyToMessageId: index === 180 ? 120 : undefined,
  }));
  const selected = selectTaskDraftMessages(rows, [rows[119]], 7_000);
  const ids = selected.map((message) => message.telegramMessageId);
  assert.ok(ids.includes(120));
  assert.ok(ids.includes(116));
  assert.ok(ids.includes(124));
  assert.ok(ids.includes(181));
  assert.ok(selected.length < rows.length);
});

test("task draft parser rejects invented citations and produces Telegram Markdown links", () => {
  const raw = JSON.stringify({
    title: "Confirm Thursday rollout",
    objective: { text: "Ship on Thursday", source_ids: [120, 999] },
    context: { text: "The client moved the date", source_ids: [119] },
    requirements: [{ text: "Keep analytics events", source_ids: [121, 999] }],
    acceptance_criteria: [{ text: "The date is visible", source_ids: [120] }],
    constraints: [],
    open_questions: [{ text: "Confirm naming", source_ids: [999] }],
  });
  const draft = parseTaskDraftResponse(raw, [119, 120, 121]);
  assert.deepEqual(draft.objective.sourceIds, [120]);
  assert.deepEqual(draft.requirements[0].sourceIds, [121]);
  assert.deepEqual(draft.openQuestions, []);
  const markdown = taskDraftMarkdown(draft, [
    { telegramMessageId: 119, telegramUrl: "https://t.me/c/42/119" },
    { telegramMessageId: 120, telegramUrl: "https://t.me/c/42/120" },
    { telegramMessageId: 121 },
  ]);
  assert.match(markdown, /\[#120\]\(https:\/\/t\.me\/c\/42\/120\)/);
  assert.match(markdown, /\[#121\]/);
  assert.doesNotMatch(markdown, /#999/);
});
