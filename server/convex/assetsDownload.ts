import { action } from "./_generated/server";

/**
 * Triggers GitHub Actions workflow to download and store token assets
 * Returns GitHub CDN URL for the token icon
 */
export const triggerAssetDownload = action({
  args: {},
  handler: async (ctx, args) => {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO || "Hamid-Ayub/crypto-evaluation";
    const GITHUB_OWNER = GITHUB_REPO.split("/")[0];
    const GITHUB_REPO_NAME = GITHUB_REPO.split("/")[1];

    if (!GITHUB_TOKEN) {
      throw new Error("GITHUB_TOKEN environment variable not set");
    }

    // This would be called from the ingest flow
    // For now, we'll return a function that can be called with token details
    return {
      trigger: async (chainId: string, address: string, symbol?: string) => {
        const response = await fetch(
          `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO_NAME}/dispatches`,
          {
            method: "POST",
            headers: {
              Authorization: `token ${GITHUB_TOKEN}`,
              Accept: "application/vnd.github.v3+json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              event_type: "token-added",
              client_payload: {
                chainId,
                address,
                symbol,
              },
            }),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to trigger workflow: ${response.status} ${error}`);
        }

        // Return the expected GitHub CDN URL
        const normalizedAddress = address.toLowerCase().replace(/^0x/, "");
        const chainIdNum = chainId.replace("eip155:", "");
        const symbolPart = symbol ? `${symbol}_` : "";
        // We'll need to wait for the workflow to complete, but for now return the expected URL
        return `https://raw.githubusercontent.com/${GITHUB_REPO}/main/assets/tokens/${chainIdNum}/${symbolPart}${normalizedAddress.slice(0, 8)}.png`;
      },
    };
  },
});

/**
 * Alternative: Direct download and commit via GitHub API
 * This is more complex but gives immediate feedback
 */
export const downloadAndStoreAsset = action({
  args: {},
  handler: async (ctx, args) => {
    // This would use GitHub API to:
    // 1. Download icon from Ethplorer/CoinGecko
    // 2. Create/update file in assets/tokens/ via GitHub API
    // 3. Return GitHub CDN URL
    // 
    // For now, we'll use the workflow approach which is simpler
    throw new Error("Not implemented - use triggerAssetDownload instead");
  },
});

