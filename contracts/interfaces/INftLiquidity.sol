// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title INftLiquidity
 * @dev On-chain liquidity for NFT pieces: buy/sell, fees, royalties, market cap.
 *     Pool prices move with trading (marketplace-style): each buy increases next buy/sell price,
 *     each sell decreases them, so the contract behaves like other NFT marketplaces.
 */
interface INftLiquidity {
    struct PoolInfo {
        address nftContract;
        uint256 nftTokenId;
        uint256 pieceId;
        address creator;
        uint256 totalPieces;
        uint256 piecesInPool;       // pieces still in pool (primary supply)
        uint256 reserveBalance;     // ETH held to pay sellers
        uint256 buyPricePerPiece;   // wei per piece (buy)
        uint256 sellPricePerPiece;  // wei per piece (sell, <= buy)
        bool active;
    }

    /**
     * @dev Emitted on every buy/sell — index for market cap, volume, transaction history.
     */
    event Trade(
        uint256 indexed pieceId,
        address indexed buyer,
        address indexed seller,
        uint256 quantity,
        uint256 pricePerPiece,
        uint256 totalAmount,
        uint256 platformFee,
        uint256 royaltyAmount,
        bytes32 tradeType,  // "primary_buy" | "secondary_buy" | "sell"
        uint256 timestamp
    );

    /**
     * @dev Emitted when pool state changes (price, reserve, pieces in pool).
     */
    event LiquidityUpdated(
        uint256 indexed pieceId,
        uint256 newReserveBalance,
        uint256 newPiecesInPool,
        uint256 newBuyPricePerPiece,
        uint256 newSellPricePerPiece,
        uint256 timestamp
    );

    event PoolCreated(
        uint256 indexed pieceId,
        address indexed nftContract,
        uint256 indexed nftTokenId,
        address creator,
        uint256 totalPieces,
        uint256 buyPricePerPiece,
        uint256 sellPricePerPiece
    );

    /**
     * @dev Create pool: register pieces and list at price. Creator must have approved this contract for pieces.
     * @param nftContract Underlying ERC-721 contract
     * @param nftTokenId Underlying token id
     * @param totalPieces Number of pieces (editions)
     * @param buyPricePerPiece Price in wei per piece (buy)
     * @param sellPricePerPiece Price in wei per piece (sell); spread (buy - sell) stays in reserve
     * @param initialReserve Optional ETH to seed reserve so sellers can be paid
     */
    function createPool(
        address nftContract,
        uint256 nftTokenId,
        uint256 totalPieces,
        uint256 buyPricePerPiece,
        uint256 sellPricePerPiece,
        uint256 initialReserve
    ) external payable returns (uint256 pieceId);

    /**
     * @dev Buy pieces with ETH. Platform fee + royalty sent out; rest to creator (primary) or reserve.
     */
    function buyPieces(uint256 pieceId, uint256 quantity) external payable;

    /**
     * @dev Sell pieces for ETH. Pieces transferred to pool; seller receives (quantity * sellPrice - fee - royalty).
     */
    function sellPieces(uint256 pieceId, uint256 quantity) external;

    /**
     * @dev Current buy/sell price and pool state (for UI and other marketplaces).
     */
    function getPoolInfo(uint256 pieceId) external view returns (PoolInfo memory);

    /**
     * @dev Quote for buying: total cost and fee/royalty breakdown.
     */
    function getBuyQuote(uint256 pieceId, uint256 quantity) external view returns (
        uint256 totalCost,
        uint256 platformFee,
        uint256 royaltyAmount,
        address royaltyRecipient
    );

    /**
     * @dev Quote for selling: net proceeds and fee/royalty breakdown.
     */
    function getSellQuote(uint256 pieceId, uint256 quantity) external view returns (
        uint256 netProceeds,
        uint256 platformFee,
        uint256 royaltyAmount
    );
}
