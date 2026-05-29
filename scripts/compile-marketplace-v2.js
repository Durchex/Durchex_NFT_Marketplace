#!/usr/bin/env node

/**
 * Compile NFTMarketplaceV2.sol (the EIP-2981-aware secondary marketplace).
 * Same import-resolution trick as compile-lazy-mint.js to keep us off Hardhat.
 */

import solcDefault from "solc";
import fs from "fs";
import path from "path";

const PROJECT_ROOT = process.cwd();
const CONTRACT_PATH = path.join(PROJECT_ROOT, "contracts", "NFTMarketplaceV2.sol");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "frontend", "src", "Context", "NFTMarketplaceV2.json");
const REQUIRED_VERSION = "v0.8.19+commit.7dd6d404";

function loadCompiler() {
  return new Promise((resolve, reject) => {
    solcDefault.loadRemoteVersion(REQUIRED_VERSION, (err, solc) => {
      if (err) reject(err);
      else resolve(solc);
    });
  });
}

function findImport(importPath) {
  let resolvedPath;
  if (importPath.startsWith("@openzeppelin/")) {
    resolvedPath = path.join(PROJECT_ROOT, "node_modules", importPath);
  } else if (importPath.startsWith("./") || importPath.startsWith("../")) {
    resolvedPath = path.join(PROJECT_ROOT, "contracts", importPath);
  } else {
    resolvedPath = path.join(PROJECT_ROOT, "node_modules", importPath);
  }
  try {
    if (fs.existsSync(resolvedPath)) {
      return { contents: fs.readFileSync(resolvedPath, "utf8") };
    }
    return { error: `File not found: ${resolvedPath}` };
  } catch (e) {
    return { error: e.message };
  }
}

async function main() {
  console.log("Loading solc " + REQUIRED_VERSION + "…");
  const solc = await loadCompiler();
  const source = fs.readFileSync(CONTRACT_PATH, "utf8");

  const input = {
    language: "Solidity",
    sources: { "NFTMarketplaceV2.sol": { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
      outputSelection: {
        "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"] }
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImport }));
  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === "error");
    errors.forEach(e => console.error("❌ " + e.formattedMessage));
    if (errors.length > 0) process.exit(1);
  }

  const contract = output.contracts["NFTMarketplaceV2.sol"]["NFTMarketplaceV2"];
  if (!contract) {
    console.error("❌ Contract not found in compilation output");
    process.exit(1);
  }

  const artifact = {
    _format: "hh-sol-artifact-1",
    contractName: "NFTMarketplaceV2",
    sourceName: "contracts/NFTMarketplaceV2.sol",
    abi: contract.abi,
    bytecode: "0x" + contract.evm.bytecode.object,
    deployedBytecode: "0x" + contract.evm.deployedBytecode.object,
    linkReferences: {},
    deployedLinkReferences: {}
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(artifact, null, 2));
  console.log("✅ Compiled artifact saved to: " + OUTPUT_PATH);
  console.log("   ABI entries: " + contract.abi.length);
  console.log("   Bytecode length: " + contract.evm.bytecode.object.length + " chars");
}

main().catch((err) => { console.error(err); process.exit(1); });
