import test from "node:test";
import assert from "node:assert/strict";
import {
  PersistentMcpOAuthProvider,
  issueFromMcpPayload,
  linearConfig,
  linearIssueInput,
  mcpResultPayload,
  normalizeLinearCatalog,
} from "../lib/linear-service.mjs";

test("Linear catalog keeps projects attached to accessible teams", () => {
  const catalog = normalizeLinearCatalog({
    organization: { id: "workspace-1", name: "EvalLens" },
    teams: { nodes: [{ id: "team-1", name: "Product", key: "EVA" }] },
    projects: { nodes: [
      { id: "project-1", name: "Telegram Thread", teams: { nodes: [{ id: "team-1" }] } },
      { id: "project-hidden", name: "Hidden", teams: { nodes: [{ id: "team-hidden" }] } },
    ] },
  });
  assert.deepEqual(catalog, {
    workspace: { id: "workspace-1", name: "EvalLens" },
    teams: [{ id: "team-1", name: "Product", key: "EVA" }],
    projects: [{ id: "project-1", name: "Telegram Thread", teamIds: ["team-1"] }],
  });
});

test("Linear issue input always uses the saved team and project destination", () => {
  assert.deepEqual(linearIssueInput(
    { title: "Ship source-linked task", description: "## Objective\n\nRelease [#42]" },
    { teamId: "team-1", externalProjectId: "project-1" },
  ), {
    team: "team-1",
    project: "project-1",
    title: "Ship source-linked task",
    description: "## Objective\n\nRelease [#42]",
  });
  assert.throws(() => linearIssueInput({ title: "Task" }, { teamId: "team-1" }), /team and project/i);
});

test("Linear MCP is available without application credentials in env", () => {
  assert.deepEqual(linearConfig(), { enabled: true, mcpUrl: "https://mcp.linear.app/mcp" });
  const provider = new PersistentMcpOAuthProvider({
    redirectUrl: "https://thread.example/api/integrations/linear/callback",
    state: "state-1",
  });
  provider.saveClientInformation({ client_id: "dynamic-client" });
  provider.saveCodeVerifier("verifier");
  provider.saveTokens({ access_token: "token", token_type: "Bearer" });
  assert.equal(provider.clientMetadata.token_endpoint_auth_method, "none");
  assert.equal(provider.state(), "state-1");
  assert.deepEqual(provider.exportSnapshot(), {
    clientInformation: { client_id: "dynamic-client" },
    codeVerifier: "verifier",
    tokens: { access_token: "token", token_type: "Bearer" },
  });
});

test("Linear MCP JSON results and created issues are parsed", () => {
  assert.deepEqual(mcpResultPayload({ content: [{ type: "text", text: '{"teams":[{"id":"team-1"}]}' }] }), {
    teams: [{ id: "team-1" }],
  });
  assert.deepEqual(issueFromMcpPayload({ issue: { identifier: "EVA-42", url: "https://linear.app/eval/issue/EVA-42/task" } }), {
    identifier: "EVA-42",
    url: "https://linear.app/eval/issue/EVA-42/task",
  });
});
