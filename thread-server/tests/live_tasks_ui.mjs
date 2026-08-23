import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const runtimeModules = process.env.CODEX_RUNTIME_NODE_MODULES
  || "/Users/vrway/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const { chromium } = await import(pathToFileURL(path.join(runtimeModules, "playwright", "index.mjs")));

const baseUrl = process.env.THREAD_TEST_URL || "http://127.0.0.1:4317";
const browserErrors = [];
const updates = [];
const sourceNavigationRequests = [];
const user = { id: "user-1", email: "owner@example.com" };
const sourceTelegramChat = {
  id: "chat-1",
  connection_id: "connection-1",
  telegram_chat_id: "-100123456",
  title: "Client room",
  kind: "supergroup",
  username: "client_room",
};
const sourceMessage = {
  id: "message-1",
  chat_id: "chat-1",
  telegram_message_id: 42,
  sender_name: "Client",
  sent_at: "2026-08-18T12:00:00.000Z",
  text: "Please keep every task linked to its source.",
  telegram_chats: sourceTelegramChat,
};
const otherMessage = {
  id: "message-other",
  chat_id: "chat-other",
  telegram_message_id: 7,
  sender_name: "Team",
  sent_at: "2026-08-18T11:00:00.000Z",
  text: "This is a different project conversation.",
};
let task = {
  id: "task-1",
  project_id: "project-1",
  created_by: "user-1",
  title: "Prepare source-linked release",
  description: "## Objective\n\nShip the agreed scope [#42]\n\n## Acceptance criteria\n\n- Keep source links",
  status: "open",
  anchor_message_count: 1,
  context_window_days: 10,
  generation_model: "GPT-5.4",
  generated_at: "2026-08-19T00:00:00.000Z",
  external_provider: null,
  external_id: null,
  external_url: null,
  created_at: "2026-08-19T00:00:00.000Z",
  updated_at: "2026-08-19T00:00:00.000Z",
  task_sources: [{
    task_id: "task-1",
    telegram_message_id: "message-1",
    ordinal: 0,
    telegram_messages: sourceMessage,
  }],
};

const workspace = () => ({
  project: { id: "project-1", owner_id: "user-1", name: "Client launch", description: "", response_language: "en" },
  members: [{ id: "member-1", project_id: "project-1", user_id: "user-1", role: "owner", profiles: { display_name: "Owner", email: user.email } }],
  chats: [{
    id: "project-chat-other",
    project_id: "project-1",
    telegram_chat_id: "chat-other",
    live_sync_enabled: false,
    initial_sync_completed_at: "2026-08-18T11:00:00.000Z",
    telegram_chats: {
      id: "chat-other",
      connection_id: "connection-1",
      telegram_chat_id: "-100987654",
      title: "Other room",
      kind: "supergroup",
      username: "other_room",
    },
  }, {
    id: "project-chat-source",
    project_id: "project-1",
    telegram_chat_id: "chat-1",
    live_sync_enabled: false,
    initial_sync_completed_at: "2026-08-18T12:00:00.000Z",
    telegram_chats: sourceTelegramChat,
  }],
  threads: [],
  tasks: [task],
  instructions: { instructions: "" },
  integrations: [{
    id: "integration-1",
    project_id: "project-1",
    provider: "linear",
    status: "connected",
    external_workspace_name: "evallens",
    config: { teamId: "team-1", teamName: "Engineering", teamKey: "ENG", projectId: "linear-project-1", projectName: "Client launch" },
  }],
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
    if (url.pathname === "/api/platform/config") return json(route, { enabled: true, telegramEnabled: false, linearEnabled: true, linearMcpUrl: "https://mcp.linear.app/mcp" });
    if (url.pathname === "/api/auth/session") return json(route, { user });
    if (url.pathname === "/api/platform/me") return json(route, { user, profile: { id: user.id, email: user.email, display_name: "Owner", avatar_url: null } });
    if (url.pathname === "/api/models") return json(route, { models: [{ apiName: "GPT-5.4", displayName: "GPT-5.4" }], defaultModel: "GPT-5.4" });
    if (url.pathname === "/api/projects") return json(route, { projects: [workspace().project] });
    if (url.pathname === "/api/projects/project-1/workspace") return json(route, workspace());
    if (url.pathname === "/api/projects/project-1/messages") {
      const chatId = url.searchParams.get("chatId");
      const sourceId = url.searchParams.get("sourceId");
      if (sourceId) sourceNavigationRequests.push({ chatId, sourceId });
      return json(route, { messages: chatId === "chat-1" ? [sourceMessage] : [otherMessage] });
    }
    if (url.pathname === "/api/tasks/task-1" && request.method() === "PATCH") {
      const body = request.postDataJSON();
      updates.push(body);
      task = { ...task, ...body, updated_at: "2026-08-19T01:00:00.000Z" };
      return json(route, { task });
    }
    return json(route, { error: `Unexpected test request: ${request.method()} ${url.pathname}` }, 404);
  });

  await page.goto(`${baseUrl}/live.html`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Project tasks" }).click();

  const card = page.locator(".live-task-card");
  assert.equal(await card.count(), 1);
  assert.equal(await card.locator(".task-card-details").isVisible(), false, "Task should start collapsed");

  await card.getByRole("button", { name: /Expand task/ }).click();
  assert.equal(await page.locator(".task-card-details").isVisible(), true, "Task did not expand");
  assert.equal(await card.locator("a.task-inline-citation").count(), 0, "Inline task citation still opens external Telegram");
  assert.equal(await card.locator(".task-source-links a").count(), 0, "Task source footer still opens external Telegram");
  const sourceCitation = card.getByRole("button", { name: "Open message #42 in Client room" }).first();
  assert.equal(await sourceCitation.getAttribute("href"), null, "Internal task citation unexpectedly has an external href");
  const appUrl = page.url();
  await sourceCitation.click();
  await page.getByRole("heading", { name: "Client room" }).waitFor();
  await page.locator('[data-telegram-message-id="42"]').waitFor();
  assert.equal(page.url(), appUrl, "Source citation navigated away from Thread");
  assert.deepEqual(sourceNavigationRequests, [{ chatId: "chat-1", sourceId: "message-1" }], "Source citation did not load the cited message in its project chat");
  await page.getByRole("button", { name: /Collapse task/ }).click();
  assert.equal(await page.locator(".task-card-details").isVisible(), false, "Task reopened after collapsing");

  await page.getByRole("button", { name: /Expand task/ }).click();
  await page.getByRole("button", { name: "Edit task" }).click();
  const titleInput = page.locator(".task-edit-title");
  const descriptionInput = page.locator(".task-inline-editor textarea");
  await titleInput.fill("Reviewed source-linked release");
  await descriptionInput.fill("## Objective\n\nShip the reviewed scope [#42]\n\n## Approval checklist\n\n- Product owner approved");

  await page.getByRole("button", { name: /Collapse task/ }).click();
  await page.getByRole("button", { name: /Expand task/ }).click();
  assert.equal(await page.locator(".task-edit-title").inputValue(), "Reviewed source-linked release", "Unsaved title was lost when collapsed");
  assert.match(await page.locator(".task-inline-editor textarea").inputValue(), /Approval checklist/, "Unsaved specification was lost when collapsed");
  assert.equal(await page.getByText("Save changes before publishing").count(), 1, "Publish guard is missing while editing");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-live-mobile-view="assistant"]').click();
  await page.waitForTimeout(260);
  assert.equal(await page.locator(".assistant-task-surface").isVisible(), true, "Task editor is not visible in the mobile assistant view");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "Task editor overflows the mobile viewport");
  const mobileSurface = await page.locator(".assistant-task-surface").evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    scrollLeft: element.scrollLeft,
  }));
  assert.equal(mobileSurface.scrollWidth <= mobileSurface.clientWidth, true, `Task surface overflows horizontally: ${JSON.stringify(mobileSurface)}`);
  const mobileRail = await page.locator(".live-rail").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, transform: getComputedStyle(element).transform };
  });
  assert.equal(mobileRail.right <= 0, true, `Closed project rail remains visible: ${JSON.stringify(mobileRail)}`);
  await page.screenshot({ path: "/tmp/thread-task-editor-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 920 });

  await page.getByRole("button", { name: "Save changes" }).click();
  await page.getByText("Reviewed source-linked release", { exact: true }).waitFor();
  assert.deepEqual(updates, [{
    title: "Reviewed source-linked release",
    description: "## Objective\n\nShip the reviewed scope [#42]\n\n## Approval checklist\n\n- Product owner approved",
  }]);
  assert.equal(await page.locator(".task-inline-editor").count(), 0, "Editor stayed open after save");
  assert.equal(await page.getByText("Approval checklist", { exact: true }).count(), 1, "Saved Markdown was not rendered");
  assert.equal(await page.getByRole("button", { name: "Publish to Linear →" }).count(), 1, "Linear publish action is missing after save");
  await page.getByRole("button", { name: "Edit task" }).click();
  await page.locator(".task-edit-title").fill("Discard this unsaved title");
  await page.getByRole("button", { name: "Cancel" }).click();
  assert.equal(await page.getByText("Reviewed source-linked release", { exact: true }).count(), 1, "Cancel did not restore the saved task");
  assert.equal(updates.length, 1, "Cancel sent an unexpected update");
  await page.screenshot({ path: "/tmp/thread-task-reviewed-desktop.png", fullPage: true });

  assert.deepEqual(browserErrors, [], `Browser errors:\n${browserErrors.join("\n")}`);
  console.log("Live task UI checks passed: internal source navigation, collapse, draft persistence, editing, save, responsive layout");
} finally {
  await browser.close();
}
