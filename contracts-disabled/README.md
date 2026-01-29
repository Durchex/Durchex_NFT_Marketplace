# Contracts excluded from compilation

`Bridge.sol` is here because it depends on `@layerzerolabs/lz-evm-sdk-v1-0.2`, which is not published on npm. Hardhat would fail with:

```
Error HH411: The library @layerzerolabs/lz-evm-sdk-v1-0.2, imported from contracts/Bridge.sol, is not installed.
```

**To compile and deploy LazyMintNFT** (and other contracts that don’t use Bridge), we keep Bridge out of the `contracts/` folder so Hardhat only compiles the rest.

**To re-enable Bridge:**

1. Install the LayerZero SDK (e.g. from [LayerZero-Labs/sdk](https://github.com/LayerZero-Labs/sdk) or the correct npm package for your SDK version).
2. Move `Bridge.sol` back into `contracts/`:
   ```bash
   mv contracts-disabled/Bridge.sol contracts/
   ```
3. Run `npx hardhat compile` again.
