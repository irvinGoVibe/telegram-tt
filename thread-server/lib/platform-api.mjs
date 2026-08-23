import { createHash, randomBytes } from "node:crypto";
import {
  api,
  asId,
  clearSessionCookie,
  convexClient,
  convexConfig,
  requestSessionHash,
  requireUser,
  sessionCookie,
} from "./convex.mjs";
import {
  beginTelegramConnection,
  disconnectTelegramConnection,
  refreshTelegramDialogs,
  telegramErrorMessage,
  verifyTelegramCode,
  verifyTelegramPassword,
} from "./telegram-service.mjs";
import { sendProjectChatMessage, syncProjectChat } from "./telegram-sync.mjs";
import {
  beginLinearConnection,
  completeLinearConnection,
  getLinearCatalog,
  linearConfig,
  publishTaskToLinear,
  setLinearDestination,
} from "./linear-service.mjs";

function clean(value, max = 10_000) {
  return String(value ?? "").trim().slice(0, max);
}

function clampInteger(value, minimum, maximum, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, Math.floor(number))) : fallback;
}

function iso(value) {
  return Number.isFinite(Number(value)) ? new Date(Number(value)).toISOString() : null;
}

function mapProject(project) {
  if (!project) return null;
  return {
    id: project._id,
    owner_id: project.ownerId,
    name: project.name,
    description: project.description || "",
    response_language: project.responseLanguage || "auto",
    created_at: iso(project.createdAt || project._creationTime),
    updated_at: iso(project.updatedAt || project._creationTime),
  };
}

function mapMember(member) {
  return {
    id: member._id,
    project_id: member.projectId,
    user_id: member.userId,
    role: member.role,
    created_at: iso(member.createdAt || member._creationTime),
    profiles: member.user ? {
      id: member.user.id,
      email: member.user.email || "",
      display_name: member.user.displayName,
      avatar_url: member.user.avatarUrl || null,
    } : null,
  };
}

function mapAccount(account, user) {
  return {
    id: account._id,
    telegram_user_id: user?.telegramUserId || null,
    username: user?.username || null,
    display_name: user?.displayName || "Telegram",
    phone_hint: account.phoneHint || "",
    status: account.status,
    last_error: account.lastError || null,
    connected_at: account.status === "connected" ? iso(account.updatedAt) : null,
    last_sync_at: iso(account.lastSyncAt),
    created_at: iso(account.createdAt || account._creationTime),
    updated_at: iso(account.updatedAt || account._creationTime),
  };
}

function mapChat(chat) {
  return {
    id: chat._id,
    connection_id: chat.telegramAccountId,
    telegram_chat_id: chat.telegramChatId,
    title: chat.title,
    kind: chat.type,
    username: chat.username || null,
    owner_telegram_user_id: chat.ownerTelegramUserId || null,
    unread_count: chat.unreadCount || 0,
    last_message_at: iso(chat.lastMessageAt),
    last_sync_at: iso(chat.lastSyncAt),
    updated_at: iso(chat.updatedAt || chat._creationTime),
  };
}

function mapProjectChat(link) {
  return {
    id: link._id,
    project_id: link.projectId,
    telegram_chat_id: link.chatId,
    is_active: true,
    live_sync_enabled: false,
    history_limit: 500,
    initial_sync_completed_at: iso(link.chat?.lastSyncAt),
    last_sync_at: iso(link.chat?.lastSyncAt),
    created_at: iso(link.createdAt || link._creationTime),
    telegram_chats: mapChat(link.chat),
  };
}

function mapThread(thread) {
  return {
    id: thread._id,
    project_id: thread.projectId,
    created_by: thread.createdBy,
    title: thread.title,
    model: thread.model || null,
    created_at: iso(thread.createdAt || thread._creationTime),
    updated_at: iso(thread.updatedAt || thread._creationTime),
  };
}

function mapMessage(message, projectId) {
  return {
    id: message._id,
    chat_id: message.chatId,
    telegram_message_id: message.telegramMessageId,
    sender_telegram_id: message.senderTelegramId || null,
    sender_name: message.senderName,
    sent_at: iso(message.sentAt),
    edited_at: iso(message.editedAt),
    reply_to_message_id: message.replyToMessageId || null,
    text: message.text,
    entities: message.entities || [],
    media_count: message.attachments?.length || 0,
    telegram_url: message.telegramUrl || null,
    telegram_message_media: (message.attachments || []).map((attachment) => ({
      id: attachment._id,
      kind: attachment.type,
      mime_type: attachment.mimeType || "application/octet-stream",
      file_name: attachment.fileName || "attachment",
      byte_size: attachment.size || null,
      download_status: "available",
      signed_url: `/api/projects/${encodeURIComponent(projectId)}/attachments/${encodeURIComponent(attachment._id)}`,
    })),
  };
}

function mapTask(task) {
  return {
    id: task._id,
    project_id: task.projectId,
    created_by: task.createdBy,
    title: task.title,
    description: task.description,
    status: task.status,
    source_chat_id: task.sourceChatId || null,
    anchor_message_count: task.anchorMessageIds?.length || 0,
    context_window_days: task.contextWindowDays || null,
    generation_model: task.generationModel || null,
    generated_at: iso(task.generatedAt),
    external_provider: task.externalUrl ? "linear" : null,
    external_id: task.externalId || null,
    external_url: task.externalUrl || null,
    created_at: iso(task.createdAt || task._creationTime),
    updated_at: iso(task.updatedAt || task._creationTime),
    task_sources: (task.sources || []).map((source) => ({
      task_id: task._id,
      telegram_message_id: source.message._id,
      ordinal: source.ordinal,
      telegram_messages: {
        id: source.message._id,
        chat_id: source.message.chatId,
        telegram_message_id: source.message.telegramMessageId,
        sender_name: source.message.senderName,
        sent_at: iso(source.message.sentAt),
        text: source.message.text,
        telegram_chats: mapChat(source.chat),
      },
    })),
    client_sources: (task.clientSources || []).map((source, ordinal) => ({
      ordinal,
      telegram_chat_id: source.telegramChatId,
      telegram_message_id: source.telegramMessageId,
      chat_title: source.chatTitle,
      sender_name: source.senderName,
      text: source.text,
      sent_at: iso(source.sentAt),
      telegram_url: source.telegramUrl || null,
    })),
  };
}

function mapIntegration(integration) {
  if (!integration) return null;
  return {
    id: integration._id,
    project_id: integration.projectId,
    provider: integration.provider,
    status: integration.status,
    external_workspace_id: integration.externalWorkspaceId || null,
    external_workspace_name: integration.externalWorkspaceName || null,
    config: {
      teamId: integration.teamId || null,
      teamName: integration.teamName || null,
      teamKey: integration.teamKey || null,
      projectId: integration.externalProjectId || null,
      projectName: integration.externalProjectName || null,
      mcpUrl: linearConfig().mcpUrl,
    },
    last_error: integration.lastError || null,
    created_at: iso(integration.createdAt || integration._creationTime),
    updated_at: iso(integration.updatedAt || integration._creationTime),
  };
}

function mapAssistantMessage(message) {
  return {
    id: message._id,
    thread_id: message.threadId,
    author_kind: message.authorKind,
    author_user_id: message.authorUserId || null,
    content: message.content,
    model: message.model || null,
    created_at: iso(message.createdAt || message._creationTime),
    assistant_citations: (message.citations || []).map((citation) => ({ telegram_message_id: citation.telegramMessageId, ordinal: citation.ordinal })),
    assistant_message_attachments: (message.attachments || []).map((attachment) => ({
      id: attachment._id,
      kind: attachment.type,
      mime_type: attachment.mimeType || "application/octet-stream",
      file_name: attachment.fileName || "attachment",
      byte_size: attachment.size || null,
      signed_url: `/api/assistant/attachments/${encodeURIComponent(attachment._id)}`,
    })),
  };
}

async function workspacePayload(client, sessionHash, projectId) {
  const workspace = await client.query(api.projects.getWorkspace, { sessionHash, projectId });
  return {
    project: mapProject(workspace.project),
    members: workspace.members.map(mapMember),
    chats: workspace.chats.map(mapProjectChat),
    threads: workspace.threads.map(mapThread),
    tasks: workspace.tasks.map(mapTask),
    instructions: { instructions: workspace.project.instructions || "" },
    integrations: (workspace.integrations || []).map(mapIntegration).filter(Boolean),
  };
}

function sendRedirect(response, url) {
  if (!url) {
    response.writeHead(404, { "cache-control": "no-store" });
    response.end();
    return;
  }
  response.writeHead(302, { location: url, "cache-control": "private, no-store", "referrer-policy": "no-referrer" });
  response.end();
}

function linearReturnPath(params) {
  const configured = clean(process.env.THREAD_CLIENT_REDIRECT_PATH, 500);
  const base = configured && configured.startsWith("/") ? configured : "/live.html";
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}${params}`;
}

export async function handlePlatformApi({ request, response, url, readJsonBody, sendJson }) {
  if (request.method === "GET" && url.pathname === "/api/platform/config") {
    sendJson(response, 200, {
      enabled: convexConfig().enabled,
      provider: "convex",
      telegramEnabled: Boolean(process.env.TELEGRAM_API_ID && process.env.TELEGRAM_API_HASH && process.env.SESSION_ENCRYPTION_KEY),
      linearEnabled: linearConfig().enabled,
      linearMcpUrl: linearConfig().mcpUrl,
    });
    return true;
  }

  const candidateRoute = ["/api/auth/", "/api/platform/", "/api/projects", "/api/telegram/", "/api/invites/", "/api/tasks/", "/api/assistant/", "/api/integrations/"].some((prefix) => url.pathname.startsWith(prefix));
  if (!candidateRoute) return false;
  const client = convexClient();

  if (url.pathname === "/api/auth/signup" && request.method === "POST") {
    const body = await readJsonBody(request);
    const result = await client.action(api.authActions.signUp, {
      email: clean(body.email, 320), password: String(body.password || ""), displayName: clean(body.displayName, 120),
    });
    sendJson(response, 201, { user: result.user }, { "set-cookie": sessionCookie(result.sessionToken, result.expiresAt) });
    return true;
  }

  if (url.pathname === "/api/auth/signin" && request.method === "POST") {
    const body = await readJsonBody(request);
    const result = await client.action(api.authActions.signIn, { email: clean(body.email, 320), password: String(body.password || "") });
    sendJson(response, 200, { user: result.user }, { "set-cookie": sessionCookie(result.sessionToken, result.expiresAt) });
    return true;
  }

  if (url.pathname === "/api/auth/session" && request.method === "GET") {
    if (!requestSessionHash(request, false)) {
      sendJson(response, 200, { user: null });
      return true;
    }
    try {
      const { user } = await requireUser(request);
      sendJson(response, 200, { user });
    } catch (error) {
      if (error.statusCode !== 401) throw error;
      sendJson(response, 200, { user: null }, { "set-cookie": clearSessionCookie() });
    }
    return true;
  }

  if (url.pathname === "/api/auth/signout" && request.method === "POST") {
    const hash = requestSessionHash(request, false);
    if (hash) await client.mutation(api.auth.signOut, { sessionHash: hash }).catch(() => {});
    sendJson(response, 200, { signedOut: true }, { "set-cookie": clearSessionCookie() });
    return true;
  }

  const protectedRoute = ["/api/platform/", "/api/projects", "/api/telegram/", "/api/invites/", "/api/tasks/", "/api/assistant/", "/api/integrations/"].some((prefix) => url.pathname.startsWith(prefix));
  if (!protectedRoute) return false;
  const { user, sessionHash } = await requireUser(request);

  if (request.method === "GET" && url.pathname === "/api/platform/me") {
    sendJson(response, 200, {
      user: { id: user.id, email: user.email || "" },
      profile: { id: user.id, email: user.email || "", display_name: user.displayName, avatar_url: user.avatarUrl || null },
    });
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/integrations/linear/callback") {
    const providerError = clean(url.searchParams.get("error_description") || url.searchParams.get("error"), 1_000);
    if (providerError) {
      sendRedirect(response, linearReturnPath(`linear=error&message=${encodeURIComponent(providerError)}`));
      return true;
    }
    try {
      const result = await completeLinearConnection({
        sessionHash,
        state: url.searchParams.get("state"),
        code: url.searchParams.get("code"),
      });
      sendRedirect(response, linearReturnPath(`linear=connected&project=${encodeURIComponent(result.projectId)}`));
    } catch (error) {
      sendRedirect(response, linearReturnPath(`linear=error&message=${encodeURIComponent(clean(error.message, 1_000))}`));
    }
    return true;
  }

  if (url.pathname === "/api/projects" && request.method === "GET") {
    const projects = await client.query(api.projects.listProjects, { sessionHash });
    sendJson(response, 200, { projects: projects.map(mapProject) });
    return true;
  }

  if (url.pathname === "/api/projects" && request.method === "POST") {
    const body = await readJsonBody(request);
    const project = await client.mutation(api.projects.createProject, {
      sessionHash, name: clean(body.name, 120), description: clean(body.description, 4_000) || undefined,
      responseLanguage: ["auto", "en", "ru"].includes(body.responseLanguage) ? body.responseLanguage : "auto",
    });
    sendJson(response, 201, { project: mapProject(project) });
    return true;
  }

  if (url.pathname === "/api/invites/accept" && request.method === "POST") {
    const body = await readJsonBody(request);
    const token = clean(body.token, 256);
    if (!token) { sendJson(response, 400, { error: "The invitation token is missing." }); return true; }
    const result = await client.mutation(api.projects.acceptInvite, { sessionHash, tokenHash: createHash("sha256").update(token).digest("hex") });
    sendJson(response, 200, result);
    return true;
  }

  const inviteMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/invites$/);
  if (inviteMatch && request.method === "POST") {
    const body = await readJsonBody(request);
    const email = clean(body.email, 320).toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) { sendJson(response, 400, { error: "Enter a valid email address." }); return true; }
    const token = randomBytes(32).toString("base64url");
    const invite = await client.mutation(api.projects.createInvite, {
      sessionHash, projectId: asId(inviteMatch[1], "project"), email,
      role: ["viewer", "editor"].includes(body.role) ? body.role : "viewer",
      tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1_000,
    });
    const protocol = clean(request.headers["x-forwarded-proto"], 20) || "http";
    const host = clean(request.headers["x-forwarded-host"] || request.headers.host, 500);
    sendJson(response, 201, { invite: { id: invite._id, email: invite.email, role: invite.role, expires_at: iso(invite.expiresAt) }, inviteUrl: `${protocol}://${host}/?invite=${encodeURIComponent(token)}` });
    return true;
  }

  const workspaceMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/workspace$/);
  if (workspaceMatch && request.method === "GET") {
    sendJson(response, 200, await workspacePayload(client, sessionHash, asId(workspaceMatch[1], "project")));
    return true;
  }

  const linearConnectMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/integrations\/linear\/connect$/);
  if (linearConnectMatch && request.method === "POST") {
    sendJson(response, 200, await beginLinearConnection({
      request,
      sessionHash,
      projectId: asId(linearConnectMatch[1], "project"),
    }));
    return true;
  }

  const linearCatalogMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/integrations\/linear\/catalog$/);
  if (linearCatalogMatch && request.method === "GET") {
    sendJson(response, 200, { catalog: await getLinearCatalog({ sessionHash, projectId: asId(linearCatalogMatch[1], "project") }) });
    return true;
  }

  const linearDestinationMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/integrations\/linear$/);
  if (linearDestinationMatch && request.method === "PATCH") {
    const body = await readJsonBody(request);
    const integration = await setLinearDestination({
      sessionHash,
      projectId: asId(linearDestinationMatch[1], "project"),
      teamId: body.teamId,
      externalProjectId: body.projectId,
    });
    sendJson(response, 200, { integration: mapIntegration(integration) });
    return true;
  }

  const projectMatch = url.pathname.match(/^\/api\/projects\/([^/]+)$/);
  if (projectMatch && request.method === "PATCH") {
    const body = await readJsonBody(request);
    const args = { sessionHash, projectId: asId(projectMatch[1], "project") };
    if (body.name !== undefined) args.name = clean(body.name, 120);
    if (body.description !== undefined) args.description = clean(body.description, 4_000);
    if (body.instructions !== undefined) args.instructions = clean(body.instructions, 20_000);
    if (["auto", "en", "ru"].includes(body.responseLanguage)) args.responseLanguage = body.responseLanguage;
    const project = await client.mutation(api.projects.updateProject, args);
    sendJson(response, 200, { project: mapProject(project) });
    return true;
  }

  const migrationMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/migrate-local$/);
  if (migrationMatch && request.method === "POST") {
    const body = await readJsonBody(request);
    const tasks = Array.isArray(body.tasks) ? body.tasks.slice(0, 500).map((task, index) => ({
      legacyImportId: clean(task.legacyImportId || task.id || `local-${index}`, 300), title: clean(task.title, 300),
      description: clean(task.description, 50_000), createdAt: Number.isFinite(Number(task.createdAt)) ? Number(task.createdAt) : undefined,
    })) : [];
    const result = await client.mutation(api.projects.importLocalTasks, { sessionHash, projectId: asId(migrationMatch[1], "project"), tasks });
    sendJson(response, 200, result);
    return true;
  }

  if (url.pathname === "/api/telegram/connections" && request.method === "GET") {
    const accounts = await client.query(api.telegram.listAccounts, { sessionHash });
    sendJson(response, 200, { connections: accounts.map((account) => mapAccount(account, user)) });
    return true;
  }

  if (url.pathname === "/api/telegram/connect" && request.method === "POST") {
    const body = await readJsonBody(request);
    try { sendJson(response, 201, await beginTelegramConnection({ sessionHash, phoneNumber: body.phoneNumber })); }
    catch (error) { error.message = telegramErrorMessage(error); throw error; }
    return true;
  }

  if (url.pathname === "/api/telegram/verify-code" && request.method === "POST") {
    const body = await readJsonBody(request);
    try { sendJson(response, 200, await verifyTelegramCode({ sessionHash, connectionId: body.connectionId, code: body.code })); }
    catch (error) { error.message = telegramErrorMessage(error); throw error; }
    return true;
  }

  if (url.pathname === "/api/telegram/verify-password" && request.method === "POST") {
    const body = await readJsonBody(request);
    try { sendJson(response, 200, await verifyTelegramPassword({ sessionHash, connectionId: body.connectionId, password: body.password })); }
    catch (error) { error.message = telegramErrorMessage(error); throw error; }
    return true;
  }

  if (url.pathname === "/api/telegram/refresh-dialogs" && request.method === "POST") {
    const body = await readJsonBody(request);
    sendJson(response, 200, await refreshTelegramDialogs({ sessionHash, connectionId: asId(body.connectionId, "Telegram account") }));
    return true;
  }

  const disconnectMatch = url.pathname.match(/^\/api\/telegram\/connections\/([^/]+)$/);
  if (disconnectMatch && request.method === "DELETE") {
    sendJson(response, 200, await disconnectTelegramConnection({ sessionHash, connectionId: asId(disconnectMatch[1], "Telegram account") }));
    return true;
  }

  if (url.pathname === "/api/telegram/chats" && request.method === "GET") {
    const connectionId = clean(url.searchParams.get("connectionId"), 100);
    const chats = await client.query(api.telegram.listChats, { sessionHash });
    sendJson(response, 200, { chats: chats.filter((chat) => !connectionId || chat.telegramAccountId === connectionId).map(mapChat) });
    return true;
  }

  const projectChatsMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/chats$/);
  if (projectChatsMatch && request.method === "POST") {
    const body = await readJsonBody(request);
    const projectChat = await client.mutation(api.telegram.addChatToProject, {
      sessionHash, projectId: asId(projectChatsMatch[1], "project"), chatId: asId(body.telegramChatId, "Telegram chat"),
    });
    sendJson(response, 201, { projectChat: { id: projectChat._id, project_id: projectChat.projectId, telegram_chat_id: projectChat.chatId } });
    return true;
  }

  const removeProjectChatMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/chats\/([^/]+)$/);
  if (removeProjectChatMatch && request.method === "DELETE") {
    await client.mutation(api.telegram.removeChatFromProject, { sessionHash, projectId: asId(removeProjectChatMatch[1], "project"), chatId: asId(removeProjectChatMatch[2], "Telegram chat") });
    sendJson(response, 200, { removed: true });
    return true;
  }

  const refreshMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/refresh$/);
  if (refreshMatch && request.method === "POST") {
    const projectId = asId(refreshMatch[1], "project");
    const body = await readJsonBody(request);
    const requestedChatId = clean(body.chatId, 100);
    const links = await client.query(api.telegram.listProjectChats, { sessionHash, projectId });
    const scopedLinks = requestedChatId ? links.filter((link) => String(link.chatId) === requestedChatId) : links;
    if (requestedChatId && !scopedLinks.length) {
      sendJson(response, 404, { error: "This Telegram chat is not attached to the project." });
      return true;
    }
    const results = [];
    for (const link of scopedLinks) {
      try { results.push({ chatId: link.chatId, ok: true, ...(await syncProjectChat({ sessionHash, projectId, chatId: link.chatId })) }); }
      catch (error) {
        const message = clean(error?.errorMessage || error?.message || "Telegram sync failed.", 500);
        console.error("Telegram chat sync failed", { projectId: String(projectId), chatId: String(link.chatId), error: message });
        results.push({ chatId: link.chatId, ok: false, error: message });
      }
    }
    sendJson(response, results.some((result) => !result.ok) ? 207 : 200, { synced: results.filter((result) => result.ok).length, results });
    return true;
  }

  const messagesMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/messages$/);
  if (messagesMatch && request.method === "POST") {
    const projectId = asId(messagesMatch[1], "project");
    const body = await readJsonBody(request);
    const message = await sendProjectChatMessage({
      sessionHash,
      projectId,
      chatId: asId(body.chatId, "project chat"),
      text: body.text,
      entities: body.entities,
      replyToMessageId: body.replyToMessageId,
    });
    sendJson(response, 201, { message: mapMessage(message, projectId) });
    return true;
  }

  if (messagesMatch && request.method === "GET") {
    const projectId = asId(messagesMatch[1], "project");
    const chatId = asId(url.searchParams.get("chatId"), "project chat");
    const rows = await client.query(api.telegram.listMessages, { sessionHash, projectId, chatId, limit: clampInteger(url.searchParams.get("limit"), 1, 1_000, 250) });
    sendJson(response, 200, { messages: rows.map((row) => mapMessage(row, projectId)) });
    return true;
  }

  const attachmentMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/attachments\/([^/]+)$/);
  if (attachmentMatch && request.method === "GET") {
    const result = await client.query(api.storage.attachmentUrl, { sessionHash, projectId: asId(attachmentMatch[1], "project"), attachmentId: asId(attachmentMatch[2], "attachment") });
    sendRedirect(response, result.url);
    return true;
  }

  const assistantAttachmentMatch = url.pathname.match(/^\/api\/assistant\/attachments\/([^/]+)$/);
  if (assistantAttachmentMatch && request.method === "GET") {
    const result = await client.query(api.storage.assistantAttachmentUrl, { sessionHash, attachmentId: asId(assistantAttachmentMatch[1], "assistant attachment") });
    sendRedirect(response, result.url);
    return true;
  }

  const tasksMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/tasks$/);
  if (tasksMatch && request.method === "POST") {
    const body = await readJsonBody(request);
    const task = await client.mutation(api.tasks.createTaskFromMessages, {
      sessionHash, projectId: asId(tasksMatch[1], "project"),
      sourceMessageIds: Array.isArray(body.sourceMessageIds) ? [...new Set(body.sourceMessageIds.map((id) => asId(id, "source message")))].slice(0, 100) : [],
      anchorMessageIds: Array.isArray(body.anchorMessageIds) ? [...new Set(body.anchorMessageIds.map((id) => asId(id, "anchor message")))].slice(0, 20) : undefined,
      contextWindowDays: body.contextWindowDays === undefined ? undefined : clampInteger(body.contextWindowDays, 1, 30, 10),
      generationModel: clean(body.generationModel, 120) || undefined,
      title: clean(body.title, 300), description: clean(body.description, 50_000) || undefined,
    });
    sendJson(response, 201, { task: mapTask(task) });
    return true;
  }

  const clientTasksMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/client-tasks$/);
  if (clientTasksMatch && request.method === "POST") {
    const body = await readJsonBody(request);
    const sources = Array.isArray(body.sources) ? body.sources.slice(0, 20).map((source) => ({
      telegramChatId: clean(source.telegramChatId, 200),
      telegramMessageId: clampInteger(source.telegramMessageId, 1, Number.MAX_SAFE_INTEGER, 0),
      chatTitle: clean(source.chatTitle, 300) || "Telegram chat",
      senderName: clean(source.senderName, 300) || "Telegram user",
      text: clean(source.text, 12_000),
      sentAt: Number.isFinite(Number(source.sentAt)) ? Number(source.sentAt) : Date.now(),
      telegramUrl: clean(source.telegramUrl, 4_000) || undefined,
    })) : [];
    const task = await client.mutation(api.tasks.createTaskFromClientMessages, {
      sessionHash,
      projectId: asId(clientTasksMatch[1], "project"),
      sources,
      title: clean(body.title, 300),
      description: clean(body.description, 50_000) || undefined,
    });
    sendJson(response, 201, { task: mapTask(task) });
    return true;
  }

  const taskMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)$/);
  if (taskMatch && request.method === "PATCH") {
    const body = await readJsonBody(request);
    const args = { sessionHash, taskId: asId(taskMatch[1], "task") };
    if (body.title !== undefined) args.title = clean(body.title, 300);
    if (body.description !== undefined) args.description = clean(body.description, 50_000);
    if (body.status !== undefined) args.status = clean(body.status, 40);
    const task = await client.mutation(api.tasks.updateTask, args);
    sendJson(response, 200, { task: mapTask(task) });
    return true;
  }

  const taskLinearMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)\/linear$/);
  if (taskLinearMatch && request.method === "POST") {
    const taskId = asId(taskLinearMatch[1], "task");
    const task = await client.query(api.tasks.getTask, { sessionHash, taskId });
    const result = await publishTaskToLinear({ sessionHash, task });
    if (result.existing) {
      sendJson(response, 200, { task: mapTask(task), issue: result.issue, existing: true });
      return true;
    }
    const updated = await client.mutation(api.tasks.updateTask, {
      sessionHash,
      taskId,
      externalUrl: result.issue.url,
      externalId: result.issue.identifier,
    });
    sendJson(response, 201, { task: mapTask(updated), issue: result.issue, existing: false });
    return true;
  }

  const threadsMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/threads$/);
  if (threadsMatch && request.method === "POST") {
    const body = await readJsonBody(request);
    const thread = await client.mutation(api.assistant.createThread, {
      sessionHash, projectId: asId(threadsMatch[1], "project"), title: clean(body.title, 160) || undefined, model: clean(body.model, 120) || undefined,
    });
    sendJson(response, 201, { thread: mapThread(thread) });
    return true;
  }

  const threadMessagesMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/threads\/([^/]+)\/messages$/);
  if (threadMessagesMatch && request.method === "GET") {
    const messages = await client.query(api.assistant.listMessages, { sessionHash, threadId: asId(threadMessagesMatch[2], "assistant thread") });
    sendJson(response, 200, { messages: messages.map(mapAssistantMessage) });
    return true;
  }

  return false;
}
