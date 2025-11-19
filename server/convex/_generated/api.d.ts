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
import type * as ai_research from "../ai/research.js";
import type * as aiContent from "../aiContent.js";
import type * as aiContentNode from "../aiContentNode.js";
import type * as assetDownload from "../assetDownload.js";
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
import type * as projectMetadata from "../projectMetadata.js";
import type * as projectParser from "../projectParser.js";
import type * as providers_chainStats from "../providers/chainStats.js";
import type * as providers_chains from "../providers/chains.js";
import type * as providers_coingecko from "../providers/coingecko.js";
import type * as providers_composite from "../providers/composite.js";
import type * as providers_covalent from "../providers/covalent.js";
import type * as providers_defillama from "../providers/defillama.js";
import type * as providers_etherscanHolders from "../providers/etherscanHolders.js";
import type * as providers_gemini from "../providers/gemini.js";
import type * as providers_github from "../providers/github.js";
import type * as providers_governance from "../providers/governance.js";
import type * as providers_holders from "../providers/holders.js";
import type * as providers_holdersMultiSource from "../providers/holdersMultiSource.js";
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
import type * as providers_webParser from "../providers/webParser.js";
import type * as rateLimit from "../rateLimit.js";
import type * as scheduler from "../scheduler.js";
import type * as schedulerActions from "../schedulerActions.js";
import type * as tokenDiscovery from "../tokenDiscovery.js";
import type * as tokenDiscoveryFallbacks from "../tokenDiscoveryFallbacks.js";

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
  "ai/research": typeof ai_research;
  aiContent: typeof aiContent;
  aiContentNode: typeof aiContentNode;
  assetDownload: typeof assetDownload;
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
  projectMetadata: typeof projectMetadata;
  projectParser: typeof projectParser;
  "providers/chainStats": typeof providers_chainStats;
  "providers/chains": typeof providers_chains;
  "providers/coingecko": typeof providers_coingecko;
  "providers/composite": typeof providers_composite;
  "providers/covalent": typeof providers_covalent;
  "providers/defillama": typeof providers_defillama;
  "providers/etherscanHolders": typeof providers_etherscanHolders;
  "providers/gemini": typeof providers_gemini;
  "providers/github": typeof providers_github;
  "providers/governance": typeof providers_governance;
  "providers/holders": typeof providers_holders;
  "providers/holdersMultiSource": typeof providers_holdersMultiSource;
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
  "providers/webParser": typeof providers_webParser;
  rateLimit: typeof rateLimit;
  scheduler: typeof scheduler;
  schedulerActions: typeof schedulerActions;
  tokenDiscovery: typeof tokenDiscovery;
  tokenDiscoveryFallbacks: typeof tokenDiscoveryFallbacks;
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
