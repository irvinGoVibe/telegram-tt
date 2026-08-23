import { beforeEach, describe, expect, test } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";

const modules = import.meta.glob("../convex/**/*.ts");

async function seedSession(t: ReturnType<typeof convexTest>, label: string) {
  const now = Date.now();
  const sessionHash = `session-${label}`;
  const userId = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      email: `${label}@example.com`,
      displayName: label,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("authSessions", {
      userId,
      tokenHash: sessionHash,
      expiresAt: now + 60_000,
      createdAt: now,
    });
    return userId;
  });
  return { sessionHash, userId };
}

async function seedProjectChat(t: ReturnType<typeof convexTest>) {
  const owner = await seedSession(t, "owner");
  const project = await t.mutation(api.projects.createProject, {
    sessionHash: owner.sessionHash,
    name: "Client launch",
    description: "Telegram delivery project",
  });
  const account = await t.mutation(api.telegram.createAccount, {
    sessionHash: owner.sessionHash,
    phoneHint: "•••• 0101",
    encryptedSession: "ciphertext",
  });
  const chat = await t.mutation(api.telegram.upsertChat, {
    sessionHash: owner.sessionHash,
    accountId: account!._id,
    chat: { telegramChatId: "-100123456", type: "supergroup", title: "Client room", username: "client_room" },
  });
  await t.mutation(api.telegram.addChatToProject, {
    sessionHash: owner.sessionHash,
    projectId: project!._id,
    chatId: chat!._id,
  });
  return { owner, project: project!, account: account!, chat: chat! };
}

describe("Convex project workspace", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  test("creates, updates, and lists a project for its member", async () => {
    const { sessionHash } = await seedSession(t, "project-owner");
    const created = await t.mutation(api.projects.createProject, { sessionHash, name: "Alpha" });
    const updated = await t.mutation(api.projects.updateProject, {
      sessionHash,
      projectId: created!._id,
      name: "Alpha 2",
      instructions: "Answer with source links.",
      responseLanguage: "en",
    });
    const projects = await t.query(api.projects.listProjects, { sessionHash });
    expect(updated).toMatchObject({ name: "Alpha 2", instructions: "Answer with source links.", responseLanguage: "en" });
    expect(projects.map((project) => project?._id)).toContain(created!._id);
  });

  test("adds, lists, and removes a Telegram chat", async () => {
    const { owner, project, chat } = await seedProjectChat(t);
    expect(await t.query(api.telegram.listProjectChats, { sessionHash: owner.sessionHash, projectId: project._id })).toHaveLength(1);
    await t.mutation(api.telegram.removeChatFromProject, { sessionHash: owner.sessionHash, projectId: project._id, chatId: chat._id });
    expect(await t.query(api.telegram.listProjectChats, { sessionHash: owner.sessionHash, projectId: project._id })).toHaveLength(0);
  });

  test("upserts duplicate Telegram messages idempotently", async () => {
    const { owner, project, chat } = await seedProjectChat(t);
    const input = {
      sessionHash: owner.sessionHash,
      projectId: project._id,
      chatId: chat._id,
      messages: [{
        telegramMessageId: 42,
        senderName: "Irvin",
        text: "First",
        entities: [{ type: "bold", offset: 0, length: 5 }],
        sentAt: Date.now(),
      }],
      lastMessageId: 42,
      syncedAt: Date.now(),
    };
    const first = await t.mutation(api.telegram.upsertMessages, input);
    const second = await t.mutation(api.telegram.upsertMessages, { ...input, messages: [{ ...input.messages[0], text: "Updated" }] });
    const messages = await t.query(api.telegram.listMessages, { sessionHash: owner.sessionHash, projectId: project._id, chatId: chat._id });
    expect(second[0].messageId).toBe(first[0].messageId);
    expect(messages).toHaveLength(1);
    expect(messages[0].text).toBe("Updated");
    expect(messages[0].entities).toEqual([{ type: "bold", offset: 0, length: 5 }]);
  });

  test("creates one task with multiple source messages", async () => {
    const { owner, project, chat } = await seedProjectChat(t);
    const saved = await t.mutation(api.telegram.upsertMessages, {
      sessionHash: owner.sessionHash,
      projectId: project._id,
      chatId: chat._id,
      messages: [
        { telegramMessageId: 1, senderName: "A", text: "Requirement", sentAt: 1_000 },
        { telegramMessageId: 2, senderName: "B", text: "Acceptance", sentAt: 2_000 },
      ],
      lastMessageId: 2,
      syncedAt: Date.now(),
    });
    const task = await t.mutation(api.tasks.createTaskFromMessages, {
      sessionHash: owner.sessionHash,
      projectId: project._id,
      sourceMessageIds: saved.map((row) => row.messageId),
      title: "Ship agreed scope",
    });
    expect(task.sourceMessageIds).toHaveLength(2);
    expect(task.sources.map((source) => source.message.telegramMessageId)).toEqual([1, 2]);
  });

  test("creates a source-linked task from the integrated Telegram client", async () => {
    const { owner, project } = await seedProjectChat(t);
    const task = await t.mutation(api.tasks.createTaskFromClientMessages, {
      sessionHash: owner.sessionHash,
      projectId: project._id,
      sources: [{
        telegramChatId: "-100123456",
        telegramMessageId: 77,
        chatTitle: "Client room",
        senderName: "Irvin",
        text: "Ship the agreed scope",
        sentAt: 1_725_000_000_000,
        telegramUrl: "https://t.me/client_room/77",
      }],
      title: "Ship the agreed scope",
      description: "Source: https://t.me/client_room/77",
    });
    expect(task.sourceMessageIds).toEqual([]);
    expect(task.clientSources).toEqual([expect.objectContaining({
      telegramMessageId: 77,
      telegramUrl: "https://t.me/client_room/77",
    })]);
  });

  test("edits a task draft before Linear publication and locks published content", async () => {
    const { owner, project, chat } = await seedProjectChat(t);
    const [source] = await t.mutation(api.telegram.upsertMessages, {
      sessionHash: owner.sessionHash,
      projectId: project._id,
      chatId: chat._id,
      messages: [{ telegramMessageId: 42, senderName: "Client", text: "Please review before publishing", sentAt: Date.now() }],
      lastMessageId: 42,
      syncedAt: Date.now(),
    });
    const task = await t.mutation(api.tasks.createTaskFromMessages, {
      sessionHash: owner.sessionHash,
      projectId: project._id,
      sourceMessageIds: [source.messageId],
      title: "Original draft",
      description: "Original specification",
    });
    const edited = await t.mutation(api.tasks.updateTask, {
      sessionHash: owner.sessionHash,
      taskId: task._id,
      title: "Reviewed draft",
      description: "## Objective\n\nReviewed specification",
    });
    expect(edited).toMatchObject({ title: "Reviewed draft", description: "## Objective\n\nReviewed specification" });

    await t.mutation(api.tasks.updateTask, {
      sessionHash: owner.sessionHash,
      taskId: task._id,
      externalUrl: "https://linear.app/thread/issue/TH-42/reviewed-draft",
      externalId: "TH-42",
    });
    await expect(t.mutation(api.tasks.updateTask, {
      sessionHash: owner.sessionHash,
      taskId: task._id,
      title: "Divergent local title",
    })).rejects.toThrow(/already published/i);
    await expect(t.mutation(api.tasks.updateTask, {
      sessionHash: owner.sessionHash,
      taskId: task._id,
      status: "done",
    })).resolves.toMatchObject({ status: "done" });
  });

  test("builds a bounded 10-day task context and stores generation metadata", async () => {
    const { owner, project, chat } = await seedProjectChat(t);
    const day = 24 * 60 * 60 * 1_000;
    const anchorTime = 20 * day;
    const saved = await t.mutation(api.telegram.upsertMessages, {
      sessionHash: owner.sessionHash,
      projectId: project._id,
      chatId: chat._id,
      messages: [
        { telegramMessageId: 1, senderName: "A", text: "Too old", sentAt: anchorTime - 11 * day },
        { telegramMessageId: 2, senderName: "B", text: "Related context", sentAt: anchorTime - 9 * day },
        { telegramMessageId: 3, senderName: "A", text: "Selected decision", sentAt: anchorTime },
        { telegramMessageId: 4, senderName: "B", text: "Later topic", sentAt: anchorTime + day },
      ],
      lastMessageId: 4,
      syncedAt: Date.now(),
    });
    const anchorId = saved.find((row) => row.telegramMessageId === 3)!.messageId;
    const context = await t.query(api.tasks.taskDraftContextPage, {
      sessionHash: owner.sessionHash,
      projectId: project._id,
      chatId: chat._id,
      anchorMessageIds: [anchorId],
      rangeDays: 10,
      paginationOpts: { numItems: 100, cursor: null },
    });
    expect(context.page.map((message) => message.telegramMessageId)).toEqual([2, 3]);
    expect(context.startAt).toBe(anchorTime - 10 * day);
    expect(context.endAt).toBe(anchorTime);

    const sourceId = saved.find((row) => row.telegramMessageId === 2)!.messageId;
    const task = await t.mutation(api.tasks.createTaskFromMessages, {
      sessionHash: owner.sessionHash,
      projectId: project._id,
      sourceMessageIds: [sourceId, anchorId],
      anchorMessageIds: [anchorId],
      contextWindowDays: 10,
      generationModel: "GPT_54",
      title: "Ship the selected decision",
      description: "## Objective\n\nShip it [#3]",
    });
    expect(task).toMatchObject({ contextWindowDays: 10, generationModel: "GPT_54", anchorMessageIds: [anchorId] });
    expect(task.generatedAt).toEqual(expect.any(Number));
  });

  test("denies project data to an outsider", async () => {
    const { project, chat } = await seedProjectChat(t);
    const outsider = await seedSession(t, "outsider");
    await expect(t.query(api.projects.getWorkspace, { sessionHash: outsider.sessionHash, projectId: project._id })).rejects.toThrow(/access/i);
    await expect(t.query(api.telegram.listMessages, { sessionHash: outsider.sessionHash, projectId: project._id, chatId: chat._id })).rejects.toThrow(/access/i);
    await expect(t.query(api.tasks.taskDraftAnchors, {
      sessionHash: outsider.sessionHash,
      projectId: project._id,
      chatId: chat._id,
      anchorMessageIds: [],
      rangeDays: 10,
    })).rejects.toThrow(/access/i);
  });

  test("checks project access before returning an attachment URL", async () => {
    const { owner, project, chat } = await seedProjectChat(t);
    const outsider = await seedSession(t, "attachment-outsider");
    const [saved] = await t.mutation(api.telegram.upsertMessages, {
      sessionHash: owner.sessionHash,
      projectId: project._id,
      chatId: chat._id,
      messages: [{ telegramMessageId: 7, senderName: "A", text: "Photo", sentAt: Date.now() }],
      lastMessageId: 7,
      syncedAt: Date.now(),
    });
    const storageId = await t.run(async (ctx) => await ctx.storage.store(new Blob(["image"], { type: "image/png" })));
    const attachment = await t.mutation(api.storage.saveAttachmentMetadata, {
      sessionHash: owner.sessionHash,
      projectId: project._id,
      messageId: saved.messageId,
      storageId,
      type: "photo",
      fileName: "proof.png",
      mimeType: "image/png",
      size: 5,
    });
    const authorized = await t.query(api.storage.attachmentUrl, { sessionHash: owner.sessionHash, projectId: project._id, attachmentId: attachment._id });
    expect(authorized.url).toMatch(/^https?:\/\//);
    await expect(t.query(api.storage.attachmentUrl, { sessionHash: outsider.sessionHash, projectId: project._id, attachmentId: attachment._id })).rejects.toThrow(/access/i);
  });

  test("imports local tasks only once", async () => {
    const { owner, project } = await seedProjectChat(t);
    const args = {
      sessionHash: owner.sessionHash,
      projectId: project._id,
      tasks: [{ legacyImportId: "archive:task-1", title: "Legacy task", description: "Imported" }],
    };
    expect(await t.mutation(api.projects.importLocalTasks, args)).toEqual({ imported: 1, skipped: 0 });
    expect(await t.mutation(api.projects.importLocalTasks, args)).toEqual({ imported: 0, skipped: 1 });
  });

  test("stores one project-scoped Linear destination without exposing credentials in the workspace", async () => {
    const { owner, project } = await seedProjectChat(t);
    const stateHash = "linear-state-hash";
    await t.mutation(api.integrations.createOAuthState, {
      sessionHash: owner.sessionHash,
      projectId: project._id,
      provider: "linear",
      stateHash,
      encryptedCodeVerifier: "encrypted-verifier",
      redirectUri: "https://thread.example/api/integrations/linear/callback",
      expiresAt: Date.now() + 60_000,
    });
    const consumed = await t.mutation(api.integrations.consumeOAuthState, { sessionHash: owner.sessionHash, stateHash });
    expect(consumed.projectId).toBe(project._id);
    await expect(t.mutation(api.integrations.consumeOAuthState, { sessionHash: owner.sessionHash, stateHash })).rejects.toThrow(/expired/i);

    await t.mutation(api.integrations.saveConnection, {
      sessionHash: owner.sessionHash,
      projectId: project._id,
      encryptedCredentials: "encrypted-linear-token",
      externalWorkspaceId: "workspace-1",
      externalWorkspaceName: "EvalLens",
    });
    await t.mutation(api.integrations.setDestination, {
      sessionHash: owner.sessionHash,
      projectId: project._id,
      teamId: "team-1",
      teamName: "Product",
      teamKey: "EVA",
      externalProjectId: "linear-project-1",
      externalProjectName: "Telegram Thread",
    });
    const workspace = await t.query(api.projects.getWorkspace, { sessionHash: owner.sessionHash, projectId: project._id });
    expect(workspace.integrations[0]).toMatchObject({
      provider: "linear",
      status: "connected",
      teamId: "team-1",
      externalProjectId: "linear-project-1",
    });
    expect(workspace.integrations[0]).not.toHaveProperty("encryptedCredentials");
    const serverConnection = await t.query(api.integrations.getConnection, { sessionHash: owner.sessionHash, projectId: project._id });
    expect(serverConnection?.encryptedCredentials).toBe("encrypted-linear-token");
  });
});
