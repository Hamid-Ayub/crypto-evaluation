import { GovernanceInfo } from "./types";
import { SnapshotSpace, SnapshotProposal, findSpacesByToken, recentProposals } from "./snapshot";
import { TallyGov, findTallyForToken } from "./tally";

export type SnapshotGovernanceEvidence = SnapshotSpace & {
  quorumPct?: number;
  turnoutHistory: Array<{ proposalId: string; turnoutPct: number; ts: number }>;
};

export type GovernanceDiscovery = {
  snapshot: SnapshotGovernanceEvidence[];
  tally: TallyGov[];
};

const SNAPSHOT_SPACE_LIMIT = 3;
const SNAPSHOT_PROPOSAL_LIMIT = 3;

function computeSnapshotTurnout(space: SnapshotSpace, proposal: SnapshotProposal) {
  const followers = space.followersCount || 0;
  const votes = proposal.votes || 0;
  let turnoutPct: number | undefined;
  if (followers > 0) {
    turnoutPct = Math.min(100, (votes / followers) * 100);
  } else if (proposal.quorum && proposal.scores_total) {
    turnoutPct = proposal.quorum > 0 ? Math.min(100, (proposal.scores_total / proposal.quorum) * 100) : undefined;
  }
  if (!turnoutPct || !Number.isFinite(turnoutPct) || turnoutPct <= 0) return null;
  const tsSec = proposal.end || proposal.start || Math.floor(Date.now() / 1000);
  return {
    proposalId: proposal.id,
    turnoutPct: Number(turnoutPct.toFixed(2)),
    ts: Math.floor(tsSec) * 1000,
  };
}

function computeSnapshotQuorum(space: SnapshotSpace, proposals: SnapshotProposal[]): number | undefined {
  const followers = space.followersCount || 0;
  if (followers <= 0) return undefined;
  const ratios = proposals
    .filter(p => p.quorum)
    .map(p => Math.min(100, (p.quorum! / followers) * 100));
  if (!ratios.length) return undefined;
  const avg = ratios.reduce((sum, val) => sum + val, 0) / ratios.length;
  return Number(avg.toFixed(2));
}

export async function collectGovernanceEvidence(chainId: number, tokenAddress: string): Promise<GovernanceDiscovery> {
  const spaces = await findSpacesByToken(chainId, tokenAddress);
  const snapshotEvidence: SnapshotGovernanceEvidence[] = [];
  for (const space of spaces.slice(0, SNAPSHOT_SPACE_LIMIT)) {
    const proposals = await recentProposals(space.id, SNAPSHOT_PROPOSAL_LIMIT);
    const turnoutHistory = proposals
      .map(p => computeSnapshotTurnout(space, p))
      .filter((entry): entry is { proposalId: string; turnoutPct: number; ts: number } => !!entry);
    const quorumPct = computeSnapshotQuorum(space, proposals);
    snapshotEvidence.push({ ...space, quorumPct, turnoutHistory });
  }

  let tallyEvidence: TallyGov[] = [];
  try {
    tallyEvidence = await findTallyForToken(chainId, tokenAddress);
  } catch {
    tallyEvidence = [];
  }

  return { snapshot: snapshotEvidence, tally: tallyEvidence };
}

export function summarizeGovernance(discovery: GovernanceDiscovery): GovernanceInfo {
  const hasTally = discovery.tally.length > 0;
  const framework = hasTally ? "tally" : (discovery.snapshot.length > 0 ? "snapshot" : undefined);

  const quorumCandidates: number[] = [];
  discovery.tally.forEach(g => { if (g.quorumPct) quorumCandidates.push(g.quorumPct); });
  discovery.snapshot.forEach(s => { if (s.quorumPct) quorumCandidates.push(s.quorumPct); });
  const quorumPct = quorumCandidates.length
    ? Number((quorumCandidates.reduce((sum, value) => sum + value, 0) / quorumCandidates.length).toFixed(2))
    : undefined;

  const turnoutHistory = discovery.snapshot
    .flatMap(s => s.turnoutHistory)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 6);

  return { framework, quorumPct, turnoutHistory };
}



