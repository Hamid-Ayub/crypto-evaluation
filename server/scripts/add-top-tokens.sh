#!/bin/bash

# Script to add top 5 tokens to the system
# Only chainId and address are required - everything else is auto-detected!

API_BASE="https://nautical-rat-318.convex.site"

echo "🚀 Adding top 5 tokens to the system..."
echo "   (Auto-detecting metadata, icons, and all data from blockchain...)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Wrapped Ethereum (WETH) - Ethereum Mainnet
echo ""
echo "1️⃣  Adding WETH (0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2)..."
curl -X POST "${API_BASE}/api/refreshNow" \
  -H "Content-Type: application/json" \
  -d '{
    "chainId": "eip155:1",
    "address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
  }' | python3 -m json.tool
sleep 3

# 2. Uniswap (UNI) - Ethereum Mainnet
echo ""
echo "2️⃣  Adding UNI (0x1f9840a85d5af5bf1d1762f925bdaddc4201f984)..."
curl -X POST "${API_BASE}/api/refreshNow" \
  -H "Content-Type: application/json" \
  -d '{
    "chainId": "eip155:1",
    "address": "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"
  }' | python3 -m json.tool
sleep 3

# 3. Chainlink (LINK) - Ethereum Mainnet
echo ""
echo "3️⃣  Adding LINK (0x514910771af9ca656af84075a2f71ec25a4a644d)..."
curl -X POST "${API_BASE}/api/refreshNow" \
  -H "Content-Type: application/json" \
  -d '{
    "chainId": "eip155:1",
    "address": "0x514910771af9ca656af84075a2f71ec25a4a644d"
  }' | python3 -m json.tool
sleep 3

# 4. Aave (AAVE) - Ethereum Mainnet
echo ""
echo "4️⃣  Adding AAVE (0x7fc66500c84a76ad7e9c93437bfc5ac33e2be7bb)..."
curl -X POST "${API_BASE}/api/refreshNow" \
  -H "Content-Type: application/json" \
  -d '{
    "chainId": "eip155:1",
    "address": "0x7fc66500c84a76ad7e9c93437bfc5ac33e2be7bb"
  }' | python3 -m json.tool
sleep 3

# 5. Maker (MKR) - Ethereum Mainnet
echo ""
echo "5️⃣  Adding MKR (0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2)..."
curl -X POST "${API_BASE}/api/refreshNow" \
  -H "Content-Type: application/json" \
  -d '{
    "chainId": "eip155:1",
    "address": "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2"
  }' | python3 -m json.tool

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Done! All 5 tokens have been added to the system."
echo ""
echo "Check the results:"
echo "  curl '${API_BASE}/api/tokens?pageSize=10' | python3 -m json.tool"
echo ""
echo "Note: Metadata (symbol, name, decimals, icon) was auto-detected from Ethplorer!"
