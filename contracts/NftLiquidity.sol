// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/INftPieces.sol";
import "./interfaces/INftLiquidity.sol";

/**
 * @title NftLiquidity
 * @dev On-chain liquidity for NFT pieces: buy/sell, platform fee, EIP-2981 royalty.
 *     All trades and price movement on-chain so creators can list from any marketplace or bridge.
 */
contract NftLiquidity is INftLiquidity, Ownable, ReentrancyGuard, Pausable {
    INftPieces public immutable piecesContract;

    uint256 public constant BPS = 10000;
    uint256 public platformFeeBps = 250; // 2.5%
    address payable public platformFeeReceiver;
    uint256 public reserveRetentionBps = 1000; // 10% of (sale - fee - royalty) retained as reserve to pay sellers

    /// @dev Price moves with trading (marketplace-style): each piece bought increases next price, each piece sold decreases it.
    uint256 public priceIncreaseBpsPerPiece = 50;  // 0.5% per piece when buying (e.g. 50 = 0.5%)
    uint256 public priceDecreaseBpsPerPiece = 50;   // 0.5% per piece when selling
    uint256 public constant MIN_PRICE_WEI = 1;

    mapping(uint256 => PoolInfo) private _pools;
    uint256[] private _activePieceIds;

    bytes32 private constant TRADE_TYPE_PRIMARY_BUY = keccak256("primary_buy");
    bytes32 private constant TRADE_TYPE_SECONDARY_BUY = keccak256("secondary_buy");
    bytes32 private constant TRADE_TYPE_SELL = keccak256("sell");

    constructor(address _piecesContract, address payable _platformFeeReceiver) {
        require(_piecesContract != address(0), "Invalid pieces contract");
        require(_platformFeeReceiver != address(0), "Invalid fee receiver");
        piecesContract = INftPieces(_piecesContract);
        platformFeeReceiver = _platformFeeReceiver;
    }

    function setPlatformFeeBps(uint256 bps) external onlyOwner {
        require(bps <= 2000, "Fee too high"); // max 20%
        platformFeeBps = bps;
    }

    function setPlatformFeeReceiver(address payable receiver) external onlyOwner {
        require(receiver != address(0), "Invalid receiver");
        platformFeeReceiver = receiver;
    }

    function setReserveRetentionBps(uint256 bps) external onlyOwner {
        require(bps <= 5000, "Retention too high"); // max 50%
        reserveRetentionBps = bps;
    }

    /// @dev Set how much the pool price moves per piece traded (marketplace-style price discovery). Max 5% per piece.
    function setPriceMovementBps(uint256 increasePerPiece, uint256 decreasePerPiece) external onlyOwner {
        require(increasePerPiece <= 500, "Increase too high"); // max 5% per piece
        require(decreasePerPiece <= 500, "Decrease too high");
        priceIncreaseBpsPerPiece = increasePerPiece;
        priceDecreaseBpsPerPiece = decreasePerPiece;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Create pool: register pieces (minted to this contract) and list at price.
     *      Creator must have approved this contract on the pieces contract if pieces pre-exist;
     *      otherwise we call registerAndMint which mints to this contract.
     */
    function createPool(
        address nftContract,
        uint256 nftTokenId,
        uint256 totalPieces,
        uint256 buyPricePerPiece,
        uint256 sellPricePerPiece,
        uint256 initialReserve
    ) external payable override whenNotPaused nonReentrant returns (uint256 pieceId) {
        require(nftContract != address(0), "Invalid nft contract");
        require(totalPieces > 0, "Invalid total pieces");
        require(buyPricePerPiece > 0, "Invalid buy price");
        require(sellPricePerPiece > 0 && sellPricePerPiece <= buyPricePerPiece, "Invalid sell price");
        require(msg.value >= initialReserve, "Insufficient initial reserve");

        require(piecesContract.getPieceId(nftContract, nftTokenId) == 0, "NFT pieces already registered");
        pieceId = piecesContract.registerAndMint(nftContract, nftTokenId, msg.sender, totalPieces);

        PoolInfo storage pool = _pools[pieceId];
        require(!pool.active, "Pool already exists");

        pool.nftContract = nftContract;
        pool.nftTokenId = nftTokenId;
        pool.pieceId = pieceId;
        pool.creator = msg.sender;
        pool.totalPieces = totalPieces;
        pool.piecesInPool = totalPieces;
        pool.reserveBalance = initialReserve;
        pool.buyPricePerPiece = buyPricePerPiece;
        pool.sellPricePerPiece = sellPricePerPiece;
        pool.active = true;

        _activePieceIds.push(pieceId);
        emit PoolCreated(pieceId, nftContract, nftTokenId, msg.sender, totalPieces, buyPricePerPiece, sellPricePerPiece);
        return pieceId;
    }

    /**
     * @dev Buy pieces with ETH. Fee + royalty sent out; rest to creator (minus reserve retention).
     */
    function buyPieces(uint256 pieceId, uint256 quantity) external payable override whenNotPaused nonReentrant {
        PoolInfo storage pool = _pools[pieceId];
        require(pool.active, "Pool not active");
        require(pool.piecesInPool >= quantity, "Insufficient pieces");

        uint256 totalCost = pool.buyPricePerPiece * quantity;
        require(msg.value >= totalCost, "Insufficient payment");

        uint256 platformFee = (totalCost * platformFeeBps) / BPS;
        (address royaltyRecipient, uint256 royaltyAmount) = _getRoyalty(pool.nftContract, pool.nftTokenId, totalCost);
        uint256 afterFees = totalCost - platformFee - royaltyAmount;
        uint256 reservePart = (afterFees * reserveRetentionBps) / BPS;
        uint256 creatorAmount = afterFees - reservePart;

        pool.piecesInPool -= quantity;
        pool.reserveBalance += reservePart;

        piecesContract.safeTransferFrom(address(this), msg.sender, pieceId, quantity, "");

        if (platformFee > 0 && platformFeeReceiver != address(0)) {
            (bool ok,) = platformFeeReceiver.call{value: platformFee}("");
            require(ok, "Platform fee transfer failed");
        }
        if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
            (bool ok,) = payable(royaltyRecipient).call{value: royaltyAmount}("");
            require(ok, "Royalty transfer failed");
        }
        if (creatorAmount > 0) {
            (bool ok,) = payable(pool.creator).call{value: creatorAmount}("");
            require(ok, "Creator payment failed");
        }

        if (msg.value > totalCost) {
            (bool ok,) = payable(msg.sender).call{value: msg.value - totalCost}("");
            require(ok, "Refund failed");
        }

        // Marketplace-style: price increases after buys (next buyer pays more)
        uint256 bpsUp = BPS + priceIncreaseBpsPerPiece * quantity;
        pool.buyPricePerPiece = (pool.buyPricePerPiece * bpsUp) / BPS;
        pool.sellPricePerPiece = (pool.sellPricePerPiece * bpsUp) / BPS;
        if (pool.sellPricePerPiece > pool.buyPricePerPiece) {
            pool.sellPricePerPiece = pool.buyPricePerPiece;
        }

        emit Trade(
            pieceId,
            msg.sender,
            pool.creator,
            quantity,
            pool.buyPricePerPiece,
            totalCost,
            platformFee,
            royaltyAmount,
            TRADE_TYPE_PRIMARY_BUY,
            block.timestamp
        );
        emit LiquidityUpdated(
            pieceId,
            pool.reserveBalance,
            pool.piecesInPool,
            pool.buyPricePerPiece,
            pool.sellPricePerPiece,
            block.timestamp
        );
    }

    /**
     * @dev Sell pieces for ETH. Pieces transferred to pool; seller receives (quantity * sellPrice - fee - royalty).
     */
    function sellPieces(uint256 pieceId, uint256 quantity) external override whenNotPaused nonReentrant {
        PoolInfo storage pool = _pools[pieceId];
        require(pool.active, "Pool not active");
        require(piecesContract.balanceOf(msg.sender, pieceId) >= quantity, "Insufficient pieces");

        uint256 totalProceeds = pool.sellPricePerPiece * quantity;
        uint256 platformFee = (totalProceeds * platformFeeBps) / BPS;
        (, uint256 royaltyAmount) = _getRoyalty(pool.nftContract, pool.nftTokenId, totalProceeds);
        uint256 sellerAmount = totalProceeds - platformFee - royaltyAmount;

        require(address(this).balance >= totalProceeds, "Insufficient reserve");
        uint256 executedSellPrice = pool.sellPricePerPiece; // price at which this trade executed (before we update pool)
        pool.piecesInPool += quantity;
        pool.reserveBalance = pool.reserveBalance >= totalProceeds ? pool.reserveBalance - totalProceeds : 0;

        piecesContract.safeTransferFrom(msg.sender, address(this), pieceId, quantity, "");

        if (sellerAmount > 0) {
            (bool ok,) = payable(msg.sender).call{value: sellerAmount}("");
            require(ok, "Seller payment failed");
        }
        if (platformFee > 0 && platformFeeReceiver != address(0)) {
            (bool ok,) = platformFeeReceiver.call{value: platformFee}("");
            require(ok, "Platform fee transfer failed");
        }
        (address royaltyRecipient,) = _getRoyalty(pool.nftContract, pool.nftTokenId, totalProceeds);
        if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
            (bool ok,) = payable(royaltyRecipient).call{value: royaltyAmount}("");
            require(ok, "Royalty transfer failed");
        }

        // Marketplace-style: price decreases after sells (next seller gets less / next buy price lower)
        uint256 bpsDown = priceDecreaseBpsPerPiece * quantity;
        if (bpsDown >= BPS) {
            bpsDown = BPS - 1;
        }
        pool.buyPricePerPiece = (pool.buyPricePerPiece * (BPS - bpsDown)) / BPS;
        pool.sellPricePerPiece = (pool.sellPricePerPiece * (BPS - bpsDown)) / BPS;
        if (pool.buyPricePerPiece < MIN_PRICE_WEI) {
            pool.buyPricePerPiece = MIN_PRICE_WEI;
        }
        if (pool.sellPricePerPiece < MIN_PRICE_WEI) {
            pool.sellPricePerPiece = MIN_PRICE_WEI;
        }
        if (pool.sellPricePerPiece > pool.buyPricePerPiece) {
            pool.sellPricePerPiece = pool.buyPricePerPiece;
        }

        emit Trade(
            pieceId,
            address(0),
            msg.sender,
            quantity,
            executedSellPrice,
            totalProceeds,
            platformFee,
            royaltyAmount,
            TRADE_TYPE_SELL,
            block.timestamp
        );
        emit LiquidityUpdated(
            pieceId,
            pool.reserveBalance,
            pool.piecesInPool,
            pool.buyPricePerPiece,
            pool.sellPricePerPiece,
            block.timestamp
        );
    }

    function getPoolInfo(uint256 pieceId) external view override returns (PoolInfo memory) {
        return _pools[pieceId];
    }

    function getBuyQuote(uint256 pieceId, uint256 quantity) external view override returns (
        uint256 totalCost,
        uint256 platformFee,
        uint256 royaltyAmount,
        address royaltyRecipient
    ) {
        PoolInfo memory pool = _pools[pieceId];
        require(pool.active, "Pool not active");
        totalCost = pool.buyPricePerPiece * quantity;
        platformFee = (totalCost * platformFeeBps) / BPS;
        (royaltyRecipient, royaltyAmount) = _getRoyalty(pool.nftContract, pool.nftTokenId, totalCost);
    }

    function getSellQuote(uint256 pieceId, uint256 quantity) external view override returns (
        uint256 netProceeds,
        uint256 platformFee,
        uint256 royaltyAmount
    ) {
        PoolInfo memory pool = _pools[pieceId];
        require(pool.active, "Pool not active");
        uint256 totalProceeds = pool.sellPricePerPiece * quantity;
        platformFee = (totalProceeds * platformFeeBps) / BPS;
        (, royaltyAmount) = _getRoyalty(pool.nftContract, pool.nftTokenId, totalProceeds);
        netProceeds = totalProceeds - platformFee - royaltyAmount;
    }

    /**
     * @dev EIP-2981: get royalty (receiver, amount) from NFT contract. No revert if not supported.
     */
    function _getRoyalty(address nftContract, uint256 tokenId, uint256 salePrice) internal view returns (address receiver, uint256 amount) {
        (bool ok, bytes memory data) = nftContract.staticcall(
            abi.encodeWithSignature("royaltyInfo(uint256,uint256)", tokenId, salePrice)
        );
        if (ok && data.length >= 64) {
            (receiver, amount) = abi.decode(data, (address, uint256));
        }
    }

    receive() external payable {}
}
