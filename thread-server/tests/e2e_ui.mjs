import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const runtimeModules = process.env.CODEX_RUNTIME_NODE_MODULES
  || "/Users/vrway/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const { chromium } = await import(pathToFileURL(path.join(runtimeModules, "playwright", "index.mjs")));

const root = path.dirname(fileURLToPath(import.meta.url));
const artifacts = path.join(root, "artifacts");
const baseUrl = "http://127.0.0.1:4317";
const browserErrors = [];

function captureErrors(page) {
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console:${message.text()}`);
  });
  page.on("pageerror", (error) => browserErrors.push(`pageerror:${error.message}`));
}

const browser = await chromium.launch({ channel: "chrome", headless: true });

try {
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 920 } });
  const desktop = await desktopContext.newPage();
  captureErrors(desktop);
  await desktop.goto(baseUrl);
  await desktop.waitForLoadState("networkidle");
  await desktop.screenshot({ path: path.join(artifacts, "empty-desktop.png"), fullPage: true });

  assert.equal(await desktop.locator("#cliStatus.ready").count(), 1, "Codex CLI status is not ready");
  await desktop.locator("#openSettingsButton").click();
  await desktop.getByText("Light", { exact: true }).click();
  assert.equal(await desktop.locator("html").getAttribute("data-theme"), "light");
  await desktop.waitForTimeout(260);
  await desktop.screenshot({ path: path.join(artifacts, "settings-light-preview.png"), fullPage: true });
  await desktop.getByRole("button", { name: "Cancel" }).click();
  await desktop.waitForFunction(() => document.documentElement.dataset.theme === "dark");
  assert.equal(await desktop.locator("html").getAttribute("data-theme"), "dark");

  const russianContext = await browser.newContext();
  await russianContext.addInitScript(() => {
    localStorage.setItem("thread.preferences.v1", JSON.stringify({ interfaceLanguage: "ru", theme: "light", responseLanguage: "ru" }));
  });
  const russianPage = await russianContext.newPage();
  captureErrors(russianPage);
  await russianPage.goto(baseUrl);
  await russianPage.waitForLoadState("networkidle");
  assert.equal(await russianPage.locator("html").getAttribute("lang"), "ru");
  assert.equal(await russianPage.locator("html").getAttribute("data-theme"), "light");
  await russianPage.locator("#openSettingsButton").click();
  await russianPage.getByText("Язык интерфейса", { exact: true }).waitFor();
  assert.equal(await russianPage.locator('#settingsForm input[name="responseLanguage"][value="ru"]').isChecked(), true);
  await russianPage.waitForTimeout(260);
  await russianPage.screenshot({ path: path.join(artifacts, "settings-russian-light.png"), fullPage: true });
  await russianContext.close();

  const liveSettingsContext = await browser.newContext();
  const liveSettingsPage = await liveSettingsContext.newPage();
  captureErrors(liveSettingsPage);
  await liveSettingsPage.goto(baseUrl);
  await liveSettingsPage.getByRole("button", { name: "Open demo" }).click();
  await liveSettingsPage.locator(".message-row[data-message-id='92']").waitFor();
  await liveSettingsPage.locator("#openSettingsButton").click();
  await liveSettingsPage.getByText("Русский", { exact: true }).first().click();
  await liveSettingsPage.getByRole("button", { name: "Save changes" }).click();
  await liveSettingsPage.waitForFunction(() => document.documentElement.lang === "ru");
  assert.equal(await liveSettingsPage.locator(".message-row:not(.service)").count(), 12, "Changing settings cleared the archive");
  assert.equal(await liveSettingsPage.locator("#openSettingsButton span").innerText(), "Настройки");
  await liveSettingsContext.close();

  const importPage = await browser.newPage({ viewport: { width: 1100, height: 760 } });
  captureErrors(importPage);
  await importPage.goto(baseUrl);
  await importPage.waitForLoadState("networkidle");
  await importPage.getByRole("button", { name: "Choose archive" }).click();
  await importPage.locator("#archiveInput").setInputFiles(path.join(root, "fixtures", "result.json"));
  await importPage.locator(".message-row[data-message-id='3']").waitFor();
  assert.equal(await importPage.locator("#archiveName").innerText(), "Fixture Group");
  assert.equal(await importPage.locator("#allCount").innerText(), "3");
  assert.equal(await importPage.locator("#linksCount").innerText(), "1");
  assert.equal(await importPage.locator(".reply-preview").count(), 1);
  assert.equal(await importPage.locator(".media-chip").count(), 1);
  await importPage.route("**/api/ask", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ answer: "The source is the documents message [#2]." }),
  }));
  await importPage.locator("#assistantInput").fill("Where are the documents?");
  await importPage.locator("#assistantForm").evaluate((form) => form.requestSubmit());
  const telegramCitation = importPage.locator("a.citation-button");
  await telegramCitation.waitFor();
  assert.equal(await telegramCitation.getAttribute("href"), "https://t.me/c/123456/2");
  const linkedMarkdownDownload = importPage.waitForEvent("download");
  await importPage.getByRole("button", { name: "Download .md" }).click();
  const linkedMarkdown = await linkedMarkdownDownload;
  const linkedMarkdownPath = await linkedMarkdown.path();
  assert.ok(linkedMarkdownPath, "Markdown download has no temporary path");
  assert.match(await readFile(linkedMarkdownPath, "utf8"), /\[#2\]\(https:\/\/t\.me\/c\/123456\/2\)/);
  await importPage.close();

  const folderPage = await browser.newPage({ viewport: { width: 1100, height: 760 } });
  captureErrors(folderPage);
  await folderPage.goto(baseUrl);
  await folderPage.waitForLoadState("networkidle");
  await folderPage.getByRole("button", { name: "Choose archive" }).click();
  await folderPage.locator("#folderInput").setInputFiles(path.join(root, "fixtures", "telegram-export"));
  await folderPage.locator(".message-photo img").waitFor();
  assert.equal(await folderPage.locator("#archiveName").innerText(), "Архив с фотографиями");
  assert.equal(await folderPage.locator("#mediaCount").innerText(), "1");
  await folderPage.locator(".message-photo").click();
  assert.equal(await folderPage.locator("#mediaDialog").isVisible(), true);
  assert.equal(await folderPage.locator("#mediaViewerImage").getAttribute("src").then((value) => value?.startsWith("blob:")), true);
  await folderPage.waitForTimeout(260);
  await folderPage.screenshot({ path: path.join(artifacts, "photo-lightbox.png") });
  await folderPage.close();

  const zipPage = await browser.newPage({ viewport: { width: 1100, height: 760 } });
  captureErrors(zipPage);
  await zipPage.goto(baseUrl);
  await zipPage.waitForLoadState("networkidle");
  await zipPage.getByRole("button", { name: "Choose archive" }).click();
  await zipPage.locator("#archiveInput").setInputFiles(path.join(root, "fixtures", "telegram-export.zip"));
  await zipPage.locator(".message-photo img").waitFor();
  assert.equal(await zipPage.locator("#archiveName").innerText(), "Архив с фотографиями");
  assert.equal(await zipPage.locator(".message-photo").count(), 1);
  await zipPage.close();

  await desktop.getByRole("button", { name: "Open demo" }).click();
  await desktop.locator(".message-row[data-message-id='92']").waitFor();
  assert.equal(await desktop.locator(".message-row:not(.service)").count(), 12);
  assert.equal(await desktop.locator("#linksCount").innerText(), "3");
  assert.equal(await desktop.locator("#participantCount").innerText(), "4");

  await desktop.locator("#archiveSearch").fill("PostHog");
  assert.equal(await desktop.locator(".message-row:not(.service)").count(), 2);
  await desktop.getByRole("button", { name: "Reset" }).click();

  await desktop.locator('[data-view="links"]').click();
  assert.equal(await desktop.locator(".message-row:not(.service)").count(), 3);
  await desktop.locator('[data-view="all"]').click();
  await desktop.screenshot({ path: path.join(artifacts, "archive-desktop.png"), fullPage: true });

  const assistantInput = desktop.locator("#assistantInput");
  await assistantInput.fill("When does the closed beta launch?");
  await desktop.locator("#assistantForm").evaluate((form) => form.requestSubmit());
  await desktop.locator(".assistant-message.assistant").waitFor({ timeout: 180_000 });
  assert.ok(await desktop.locator(".citation-button").count(), "Codex answer has no message citations");
  await desktop.locator(".citation-button").first().click();
  await desktop.locator(".message-row.cited").waitFor({ timeout: 5_000 });
  await desktop.screenshot({ path: path.join(artifacts, "answer-desktop.png"), fullPage: true });

  assert.equal(await desktop.locator(".assistant-message-action").count(), 3, "Assistant response actions are missing");
  const markdownDownload = desktop.waitForEvent("download");
  await desktop.getByRole("button", { name: "Download .md" }).click();
  assert.match((await markdownDownload).suggestedFilename(), /\.md$/);

  await desktop.getByRole("button", { name: "Create task" }).click();
  await desktop.getByRole("button", { name: "Create task" }).click();
  assert.equal(await desktop.locator("#assistantTaskCount").innerText(), "1");
  await desktop.getByRole("button", { name: "Open tasks" }).click();
  await desktop.locator("#assistantTasksView").waitFor();
  assert.equal(await desktop.locator(".assistant-task-card").count(), 1);
  await desktop.screenshot({ path: path.join(artifacts, "assistant-tasks-desktop.png"), fullPage: true });
  await desktop.locator(".assistant-task-source").click();
  await desktop.locator(".assistant-message.source-highlight").waitFor({ timeout: 5_000 });

  await desktop.getByRole("button", { name: "Choose conversation" }).click();
  await desktop.getByRole("button", { name: "New chat" }).click();
  assert.equal(await desktop.locator("#assistantChatTitle").innerText(), "New research");
  assert.equal(await desktop.locator("#assistantThread .assistant-message").count(), 0, "New chat is not empty");
  assert.equal(await desktop.locator("#assistantWelcome").isVisible(), true);

  await desktop.getByRole("button", { name: "Choose conversation" }).click();
  await desktop.locator(".assistant-chat-option").filter({ hasText: "When does the closed beta launch?" }).click();
  assert.equal(await desktop.locator("#assistantThread .assistant-message.assistant").count(), 1, "Previous chat was not restored");

  await desktop.reload();
  await desktop.waitForLoadState("networkidle");
  await desktop.getByRole("button", { name: "Open demo" }).click();
  await desktop.locator(".message-row[data-message-id='92']").waitFor();
  assert.equal(await desktop.locator("#assistantTaskCount").innerText(), "1", "Tasks were not restored from local storage");
  await desktop.getByRole("button", { name: "Choose conversation" }).click();
  assert.equal(await desktop.locator(".assistant-chat-option").count(), 2, "Chats were not restored from local storage");
  await desktop.getByRole("button", { name: "Choose conversation" }).click();
  await desktop.screenshot({ path: path.join(artifacts, "assistant-workspace-desktop.png"), fullPage: true });

  const mobile = await desktopContext.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  captureErrors(mobile);
  await mobile.goto(baseUrl);
  await mobile.waitForLoadState("networkidle");
  await mobile.getByRole("button", { name: "Open demo" }).click();
  await mobile.locator(".message-row[data-message-id='92']").waitFor();
  await mobile.screenshot({ path: path.join(artifacts, "archive-mobile.png"), fullPage: true });
  await mobile.locator('[data-mobile-view="assistant"]').click();
  assert.equal(await mobile.locator("#assistantPanel").isVisible(), true);
  await mobile.getByRole("button", { name: "Open tasks" }).click();
  await mobile.locator("#assistantTasksView").waitFor();
  assert.equal(await mobile.locator(".assistant-task-card").count(), 1, "Persisted tasks are missing on mobile");
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "Assistant tasks overflow on mobile");
  await mobile.screenshot({ path: path.join(artifacts, "assistant-mobile.png"), fullPage: true });

  assert.deepEqual(browserErrors, [], `Browser errors:\n${browserErrors.join("\n")}`);
  console.log("UI checks passed: desktop, mobile, filters, Codex answer, citations");
} finally {
  await browser.close();
}
