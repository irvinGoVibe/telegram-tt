import { createHash, randomBytes } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { UnauthorizedError } from "@modelcontextprotocol/sdk/client/auth.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { api, asId, convexClient } from "./convex.mjs";
import { decryptJson, encryptJson } from "./crypto.mjs";

const LINEAR_MCP_URL = "https://mcp.linear.app/mcp";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1_000;
const CLIENT_NAME = "Thread";
const CLIENT_VERSION = "1.0.0";

function clean(value, max = 10_000) {
  return String(value ?? "").trim().slice(0, max);
}

export function linearConfig() {
  return { enabled: true, mcpUrl: LINEAR_MCP_URL };
}

function requestOrigin(request) {
  const protocol = clean(request.headers["x-forwarded-proto"], 20) || "http";
  const host = clean(request.headers["x-forwarded-host"] || request.headers.host, 500);
  if (!host) throw new Error("Could not determine the Linear callback origin.");
  return `${protocol}://${host}`;
}

function redirectUriFor(request) {
  return `${requestOrigin(request)}/api/integrations/linear/callback`;
}

function secretContext(projectId) {
  return `linear-mcp-session:${projectId}`;
}

function pendingContext(stateHash) {
  return `linear-mcp-oauth:${stateHash}`;
}

export class PersistentMcpOAuthProvider {
  constructor({ redirectUrl, state, snapshot = {}, onRedirect = () => {} }) {
    this._redirectUrl = redirectUrl;
    this._state = state;
    this._snapshot = structuredClone(snapshot || {});
    this._onRedirect = onRedirect;
  }

  get redirectUrl() {
    return this._redirectUrl;
  }

  get clientMetadata() {
    return {
      redirect_uris: [this._redirectUrl],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      client_name: CLIENT_NAME,
      software_id: "telegram-threads",
      software_version: CLIENT_VERSION,
    };
  }

  state() {
    return this._state;
  }

  clientInformation() {
    return this._snapshot.clientInformation;
  }

  saveClientInformation(clientInformation) {
    this._snapshot.clientInformation = structuredClone(clientInformation);
  }

  tokens() {
    return this._snapshot.tokens;
  }

  saveTokens(tokens) {
    this._snapshot.tokens = structuredClone(tokens);
  }

  redirectToAuthorization(authorizationUrl) {
    this._onRedirect(new URL(authorizationUrl));
  }

  saveCodeVerifier(codeVerifier) {
    this._snapshot.codeVerifier = codeVerifier;
  }

  codeVerifier() {
    if (!this._snapshot.codeVerifier) throw new Error("The Linear authorization verifier is missing. Start the connection again.");
    return this._snapshot.codeVerifier;
  }

  saveDiscoveryState(discoveryState) {
    this._snapshot.discoveryState = structuredClone(discoveryState);
  }

  discoveryState() {
    return this._snapshot.discoveryState;
  }

  invalidateCredentials(scope) {
    if (scope === "all" || scope === "client") delete this._snapshot.clientInformation;
    if (scope === "all" || scope === "tokens") delete this._snapshot.tokens;
    if (scope === "all" || scope === "verifier") delete this._snapshot.codeVerifier;
    if (scope === "all" || scope === "discovery") delete this._snapshot.discoveryState;
  }

  exportSnapshot() {
    return structuredClone(this._snapshot);
  }
}

function mcpClient() {
  return new Client({ name: CLIENT_NAME, version: CLIENT_VERSION }, { capabilities: {} });
}

function mcpTransport(provider) {
  return new StreamableHTTPClientTransport(new URL(LINEAR_MCP_URL), { authProvider: provider });
}

function errorStatus(error, fallback = 502) {
  if (!error.statusCode) error.statusCode = fallback;
  return error;
}

function toolError(result, fallback) {
  const message = (result?.content || [])
    .filter((item) => item?.type === "text")
    .map((item) => clean(item.text, 2_000))
    .filter(Boolean)
    .join("\n");
  return errorStatus(new Error(message || fallback), 502);
}

function parseTextPayload(text) {
  const value = clean(text, 2_000_000);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return { text: value };
  }
}

export function mcpResultPayload(result) {
  if (result?.isError) throw toolError(result, "Linear MCP returned an error.");
  if (result?.structuredContent && typeof result.structuredContent === "object") return result.structuredContent;
  for (const item of result?.content || []) {
    if (item?.type !== "text") continue;
    const payload = parseTextPayload(item.text);
    if (payload) return payload;
  }
  return {};
}

function findToolName(toolList, desiredName) {
  const names = (toolList?.tools || []).map((tool) => clean(tool.name, 300)).filter(Boolean);
  return names.find((name) => name === desiredName)
    || names.find((name) => name.endsWith(`_${desiredName}`));
}

async function callLinearTool(client, toolList, desiredName, args) {
  const name = findToolName(toolList, desiredName);
  if (!name) throw errorStatus(new Error(`Linear MCP does not expose the required ${desiredName} tool.`), 502);
  return mcpResultPayload(await client.callTool({ name, arguments: args }));
}

function nodes(value, key) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.[key])) return value[key];
  if (Array.isArray(value?.nodes)) return value.nodes;
  return [];
}

function projectTeamIds(project) {
  const explicit = Array.isArray(project?.teamIds) ? project.teamIds : [];
  const nested = nodes(project?.teams, "teams").map((team) => typeof team === "string" ? team : team?.id);
  return [...new Set([...explicit, ...nested].map((id) => clean(id, 200)).filter(Boolean))];
}

function workspaceSlug(projects) {
  for (const project of projects) {
    try {
      const url = new URL(project.url);
      if (url.hostname === "linear.app") {
        const slug = clean(url.pathname.split("/").filter(Boolean)[0], 200);
        if (slug) return slug;
      }
    } catch {}
  }
  return "";
}

function workspaceIdentity(teams, projects, workspace = {}) {
  const slug = workspaceSlug(projects);
  const stableIds = teams.map((team) => team.id).filter(Boolean).sort().join(":");
  const fallbackId = stableIds ? createHash("sha256").update(stableIds).digest("hex").slice(0, 32) : "linear";
  return {
    id: clean(workspace.id, 200) || (slug ? `linear:${slug}` : `linear:${fallbackId}`),
    name: clean(workspace.name, 300) || slug || "Linear workspace",
  };
}

export function normalizeLinearCatalog(data) {
  const rawTeams = nodes(data?.teams?.nodes || data?.teams, "teams");
  const teams = rawTeams.map((team) => ({
    id: clean(team?.id, 200),
    name: clean(team?.name, 300),
    key: clean(team?.key, 80),
  })).filter((team) => team.id && team.name);
  const availableTeamIds = new Set(teams.map((team) => team.id));
  const rawProjects = nodes(data?.projects?.nodes || data?.projects, "projects");
  const projects = rawProjects.map((project) => ({
    id: clean(project?.id, 200),
    name: clean(project?.name, 300),
    url: clean(project?.url, 2_000),
    teamIds: projectTeamIds(project).filter((id) => availableTeamIds.has(id)),
  })).filter((project) => project.id && project.name && project.teamIds.length);
  const workspace = workspaceIdentity(teams, rawProjects, data?.workspace || data?.organization || {});
  return { workspace, teams, projects: projects.map(({ url: _url, ...project }) => project) };
}

async function paginatedTool(client, toolList, desiredName, key, baseArgs, maxPages = 30) {
  const records = [];
  let cursor;
  for (let page = 0; page < maxPages; page += 1) {
    const payload = await callLinearTool(client, toolList, desiredName, cursor ? { ...baseArgs, cursor } : baseArgs);
    records.push(...nodes(payload, key));
    if (!payload?.hasNextPage || !payload?.cursor || payload.cursor === cursor) break;
    cursor = payload.cursor;
  }
  return records;
}

async function fetchCatalog(client, toolList) {
  const teams = await paginatedTool(client, toolList, "list_teams", "teams", { limit: 250, includeArchived: false });
  const projectsById = new Map();
  for (const team of teams) {
    const teamId = clean(team?.id, 200);
    if (!teamId) continue;
    const projects = await paginatedTool(client, toolList, "list_projects", "projects", {
      team: teamId,
      limit: 50,
      includeArchived: false,
    });
    for (const project of projects) {
      const id = clean(project?.id, 200);
      if (!id) continue;
      const existing = projectsById.get(id);
      projectsById.set(id, {
        ...(existing || {}),
        ...project,
        teamIds: [...new Set([...(existing?.teamIds || []), ...projectTeamIds(project), teamId])],
      });
    }
  }
  const catalog = normalizeLinearCatalog({ teams, projects: [...projectsById.values()] });
  if (!catalog.teams.length) throw errorStatus(new Error("The connected Linear workspace has no available teams."), 400);
  return catalog;
}

function snapshotForStorage(provider, redirectUri) {
  const snapshot = provider.exportSnapshot();
  delete snapshot.codeVerifier;
  return { ...snapshot, redirectUri };
}

function snapshotChanged(before, after) {
  return JSON.stringify(before || {}) !== JSON.stringify(after || {});
}

async function closeMcp(client, transport) {
  await client?.close().catch(() => transport?.close().catch(() => {}));
}

export async function beginLinearConnection({ request, sessionHash, projectId }) {
  const state = randomBytes(32).toString("base64url");
  const stateHash = createHash("sha256").update(state).digest("hex");
  const redirectUri = redirectUriFor(request);
  let authorizeUrl = "";
  const provider = new PersistentMcpOAuthProvider({
    redirectUrl: redirectUri,
    state,
    onRedirect: (url) => { authorizeUrl = url.toString(); },
  });
  const client = mcpClient();
  const transport = mcpTransport(provider);
  try {
    await client.connect(transport);
    throw errorStatus(new Error("Linear MCP did not request authorization."), 502);
  } catch (error) {
    if (!(error instanceof UnauthorizedError) || !authorizeUrl) throw errorStatus(error, 502);
  } finally {
    await closeMcp(client, transport);
  }
  await convexClient().mutation(api.integrations.createOAuthState, {
    sessionHash,
    projectId: asId(projectId, "project"),
    provider: "linear",
    stateHash,
    encryptedCodeVerifier: encryptJson(provider.exportSnapshot(), pendingContext(stateHash)),
    redirectUri,
    expiresAt: Date.now() + OAUTH_STATE_TTL_MS,
  });
  return { authorizeUrl };
}

export async function completeLinearConnection({ sessionHash, state, code }) {
  const safeState = clean(state, 1_000);
  const safeCode = clean(code, 4_000);
  if (!safeState || !safeCode) throw errorStatus(new Error("Linear did not return a valid authorization code."), 400);
  const stateHash = createHash("sha256").update(safeState).digest("hex");
  const convex = convexClient();
  const oauthState = await convex.mutation(api.integrations.consumeOAuthState, { sessionHash, stateHash });
  const snapshot = decryptJson(oauthState.encryptedCodeVerifier, pendingContext(stateHash));
  const provider = new PersistentMcpOAuthProvider({ redirectUrl: oauthState.redirectUri, state: safeState, snapshot });
  const transport = mcpTransport(provider);
  const client = mcpClient();
  try {
    await transport.finishAuth(safeCode);
    await client.connect(transport);
    const toolList = await client.listTools();
    const catalog = await fetchCatalog(client, toolList);
    const stored = snapshotForStorage(provider, oauthState.redirectUri);
    const integration = await convex.mutation(api.integrations.saveConnection, {
      sessionHash,
      projectId: oauthState.projectId,
      encryptedCredentials: encryptJson(stored, secretContext(oauthState.projectId)),
      externalWorkspaceId: catalog.workspace.id,
      externalWorkspaceName: catalog.workspace.name,
    });
    return { projectId: oauthState.projectId, integration, catalog };
  } finally {
    await closeMcp(client, transport);
  }
}

async function connectedIntegration({ sessionHash, projectId }) {
  const integration = await convexClient().query(api.integrations.getConnection, {
    sessionHash,
    projectId: asId(projectId, "project"),
  });
  if (!integration || integration.status !== "connected") {
    const error = new Error("Connect Linear to this project first.");
    error.statusCode = 409;
    throw error;
  }
  let snapshot;
  try {
    snapshot = decryptJson(integration.encryptedCredentials, secretContext(projectId));
  } catch {
    const error = new Error("This Linear connection uses an old format. Reconnect Linear in project settings.");
    error.statusCode = 401;
    throw error;
  }
  if (!snapshot?.tokens?.access_token || !snapshot?.clientInformation || !snapshot?.redirectUri) {
    const error = new Error("This Linear connection uses an old format. Reconnect Linear in project settings.");
    error.statusCode = 401;
    throw error;
  }
  return { integration, snapshot };
}

async function withLinearMcp({ sessionHash, projectId }, operation) {
  const convex = convexClient();
  const { integration, snapshot } = await connectedIntegration({ sessionHash, projectId });
  let reconnectUrl = "";
  const provider = new PersistentMcpOAuthProvider({
    redirectUrl: snapshot.redirectUri,
    state: randomBytes(32).toString("base64url"),
    snapshot,
    onRedirect: (url) => { reconnectUrl = url.toString(); },
  });
  const client = mcpClient();
  const transport = mcpTransport(provider);
  try {
    await client.connect(transport);
    const toolList = await client.listTools();
    return await operation({ client, toolList, integration });
  } catch (error) {
    const message = error instanceof UnauthorizedError || reconnectUrl
      ? "The Linear MCP session expired. Reconnect Linear in project settings."
      : clean(error.message, 1_000) || "Linear MCP request failed.";
    await convex.mutation(api.integrations.markError, {
      sessionHash,
      projectId: asId(projectId, "project"),
      message,
    }).catch(() => {});
    if (error instanceof UnauthorizedError || reconnectUrl) error.statusCode = 401;
    throw errorStatus(new Error(message), error.statusCode || 502);
  } finally {
    const updated = snapshotForStorage(provider, snapshot.redirectUri);
    if (updated?.tokens?.access_token && snapshotChanged(snapshot, updated)) {
      await convex.mutation(api.integrations.updateCredentials, {
        sessionHash,
        projectId: asId(projectId, "project"),
        encryptedCredentials: encryptJson(updated, secretContext(projectId)),
      }).catch(() => {});
    }
    await closeMcp(client, transport);
  }
}

export async function getLinearCatalog({ sessionHash, projectId }) {
  return await withLinearMcp({ sessionHash, projectId }, async ({ client, toolList }) => await fetchCatalog(client, toolList));
}

export async function setLinearDestination({ sessionHash, projectId, teamId, externalProjectId }) {
  const catalog = await getLinearCatalog({ sessionHash, projectId });
  const team = catalog.teams.find((item) => item.id === clean(teamId, 200));
  const project = catalog.projects.find((item) => item.id === clean(externalProjectId, 200) && item.teamIds.includes(team?.id));
  if (!team || !project) {
    const error = new Error("Choose a Linear project that belongs to the selected team.");
    error.statusCode = 400;
    throw error;
  }
  return await convexClient().mutation(api.integrations.setDestination, {
    sessionHash,
    projectId: asId(projectId, "project"),
    teamId: team.id,
    teamName: team.name,
    teamKey: team.key,
    externalProjectId: project.id,
    externalProjectName: project.name,
  });
}

export function linearIssueInput(task, integration) {
  if (!integration?.teamId || !integration?.externalProjectId) throw new Error("Choose a Linear team and project in project settings before publishing.");
  return {
    team: integration.teamId,
    project: integration.externalProjectId,
    title: clean(task.title, 300),
    description: clean(task.description, 50_000),
  };
}

function findIssue(value) {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const issue = findIssue(item);
      if (issue) return issue;
    }
    return null;
  }
  const url = clean(value.url, 2_000);
  const identifier = clean(value.identifier, 200);
  if (url && (identifier || /linear\.app\//i.test(url))) return { ...value, url, identifier };
  for (const nested of Object.values(value)) {
    const issue = findIssue(nested);
    if (issue) return issue;
  }
  return null;
}

export function issueFromMcpPayload(payload) {
  const found = findIssue(payload);
  if (found?.url) return found;
  const text = clean(payload?.text, 20_000);
  const url = text.match(/https:\/\/linear\.app\/[^\s)]+/i)?.[0] || "";
  const identifier = text.match(/\b[A-Z][A-Z0-9]+-\d+\b/)?.[0] || "";
  if (url) return { url, identifier, title: "" };
  throw errorStatus(new Error("Linear MCP did not return the created issue."), 502);
}

export async function publishTaskToLinear({ sessionHash, task }) {
  if (task.externalUrl && task.externalId) return { task, issue: { identifier: task.externalId, url: task.externalUrl }, existing: true };
  return await withLinearMcp({ sessionHash, projectId: task.projectId }, async ({ client, toolList, integration }) => {
    const input = linearIssueInput(task, integration);
    const payload = await callLinearTool(client, toolList, "save_issue", input);
    return { issue: issueFromMcpPayload(payload), existing: false };
  });
}
