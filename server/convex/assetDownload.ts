import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

const ETHPLORER_BASE = process.env.ETHPLORER_URL || "https://api.ethplorer.io";
const ETHPLORER_KEY = process.env.ETHPLORER_KEY || "freekey";

/**
 * Downloads token icon from Ethplorer or CoinGecko and stores it in Convex file storage
 */
export const downloadAndStoreAsset = internalAction({
  args: {
    chainId: v.string(),
    address: v.string(),
    symbol: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { chainId, address, symbol, iconUrl } = args;

    // If we have an iconUrl from Ethplorer, use it (but convert relative URLs to absolute)
    let imageUrl = iconUrl;
    
    // Ethplorer returns relative URLs, convert to absolute
    if (imageUrl && imageUrl.startsWith("/")) {
      imageUrl = `https://ethplorer.io${imageUrl}`;
    }
    
    // If no iconUrl, try to fetch from Ethplorer (Ethereum mainnet only)
    if (!imageUrl && chainId === "eip155:1") {
      try {
        const response = await fetch(
          `${ETHPLORER_BASE}/getTokenInfo/${address}?apiKey=${ETHPLORER_KEY}`
        );
        if (response.ok) {
          const data = await response.json();
          imageUrl = data.image;
          // Ethplorer returns relative URLs, convert to absolute
          if (imageUrl && imageUrl.startsWith("/")) {
            imageUrl = `https://ethplorer.io${imageUrl}`;
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch from Ethplorer: ${error}`);
      }
    }

    // Fallback to CoinGecko if still no icon
    if (!imageUrl && symbol) {
      try {
        const searchUrl = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(symbol)}`;
        const searchResponse = await fetch(searchUrl);
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.coins && searchData.coins.length > 0) {
            imageUrl = searchData.coins[0].large || searchData.coins[0].thumb;
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch from CoinGecko: ${error}`);
      }
    }

    if (!imageUrl) {
      console.warn(`No icon found for ${address} (${symbol})`);
      return null;
    }

    // Download the image
    try {
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }

      const imageBlob = await imageResponse.blob();
      
      // Store in Convex file storage
      const storageId = await ctx.storage.store(imageBlob);
      const storageUrl = await ctx.storage.getUrl(storageId);

      console.log(`✅ Downloaded and stored asset for ${address}: ${storageUrl}`);

      return {
        storageId,
        url: storageUrl,
        source: imageUrl,
      };
    } catch (error) {
      console.error(`Failed to download/store asset for ${address}:`, error);
      return null;
    }
  },
});

/**
 * Syncs assets to GitHub (backup) - called by scheduled cron
 */
export const syncAssetsToGitHub = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all assets that haven't been synced to GitHub yet
    const unsyncedAssets = await ctx.runQuery(internal.assets.getUnsyncedAssets);

    if (unsyncedAssets.length === 0) {
      console.log("No assets to sync to GitHub");
      return { synced: 0 };
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const PUBLIC_ASSETS_REPO = process.env.PUBLIC_ASSETS_REPO || "Hamid-Ayub/blockchain-assets";
    const PUBLIC_ASSETS_BRANCH = process.env.PUBLIC_ASSETS_BRANCH || "main";

    if (!GITHUB_TOKEN) {
      console.warn("GITHUB_TOKEN not set, skipping GitHub sync");
      return { synced: 0 };
    }

    let syncedCount = 0;

    for (const asset of unsyncedAssets) {
      if (!asset.iconStorageId) {
        continue; // Skip assets without icons
      }

      try {
        // Get the file from Convex storage
        const fileUrl = await ctx.storage.getUrl(asset.iconStorageId);
        const fileResponse = await fetch(fileUrl);
        if (!fileResponse.ok) {
          throw new Error(`Failed to fetch file from storage: ${fileResponse.status}`);
        }

        const fileBlob = await fileResponse.blob();
        const fileBuffer = await fileBlob.arrayBuffer();
        // Convert ArrayBuffer to base64 (browser-compatible)
        const uint8Array = new Uint8Array(fileBuffer);
        let binaryString = "";
        const chunkSize = 8192; // Process in chunks to avoid stack overflow
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.slice(i, i + chunkSize);
          binaryString += String.fromCharCode(...chunk);
        }
        const fileBase64 = btoa(binaryString);

        // Determine file extension
        const contentType = fileBlob.type || "image/png";
        const ext = contentType.includes("svg") ? "svg" : 
                   contentType.includes("webp") ? "webp" : 
                   contentType.includes("jpg") || contentType.includes("jpeg") ? "jpg" : "png";

        const chainIdNum = asset.chainId.replace("eip155:", "");
        const normalizedAddress = asset.address.toLowerCase().replace(/^0x/, "");
        const filePath = `tokens/${chainIdNum}/${normalizedAddress}/icon.${ext}`;

        // Create or update file in GitHub using GitHub API
        const [owner, repo] = PUBLIC_ASSETS_REPO.split("/");
        
        // Check if file exists
        const checkResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
          {
            headers: {
              Authorization: `Bearer ${GITHUB_TOKEN}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        let sha: string | undefined;
        if (checkResponse.ok) {
          const existingFile = await checkResponse.json();
          sha = existingFile.sha;
        }

        // Create or update file
        const putResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${GITHUB_TOKEN}`,
              Accept: "application/vnd.github.v3+json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: `chore: sync token asset [skip ci]\n\nToken: ${asset.address}\nChain: ${asset.chainId}\nSymbol: ${asset.symbol || "N/A"}`,
              content: fileBase64,
              branch: PUBLIC_ASSETS_BRANCH,
              ...(sha ? { sha } : {}),
            }),
          }
        );

        if (putResponse.ok) {
          // Mark as synced
          const githubUrl = `https://raw.githubusercontent.com/${PUBLIC_ASSETS_REPO}/${PUBLIC_ASSETS_BRANCH}/${filePath}`;
          await ctx.runMutation(internal.assets.markAssetSynced, {
            assetId: asset._id,
            githubUrl,
          });
          syncedCount++;
          console.log(`✅ Synced ${asset.address} to GitHub`);
        } else {
          const errorText = await putResponse.text();
          console.error(`Failed to sync ${asset.address}: ${putResponse.status} ${errorText}`);
        }
      } catch (error) {
        console.error(`Error syncing ${asset.address} to GitHub:`, error);
      }
    }

    console.log(`✅ Synced ${syncedCount} assets to GitHub`);
    return { synced: syncedCount };
  },
});

