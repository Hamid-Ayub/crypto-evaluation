import fetch from "cross-fetch";
import { toCaipChainId } from "./chains";

const TALLY_URL = process.env.TALLY_GRAPHQL || "https://api.tally.xyz/query";
const TALLY_KEY = process.env.TALLY_API_KEY || "";

const ORGANIZATIONS_QUERY = `
query Organizations($limit: Int!, $after: String) {
  organizations(input: { page: { limit: $limit, afterCursor: $after } }) {
    nodes {
      ... on Organization {
        id
        slug
        name
        tokenIds
        governorIds
      }
    }
    pageInfo { lastCursor }
  }
}`;

const GOVERNOR_QUERY = `
query Governor($id: AccountID!) {
  governor(input: { id: $id }) {
    id
    name
    slug
    chainId
    quorum
    token { id decimals supply }
  }
}`;

export type TallyGov = { id: string; name: string; slug: string; chainId: string; quorumPct?: number };

type OrganizationNode = { slug: string; tokenIds?: string[]; governorIds?: string[] };

async function postTally<T>(query: string, variables: Record<string, any>): Promise<T> {
  const res = await fetch(TALLY_URL, {
    method: "POST",
    headers: { "content-type": "application/json", ...(TALLY_KEY ? { "Api-Key": TALLY_KEY } : {}) },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`tally-${res.status}`);
  const body = await res.json();
  if (body?.errors?.length) throw new Error(body.errors[0]?.message || "tally-error");
  return body.data as T;
}

async function discoverOrganizations(assetId: string): Promise<OrganizationNode[]> {
  const matches: OrganizationNode[] = [];
  const limit = 200;
  const MAX_PAGES = 40;
  let cursor: string | null = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await postTally<{ organizations: { nodes: OrganizationNode[]; pageInfo: { lastCursor?: string } } }>(
      ORGANIZATIONS_QUERY,
      { limit, after: cursor }
    );
    const nodes = data?.organizations?.nodes || [];
    for (const node of nodes) {
      const tokenIds = (node.tokenIds || []).map(t => t.toLowerCase());
      if (tokenIds.includes(assetId)) matches.push(node);
    }
    if (matches.length >= 5) break;
    const lastCursor = data?.organizations?.pageInfo?.lastCursor;
    if (!lastCursor || nodes.length < limit) break;
    cursor = lastCursor;
  }
  return matches;
}

function toAssetId(chainId: number, tokenAddress: string) {
  return `${toCaipChainId(chainId)}/erc20:${tokenAddress.toLowerCase()}`;
}

function pctFromBigints(numerator: bigint, denominator: bigint): number | undefined {
  if (denominator === 0n) return undefined;
  const scaled = (numerator * 10000n) / denominator;
  return Number(scaled) / 100;
}

async function fetchGovernor(governorId: string): Promise<TallyGov | null> {
  try {
    const data = await postTally<{ governor: { id: string; name: string; slug: string; chainId: string; quorum?: string; token?: { supply?: string } } }>(
      GOVERNOR_QUERY,
      { id: governorId }
    );
    const gov = data?.governor;
    if (!gov) return null;
    const quorum = gov.quorum ? BigInt(gov.quorum) : null;
    const supply = gov.token?.supply ? BigInt(gov.token.supply) : null;
    const quorumPct = (quorum && supply) ? pctFromBigints(quorum, supply) : undefined;
    return { id: gov.id, name: gov.name, slug: gov.slug, chainId: gov.chainId, quorumPct };
  } catch {
    return null;
  }
}

export async function findTallyForToken(chainId: number, tokenAddress: string): Promise<TallyGov[]> {
  const assetId = toAssetId(chainId, tokenAddress);
  const orgs = await discoverOrganizations(assetId);
  const governorIds = Array.from(new Set(orgs.flatMap(o => o.governorIds || [])));
  const results: TallyGov[] = [];
  for (const govId of governorIds) {
    const detail = await fetchGovernor(govId);
    if (detail) results.push(detail);
  }
  return results;
}

