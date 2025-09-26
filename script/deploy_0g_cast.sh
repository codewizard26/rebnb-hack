#!/usr/bin/env bash
set -euo pipefail

# Usage example:
#   RPC_URL=https://evmrpc-testnet.0g.ai \
#   CHAIN_ID=16601 \
#   PRIVATE_KEY=0xd4163a9ae1d49c4a3d824677ed188fe1a30f5640880008655b04217b7dfdebac \
#   NAME=AirbnbProperty \
#   SYMBOL=ABNB \
#   BASE_URI=https://example.com/metadata/ \
#   PROPERTY_ID=1 \
#   PROPERTY_OWNER=0xd81252d06C67A2f3cF3B377d9Aae5d827f14f3b1 \
#   ./script/deploy_0g_cast.sh

if ! command -v jq &>/dev/null; then
  echo "jq is required. Install with: brew install jq" >&2
  exit 1
fi

: "${RPC_URL:?RPC_URL is required}"
: "${CHAIN_ID:?CHAIN_ID is required}"
: "${PRIVATE_KEY:?PRIVATE_KEY is required}"

NAME=${NAME:-AirbnbProperty}
SYMBOL=${SYMBOL:-ABNB}
BASE_URI=${BASE_URI:-https://example.com/metadata/}

echo "Building artifacts..."
forge build >/dev/null

# Helper: deploy contract using bytecode + ctor args
deploy_contract() {
  local artifact_json=$1
  local ctor_sig=$2
  shift 2
  local ctor_args=("$@")

  local bytecode
  bytecode=$(jq -r '.bytecode.object' "$artifact_json")
  if [[ -z "$bytecode" || "$bytecode" == "null" ]]; then
    echo "Failed to read bytecode from $artifact_json" >&2
    exit 1
  fi
  # strip 0x if present
  bytecode=${bytecode#0x}

  local encoded_args
  if [[ -n "$ctor_sig" ]]; then
    encoded_args=$(cast abi-encode "$ctor_sig" "${ctor_args[@]}")
    encoded_args=${encoded_args#0x}
  else
    encoded_args=""
  fi

  local data="${bytecode}${encoded_args}"

  echo "Sending deployment tx... ($artifact_json)"
  local tx_hash
  tx_hash=$(cast send \
    --rpc-url "$RPC_URL" \
    --chain "$CHAIN_ID" \
    --private-key "$PRIVATE_KEY" \
    --json \
    --create "0x${data}" | jq -r '.transactionHash // .hash')

  if [[ -z "$tx_hash" || "$tx_hash" == "null" ]]; then
    echo "Failed to obtain tx hash for deployment" >&2
    exit 1
  fi

  echo "Waiting for receipt: $tx_hash"
  local contract_addr
  contract_addr=$(cast receipt "$tx_hash" --rpc-url "$RPC_URL" --json | jq -r '.contractAddress')
  if [[ -z "$contract_addr" || "$contract_addr" == "0x0000000000000000000000000000000000000000" ]]; then
    echo "Failed to obtain contract address from receipt" >&2
    exit 1
  fi
  echo "$contract_addr"
}

# Artifacts
TP_ARTIFACT="out/TokenizedProperty.sol/TokenizedProperty.json"
MP_ARTIFACT="out/Marketplace.sol/Marketplace.json"

if [[ ! -f "$TP_ARTIFACT" || ! -f "$MP_ARTIFACT" ]]; then
  echo "Artifacts not found. Run forge build to produce $TP_ARTIFACT and $MP_ARTIFACT" >&2
  exit 1
fi

echo "Deploying TokenizedProperty ..."
TP_ADDR=$(deploy_contract "$TP_ARTIFACT" "constructor(string,string,string)" "$NAME" "$SYMBOL" "$BASE_URI")
echo "✅ TokenizedProperty deployed at: $TP_ADDR"

echo "Deploying Marketplace ..."
MP_ADDR=$(deploy_contract "$MP_ARTIFACT" "constructor(address)" "$TP_ADDR")
echo "✅ Marketplace deployed at: $MP_ADDR"

echo "Linking Marketplace to TokenizedProperty ..."
cast send \
  --rpc-url "$RPC_URL" --chain "$CHAIN_ID" --private-key "$PRIVATE_KEY" \
  "$TP_ADDR" "setMarketplace(address)" "$MP_ADDR" >/dev/null
echo "✅ Marketplace set on TokenizedProperty."

# Optional: Mint a property and fetch its TokenizedPropertyDate
if [[ -n "${PROPERTY_ID:-}" && -n "${PROPERTY_OWNER:-}" ]]; then
  echo "Minting propertyId=$PROPERTY_ID to $PROPERTY_OWNER ..."
  cast send \
    --rpc-url "$RPC_URL" --chain "$CHAIN_ID" --private-key "$PRIVATE_KEY" \
    "$TP_ADDR" "mint(address,uint256)" "$PROPERTY_OWNER" "$PROPERTY_ID" >/dev/null

  echo "Fetching TokenizedPropertyDate for propertyId=$PROPERTY_ID ..."
  DATE_TOKEN_ADDR=$(cast call "$TP_ADDR" "date_token(uint256)(address)" "$PROPERTY_ID" \
    --rpc-url "$RPC_URL")
  echo "✅ TokenizedPropertyDate for propertyId=$PROPERTY_ID: $DATE_TOKEN_ADDR"
fi

echo "🎉 Deployment complete."
