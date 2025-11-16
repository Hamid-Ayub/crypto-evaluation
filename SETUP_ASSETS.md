# Quick Setup Guide: Token Asset Management

## 🚀 Quick Start

### 1. Create GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: `crypto-evaluation-assets`
4. Scopes: Check `repo` (full control of private repositories)
5. Generate and **copy the token** (you won't see it again!)

### 2. Add Token to GitHub Secrets

1. Go to your repository: `Settings → Secrets and variables → Actions`
2. Click "New repository secret"
3. Name: `GITHUB_TOKEN`
4. Value: Paste your token
5. Save

### 3. Set Convex Environment Variables

```bash
cd server
npx convex env set GITHUB_TOKEN "your_github_token_here"
npx convex env set GITHUB_REPO "your-username/crypto-evaluation"  # Update with your repo!
npx convex env set GITHUB_BRANCH "main"
```

### 4. Test It!

Add a token and watch the magic happen:

```bash
curl -X POST "https://your-convex-site/api/refreshNow" \
  -H "Content-Type: application/json" \
  -d '{"chainId": "eip155:1", "address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"}'
```

Then check:
- ✅ GitHub Actions tab → See workflow run
- ✅ `assets/tokens/1/` → See new icon file
- ✅ Database → Icon URL points to GitHub CDN

## 📋 What Happens Automatically

1. **Token Added** → Convex triggers GitHub Actions
2. **Workflow Runs** → Downloads icon from Ethplorer/CoinGecko
3. **Commits to Repo** → Stores in `assets/tokens/{chainId}/`
4. **GitHub CDN** → Serves via `raw.githubusercontent.com`
5. **Frontend** → Displays real token icons! 🎉

## 🔍 Verify Setup

Check if everything is working:

```bash
# 1. Check Convex env vars
npx convex env

# 2. Check GitHub Actions (go to Actions tab in GitHub)

# 3. Check assets directory
ls -la assets/tokens/

# 4. Test icon URL
curl -I "https://raw.githubusercontent.com/your-repo/main/assets/tokens/1/WETH_c02aaa39.png"
```

## 🐛 Troubleshooting

**Workflow not triggering?**
- Check `GITHUB_TOKEN` is set in Convex
- Verify token has `repo` scope
- Check GitHub Actions tab for errors

**Icon not downloading?**
- Check Ethplorer API is accessible
- Verify token address is correct
- Check workflow logs

**Icon not displaying?**
- Verify GitHub CDN URL is accessible
- Check if file exists in repo
- Verify `TokenAvatar` component

## 📚 More Info

See `ASSET_MANAGEMENT.md` for detailed documentation.

