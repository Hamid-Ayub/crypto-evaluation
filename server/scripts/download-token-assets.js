#!/usr/bin/env node

/**
 * Downloads token icons/logos from Ethplorer and stores them locally
 * Returns GitHub CDN URLs for the assets
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const ETHPLORER_BASE = process.env.ETHPLORER_URL || 'https://api.ethplorer.io';
const ETHPLORER_KEY = process.env.ETHPLORER_KEY || 'freekey';

// Parse command line arguments
const args = process.argv.slice(2);
function getArg(name, defaultValue = null) {
  const idx = args.indexOf(name);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : defaultValue;
}

const chainId = getArg('--chainId');
const address = getArg('--address');
const symbol = getArg('--symbol', '');
const outputDir = getArg('--output-dir', './assets/tokens');
// Public repo for assets (separate from private code repo)
const publicRepo = getArg('--public-repo') || process.env.PUBLIC_ASSETS_REPO || 'Hamid-Ayub/blockchain-assets';
const publicBranch = getArg('--public-branch') || process.env.PUBLIC_ASSETS_BRANCH || 'main';

if (!chainId || !address) {
  console.error('Usage: node download-token-assets.js --chainId <chainId> --address <address> [--symbol <symbol>] [--output-dir <dir>]');
  process.exit(1);
}

// Normalize address (lowercase, no 0x prefix for filename)
const normalizedAddress = address.toLowerCase().replace(/^0x/, '');
const chainIdNum = chainId.replace('eip155:', '');

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function getTokenInfo(address) {
  try {
    const url = `${ETHPLORER_BASE}/getTokenInfo/${address}?apiKey=${ETHPLORER_KEY}`;
    const data = await fetchJson(url);
    return data;
  } catch (error) {
    console.error(`Failed to fetch token info from Ethplorer: ${error.message}`);
    return null;
  }
}

async function downloadFromCoinGecko(symbol) {
  // CoinGecko API for token images
  try {
    const searchUrl = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(symbol)}`;
    const searchData = await fetchJson(searchUrl);
    
    if (searchData.coins && searchData.coins.length > 0) {
      const coin = searchData.coins[0];
      return {
        small: coin.thumb,
        large: coin.large,
      };
    }
  } catch (error) {
    console.warn(`CoinGecko search failed: ${error.message}`);
  }
  return null;
}

async function main() {
  console.log(`📥 Downloading assets for ${address} on ${chainId}...`);
  
  // Create directory structure: tokens/{chainId}/{address}/
  const chainDir = path.join(outputDir, chainIdNum);
  const tokenDir = path.join(chainDir, normalizedAddress);
  
  if (!fs.existsSync(tokenDir)) {
    fs.mkdirSync(tokenDir, { recursive: true });
  }

  let tokenInfo = null;
  let iconUrl = null;
  let tokenSymbol = symbol;

  // Try Ethplorer first
  if (chainIdNum === '1') {
    tokenInfo = await getTokenInfo(address);
    if (tokenInfo) {
      tokenSymbol = tokenInfo.symbol || symbol;
      iconUrl = tokenInfo.image;
      // Ethplorer returns relative URLs, convert to absolute
      if (iconUrl && iconUrl.startsWith('/')) {
        iconUrl = `https://ethplorer.io${iconUrl}`;
      }
    }
  }

  // Fallback to CoinGecko if Ethplorer doesn't have icon
  if (!iconUrl && tokenSymbol) {
    console.log(`   Trying CoinGecko for ${tokenSymbol}...`);
    const cgData = await downloadFromCoinGecko(tokenSymbol);
    if (cgData) {
      iconUrl = cgData.large || cgData.small;
    }
  }

  if (!iconUrl) {
    console.log(`   ⚠️  No icon found for ${address}`);
    process.exit(0);
  }

  // Determine file extension from URL
  const urlExt = iconUrl.split('.').pop().split('?')[0].toLowerCase();
  const ext = ['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(urlExt) ? urlExt : 'png';
  
  // Use standard filename: icon.png (instead of SYMBOL_address.png)
  const iconFilename = 'icon.' + ext;
  const iconPath = path.join(tokenDir, iconFilename);

  // Download the image
  try {
    console.log(`   Downloading icon from ${iconUrl}...`);
    await downloadImage(iconUrl, iconPath);
    console.log(`   ✅ Saved to ${iconPath}`);
  } catch (error) {
    console.error(`   ❌ Failed to download icon: ${error.message}`);
    process.exit(1);
  }

  // Generate GitHub CDN URL (using public repo)
  // Structure: tokens/{chainId}/{address}/icon.png
  const githubUrl = `https://raw.githubusercontent.com/${publicRepo}/${publicBranch}/tokens/${chainIdNum}/${normalizedAddress}/${iconFilename}`;
  
  console.log(`\n📦 Asset Information:`);
  console.log(`   Local: ${iconPath}`);
  console.log(`   Public Repo: ${publicRepo}`);
  console.log(`   GitHub CDN: ${githubUrl}`);
  console.log(`   Symbol: ${tokenSymbol || 'N/A'}`);
  console.log(`   Name: ${tokenInfo?.name || 'N/A'}`);
  
  // Output for GitHub Actions (using GITHUB_OUTPUT file)
  if (process.env.GITHUB_ACTIONS && process.env.GITHUB_OUTPUT) {
    const outputFile = process.env.GITHUB_OUTPUT;
    const outputs = [
      `has-assets=true`,
      `asset-urls=${githubUrl}`,
      `local-path=${iconPath}`,
    ].join('\n');
    fs.appendFileSync(outputFile, outputs + '\n');
  }

  // Write metadata file in token directory
  const metadata = {
    chainId,
    address,
    symbol: tokenSymbol,
    name: tokenInfo?.name,
    decimals: tokenInfo?.decimals,
    iconUrl: githubUrl,
    localPath: iconPath,
    source: iconUrl,
    downloadedAt: new Date().toISOString(),
  };
  
  const metadataPath = path.join(tokenDir, 'metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`   📄 Metadata saved to ${metadataPath}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

