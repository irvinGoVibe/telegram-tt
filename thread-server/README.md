# Thread — live Telegram project workspace

Thread turns selected Telegram chats into private project workspaces. Each project keeps its chats, messages, files, AI research threads, members, instructions, and source-linked tasks together.

Inside the integrated Telegram Web A client, the existing Telegram session supplies the message source. The server accepts a bounded source snapshot, stores its Telegram link when available, and publishes the reviewed task through the same project-scoped Linear connection. The standalone archive/live interfaces remain available for migration and research workflows.

The original Telegram Desktop archive viewer remains available at `/index.html`. When Convex is configured, `/` opens the live workspace.

## Current product flow

1. Create an account with email and password, then create a project.
2. Connect a Telegram user account with a phone number, login code, and optional 2FA password.
3. Add only the Telegram chats needed by the project.
4. Press **Refresh** to fetch messages newer than the last saved Telegram message ID.
5. Ask questions in parallel AI threads and attach images when needed.
6. Select one or more Telegram messages as topic anchors. Thread loads up to 10 days of prior conversation, drafts a technical task with validated Telegram citations, and lets you edit it before creation.
7. Invite a teammate as a viewer or editor. Project access never exposes the owner's Telegram session.
8. Optionally import tasks previously stored by the archive-only interface in this browser. The import is explicit and idempotent.
9. In the integrated client, create a task directly from a Telegram message without connecting the same Telegram account to the server a second time.

There is intentionally no permanent worker or socket process in this version. Telegram synchronization runs only after a user presses **Refresh**.

## Architecture

- `server.mjs` — web/API server and R2 Copilot proxy.
- `convex/schema.ts` — projects, members, Telegram accounts, chats, messages, attachments, tasks, assistant threads, and cookie sessions.
- `convex/*.ts` — access-checked queries, mutations, and auth actions.
- `lib/telegram-service.mjs` — Telegram MTProto authorization. The Telegram session is encrypted before being written to Convex and is never returned to the browser.
- `lib/telegram-sync.mjs` — bounded manual synchronization, 10-day task-context history loading, and Convex Storage uploads.
- `public/live.html` — authenticated live workspace.
- `public/index.html` — standalone JSON/HTML/ZIP archive viewer.
- `convex/tasks.ts#createTaskFromClientMessages` — access-checked source capture from Telegram Web A.

The browser authenticates through a same-origin HttpOnly cookie. Only a SHA-256 hash of the opaque session token is stored in Convex. Every project, chat, message, task, and file function checks project membership before returning data.

## Environment

For local development, `npx convex dev` creates `.env.local` with the development deployment URL. Server-only secrets also belong in `.env.local`:

- `CONVEX_URL` — local/development Convex deployment URL.
- `TELEGRAM_API_ID`, `TELEGRAM_API_HASH` — Telegram app credentials.
- `SESSION_ENCRYPTION_KEY` — at least 32 random bytes.
- `R2_COPILOT_API_KEY` — AI provider key.
- `R2_COPILOT_API_URL` — optional, defaults to `https://api-chat.r2copilot.ai`.

Do not expose Telegram, encryption, R2, or Convex deploy credentials in browser code.

## Local run

```bash
npm ci
npx convex dev --once
npm start
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317).

## Deployment

The Vercel project uses the official Convex Marketplace integration. Preview and Production environments receive separate `CONVEX_DEPLOY_KEY` values. The Vercel build runs:

```bash
npx convex deploy --cmd-url-env-var-name CONVEX_URL --cmd 'npm run build:app'
```

This deploys the matching Convex functions before packaging `server.mjs`. A preview deployment is the required verification target before any production promotion.

## Verification

```bash
npm run check
npm test
npm run build
```

The test suite covers project creation/update/listing, chat add/remove/listing, idempotent Telegram message upserts, paginated 10-day task context, source-citation validation, generated-task metadata, outsider access denial, protected attachment URLs, and idempotent local task import.

## Telegram data boundaries

Only chats explicitly added to a project are synchronized and supplied to the assistant. Project instructions are treated as preferences, never as permission to bypass evidence rules. Before production use, review Telegram's current API terms and the organization's consent, retention, and AI-processing requirements for invited users and client conversations.
