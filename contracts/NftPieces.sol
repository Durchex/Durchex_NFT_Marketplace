// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NftPieces
 * @dev ERC-1155 contract for "pieces" (editions) of NFTs. Each piece id = one NFT's supply.
 *      All ownership and transfers on-chain so creators can list from any marketplace or bridge.
 */
contract NftPieces is ERC1155, Ownable {
    address public liquidityContract;

    uint256 private _nextPieceId = 1;
    mapping(uint256 => address) public pieceIdToNftContract;
    mapping(uint256 => uint256) public pieceIdToNftTokenId;
    mapping(address => mapping(uint256 => uint256)) private _nftToPieceId;
    mapping(uint256 => uint256) private _totalSupplyByPieceId;

    event PoolRegistered(
        uint256 indexed pieceId,
        address indexed nftContract,
        uint256 indexed nftTokenId,
        address creator,
        uint256 totalPieces
    );

    constructor(string memory uri_, address liquidityContract_) ERC1155(uri_) {
        liquidityContract = liquidityContract_;
    }

    function setLiquidityContract(address liquidityContract_) external onlyOwner {
        require(liquidityContract_ != address(0), "Invalid address");
        liquidityContract = liquidityContract_;
    }

    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }

    /**
     * @dev Returns the piece id for (nftContract, nftTokenId). 0 if not registered.
     */
    function getPieceId(address nftContract, uint256 nftTokenId) external view returns (uint256) {
        return _nftToPieceId[nftContract][nftTokenId];
    }

    /**
     * @dev Register NFT and mint totalPieces to caller (liquidity contract). Only liquidity contract.
     */
    function registerAndMint(
        address nftContract,
        uint256 nftTokenId,
        address creator,
        uint256 totalPieces
    ) external returns (uint256 pieceId) {
        require(msg.sender == liquidityContract, "Only liquidity contract");
        require(nftContract != address(0), "Invalid nft contract");
        require(totalPieces > 0, "Invalid total pieces");
        require(_nftToPieceId[nftContract][nftTokenId] == 0, "Already registered");

        pieceId = _nextPieceId++;
        pieceIdToNftContract[pieceId] = nftContract;
        pieceIdToNftTokenId[pieceId] = nftTokenId;
        _nftToPieceId[nftContract][nftTokenId] = pieceId;
        _totalSupplyByPieceId[pieceId] = totalPieces;

        _mint(msg.sender, pieceId, totalPieces, "");
        emit PoolRegistered(pieceId, nftContract, nftTokenId, creator, totalPieces);
        return pieceId;
    }

    /**
     * @dev Total supply of a piece id (fixed at mint).
     */
    function totalSupply(uint256 pieceId) external view returns (uint256) {
        return _totalSupplyByPieceId[pieceId];
    }

    /**
     * @dev Override: track totalSupply. In ERC1155, totalSupply is not standard; we track at mint.
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
