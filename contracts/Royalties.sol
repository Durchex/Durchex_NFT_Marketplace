// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Royalties
 * @dev Smart contract for managing NFT royalty distributions
 * Creators can set royalty percentages and claim earnings
 */
contract Royalties is Ownable, ReentrancyGuard {
    // Constants
    uint256 public constant MAX_ROYALTY_PERCENTAGE = 50; // Max 50% royalties
    uint256 public constant BASIS_POINTS = 10000; // 100% = 10000

    // Structs
    struct RoyaltyInfo {
        address creator;
        uint256 percentage;
        uint256 totalEarned;
        uint256 claimed;
        bool active;
    }

    struct RoyaltyRecord {
        address nftContract;
        uint256 tokenId;
        uint256 amount;
        address buyer;
        uint256 timestamp;
        string transactionType; // "sale", "resale", "auction"
    }

    // Mappings
    mapping(address => mapping(uint256 => RoyaltyInfo)) public royalties;
    mapping(address => mapping(uint256 => RoyaltyRecord[])) public royaltyHistory;
    mapping(address => uint256) public creatorEarnings;
    mapping(address => RoyaltyInfo[]) public creatorRoyalties;

    // State variables
    address public platformWallet;
    uint256 public platformFeePercentage = 250; // 2.5% in basis points

    // Events
    event RoyaltySet(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed creator,
        uint256 percentage
    );

    event RoyaltyPaid(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed creator,
        uint256 amount,
        string transactionType
    );

    event RoyaltyClaimed(
        address indexed creator,
        uint256 amount,
        uint256 timestamp
    );

    event RoyaltyPercentageUpdated(
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 oldPercentage,
        uint256 newPercentage
    );

    event RoyaltyRevokedOrDisabled(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed creator
    );

    // Modifiers
    modifier validPercentage(uint256 _percentage) {
        require(_percentage <= MAX_ROYALTY_PERCENTAGE, "Royalty exceeds max");
        require(_percentage > 0, "Royalty must be greater than 0");
        _;
    }

    modifier onlyCreator(address _nftContract, uint256 _tokenId) {
        require(
            royalties[_nftContract][_tokenId].creator == msg.sender,
            "Only creator can manage royalties"
        );
        _;
    }

    /**
     * @dev Set royalty percentage for an NFT
     * @param _nftContract Address of the NFT contract
     * @param _tokenId Token ID
     * @param _percentage Royalty percentage (1-50)
     */
    function setRoyaltyPercentage(
        address _nftContract,
        uint256 _tokenId,
        uint256 _percentage
    ) external validPercentage(_percentage) {
        require(_nftContract != address(0), "Invalid NFT contract");

        RoyaltyInfo storage royalty = royalties[_nftContract][_tokenId];

        // Update existing or create new
        uint256 oldPercentage = royalty.percentage;
        royalty.creator = msg.sender;
        royalty.percentage = _percentage;
        royalty.active = true;

        // Track creator royalties
        if (oldPercentage == 0) {
            creatorRoyalties[msg.sender].push(royalty);
        }

        emit RoyaltySet(_nftContract, _tokenId, msg.sender, _percentage);
        if (oldPercentage != 0) {
            emit RoyaltyPercentageUpdated(
                _nftContract,
                _tokenId,
                oldPercentage,
                _percentage
            );
        }
    }

    /**
     * @dev Distribute royalties after an NFT sale/resale
     * @param _nftContract Address of the NFT contract
     * @param _tokenId Token ID
     * @param _saleAmount Sale amount in wei
     * @param _transactionType Type of transaction (sale, resale, auction)
     */
    function distributeRoyalties(
        address _nftContract,
        uint256 _tokenId,
        uint256 _saleAmount,
        string memory _transactionType
    ) external nonReentrant {
        require(_saleAmount > 0, "Invalid sale amount");

        RoyaltyInfo storage royalty = royalties[_nftContract][_tokenId];
        require(royalty.active && royalty.creator != address(0), "No royalty set");

        // Calculate royalty and platform fee
        uint256 royaltyAmount = (_saleAmount * royalty.percentage) / 100;
        // platformFee reserved for future use: (_saleAmount * platformFeePercentage) / BASIS_POINTS

        // Update creator earnings
        royalty.totalEarned += royaltyAmount;
        creatorEarnings[royalty.creator] += royaltyAmount;

        // Record transaction
        royaltyHistory[_nftContract][_tokenId].push(
            RoyaltyRecord({
                nftContract: _nftContract,
                tokenId: _tokenId,
                amount: royaltyAmount,
                buyer: msg.sender,
                timestamp: block.timestamp,
                transactionType: _transactionType
            })
        );

        emit RoyaltyPaid(
            _nftContract,
            _tokenId,
            royalty.creator,
            royaltyAmount,
            _transactionType
        );
    }

    /**
     * @dev Claim accumulated royalties
     * @param _minAmount Minimum amount to claim (for batch optimization)
     */
    function claimRoyalties(uint256 _minAmount) external nonReentrant {
        uint256 amount = creatorEarnings[msg.sender];
        require(amount >= _minAmount, "Insufficient earnings to claim");
        require(amount > 0, "No earnings to claim");

        creatorEarnings[msg.sender] = 0;

        // Transfer ETH to creator
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit RoyaltyClaimed(msg.sender, amount, block.timestamp);
    }

    /**
     * @dev Get royalty information for an NFT
     * @param _nftContract Address of the NFT contract
     * @param _tokenId Token ID
     */
    function getRoyalties(address _nftContract, uint256 _tokenId)
        external
        view
        returns (RoyaltyInfo memory)
    {
        return royalties[_nftContract][_tokenId];
    }

    /**
     * @dev Get royalty history for an NFT
     * @param _nftContract Address of the NFT contract
     * @param _tokenId Token ID
     * @param _limit Number of records to fetch
     * @param _offset Pagination offset
     */
    function getRoyaltyHistory(
        address _nftContract,
        uint256 _tokenId,
        uint256 _limit,
        uint256 _offset
    ) external view returns (RoyaltyRecord[] memory) {
        RoyaltyRecord[] storage history = royaltyHistory[_nftContract][_tokenId];
        uint256 total = history.length;

        require(_offset < total, "Offset out of bounds");

        uint256 count = _limit > total - _offset ? total - _offset : _limit;
        RoyaltyRecord[] memory result = new RoyaltyRecord[](count);

        for (uint256 i = 0; i < count; i++) {
            result[i] = history[total - _offset - i - 1]; // Reverse order (newest first)
        }

        return result;
    }

    /**
     * @dev Get creator's total earnings
     * @param _creator Creator address
     */
    function getCreatorEarnings(address _creator)
        external
        view
        returns (uint256)
    {
        return creatorEarnings[_creator];
    }

    /**
     * @dev Get creator's royalty info for their NFTs
     * @param _creator Creator address
     */
    function getCreatorRoyalties(address _creator)
        external
        view
        returns (RoyaltyInfo[] memory)
    {
        return creatorRoyalties[_creator];
    }

    /**
     * @dev Update platform fee (owner only)
     * @param _newFeePercentage New platform fee in basis points
     */
    function updatePlatformFee(uint256 _newFeePercentage)
        external
        onlyOwner
    {
        require(_newFeePercentage <= 1000, "Fee too high"); // Max 10%
        platformFeePercentage = _newFeePercentage;
    }

    /**
     * @dev Set platform wallet address
     * @param _wallet New wallet address
     */
    function setPlatformWallet(address _wallet) external onlyOwner {
        require(_wallet != address(0), "Invalid address");
        platformWallet = _wallet;
    }

    /**
     * @dev Disable royalties for an NFT
     * @param _nftContract Address of the NFT contract
     * @param _tokenId Token ID
     */
    function disableRoyalty(address _nftContract, uint256 _tokenId)
        external
        onlyCreator(_nftContract, _tokenId)
    {
        royalties[_nftContract][_tokenId].active = false;
        emit RoyaltyRevokedOrDisabled(
            _nftContract,
            _tokenId,
            msg.sender
        );
    }

    /**
     * @dev Calculate royalty amount for a given sale price
     * @param _nftContract Address of the NFT contract
     * @param _tokenId Token ID
     * @param _saleAmount Sale amount
     */
    function calculateRoyalty(
        address _nftContract,
        uint256 _tokenId,
        uint256 _saleAmount
    ) external view returns (uint256) {
        RoyaltyInfo memory royalty = royalties[_nftContract][_tokenId];
        if (!royalty.active) return 0;
        return (_saleAmount * royalty.percentage) / 100;
    }

    /**
     * @dev Fallback function to receive ETH
     */
    receive() external payable {}
}
