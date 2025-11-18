import { HoldersSnapshot } from "./types";
import { fetchHoldersSnapshot } from "./holders";
import { fetchHoldersFromCovalent } from "./covalent";
import { toNumericChainId } from "./chains";

/**
 * Aggregate holder data from multiple sources with consensus
 * Currently supports: Ethplorer (Ethereum only) + Covalent (multi-chain)
 */
export async function fetchHoldersMultiSource(
  chainId: string | number,
  address: string
): Promise<HoldersSnapshot | null> {
  const numericChain = toNumericChainId(chainId);
  const sources: Array<{ name: string; data: HoldersSnapshot | null }> = [];

  // Try Ethplorer (Ethereum mainnet only)
  if (numericChain === 1) {
    try {
      const ethplorerData = await fetchHoldersSnapshot(chainId, address);
      if (ethplorerData) {
        sources.push({ name: "ethplorer", data: ethplorerData });
      }
    } catch (error) {
      console.error("Ethplorer fetch failed:", error);
    }
  }

  // Try Covalent (multi-chain)
  try {
    const covalentData = await fetchHoldersFromCovalent(chainId, address);
    if (covalentData) {
      sources.push({ name: "covalent", data: covalentData });
    }
  } catch (error) {
    console.error("Covalent fetch failed:", error);
  }

  if (sources.length === 0) {
    return null;
  }

  // If only one source, return it with source tracking
  if (sources.length === 1) {
    const result = sources[0].data!;
    return {
      ...result,
      source: sources[0].name,
      sources: [sources[0].name],
      crossValidationStatus: "single-source",
    };
  }

  // Multiple sources - aggregate with consensus
  return aggregateHoldersData(sources);
}

/**
 * Aggregate holder data from multiple sources
 * Uses weighted average for metrics, consensus for holder lists
 */
function aggregateHoldersData(
  sources: Array<{ name: string; data: HoldersSnapshot }>
): HoldersSnapshot {
  // Use the source with highest coverage as primary
  const primarySource = sources.reduce((best, current) => {
    const bestCoverage = best.data.coveragePct ?? 0;
    const currentCoverage = current.data.coveragePct ?? 0;
    return currentCoverage > bestCoverage ? current : best;
  });

  const primary = primarySource.data;
  const sourceNames = sources.map(s => s.name);

  // Calculate weighted averages for metrics (weighted by coverage)
  const totalCoverage = sources.reduce((sum, s) => sum + (s.data.coveragePct ?? 0), 0);
  
  let weightedTop10Pct = 0;
  let weightedHHI = 0;
  let weightedGini = 0;
  let weightedTop1Pct = 0;
  let weightedTop3Pct = 0;
  let weightedContractShare = 0;
  let weightedEoaShare = 0;
  let totalSampleSize = 0;

  for (const source of sources) {
    const weight = totalCoverage > 0 ? (source.data.coveragePct ?? 0) / totalCoverage : 1 / sources.length;
    weightedTop10Pct += (source.data.top10Pct ?? 0) * weight;
    weightedHHI += (source.data.hhi ?? 0) * weight;
    weightedGini += (source.data.gini ?? 0) * weight;
    weightedTop1Pct += (source.data.top1Pct ?? 0) * weight;
    weightedTop3Pct += (source.data.top3Pct ?? 0) * weight;
    weightedContractShare += (source.data.contractSharePct ?? 0) * weight;
    weightedEoaShare += (source.data.eoaSharePct ?? 0) * weight;
    totalSampleSize += source.data.sampleSize ?? 0;
  }

  // Nakamoto coefficient: use maximum (most conservative)
  const nakamotoCoeff = Math.max(...sources.map(s => s.data.nakamotoCoeff ?? 0));

  // Determine cross-validation status
  const top10PctValues = sources.map(s => s.data.top10Pct ?? 0);
  const top10PctVariance = calculateVariance(top10PctValues);
  const top10PctAgreement = top10PctVariance < 5; // Within 5% variance = agreement

  const hhiValues = sources.map(s => s.data.hhi ?? 0);
  const hhiVariance = calculateVariance(hhiValues);
  const hhiAgreement = hhiVariance < 100; // Within 100 HHI points = agreement

  let crossValidationStatus: string;
  if (top10PctAgreement && hhiAgreement && sources.length >= 2) {
    crossValidationStatus = `${sources.length} sources agree`;
  } else if (sources.length >= 2) {
    crossValidationStatus = "data conflict detected";
  } else {
    crossValidationStatus = "single-source";
  }

  return {
    ...primary,
    top10Pct: Number(weightedTop10Pct.toFixed(2)),
    hhi: Number(weightedHHI.toFixed(2)),
    gini: Number(weightedGini.toFixed(4)),
    top1Pct: Number(weightedTop1Pct.toFixed(2)),
    top3Pct: Number(weightedTop3Pct.toFixed(2)),
    contractSharePct: Number(weightedContractShare.toFixed(2)),
    eoaSharePct: Number(weightedEoaShare.toFixed(2)),
    nakamotoCoeff,
    sampleSize: Math.round(totalSampleSize / sources.length),
    source: primarySource.name, // Primary source
    sources: sourceNames,
    crossValidationStatus,
  };
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
}

