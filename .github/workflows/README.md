# GitHub Actions Workflows

## Token Assets Management

### `update-token-assets.yml`

Automatically downloads and stores token icons/logos in the repository.

**Triggers:**
- Manual dispatch (via GitHub UI or API)
- Repository dispatch event (`token-added`) - triggered when a new token is added via `/api/refreshNow`
- Scheduled daily at 2 AM UTC to update missing assets

**What it does:**
1. Downloads token icon from Ethplorer (or CoinGecko as fallback)
2. Stores it in `assets/tokens/{chainId}/{SYMBOL}_{address}.png`
3. Commits and pushes to the repository
4. Assets are served via GitHub CDN: `https://raw.githubusercontent.com/{repo}/main/assets/tokens/...`

**Setup:**

1. Add GitHub Personal Access Token as secret:
   - Go to Settings → Secrets and variables → Actions
   - Add `GITHUB_TOKEN` with `repo` scope

2. Set environment variables in Convex:
   ```bash
   npx convex env set GITHUB_TOKEN "your_token_here"
   npx convex env set GITHUB_REPO "your-username/crypto-evaluation"
   npx convex env set GITHUB_BRANCH "main"
   ```

3. The workflow will automatically trigger when tokens are added!

**Manual Trigger:**

```bash
gh workflow run update-token-assets.yml \
  -f chainId="eip155:1" \
  -f address="0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" \
  -f symbol="WETH"
```

