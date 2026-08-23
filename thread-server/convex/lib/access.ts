import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type DatabaseCtx = QueryCtx | MutationCtx;

export async function requireUser(ctx: DatabaseCtx, sessionHash: string) {
  if (!sessionHash) throw new Error("Sign in to continue.");
  const session = await ctx.db
    .query("authSessions")
    .withIndex("by_token_hash", (q) => q.eq("tokenHash", sessionHash))
    .unique();
  if (!session || session.expiresAt <= Date.now()) throw new Error("Your session is invalid or expired.");
  const user = await ctx.db.get(session.userId);
  if (!user) throw new Error("Your account no longer exists.");
  return user;
}

export async function requireProjectAccess(
  ctx: DatabaseCtx,
  sessionHash: string,
  projectId: Id<"projects">,
  roles: string[] = ["owner", "editor", "viewer"],
) {
  const user = await requireUser(ctx, sessionHash);
  const project = await ctx.db.get(projectId);
  if (!project) throw new Error("Project not found.");
  const membership = await ctx.db
    .query("projectMembers")
    .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", user._id))
    .unique();
  const role = project.ownerId === user._id ? "owner" : membership?.role;
  if (!role || !roles.includes(role)) throw new Error("You do not have access to this project.");
  return { user, project, role };
}

export async function requireOwnedTelegramAccount(
  ctx: DatabaseCtx,
  sessionHash: string,
  accountId: Id<"telegramAccounts">,
) {
  const user = await requireUser(ctx, sessionHash);
  const account = await ctx.db.get(accountId);
  if (!account || account.userId !== user._id) throw new Error("Telegram account not found.");
  return { user, account };
}

export async function requireProjectChatAccess(
  ctx: DatabaseCtx,
  sessionHash: string,
  projectId: Id<"projects">,
  chatId: Id<"chats">,
) {
  const access = await requireProjectAccess(ctx, sessionHash, projectId);
  const projectChat = await ctx.db
    .query("projectChats")
    .withIndex("by_project_chat", (q) => q.eq("projectId", projectId).eq("chatId", chatId))
    .unique();
  if (!projectChat) throw new Error("This chat is not attached to the project.");
  const chat = await ctx.db.get(chatId);
  if (!chat) throw new Error("Telegram chat not found.");
  return { ...access, projectChat, chat };
}
