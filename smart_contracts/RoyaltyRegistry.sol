// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title RoyaltyRegistry
 * @dev ERC-2981 compliant royalty registry for NFT collections
 * Supports multi-creator royalty splitting with customizable percentages
 */
contract RoyaltyRegistry is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    /**
     * @dev RoyaltySplit structure for multi-creator splits
     */
    struct RoyaltySplit {
        address creator;
        uint256 percentage; // In basis points (1% = 100)
    }

    /**
     * @dev RoyaltyInfo structure for collections
     */
    struct RoyaltyInfo {
        address collectionAddress;
        bool isERC721;
        bool isERC1155;
        address paymentToken; // Address for ERC20 payments (address(0) for ETH)
        uint256 royaltyFeeNumerator; // In basis points
        address[] royaltyReceivers;
        RoyaltySplit[] splits;
        bool enabled;
        uint256 createdAt;
    }

    /**
     * @dev RoyaltyRecord for tracking paid royalties
     */
    struct RoyaltyRecord {
        uint256 tokenId;
        address collectionAddress;
        uint256 salePrice;
        uint256 royaltyAmount;
        address seller;
        address buyer;
        address paymentToken;
        uint256 timestamp;
        bool settled;
    }

    /**
     * @dev CreatorStats for tracking creator earnings
     */
    struct CreatorStats {
        address creator;
        uint256 totalEarnings;
        uint256 totalEarningsETH;
        uint256 totalRoyaltyCount;
        uint256 totalReferred;
        uint256 lastPaymentTime;
        uint256 pendingAmount;
        bool verified;
    }

    // Mapping from collection address to royalty info
    mapping(address => RoyaltyInfo) public royaltyInfos;

    // Mapping from collection address to token ID to royalty records
    mapping(address => mapping(uint256 => RoyaltyRecord[])) public royaltyHistory;

    // Mapping from creator address to stats
    mapping(address => CreatorStats) public creatorStats;

    // Mapping from creator address to pending balances by token
    mapping(address => mapping(address => uint256)) public pendingBalances;

    // Track all collections
    address[] public allCollections;

    // Track all creators
    address[] public allCreators;

    // Admin addresses for verification
    mapping(address => bool) public adminAddresses;

    // Events
    event RoyaltyRegistered(
        address indexed collectionAddress,
        uint256 royaltyFeeNumerator,
        address[] royaltyReceivers
    );

    event RoyaltyUpdated(
        address indexed collectionAddress,
        uint256 newRoyaltyFeeNumerator
    );

    event RoyaltyPaid(
        address indexed collectionAddress,
        uint256 indexed tokenId,
        uint256 salePrice,
        uint256 royaltyAmount,
        address[] receivers,
        uint256[] amounts
    );

    event RoyaltyWithdrawn(
        address indexed creator,
        address indexed token,
        uint256 amount
    );

    event CreatorVerified(address indexed creator);
    event CreatorUnverified(address indexed creator);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    constructor() {
        adminAddresses[msg.sender] = true;
    }

    /**
     * @dev Register collection for royalty tracking
     */
    function registerCollection(
        address collectionAddress,
        uint256 royaltyFeeNumerator,
        address[] calldata royaltyReceivers,
        uint256[] calldata percentages,
        bool isERC721
    ) external onlyOwner {
        require(collectionAddress != address(0), "Invalid collection address");
        require(royaltyFeeNumerator <= 10000, "Fee cannot exceed 100%");
        require(royaltyReceivers.length > 0, "Must have at least one receiver");
        require(royaltyReceivers.length == percentages.length, "Array length mismatch");

        // Verify percentages sum to 10000 (100%)
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < percentages.length; i++) {
            require(percentages[i] > 0, "Percentage must be > 0");
            totalPercentage += percentages[i];
        }
        require(totalPercentage == 10000, "Percentages must sum to 100%");

        RoyaltyInfo storage info = royaltyInfos[collectionAddress];
        info.collectionAddress = collectionAddress;
        info.isERC721 = isERC721;
        info.isERC1155 = !isERC721;
        info.royaltyFeeNumerator = royaltyFeeNumerator;
        info.royaltyReceivers = royaltyReceivers;
        info.enabled = true;
        info.createdAt = block.timestamp;
        info.paymentToken = address(0); // Default to ETH

        // Set up royalty splits
        delete info.splits;
        for (uint256 i = 0; i < royaltyReceivers.length; i++) {
            info.splits.push(
                RoyaltySplit({
                    creator: royaltyReceivers[i],
                    percentage: percentages[i]
                })
            );

            // Initialize creator stats
            if (creatorStats[royaltyReceivers[i]].creator == address(0)) {
                creatorStats[royaltyReceivers[i]].creator = royaltyReceivers[i];
                allCreators.push(royaltyReceivers[i]);
            }
        }

        allCollections.push(collectionAddress);

        emit RoyaltyRegistered(
            collectionAddress,
            royaltyFeeNumerator,
            royaltyReceivers
        );
    }

    /**
     * @dev Update royalty fee for collection
     */
    function updateRoyaltyFee(
        address collectionAddress,
        uint256 newRoyaltyFeeNumerator
    ) external onlyOwner {
        require(royaltyInfos[collectionAddress].enabled, "Collection not registered");
        require(newRoyaltyFeeNumerator <= 10000, "Fee cannot exceed 100%");

        royaltyInfos[collectionAddress].royaltyFeeNumerator = newRoyaltyFeeNumerator;

        emit RoyaltyUpdated(collectionAddress, newRoyaltyFeeNumerator);
    }

    /**
     * @dev Update payment token for royalties
     */
    function setPaymentToken(
        address collectionAddress,
        address paymentToken
    ) external onlyOwner {
        require(royaltyInfos[collectionAddress].enabled, "Collection not registered");
        royaltyInfos[collectionAddress].paymentToken = paymentToken;
    }

    /**
     * @dev Record royalty payment (called after sale)
     */
    function recordRoyalty(
        address collectionAddress,
        uint256 tokenId,
        uint256 salePrice,
        address seller,
        address buyer,
        address paymentToken
    ) external onlyOwner nonReentrant {
        RoyaltyInfo storage info = royaltyInfos[collectionAddress];
        require(info.enabled, "Collection not registered");

        // Calculate royalty amount
        uint256 royaltyAmount = (salePrice * info.royaltyFeeNumerator) / 10000;

        // Calculate splits and update pending balances
        uint256[] memory amounts = new uint256[](info.splits.length);
        for (uint256 i = 0; i < info.splits.length; i++) {
            uint256 splitAmount = (royaltyAmount * info.splits[i].percentage) / 10000;
            amounts[i] = splitAmount;

            // Update pending balance
            pendingBalances[info.splits[i].creator][paymentToken] += splitAmount;

            // Update creator stats
            if (paymentToken == address(0)) {
                creatorStats[info.splits[i].creator].totalEarningsETH += splitAmount;
            }
            creatorStats[info.splits[i].creator].totalEarnings += splitAmount;
            creatorStats[info.splits[i].creator].pendingAmount += splitAmount;
        }

        // Record history
        RoyaltyRecord memory record = RoyaltyRecord({
            tokenId: tokenId,
            collectionAddress: collectionAddress,
            salePrice: salePrice,
            royaltyAmount: royaltyAmount,
            seller: seller,
            buyer: buyer,
            paymentToken: paymentToken,
            timestamp: block.timestamp,
            settled: false
        });

        royaltyHistory[collectionAddress][tokenId].push(record);

        // Increment royalty count
        creatorStats[seller].totalRoyaltyCount++;

        emit RoyaltyPaid(
            collectionAddress,
            tokenId,
            salePrice,
            royaltyAmount,
            info.royaltyReceivers,
            amounts
        );
    }

    /**
     * @dev Withdraw pending royalties
     */
    function withdrawRoyalties(
        address token,
        uint256 amount
    ) external nonReentrant {
        require(
            pendingBalances[msg.sender][token] >= amount,
            "Insufficient pending balance"
        );

        pendingBalances[msg.sender][token] -= amount;
        creatorStats[msg.sender].pendingAmount -= amount;
        creatorStats[msg.sender].lastPaymentTime = block.timestamp;

        if (token == address(0)) {
            // ETH transfer
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC20 transfer
            IERC20(token).transfer(msg.sender, amount);
        }

        emit RoyaltyWithdrawn(msg.sender, token, amount);
    }

    /**
     * @dev Get royalty info for collection
     */
    function getRoyaltyInfo(address collectionAddress)
        external
        view
        returns (RoyaltyInfo memory)
    {
        return royaltyInfos[collectionAddress];
    }

    /**
     * @dev Get royalty splits for collection
     */
    function getRoyaltySplits(address collectionAddress)
        external
        view
        returns (RoyaltySplit[] memory)
    {
        return royaltyInfos[collectionAddress].splits;
    }

    /**
     * @dev Calculate royalty amount for sale price
     */
    function calculateRoyalty(
        address collectionAddress,
        uint256 salePrice
    ) external view returns (uint256) {
        require(royaltyInfos[collectionAddress].enabled, "Collection not registered");
        return (salePrice * royaltyInfos[collectionAddress].royaltyFeeNumerator) / 10000;
    }

    /**
     * @dev Get pending balance for creator
     */
    function getPendingBalance(address creator, address token)
        external
        view
        returns (uint256)
    {
        return pendingBalances[creator][token];
    }

    /**
     * @dev Get creator stats
     */
    function getCreatorStats(address creator)
        external
        view
        returns (CreatorStats memory)
    {
        return creatorStats[creator];
    }

    /**
     * @dev Get royalty history for token
     */
    function getRoyaltyHistory(
        address collectionAddress,
        uint256 tokenId
    ) external view returns (RoyaltyRecord[] memory) {
        return royaltyHistory[collectionAddress][tokenId];
    }

    /**
     * @dev Get all registered collections
     */
    function getAllCollections() external view returns (address[] memory) {
        return allCollections;
    }

    /**
     * @dev Get all creators
     */
    function getAllCreators() external view returns (address[] memory) {
        return allCreators;
    }

    /**
     * @dev Verify creator (admin only)
     */
    function verifyCreator(address creator) external {
        require(adminAddresses[msg.sender], "Only admin can verify");
        creatorStats[creator].verified = true;
        emit CreatorVerified(creator);
    }

    /**
     * @dev Unverify creator (admin only)
     */
    function unverifyCreator(address creator) external {
        require(adminAddresses[msg.sender], "Only admin can unverify");
        creatorStats[creator].verified = false;
        emit CreatorUnverified(creator);
    }

    /**
     * @dev Add admin address
     */
    function addAdmin(address admin) external onlyOwner {
        adminAddresses[admin] = true;
        emit AdminAdded(admin);
    }

    /**
     * @dev Remove admin address
     */
    function removeAdmin(address admin) external onlyOwner {
        adminAddresses[admin] = false;
        emit AdminRemoved(admin);
    }

    /**
     * @dev Receive ETH for royalty payments
     */
    receive() external payable {}
}

/**
 * @dev ERC20 interface for token transfers
 */
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}
