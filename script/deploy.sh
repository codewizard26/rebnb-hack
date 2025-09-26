#!/bin/bash
set -e

# === CONFIG ===
RPC_URL="wss://unichain-sepolia-rpc.publicnode.com"
PRIVATE_KEY="d4163a9ae1d49c4a3d824677ed188fe1a30f5640880008655b04217b7dfdebac"
CHAIN_ID=1301

DEPLOYER=$(cast wallet address $PRIVATE_KEY)

export TOKEN_NAME="AirbnbProperty"
export TOKEN_SYMBOL="ABNB"
export BASE_URI="https://api.rebnb.sumitdhiman.in/metadata/"

echo "🚀 Deploying contracts to unichain (Chain ID: $CHAIN_ID)..."
echo "Deployer address: $DEPLOYER"

# Clean cache
forge clean
rm -rf broadcast/Deploy.s.sol/$CHAIN_ID

# Compile contracts
forge build

# Deploy
forge script script/deploy.s.sol:Deploy \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --legacy \
  --gas-price 15000000000 \
  -vvvv

echo "✅ Deployment broadcast finished"

# Output deployed addresses
LATEST_JSON="broadcast/Deploy.s.sol/$CHAIN_ID/run-latest.json"

if [ -f "$LATEST_JSON" ]; then
  echo ""
  echo "📄 Reading deployed addresses from $LATEST_JSON ..."
  
  TOKENIZED_PROPERTY=$(jq -r '.transactions[] | select(.contractName=="TokenizedProperty") | .contractAddress' "$LATEST_JSON")
  MARKETPLACE=$(jq -r '.transactions[] | select(.contractName=="Marketplace") | .contractAddress' "$LATEST_JSON")

  echo "=========================================="
  echo " Deployed Contracts on unichain chain:"
  echo " - TokenizedProperty: $TOKENIZED_PROPERTY"
  echo " - Marketplace:       $MARKETPLACE"
  echo "=========================================="

  # Save all ABIs dynamically
  mkdir -p abi
  for file in out/**/*.json; do
    contract_name=$(jq -r .contractName "$file")
    if [ "$contract_name" != "null" ]; then
      jq '.abi' "$file" > "abi/${contract_name}.json"
      echo "Saved ABI: abi/${contract_name}.json"
    fi
  done
else
  echo "⚠️ No broadcast JSON found, something went wrong."
fi
