// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title INftPieces
 * @dev Interface for ERC-1155 style "pieces" of an NFT (fractional ownership on-chain).
 *     Each piece id represents one NFT's edition/supply; balances are per-wallet.
 *     Enables creators to list from any marketplace and bridge — all state on-chain.
 */
interface INftPieces {
    /**
     * @dev Emitted when a pool is registered (creator mints initial supply of pieces).
     */
    event PoolRegistered(
        uint256 indexed pieceId,
        address indexed nftContract,
        uint256 indexed nftTokenId,
        address creator,
        uint256 totalPieces
    );

    /**
     * @dev Returns the piece id for a given NFT (nftContract + nftTokenId).
     *      Returns 0 if not registered.
     */
    function getPieceId(address nftContract, uint256 nftTokenId) external view returns (uint256);

    /**
     * @dev Registers an NFT and mints `totalPieces` to creator. Callable by liquidity contract or owner.
     * @return pieceId The ERC-1155 token id for this NFT's pieces.
     */
    function registerAndMint(
        address nftContract,
        uint256 nftTokenId,
        address creator,
        uint256 totalPieces
    ) external returns (uint256 pieceId);

    /**
     * @dev Balance of pieces (ERC-1155) for account and piece id.
     */
    function balanceOf(address account, uint256 pieceId) external view returns (uint256);

    /**
     * @dev Total supply of a piece id (fixed at mint).
     */
    function totalSupply(uint256 pieceId) external view returns (uint256);

    /**
     * @dev Safe transfer pieces (ERC-1155).
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 pieceId,
        uint256 amount,
        bytes calldata data
    ) external;

    /**
     * @dev Approve liquidity contract (or marketplace) to move pieces.
     */
    function setApprovalForAll(address operator, bool approved) external;

    function isApprovedForAll(address account, address operator) external view returns (bool);
}
