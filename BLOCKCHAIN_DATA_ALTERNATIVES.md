# Blockchain Data Provider Alternatives

This document outlines free alternatives to Covalent API for fetching token holder data across multiple chains.

## Current Implementation

The system now uses **Etherscan family APIs** as the primary source for token holder data, with Covalent as a fallback. This provides better reliability and free tier access.

## Primary Alternative: Etherscan Family APIs

### Overview
Etherscan and its chain-specific variants (Arbiscan, Basescan, Polygonscan, etc.) provide free API access with generous rate limits.

### Supported Chains
- **Ethereum**: `api.etherscan.io` (requires `ETHERSCAN_KEY`)
- **Arbitrum**: `api.arbiscan.io` (requires `ARBISCAN_KEY`)
- **Optimism**: `api-optimistic.etherscan.io` (requires `OPTIMISTIC_ETHERSCAN_KEY`)
- **Base**: `api.basescan.org` (requires `BASESCAN_KEY`)
- **Polygon**: `api.polygonscan.com` (requires `POLYGONSCAN_KEY`)
- **BSC**: `api.bscscan.com` (requires `BSCSCAN_KEY`)
- **Avalanche**: `api.snowtrace.io` (requires `SNOWTRACE_KEY`)
- **Fantom**: `api.ftmscan.com` (requires `FTMSCAN_KEY`)
- **Gnosis**: `api.gnosisscan.io` (requires `GNOSISSCAN_KEY`)

### Free Tier Limits
- **Rate Limit**: 5 calls per second
- **Daily Limit**: 100,000 calls per day
- **No Credit Card Required**: Free tier is available without payment

### API Endpoints Used
- `tokenholderlist`: Fetches list of token holders
- `tokeninfo`: Fetches token metadata (name, symbol, total supply, decimals)

### Getting API Keys
1. Visit the chain-specific explorer (e.g., etherscan.io, arbiscan.io)
2. Create a free account
3. Navigate to API section
4. Generate a free API key
5. Add to `.env.local` as `{CHAIN}SCAN_KEY=your_key_here`

### Implementation
Located in: `server/convex/providers/etherscanHolders.ts`

The provider is automatically used in the multi-source aggregation system (`holdersMultiSource.ts`), which tries Etherscan first, then falls back to Covalent if Etherscan fails.

## Other Free Alternatives

### 1. The Graph Protocol
**Type**: Decentralized indexing protocol  
**Cost**: Free to query (indexers earn rewards)  
**Pros**:
- Decentralized and censorship-resistant
- No API keys required for public subgraphs
- Real-time data indexing
- Community-maintained subgraphs

**Cons**:
- Requires subgraph deployment for custom data
- May need to find or create token holder subgraphs
- Query complexity can be higher

**Best For**: Long-term, decentralized solutions

### 2. Alchemy
**Type**: Blockchain infrastructure provider  
**Cost**: Free tier with limits  
**Pros**:
- Good RPC access
- Some analytics APIs
- Multi-chain support

**Cons**:
- Limited token holder endpoints
- May require paid tier for advanced features

**Best For**: RPC access and basic analytics

### 3. Moralis
**Type**: Web3 development platform  
**Cost**: Free tier available  
**Pros**:
- Easy-to-use APIs
- Good documentation
- Multi-chain support

**Cons**:
- Free tier has strict limits
- Token holder data may be limited

**Best For**: Quick prototyping and development

### 4. QuickNode
**Type**: Blockchain infrastructure  
**Cost**: Free tier available  
**Pros**:
- Fast RPC access
- Multi-chain support
- Good performance

**Cons**:
- Limited analytics APIs
- Token holder data not primary focus

**Best For**: RPC access and basic queries

### 5. Bitquery
**Type**: Blockchain data analytics  
**Cost**: Free tier with limits  
**Pros**:
- GraphQL API
- Good for complex queries
- Multi-chain support

**Cons**:
- Learning curve for GraphQL
- Free tier may be restrictive

**Best For**: Complex analytics queries

## Recommendation

**Use Etherscan Family APIs** as the primary source because:
1. ✅ Free tier with generous limits (100k calls/day)
2. ✅ No credit card required
3. ✅ Supports all major EVM chains
4. ✅ Reliable and well-maintained
5. ✅ Already integrated in the codebase
6. ✅ Provides token metadata along with holder data

The system is configured to:
1. Try Etherscan first (primary)
2. Fall back to Covalent if Etherscan fails
3. Use Ethplorer for Ethereum mainnet (if available)

This multi-source approach ensures reliability and redundancy.

## Migration Notes

If Covalent becomes unavailable:
- The system will automatically use Etherscan as the primary source
- No code changes needed (already implemented)
- Just ensure API keys are set in `.env.local`
- Covalent can remain as a fallback if you have an API key

## Environment Variables

Add these to `server/.env.local`:

```bash
# Required for token holders (free tier)
ETHERSCAN_KEY=your_etherscan_key
ARBISCAN_KEY=your_arbiscan_key
OPTIMISTIC_ETHERSCAN_KEY=your_optimistic_etherscan_key
BASESCAN_KEY=your_basescan_key
POLYGONSCAN_KEY=your_polygonscan_key

# Optional for additional chains
BSCSCAN_KEY=your_bscscan_key
SNOWTRACE_KEY=your_snowtrace_key
FTMSCAN_KEY=your_ftmscan_key
GNOSISSCAN_KEY=your_gnosisscan_key

# Optional fallback (if Covalent is accessible)
COVALENT_API_KEY=your_covalent_key
```

## Testing

Test the Etherscan provider:

```bash
# Test Ethereum token holders
curl "https://nautical-rat-318.convex.site/api/score?chainId=eip155:1&address=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"

# Test Arbitrum token holders
curl "https://nautical-rat-318.convex.site/api/score?chainId=eip155:42161&address=0x..."
```

The system will automatically use Etherscan if available, falling back to other sources as needed.



