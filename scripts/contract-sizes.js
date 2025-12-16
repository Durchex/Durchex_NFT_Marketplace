#!/usr/bin/env node

import fs from "fs";
import path from "path";

function getContractSize(contractName) {
  const artifactPath = path.join("artifacts", "contracts", contractName + ".sol", contractName + ".json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const bytecode = artifact.bytecode;
    const deployedBytecode = artifact.deployedBytecode;
    console.log(`${contractName}:`);
    console.log(`  Bytecode size: ${(bytecode.length / 2 - 1)} bytes`);
    console.log(`  Deployed bytecode size: ${(deployedBytecode.length / 2 - 1)} bytes`);
    console.log(`  Estimated gas for deployment: ~${Math.ceil((bytecode.length / 2 - 1) / 32) * 200} gas`);
    console.log("");
  } else {
    console.log(`Artifact not found: ${artifactPath}`);
  }
}

console.log("📊 Contract Size Analysis");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
getContractSize("NFTMarketplace");
getContractSize("VendorNFT");