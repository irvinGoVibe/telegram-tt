/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiSettings from "../aiSettings.js";
import type * as assistant from "../assistant.js";
import type * as auth from "../auth.js";
import type * as authActions from "../authActions.js";
import type * as integrations from "../integrations.js";
import type * as lib_access from "../lib/access.js";
import type * as projects from "../projects.js";
import type * as storage from "../storage.js";
import type * as tasks from "../tasks.js";
import type * as telegram from "../telegram.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiSettings: typeof aiSettings;
  assistant: typeof assistant;
  auth: typeof auth;
  authActions: typeof authActions;
  integrations: typeof integrations;
  "lib/access": typeof lib_access;
  projects: typeof projects;
  storage: typeof storage;
  tasks: typeof tasks;
  telegram: typeof telegram;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
