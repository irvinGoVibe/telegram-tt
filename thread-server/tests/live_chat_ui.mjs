import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const runtimeModules = process.env.CODEX_RUNTIME_NODE_MODULES
  || "/Users/vrway/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const { chromium } = await import(pathToFileURL(path.join(runtimeModules, "playwright", "index.mjs")));

const baseUrl = process.env.THREAD_TEST_URL || "http://127.0.0.1:4317";
const browserErrors = [];
const sentPayloads = [];
const user = { id: "user-1", email: "owner@example.com" };
const chat = {
  id: "chat-1",
  connection_id: "connection-1",
  telegram_chat_id: "-100123456",
  title: "Launch room",
  kind: "supergroup",
  username: "launch_room",
  owner_telegram_user_id: "telegram-owner",
};
const incoming = {
  id: "message-incoming",
  chat_id: chat.id,
  telegram_message_id: 42,
  sender_telegram_id: "telegram-client",
  sender_name: "Client",
  sent_at: "2026-08-19T03:00:00.000Z",
  text: "Can we ship the API and UI today? https://example.com/spec",
  entities: [],
  telegram_message_media: [],
};
const outgoing = {
  id: "message-outgoing",
  chat_id: chat.id,
  telegram_message_id: 43,
  sender_telegram_id: "telegram-owner",
  sender_name: "Owner",
  sent_at: "2026-08-19T03:02:00.000Z",
  text: "I am checking the release now.",
  entities: [{ type: "italic", offset: 5, length: 8 }],
  telegram_message_media: [],
};

const project = { id: "project-1", owner_id: user.id, name: "Client launch", description: "", response_language: "en" };
const workspace = () => ({
  project,
  members: [{ id: "member-1", project_id: project.id, user_id: user.id, role: "owner", profiles: { display_name: "Owner", email: user.email } }],
  chats: [{
    id: "project-chat-1",
    project_id: project.id,
    telegram_chat_id: chat.id,
    live_sync_enabled: false,
    initial_sync_completed_at: "2026-08-19T03:00:00.000Z",
    telegram_chats: chat,
  }],
  threads: [],
  tasks: [],
  instructions: { instructions: "" },
  integrations: [],
});

function json(route, body, status = 200) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 920 } });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console:${message.text()}`);
  });
  page.on("pageerror", (error) => browserErrors.push(`pageerror:${error.message}`));
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/platform/config") return json(route, { enabled: true, telegramEnabled: true, linearEnabled: false });
    if (url.pathname === "/api/auth/session") return json(route, { user });
    if (url.pathname === "/api/platform/me") return json(route, { user, profile: { id: user.id, email: user.email, display_name: "Owner", avatar_url: null } });
    if (url.pathname === "/api/models") return json(route, { models: [{ apiName: "GPT-5.4", displayName: "GPT-5.4" }], defaultModel: "GPT-5.4" });
    if (url.pathname === "/api/projects") return json(route, { projects: [project] });
    if (url.pathname === "/api/projects/project-1/workspace") return json(route, workspace());
    if (url.pathname === "/api/telegram/connections") return json(route, { connections: [{
      id: "connection-1",
      telegram_user_id: "telegram-owner",
      display_name: "Owner",
      status: "connected",
    }] });
    if (url.pathname === "/api/projects/project-1/messages" && request.method() === "GET") {
      return json(route, { messages: [incoming, outgoing] });
    }
    if (url.pathname === "/api/projects/project-1/messages" && request.method() === "POST") {
      const body = request.postDataJSON();
      sentPayloads.push(body);
      return json(route, { message: {
        id: "message-sent",
        chat_id: chat.id,
        telegram_message_id: 44,
        sender_telegram_id: "telegram-owner",
        sender_name: "Owner",
        sent_at: "2026-08-19T03:04:00.000Z",
        reply_to_message_id: body.replyToMessageId,
        text: String(body.text).trim(),
        entities: body.entities,
        telegram_message_media: [],
      } }, 201);
    }
    return json(route, { error: `Unexpected test request: ${request.method()} ${url.pathname}` }, 404);
  });

  await page.goto(`${baseUrl}/live.html`);
  await page.waitForLoadState("networkidle");

  const createProjectDialog = page.locator("#createProjectDialog");
  await page.getByRole("button", { name: "New project" }).click();
  await createProjectDialog.getByRole("button", { name: "Close" }).click();
  assert.equal(await createProjectDialog.isHidden(), true, "Project dialog close button was blocked by required-field validation");
  await page.getByRole("button", { name: "New project" }).click();
  await createProjectDialog.getByRole("button", { name: "Cancel" }).click();
  assert.equal(await createProjectDialog.isHidden(), true, "Project dialog cancel button was blocked by required-field validation");

  const incomingRow = page.locator("#message-message-incoming");
  const outgoingRow = page.locator("#message-message-outgoing");
  assert.equal(await incomingRow.getAttribute("class").then((value) => value.includes("incoming")), true, "Incoming message bubble is missing");
  assert.equal(await outgoingRow.getAttribute("class").then((value) => value.includes("own")), true, "Outgoing message bubble is missing");
  const messageActions = incomingRow.locator(".message-actions button");
  assert.equal(await messageActions.count(), 3, "Telegram message actions are incomplete");
  assert.equal(await messageActions.locator("svg").count(), 3, "Telegram message actions are not rendered as icons");
  assert.deepEqual(await messageActions.allTextContents(), ["", "", ""], "Telegram message actions still render text labels");
  const taskAction = incomingRow.getByRole("button", { name: "Task" });
  await taskAction.click();
  assert.equal(await taskAction.getAttribute("aria-pressed"), "true", "Task icon did not expose its selected state");
  await taskAction.click();
  assert.equal(await taskAction.getAttribute("aria-pressed"), "false", "Task icon did not clear its selected state");
  assert.equal(await incomingRow.locator('.message-text a[href="https://example.com/spec"]').count(), 1, "Telegram message URL was not rendered as a link");
  assert.equal(await outgoingRow.locator(".message-text em").textContent(), "checking", "Stored Telegram formatting was not rendered");

  await incomingRow.locator(".message-content").focus();
  await incomingRow.getByRole("button", { name: "Reply" }).click();
  assert.equal(await page.locator("#telegramReplyPreview").isVisible(), true, "Reply preview did not open");
  assert.equal(await page.locator("#telegramReplyAuthor").textContent(), "Reply to Client");
  await page.screenshot({ path: "/tmp/thread-telegram-reply-desktop.png", fullPage: true });

  const editor = page.getByRole("textbox", { name: "Telegram message" });
  await editor.evaluate((element) => {
    element.textContent = "Ship now";
    const range = document.createRange();
    range.setStart(element.firstChild, 0);
    range.setEnd(element.firstChild, 4);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    element.dispatchEvent(new InputEvent("input", { bubbles: true }));
  });
  assert.equal(await page.locator("#telegramFormatToolbar").isHidden(), true, "Formatting toolbar should be collapsed by default");
  await page.getByRole("button", { name: "Formatting options" }).click();
  assert.equal(await page.locator("#telegramFormatToolbar").isVisible(), true, "Formatting toolbar did not open from the compact composer");
  await page.getByRole("button", { name: "Bold" }).click();
  assert.equal(await editor.locator("b, strong").textContent(), "Ship", "Bold toolbar action did not format the selection");

  await editor.evaluate((element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const range = document.createRange();
    let cursor = 0;
    for (const node of nodes) {
      const next = cursor + node.nodeValue.length;
      if (cursor <= 5 && next >= 5) range.setStart(node, 5 - cursor);
      if (cursor <= 8 && next >= 8) {
        range.setEnd(node, 8 - cursor);
        break;
      }
      cursor = next;
    }
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  });
  await page.getByRole("button", { name: "Inline code" }).click();
  assert.equal(await editor.locator("code").textContent(), "now", "Code toolbar action did not format the selection");

  await editor.evaluate((element) => {
    element.innerHTML = "<div>API</div><div>UI</div>";
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  });
  await page.getByRole("button", { name: "Bulleted list" }).click();
  assert.equal(await editor.locator("ul").count(), 1, "List toolbar action did not create a bulleted list");

  await editor.evaluate((element) => {
    element.innerHTML = "<div><strong>Ship</strong> <code>now</code></div><ul><li>API</li><li>UI</li></ul>";
    element.dispatchEvent(new InputEvent("input", { bubbles: true }));
  });
  await page.getByRole("button", { name: "Send to Telegram" }).click();
  await page.locator("#message-message-sent").waitFor();

  assert.equal(sentPayloads.length, 1, "Telegram send endpoint was not called once");
  assert.equal(sentPayloads[0].replyToMessageId, 42, "Reply target was not sent to Telegram");
  assert.match(sentPayloads[0].text, /^Ship now\n• API\n• UI/);
  assert.deepEqual(sentPayloads[0].entities, [
    { type: "bold", offset: 0, length: 4 },
    { type: "code", offset: 5, length: 3 },
  ]);
  const sentRow = page.locator("#message-message-sent");
  assert.equal(await sentRow.locator(".message-reply strong").textContent(), "Client", "Reply quote does not resolve the source message");
  assert.equal(await sentRow.locator(".message-text strong").textContent(), "Ship", "Sent bold entity was not rendered");
  assert.equal(await sentRow.locator(".message-text code").textContent(), "now", "Sent code entity was not rendered");
  assert.equal(await page.locator("#telegramReplyPreview").isHidden(), true, "Reply state was not cleared after sending");
  await page.screenshot({ path: "/tmp/thread-telegram-chat-desktop.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(180);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "Telegram chat overflows the mobile viewport");
  assert.equal(await editor.isVisible(), true, "Telegram composer is hidden on mobile");
  await page.screenshot({ path: "/tmp/thread-telegram-chat-mobile.png", fullPage: true });

  assert.deepEqual(browserErrors, [], `Browser errors:\n${browserErrors.join("\n")}`);
  console.log("Live Telegram chat UI checks passed: bubbles, rich formatting, reply, send, responsive layout");
} finally {
  await browser.close();
}
