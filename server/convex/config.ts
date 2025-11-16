export const SCORE_WEIGHTS = {
  ownership: 0.30,
  controlRisk: 0.30,
  liquidity: 0.15,
  governance: 0.15,
  chainLevel: 0.05,
  codeAssurance: 0.05,
} as const;

export const CALC_VERSION = "0.4.0";

export const DEFAULT_RATE_LIMIT = {
  windowMs: 60_000,
  limitFree: 30,
  limitPro: 300,
};

export const APP = { jsonldNamespace: "https://w3id.org/chain/" };

