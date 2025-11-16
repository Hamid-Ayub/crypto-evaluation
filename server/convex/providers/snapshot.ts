import fetch from "cross-fetch";
const SNAPSHOT_GRAPHQL = process.env.SNAPSHOT_GRAPHQL || "https://hub.snapshot.org/graphql";
const SPACES_QUERY = `
query Spaces($first: Int!, $skip: Int!) {
  spaces(first: $first, skip: $skip, orderBy: "created", orderDirection: desc) {
    id
    name
    network
    symbol
    followersCount
    strategies { name params }
  }
}`;

const PROPOSALS_QUERY = `
query Proposals($space: String!, $limit: Int!) {
  proposals(first: $limit, skip: 0, where: { space_in: [$space] }, orderBy: "created", orderDirection: desc) {
    id
    votes
    scores_total
    quorum
    start
    end
  }
}`;

export type SnapshotSpace = {
  id: string;
  name: string;
  network: string;
  symbol?: string;
  followersCount?: number;
  strategies?: any[];
};

export type SnapshotProposal = {
  id: string;
  votes: number;
  scores_total?: number;
  quorum?: number;
  start: number;
  end: number;
};

const PAGE_SIZE = 200;
const MAX_PAGES = 30;
const CACHE_MS = 15 * 60 * 1000;

let spacesCache: { fetchedAt: number; data: SnapshotSpace[] } | null = null;

async function postSnapshot<T>(query: string, variables: Record<string, any>): Promise<T> {
  const res = await fetch(SNAPSHOT_GRAPHQL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`snapshot-${res.status}`);
  const body = await res.json();
  if (body?.errors?.length) throw new Error(body.errors[0]?.message || "snapshot-error");
  return body.data as T;
}

async function loadAllSpaces(): Promise<SnapshotSpace[]> {
  const now = Date.now();
  if (spacesCache && now - spacesCache.fetchedAt < CACHE_MS) return spacesCache.data;
  const collected: SnapshotSpace[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const skip = page * PAGE_SIZE;
    const data = await postSnapshot<{ spaces: SnapshotSpace[] }>(SPACES_QUERY, { first: PAGE_SIZE, skip });
    const spaces = data?.spaces || [];
    if (spaces.length === 0) break;
    collected.push(...spaces);
    if (spaces.length < PAGE_SIZE) break;
  }
  spacesCache = { data: collected, fetchedAt: now };
  return collected;
}

function strategyMatchesToken(strategy: any, token: string): boolean {
  const params = strategy?.params || {};
  const candidates: string[] = [];
  const keys = ["address", "token", "tokenAddress", "addressMainnet", "addressPolygon"];
  for (const key of keys) {
    if (params[key]) {
      if (Array.isArray(params[key])) candidates.push(...params[key]);
      else candidates.push(params[key]);
    }
  }
  if (Array.isArray(params.addresses)) candidates.push(...params.addresses);
  return candidates.some(addr => typeof addr === "string" && addr.toLowerCase() === token.toLowerCase());
}

export async function findSpacesByToken(chainId: number, tokenAddress: string): Promise<SnapshotSpace[]> {
  const spaces = await loadAllSpaces();
  const network = String(chainId);
  const lower = tokenAddress.toLowerCase();
  return spaces.filter(space => {
    if (space.network !== network) return false;
    const strategies = space.strategies || [];
    return strategies.some(strategy => strategyMatchesToken(strategy, lower));
  });
}

export async function recentProposals(spaceId: string, limit = 3): Promise<SnapshotProposal[]> {
  const data = await postSnapshot<{ proposals: SnapshotProposal[] }>(PROPOSALS_QUERY, { space: spaceId, limit });
  return data?.proposals ?? [];
}
