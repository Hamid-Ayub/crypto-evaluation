import fetch from "cross-fetch";

const COINGECKO_BASE = process.env.COINGECKO_API_URL ?? "https://api.coingecko.com/api/v3";
const COINGECKO_KEY = process.env.COINGECKO_API_KEY ?? "";

export type MarketDataSnapshot = {
  marketCapUsd: number;
  priceUsd: number;
  volume24hUsd: number;
  timestamp: number;
  source: string;
  sourceUrl?: string;
};

export type LaunchMarketData = {
  launchDate?: number; // Unix timestamp
  initialMarketCapUsd?: number;
  initialPriceUsd?: number;
  source: string;
  sourceUrl?: string;
};

type CoinGeckoCoin = {
  id: string;
  symbol: string;
  name: string;
  market_data?: {
    current_price?: { usd?: number };
    market_cap?: { usd?: number };
    total_volume?: { usd?: number };
  };
  genesis_date?: string; // ISO date string
  ico?: {
    start_date?: string;
    end_date?: string;
  };
};

type CoinGeckoHistoryResponse = {
  market_data?: {
    current_price?: { usd?: number };
    market_cap?: { usd?: number };
    total_volume?: { usd?: number };
  };
  genesis_date?: string;
  ico?: {
    start_date?: string;
    end_date?: string;
  };
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 429) throw new Error("coingecko-rate-limit");
    throw new Error(`coingecko-${res.status}`);
  }
  const body = await res.json();
  return body;
}

/**
 * Find CoinGecko coin ID by contract address and chain
 * @param chainId EIP-155 chain ID
 * @param address Token contract address
 */
async function findCoinId(chainId: string | number, address: string): Promise<string | null> {
  try {
    // Map chain IDs to CoinGecko platform IDs
    const platformMap: Record<number, string> = {
      1: "ethereum",
      10: "optimistic-ethereum",
      137: "polygon-pos",
      42161: "arbitrum-one",
      8453: "base",
      43114: "avalanche",
      56: "binance-smart-chain",
      250: "fantom",
      100: "xdai",
    };

    const numericChain = typeof chainId === "number" 
      ? chainId 
      : parseInt(chainId.replace("eip155:", ""));

    const platform = platformMap[numericChain];
    if (!platform) return null;

    const url = `${COINGECKO_BASE}/coins/${platform}/contract/${address.toLowerCase()}`;
    const params = new URLSearchParams();
    if (COINGECKO_KEY) {
      params.set("x_cg_demo_api_key", COINGECKO_KEY);
    }

    const coin = await fetchJson<CoinGeckoCoin>(`${url}?${params.toString()}`);
    return coin.id || null;
  } catch (error) {
    // Coin not found on CoinGecko
    return null;
  }
}

/**
 * Fetch current market data snapshot from CoinGecko
 * @param chainId EIP-155 chain ID
 * @param address Token contract address
 */
export async function fetchCurrentMarketData(
  chainId: string | number,
  address: string
): Promise<MarketDataSnapshot | null> {
  try {
    const coinId = await findCoinId(chainId, address);
    if (!coinId) return null;

    const url = `${COINGECKO_BASE}/coins/${coinId}`;
    const params = new URLSearchParams({
      localization: "false",
      tickers: "false",
      market_data: "true",
      community_data: "false",
      developer_data: "false",
      sparkline: "false",
    });
    
    if (COINGECKO_KEY) {
      params.set("x_cg_demo_api_key", COINGECKO_KEY);
    }

    const coin = await fetchJson<CoinGeckoCoin>(`${url}?${params.toString()}`);

    const marketData = coin.market_data;
    if (!marketData) return null;

    const marketCapUsd = marketData.market_cap?.usd ?? 0;
    const priceUsd = marketData.current_price?.usd ?? 0;
    const volume24hUsd = marketData.total_volume?.usd ?? 0;

    if (marketCapUsd === 0 && priceUsd === 0) return null;

    return {
      marketCapUsd,
      priceUsd,
      volume24hUsd,
      timestamp: Math.floor(Date.now() / 1000),
      source: "coingecko",
      sourceUrl: `https://www.coingecko.com/en/coins/${coinId}`,
    };
  } catch (error) {
    console.error(`CoinGecko API error for chain ${chainId}, address ${address}:`, error);
    return null;
  }
}

/**
 * Fetch launch market data from CoinGecko
 * Attempts to get historical data from launch date
 * @param chainId EIP-155 chain ID
 * @param address Token contract address
 */
export async function fetchLaunchMarketData(
  chainId: string | number,
  address: string
): Promise<LaunchMarketData | null> {
  try {
    const coinId = await findCoinId(chainId, address);
    if (!coinId) return null;

    // Get coin info to find launch date
    const url = `${COINGECKO_BASE}/coins/${coinId}`;
    const params = new URLSearchParams({
      localization: "false",
      tickers: "false",
      market_data: "false",
      community_data: "false",
      developer_data: "false",
      sparkline: "false",
    });
    
    if (COINGECKO_KEY) {
      params.set("x_cg_demo_api_key", COINGECKO_KEY);
    }

    const coin = await fetchJson<CoinGeckoCoin>(`${url}?${params.toString()}`);

    // Determine launch date
    let launchDate: number | undefined;
    if (coin.genesis_date) {
      launchDate = Math.floor(new Date(coin.genesis_date).getTime() / 1000);
    } else if (coin.ico?.start_date) {
      launchDate = Math.floor(new Date(coin.ico.start_date).getTime() / 1000);
    }

    if (!launchDate) {
      // No launch date available
      return {
        source: "coingecko",
        sourceUrl: `https://www.coingecko.com/en/coins/${coinId}`,
      };
    }

    // Try to get historical market data from launch date
    // Note: CoinGecko free tier may not support historical data
    // This is a placeholder - may need to use paid tier or alternative source
    try {
      const historyUrl = `${COINGECKO_BASE}/coins/${coinId}/history`;
      const historyParams = new URLSearchParams({
        date: new Date(launchDate * 1000).toISOString().split("T")[0], // YYYY-MM-DD
        localization: "false",
      });
      
      if (COINGECKO_KEY) {
        historyParams.set("x_cg_demo_api_key", COINGECKO_KEY);
      }

      const history = await fetchJson<CoinGeckoHistoryResponse>(`${historyUrl}?${historyParams.toString()}`);
      
      const initialMarketCapUsd = history.market_data?.market_cap?.usd;
      const initialPriceUsd = history.market_data?.current_price?.usd;

      return {
        launchDate,
        initialMarketCapUsd,
        initialPriceUsd,
        source: "coingecko",
        sourceUrl: `https://www.coingecko.com/en/coins/${coinId}`,
      };
    } catch {
      // Historical data not available, return launch date only
      return {
        launchDate,
        source: "coingecko",
        sourceUrl: `https://www.coingecko.com/en/coins/${coinId}`,
      };
    }
  } catch (error) {
    console.error(`CoinGecko launch data error for chain ${chainId}, address ${address}:`, error);
    return null;
  }
}

