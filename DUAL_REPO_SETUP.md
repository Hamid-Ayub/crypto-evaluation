# Dual Repository Setup Guide

## Architecture Overview

This system uses **two separate repositories**:

1. **Private Repo** (`crypto-evaluation`) - Contains all code, secrets, and workflows
2. **Public Repo** (`crypto-evaluation-assets`) - Contains only token icons/assets for CDN

```
┌─────────────────────┐
│  Private Repo       │
│  (Code + Workflows) │
└──────────┬──────────┘
           │
           │ GitHub Actions
           │ (runs here)
           ▼
┌─────────────────────┐
│  Public Repo        │
│  (Assets Only)      │
│  → GitHub CDN       │
└─────────────────────┘
```

## Step-by-Step Setup

### 1. Create Public Assets Repository

1. Go to GitHub and create a **new public repository**:
   - Name: `blockchain-assets` (or your preferred name)
   - Visibility: **Public** ✅
   - Initialize with README: Yes

2. Create the directory structure:
   ```bash
   mkdir -p tokens
   echo "# Token Assets" > README.md
   git add .
   git commit -m "Initial commit"
   git push
   ```

### 2. Generate Deploy Key for Public Repo

A deploy key allows the GitHub Action to push to the public repo without exposing your personal token.

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions-assets" -f ~/.ssh/github_assets_deploy_key -N ""

# Display public key (add this to GitHub)
cat ~/.ssh/github_assets_deploy_key.pub
```

**Add to GitHub:**
1. Go to your **public assets repo** → Settings → Deploy keys
2. Click "Add deploy key"
3. Title: `GitHub Actions Asset Uploader`
4. Key: Paste the public key from above
5. ✅ Check "Allow write access"
6. Add key

### 3. Add Secrets to Private Repo

Go to your **private repo** → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `PUBLIC_ASSETS_REPO` | `Hamid-Ayub/blockchain-assets` | Public repo for assets |
| `PUBLIC_ASSETS_BRANCH` | `main` | Branch in public repo |
| `PUBLIC_ASSETS_DEPLOY_KEY` | `(private key content)` | SSH private key for deploy key |
| `GITHUB_TOKEN` | `(your PAT)` | Personal Access Token for triggering workflows |
| `PRIVATE_CODE_REPO` | `your-username/crypto-evaluation` | Your private code repo |

**To get the private key:**
```bash
cat ~/.ssh/github_assets_deploy_key
# Copy the entire output (including -----BEGIN and -----END lines)
```

**Important:** When pasting the private key into GitHub Secrets:
- Include the entire key (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)
- No extra spaces or line breaks
- The key should be on multiple lines

### 4. Set Convex Environment Variables

```bash
cd server
npx convex env set PUBLIC_ASSETS_REPO "Hamid-Ayub/blockchain-assets"
npx convex env set PUBLIC_ASSETS_BRANCH "main"
npx convex env set PRIVATE_CODE_REPO "your-username/crypto-evaluation"
npx convex env set GITHUB_TOKEN "your_github_pat_token"
```

### 5. Update Workflow File

The workflow file (`.github/workflows/update-token-assets.yml`) is already configured, but verify:

- ✅ Uses `PUBLIC_ASSETS_REPO` secret
- ✅ Uses SSH deploy key for public repo
- ✅ Pushes to public repo

### 6. Test the Setup

Add a token and verify:

```bash
curl -X POST "https://your-convex-site/api/refreshNow" \
  -H "Content-Type: application/json" \
  -d '{"chainId": "eip155:1", "address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"}'
```

**Check:**
1. ✅ GitHub Actions tab in **private repo** → Workflow runs
2. ✅ Public assets repo → New icon file appears in `tokens/1/`
3. ✅ Icon URL works: `https://raw.githubusercontent.com/Hamid-Ayub/blockchain-assets/main/tokens/1/c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2/icon.png`

## Alternative: Using Personal Access Token (Easier)

If SSH keys are too complex, you can use a PAT instead:

1. **Create a PAT:**
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token (classic)
   - Scopes: Check `public_repo` (or `repo` if you want full access)
   - Generate and copy the token

2. **Add to secrets:**
   - In your **private repo** → Secrets → Add `PUBLIC_ASSETS_DEPLOY_KEY`
   - Value: Your PAT token (not SSH key)

3. **Update workflow** (already done):
   - The workflow will use the PAT if SSH fails
   - Works with HTTPS instead of SSH

**Note:** PAT is simpler but less secure (has broader permissions). Deploy keys are more secure (scoped to one repo).

## Security Considerations

✅ **Private repo** - Contains all code, secrets, workflows
✅ **Public repo** - Only contains assets (no secrets, no code)
✅ **Deploy key** - Scoped to public repo only (can't access private repo)
✅ **Workflow** - Runs in private repo, pushes to public repo

## Troubleshooting

### Workflow fails to push to public repo?

1. **Check deploy key:**
   - Verify it's added to public repo → Settings → Deploy keys
   - Ensure "Allow write access" is checked
   - Verify private key is correctly stored in secrets (entire key, all lines)

2. **Check secrets:**
   ```bash
   # In GitHub Actions logs, verify secrets are set
   echo "Repo: ${{ secrets.PUBLIC_ASSETS_REPO }}"
   ```

3. **Check permissions:**
   - Workflow needs `contents: write` for public repo
   - Deploy key needs write access

4. **Try PAT instead:**
   - If SSH fails, use PAT method (see Alternative above)

### Icon URL not accessible?

1. Verify public repo is actually public
2. Check file path: `tokens/{chainId}/{SYMBOL}_{address}.png`
3. Verify branch name matches `PUBLIC_ASSETS_BRANCH`
4. Check file exists in public repo

### Workflow not triggering?

1. Check `GITHUB_TOKEN` is set in Convex
2. Verify `PRIVATE_CODE_REPO` matches your repo
3. Check GitHub Actions tab for errors
4. Verify workflow file is in `.github/workflows/`

## File Structure

**Private Repo:**
```
crypto-evaluation/
  .github/workflows/
    update-token-assets.yml
  server/
    scripts/
      download-token-assets.js
  assets/tokens/  # Temporary, not committed
```

**Public Repo:**
```
blockchain-assets/
  tokens/
    1/
      c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2/
        icon.png
        metadata.json
      1f9840a85d5af5bf1d1762f925bdaddc4201f984/
        icon.png
        metadata.json
      ...
  README.md
```

**Directory Structure:**
- `tokens/{chainId}/{address}/icon.png` - Token icon
- `tokens/{chainId}/{address}/metadata.json` - Token metadata
- Address is lowercase, no `0x` prefix
- Each token has its own directory for scalability

## Benefits of Dual Repo Architecture

1. ✅ **Security** - Code stays private, assets are public
2. ✅ **Performance** - Public CDN for fast asset delivery
3. ✅ **Separation** - Clear separation of concerns
4. ✅ **Scalability** - Easy to add more assets without exposing code
5. ✅ **Compliance** - Meets security requirements for private codebases

## Quick Reference

**Environment Variables (Convex):**
- `PUBLIC_ASSETS_REPO` - Public repo for assets
- `PUBLIC_ASSETS_BRANCH` - Branch in public repo (usually `main`)
- `PRIVATE_CODE_REPO` - Your private code repo
- `GITHUB_TOKEN` - PAT for triggering workflows

**GitHub Secrets:**
- `PUBLIC_ASSETS_REPO` - Public repo name
- `PUBLIC_ASSETS_BRANCH` - Branch name
- `PUBLIC_ASSETS_DEPLOY_KEY` - SSH private key or PAT
- `GITHUB_TOKEN` - PAT for workflow triggers
