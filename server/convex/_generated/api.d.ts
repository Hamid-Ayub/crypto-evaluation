/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _internal_math from "../_internal/math.js";
import type * as _internal_normalize from "../_internal/normalize.js";
import type * as _internal_scoring from "../_internal/scoring.js";
import type * as assets from "../assets.js";
import type * as assetsDownload from "../assetsDownload.js";
import type * as auth from "../auth.js";
import type * as compute from "../compute.js";
import type * as config from "../config.js";
import type * as crons from "../crons.js";
import type * as debug from "../debug.js";
import type * as http from "../http.js";
import type * as ingest from "../ingest.js";
import type * as jobs from "../jobs.js";
import type * as providers_chainStats from "../providers/chainStats.js";
import type * as providers_chains from "../providers/chains.js";
import type * as providers_composite from "../providers/composite.js";
import type * as providers_defillama from "../providers/defillama.js";
import type * as providers_governance from "../providers/governance.js";
import type * as providers_holders from "../providers/holders.js";
import type * as providers_index from "../providers/index.js";
import type * as providers_legacy_covalent from "../providers/legacy_covalent.js";
import type * as providers_legacy_defillama from "../providers/legacy_defillama.js";
import type * as providers_legacy_etherscan from "../providers/legacy_etherscan.js";
import type * as providers_legacy_snapshot from "../providers/legacy_snapshot.js";
import type * as providers_legacy_tally from "../providers/legacy_tally.js";
import type * as providers_ozIntrospection from "../providers/ozIntrospection.js";
import type * as providers_rpc from "../providers/rpc.js";
import type * as providers_snapshot from "../providers/snapshot.js";
import type * as providers_tally from "../providers/tally.js";
import type * as providers_types from "../providers/types.js";
import type * as rateLimit from "../rateLimit.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "_internal/math": typeof _internal_math;
  "_internal/normalize": typeof _internal_normalize;
  "_internal/scoring": typeof _internal_scoring;
  assets: typeof assets;
  assetsDownload: typeof assetsDownload;
  auth: typeof auth;
  compute: typeof compute;
  config: typeof config;
  crons: typeof crons;
  debug: typeof debug;
  http: typeof http;
  ingest: typeof ingest;
  jobs: typeof jobs;
  "providers/chainStats": typeof providers_chainStats;
  "providers/chains": typeof providers_chains;
  "providers/composite": typeof providers_composite;
  "providers/defillama": typeof providers_defillama;
  "providers/governance": typeof providers_governance;
  "providers/holders": typeof providers_holders;
  "providers/index": typeof providers_index;
  "providers/legacy_covalent": typeof providers_legacy_covalent;
  "providers/legacy_defillama": typeof providers_legacy_defillama;
  "providers/legacy_etherscan": typeof providers_legacy_etherscan;
  "providers/legacy_snapshot": typeof providers_legacy_snapshot;
  "providers/legacy_tally": typeof providers_legacy_tally;
  "providers/ozIntrospection": typeof providers_ozIntrospection;
  "providers/rpc": typeof providers_rpc;
  "providers/snapshot": typeof providers_snapshot;
  "providers/tally": typeof providers_tally;
  "providers/types": typeof providers_types;
  rateLimit: typeof rateLimit;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
