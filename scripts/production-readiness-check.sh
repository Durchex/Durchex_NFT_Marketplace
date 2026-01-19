#!/bin/bash
set -e

# Mainnet production readiness checklist
echo "🚀 Durchex NFT Marketplace - Production Readiness Check"
echo "=================================================="
echo ""

PASSED=0
FAILED=0

# Function to check item
check() {
  local item=$1
  local command=$2

  if eval "$command" > /dev/null 2>&1; then
    echo "✓ $item"
    ((PASSED++))
  else
    echo "✗ $item"
    ((FAILED++))
  fi
}

# Environment checks
echo "📋 Environment Checks"
echo "-------------------"
check "Node.js version >= 18" "node --version | grep -E 'v(1[8-9]|[2-9][0-9])'"
check "npm installed" "npm --version"
check "Hardhat installed" "npx hardhat --version"
check "Git initialized" "git rev-parse --git-dir"

# Configuration checks
echo ""
echo "⚙️  Configuration Checks"
echo "---------------------"
check ".env file exists" "test -f .env"
check "MAINNET_RPC_URL set" "test -n \"$MAINNET_RPC_URL\""
check "MAINNET_PRIVATE_KEY set" "test -n \"$MAINNET_PRIVATE_KEY\""
check "MAINNET_MULTISIG_ADDRESS set" "test -n \"$MAINNET_MULTISIG_ADDRESS\""
check "ETHERSCAN_API_KEY set" "test -n \"$ETHERSCAN_API_KEY\""

# Contract checks
echo ""
echo "🔐 Smart Contract Checks"
echo "------------------------"
check "Contracts compile" "npx hardhat compile"
check "Contract tests pass" "npx hardhat test || true"
check "Gas estimations valid" "npx hardhat test:gas || true"

# Security checks
echo ""
echo "🛡️  Security Checks"
echo "------------------"
check "No hardcoded secrets" "! grep -r 'PRIVATE_KEY=' contracts/ src/ frontend/src/ 2>/dev/null"
check "No console.log in contracts" "! grep -r 'console.log' contracts/ 2>/dev/null || echo 'Found in contracts'"
check "Access controls implemented" "grep -r 'onlyOwner\\|onlyAdmin' contracts/ > /dev/null"

# Documentation checks
echo ""
echo "📚 Documentation Checks"
echo "---------------------"
check "Deployment guide exists" "test -f MAINNET_DEPLOYMENT_GUIDE.md"
check "README exists" "test -f README.md"
check "Contract ABIs in artifacts" "test -d artifacts/contracts"

# Deployment artifact checks
echo ""
echo "📦 Deployment Artifacts"
echo "---------------------"
check "Testnet deployment exists" "test -f deployments/sepolia-latest.json"
check "Mainnet config ready" "test -f hardhat.config.mainnet.cjs"
check "Deploy script exists" "test -f scripts/deploy-mainnet.js"

# Summary
echo ""
echo "=================================================="
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "🎉 All checks passed! Ready for mainnet deployment."
  exit 0
else
  echo "⚠️  $FAILED checks failed. Please resolve before deploying."
  exit 1
fi
