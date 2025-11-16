import { ProviderAdapter, LiquidityInfo } from "./types";
export const defillamaAdapter: ProviderAdapter = {
  name: "defillama",
  async getLiquidityInfo(chainId, address) {
    const info: LiquidityInfo = { asOfBlock: Math.floor(Date.now()/1000), pools: [], cexSharePct: undefined };
    return info;
  },
};

