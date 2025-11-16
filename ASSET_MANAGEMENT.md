# Token Asset Management System

## Overview

This system automatically downloads, stores, and serves token icons/logos using GitHub as a CDN. All assets are version-controlled and served via GitHub's CDN for reliability and consistency.

## Architecture

```
┌─────────────────┐
│  Token Added    │
│  (/api/refresh) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Convex Backend │
│  (ingest.ts)    │
└────────┬────────┘
         │
         │ Triggers GitHub Actions
         ▼
┌─────────────────┐
│ GitHub Actions  │
│  Workflow       │
└────────┬────────┘
         │
         │ Downloads from Ethplorer/CoinGecko
         ▼
┌─────────────────┐
│  assets/tokens/ │
│  (GitHub Repo)   │
└────────┬────────┘
         │
         │ Served via GitHub CDN
         ▼
┌─────────────────┐
│  Frontend       │
│  (TokenAvatar)   │
└─────────────────┘
```

## File Structure

```
assets/tokens/
  {chainId}/
    {SYMBOL}_{address}.png    # Token icon
    {address}.json             # Metadata
```

**Example:**
```
assets/tokens/
  1/
    WETH_c02aaa39.png
    c02aaa39.json
```

## GitHub CDN URLs

Assets are served via GitHub's raw content CDN:

```
https://raw.githubusercontent.com/{owner}/{repo}/{branch}/assets/tokens/{chainId}/{filename}
```

**Example:**
```
https://raw.githubusercontent.com/hamid/crypto-evaluation/main/assets/tokens/1/WETH_c02aaa39.png
```

## Benefits

1. ✅ **Version Control** - All assets are tracked in Git
2. ✅ **Reliability** - GitHub CDN is highly available
3. ✅ **Consistency** - Single source of truth for all token icons
4. ✅ **Automation** - No manual asset management needed
5. ✅ **Scalability** - Easy to add new tokens
6. ✅ **Performance** - GitHub CDN is fast and cached globally

## Setup

### 1. GitHub Personal Access Token

Create a token with `repo` scope:
- Go to GitHub Settings → Developer settings → Personal access tokens
- Create token with `repo` scope
- Add as secret: `GITHUB_TOKEN` in repository secrets

### 2. Convex Environment Variables

```bash
npx convex env set GITHUB_TOKEN "your_github_token"
npx convex env set GITHUB_REPO "your-username/crypto-evaluation"
npx convex env set GITHUB_BRANCH "main"
```

### 3. Verify Setup

Add a token and check if the workflow runs:
```bash
curl -X POST "https://your-convex-site/api/refreshNow" \
  -H "Content-Type: application/json" \
  -d '{"chainId": "eip155:1", "address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"}'
```

Check GitHub Actions tab to see the workflow run!

## Workflow Triggers

1. **Automatic** - When token is added via `/api/refreshNow`
2. **Scheduled** - Daily at 2 AM UTC to update missing assets
3. **Manual** - Via GitHub UI or API

## Manual Asset Download

To manually download assets for a token:

```bash
cd server
node scripts/download-token-assets.js \
  --chainId "eip155:1" \
  --address "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" \
  --symbol "WETH" \
  --output-dir ../assets/tokens
```

## Icon Sources

The system tries multiple sources in order:

1. **Ethplorer** - Primary source for Ethereum mainnet tokens
2. **CoinGecko** - Fallback for all chains and tokens

## Database Storage

Icons are stored in the `assets` table with GitHub CDN URLs:

```typescript
{
  iconUrl: "https://raw.githubusercontent.com/.../WETH_c02aaa39.png"
}
```

## Frontend Usage

The `TokenAvatar` component automatically handles:
- GitHub CDN URLs
- Emoji fallbacks
- Error handling
- Multiple sizes (sm, md, lg)

```tsx
<TokenAvatar 
  avatar={token.avatar}  // GitHub CDN URL
  symbol={token.symbol}
  size="md"
/>
```

## Troubleshooting

### Workflow not triggering?

1. Check `GITHUB_TOKEN` is set in Convex environment
2. Verify token has `repo` scope
3. Check GitHub Actions tab for errors

### Icon not downloading?

1. Check Ethplorer/CoinGecko API availability
2. Verify token address is correct
3. Check workflow logs for errors

### Icon not displaying?

1. Verify GitHub CDN URL is accessible
2. Check if file exists in `assets/tokens/` directory
3. Verify `TokenAvatar` component is handling URLs correctly

## Future Enhancements

- [ ] Support for multiple icon sizes (32x32, 64x64, 128x128)
- [ ] Icon optimization (compression, WebP conversion)
- [ ] Fallback to other CDNs if GitHub is unavailable
- [ ] Batch asset updates
- [ ] Asset validation and quality checks

