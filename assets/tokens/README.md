# Token Assets

This directory contains token icons/logos downloaded from Ethplorer and CoinGecko.

## Directory Structure

**New Structure (Address-Based):**
```
tokens/
  {chainId}/
    {address}/           # Full address (lowercase, no 0x prefix)
      icon.png           # Token icon/logo
      metadata.json      # Token metadata
```

**Example:**
```
tokens/
  1/
    c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2/
      icon.png
      metadata.json
   1f9840a85d5af5bf1d1762f925bdaddc4201f984/
      icon.png
      metadata.json
```

## Benefits of Address-Based Structure

1. ✅ **Organization** - Each token has its own directory
2. ✅ **Scalability** - Easy to add multiple files per token (icon, logo, banner, etc.)
3. ✅ **Clean URLs** - Standard filenames (`icon.png` instead of `WETH_c02aaa39.png`)
4. ✅ **Future-proof** - Can add different sizes/formats without breaking URLs
5. ✅ **No collisions** - Address is unique identifier

## GitHub CDN URLs

Assets are served via GitHub's CDN:
```
https://raw.githubusercontent.com/{owner}/{repo}/{branch}/tokens/{chainId}/{address}/icon.png
```

**Example:**
```
https://raw.githubusercontent.com/Hamid-Ayub/blockchain-assets/main/tokens/1/c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2/icon.png
```

## File Naming

- **Icon**: `icon.png` (or `icon.jpg`, `icon.svg`, etc. based on source)
- **Metadata**: `metadata.json`
- **Future files**: Can add `logo.png`, `banner.png`, `icon-32.png`, etc.

## Metadata Format

Each token directory contains a `metadata.json` file:

```json
{
  "chainId": "eip155:1",
  "address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  "symbol": "WETH",
  "name": "Wrapped Ether",
  "decimals": 18,
  "iconUrl": "https://raw.githubusercontent.com/.../icon.png",
  "source": "https://ethplorer.io/...",
  "downloadedAt": "2024-01-15T10:30:00.000Z"
}
```

## Automation

Assets are automatically downloaded and committed via GitHub Actions when:
- A new token is added via `/api/refreshNow`
- Daily scheduled run (2 AM UTC) to update missing assets

## Manual Download

To manually download assets for a token:

```bash
cd server
node scripts/download-token-assets.js \
  --chainId "eip155:1" \
  --address "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" \
  --symbol "WETH" \
  --output-dir ../assets/tokens
```

This will create:
```
assets/tokens/1/c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2/
  icon.png
  metadata.json
```

## Migration from Old Structure

If you have existing assets in the old format (`{SYMBOL}_{address}.png`), you can migrate them:

```bash
# Example migration script
for file in tokens/1/*.png; do
  # Extract address from filename
  # Move to new structure
done
```

The new structure is automatically used for all new tokens.
