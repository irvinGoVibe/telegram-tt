# Telegram Tasks — live Telegram project workspace

Telegram Tasks turns every Telegram chat into its own task stream without creating a server-side archive of the conversation. AI and Linear settings are shared for the signed-in account; tasks keep only the source snapshots explicitly selected by the user.

Inside the integrated Telegram Web A client, the existing Telegram session supplies the message source. The server accepts a bounded source snapshot, stores its Telegram link when available, and publishes the reviewed task through the account's Linear connection.

When `../dist` is present, `/` opens the integrated Telegram client. The old standalone project interface is no longer part of the default product path.

## Current product flow

1. Sign in with Telegram. Telegram Tasks uses the verified Telegram user ID as the account identity.
2. Open any Telegram chat. That chat is the workspace and task history boundary.
3. Ask questions against the bounded context currently loaded in the browser.
4. Create a task from one or more Telegram messages, review its title and description, and send it to Linear.
5. Configure the AI model and Linear destination once; both settings are shared across chats.

There is intentionally no permanent worker or socket process in this version. Telegram synchronization runs only after a user presses **Refresh**.

## Architecture

- `server.mjs` — web/API server and R2 Copilot proxy.
- `convex/schema.ts` — account identity, Telegram connection metadata, tasks, integrations, AI settings, and cookie sessions. Legacy project/member tables remain temporarily as a non-user-facing compatibility layer and receive no new membership or invite writes.
- `convex/*.ts` — access-checked queries, mutations, and auth actions.
- `lib/telegram-service.mjs` — Telegram MTProto authorization. The Telegram session is encrypted before being written to Convex and is never returned to the browser.
- `lib/telegram-sync.mjs` — bounded on-demand Telegram reads returned directly to the requesting browser; it does not persist message bodies or Telegram media.
- `public/*` — legacy migration interfaces, served only when explicitly selected as `THREAD_WEB_ROOT`.
- `convex/tasks.ts#createTaskFromClientMessages` — access-checked source capture from Telegram Web A.

The browser starts sign-in through Telegram OIDC with PKCE, state, and nonce verification. After Telegram returns a verified identity, Telegram Tasks issues a same-origin HttpOnly cookie. Only a SHA-256 hash of the opaque session token is stored in Convex. Product access is account-owned; the integrated UI has no project creation, invitations, roles, or member management.

## Environment

For local development, `npx convex dev` creates `.env.local` with the development deployment URL. Server-only secrets also belong in `.env.local`:

- `CONVEX_URL` — local/development Convex deployment URL.
- `TELEGRAM_API_ID`, `TELEGRAM_API_HASH` — Telegram app credentials.
- `SESSION_ENCRYPTION_KEY` — at least 32 random bytes.
- `TELEGRAM_OIDC_CLIENT_ID`, `TELEGRAM_OIDC_CLIENT_SECRET` — Telegram Login credentials from BotFather.
- `TELEGRAM_OIDC_REDIRECT_URI` — registered callback URL ending in `/api/auth/telegram/callback`.
- `THREAD_SERVER_SECRET` — a separate random 32+ character server-to-Convex secret. Configure the same value in the server and Convex environments.
- `R2_COPILOT_API_KEY` — AI provider key.
- `R2_COPILOT_API_URL` — optional, defaults to `https://api-chat.r2copilot.ai`.
- `R2_COPILOT_DEFAULT_MODEL` — optional development/bootstrap fallback. Each project's selected default is stored in Convex.

The shared R2 key is managed only as a server secret and is never returned to the browser. The default AI model is a common server/account setting. Telegram context and attached images pass through the backend only for the active AI request and are not written to Convex Storage.

Register the production origin and callback URL under **BotFather → Login Widget**. Telegram sign-in stays disabled until all OIDC values, `SESSION_ENCRYPTION_KEY`, and `THREAD_SERVER_SECRET` are configured. Also set `THREAD_SERVER_SECRET` in the matching Convex deployment with `npx convex env set`.

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

Conversation bodies remain in Telegram and the current browser session; the backend sends only the selected bounded context to R2 Copilot without storing it in Convex. A created task may retain the small source snapshots explicitly selected by the user so that its evidence remains reviewable. Before production use, review Telegram's current API terms and the organization's consent and AI-processing requirements for client conversations.
