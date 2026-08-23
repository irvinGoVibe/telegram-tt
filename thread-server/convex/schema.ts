import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    telegramUserId: v.optional(v.string()),
    email: v.optional(v.string()),
    displayName: v.string(),
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_telegram_user_id", ["telegramUserId"])
    .index("by_email", ["email"]),

  authCredentials: defineTable({
    userId: v.id("users"),
    passwordHash: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  authSessions: defineTable({
    userId: v.id("users"),
    tokenHash: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token_hash", ["tokenHash"])
    .index("by_user", ["userId"]),

  telegramAccounts: defineTable({
    userId: v.id("users"),
    encryptedSession: v.string(),
    encryptedChallenge: v.optional(v.string()),
    challengeExpiresAt: v.optional(v.number()),
    phoneHint: v.optional(v.string()),
    status: v.string(),
    lastError: v.optional(v.string()),
    lastSyncAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  projects: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    instructions: v.string(),
    responseLanguage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  projectMembers: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    role: v.string(),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"])
    .index("by_project_user", ["projectId", "userId"]),

  projectInvites: defineTable({
    projectId: v.id("projects"),
    email: v.string(),
    role: v.string(),
    tokenHash: v.string(),
    invitedBy: v.id("users"),
    expiresAt: v.number(),
    acceptedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_token_hash", ["tokenHash"]),

  projectIntegrations: defineTable({
    projectId: v.id("projects"),
    provider: v.string(),
    status: v.string(),
    encryptedCredentials: v.string(),
    externalWorkspaceId: v.optional(v.string()),
    externalWorkspaceName: v.optional(v.string()),
    teamId: v.optional(v.string()),
    teamName: v.optional(v.string()),
    teamKey: v.optional(v.string()),
    externalProjectId: v.optional(v.string()),
    externalProjectName: v.optional(v.string()),
    connectedBy: v.id("users"),
    lastError: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_provider", ["projectId", "provider"]),

  projectAiSettings: defineTable({
    projectId: v.id("projects"),
    defaultModel: v.string(),
    updatedBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_project", ["projectId"]),

  integrationOAuthStates: defineTable({
    projectId: v.id("projects"),
    provider: v.string(),
    userId: v.id("users"),
    stateHash: v.string(),
    encryptedCodeVerifier: v.string(),
    redirectUri: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_state_hash", ["stateHash"])
    .index("by_project", ["projectId"]),

  chats: defineTable({
    telegramAccountId: v.id("telegramAccounts"),
    telegramChatId: v.string(),
    type: v.string(),
    title: v.string(),
    username: v.optional(v.string()),
    photoStorageId: v.optional(v.id("_storage")),
    unreadCount: v.optional(v.number()),
    lastMessageAt: v.optional(v.number()),
    lastMessageId: v.optional(v.number()),
    lastSyncAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_telegram_chat_id", ["telegramChatId"])
    .index("by_account", ["telegramAccountId"])
    .index("by_account_telegram_chat", ["telegramAccountId", "telegramChatId"]),

  projectChats: defineTable({
    projectId: v.id("projects"),
    chatId: v.id("chats"),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_chat", ["chatId"])
    .index("by_project_chat", ["projectId", "chatId"]),

  messages: defineTable({
    chatId: v.id("chats"),
    telegramMessageId: v.number(),
    senderTelegramId: v.optional(v.string()),
    senderName: v.string(),
    text: v.string(),
    entities: v.optional(v.array(v.object({
      type: v.string(),
      offset: v.number(),
      length: v.number(),
      url: v.optional(v.string()),
      language: v.optional(v.string()),
    }))),
    sentAt: v.number(),
    editedAt: v.optional(v.number()),
    replyToMessageId: v.optional(v.number()),
    telegramUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_chat_message", ["chatId", "telegramMessageId"])
    .index("by_chat_sent_at", ["chatId", "sentAt"])
    .searchIndex("search_text", { searchField: "text", filterFields: ["chatId"] }),

  attachments: defineTable({
    messageId: v.id("messages"),
    storageId: v.id("_storage"),
    type: v.string(),
    fileName: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    size: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_message", ["messageId"])
    .index("by_message_storage", ["messageId", "storageId"]),

  tasks: defineTable({
    projectId: v.id("projects"),
    sourceChatId: v.optional(v.id("chats")),
    sourceMessageIds: v.array(v.id("messages")),
    clientSources: v.optional(v.array(v.object({
      telegramChatId: v.string(),
      telegramMessageId: v.number(),
      chatTitle: v.string(),
      senderName: v.string(),
      text: v.string(),
      sentAt: v.number(),
      telegramUrl: v.optional(v.string()),
    }))),
    anchorMessageIds: v.optional(v.array(v.id("messages"))),
    contextWindowDays: v.optional(v.number()),
    generationModel: v.optional(v.string()),
    generatedAt: v.optional(v.number()),
    title: v.string(),
    description: v.string(),
    status: v.string(),
    externalUrl: v.optional(v.string()),
    externalId: v.optional(v.string()),
    createdBy: v.id("users"),
    legacyImportId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_legacy", ["projectId", "legacyImportId"]),

  assistantThreads: defineTable({
    projectId: v.id("projects"),
    createdBy: v.id("users"),
    title: v.string(),
    model: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_project", ["projectId"]),

  assistantMessages: defineTable({
    threadId: v.id("assistantThreads"),
    authorKind: v.string(),
    authorUserId: v.optional(v.id("users")),
    content: v.string(),
    model: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_thread", ["threadId", "createdAt"]),

  assistantCitations: defineTable({
    assistantMessageId: v.id("assistantMessages"),
    telegramMessageId: v.id("messages"),
    ordinal: v.number(),
  }).index("by_assistant_message", ["assistantMessageId"]),

  assistantAttachments: defineTable({
    assistantMessageId: v.id("assistantMessages"),
    storageId: v.id("_storage"),
    type: v.string(),
    fileName: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    size: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_assistant_message", ["assistantMessageId"]),
});
