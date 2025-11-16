export function hhi(shares: number[]) {
  return shares.reduce((acc, s) => acc + s * s, 0);
}

export function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Compute Gini coefficient for a set of values.
 * Returns 0 for perfect equality, 1 for maximum inequality.
 */
export function gini(values: number[]) {
  if (!values || values.length === 0) return 0;
  const filtered = values.filter(v => Number.isFinite(v) && v > 0);
  if (filtered.length === 0) return 0;
  const sorted = filtered.sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  if (sum === 0) return 0;
  const n = sorted.length;
  let cumulative = 0;
  for (let i = 0; i < n; i++) {
    cumulative += (2 * (i + 1) - n - 1) * sorted[i];
  }
  const coefficient = cumulative / (n * sum);
  return clamp(coefficient, 0, 1);
}

