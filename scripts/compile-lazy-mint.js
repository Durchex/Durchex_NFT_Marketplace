#!/usr/bin/env node

/**
 * Compile MultiPieceLazyMintNFT.sol using solc directly.
 * Bypasses hardhat to work around corrupted node_modules state.
 * Resolves @openzeppelin imports from node_modules.
 */

import solcDefault from "solc";
import fs from "fs";
import path from "path";

const PROJECT_ROOT = process.cwd();
const CONTRACT_PATH = path.join(PROJECT_ROOT, "contracts", "MultiPieceLazyMintNFT.sol");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "frontend", "src", "Context", "MultiPieceLazyMintNFT.json");
const REQUIRED_VERSION = "v0.8.20+commit.a1b79de6";

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
  console.log("Loading solc " + REQUIRED_VERSION + " (downloads on first run)...");
  const solc = await loadCompiler();
  console.log("Reading contract source...");
  const source = fs.readFileSync(CONTRACT_PATH, "utf8");

  const input = {
    language: "Solidity",
    sources: {
      "MultiPieceLazyMintNFT.sol": { content: source }
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"]
        }
      }
    }
  };

  console.log("Compiling with solc " + solc.version() + "...");
  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImport }));

  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === "error");
    const warnings = output.errors.filter(e => e.severity === "warning");

    warnings.forEach(w => console.warn("⚠️ " + w.formattedMessage));

    if (errors.length > 0) {
      errors.forEach(e => console.error("❌ " + e.formattedMessage));
      process.exit(1);
    }
  }

  const contract = output.contracts["MultiPieceLazyMintNFT.sol"]["MultiPieceLazyMintNFT"];
  if (!contract) {
    console.error("❌ Contract not found in compilation output");
    process.exit(1);
  }

  const artifact = {
    _format: "hh-sol-artifact-1",
    contractName: "MultiPieceLazyMintNFT",
    sourceName: "contracts/MultiPieceLazyMintNFT.sol",
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

main();
