// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./NftLiquidity.sol";

/**
 * @title CreatorLiquidity
 * @dev Creator-backed liquidity pool for NFT pieces.
 *
 * This contract simply extends NftLiquidity so you can deploy a dedicated
 * "creator liquidity" contract address per network while reusing the
 * existing pool logic:
 *  - Creator calls createPool(...) to register pieces and seed reserve.
 *  - Buyers call buyPieces(...) to buy pieces from the pool.
 *  - Sellers call sellPieces(...) to sell pieces back to the pool.
 *
 * The "creator wallet = pool" idea is implemented by:
 *  - pool.creator = msg.sender when createPool is called (the NFT creator),
 *  - all ETH flows (buys/sells, fees, royalties) happen via this contract,
 *    which is funded and owned by the creator.
 */
contract CreatorLiquidity is NftLiquidity {
    constructor(address _piecesContract, address payable _platformFeeReceiver)
        NftLiquidity(_piecesContract, _platformFeeReceiver)
    {}
}

