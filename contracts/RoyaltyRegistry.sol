// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title RoyaltyRegistry
 * @dev ERC-2981 compliant royalty registry with multi-creator support
 * Allows collections and individual NFTs to define royalty recipients and percentages
 */
contract RoyaltyRegistry is Ownable, Pausable {
    using EnumerableSet for EnumerableSet.AddressSet;

    /**
     * @dev Royalty recipient info
     */
    struct RoyaltyRecipient {
        address recipient;
        uint256 percentage; // In basis points (100 = 1%)
    }

    /**
     * @dev Collection-level royalty configuration
     */
    struct CollectionRoyalty {
        bool enabled;
        uint256 totalPercentage; // Sum of all recipient percentages
        RoyaltyRecipient[] recipients;
        mapping(address => uint256) recipientIndex;
    }

    /**
     * @dev NFT-level royalty configuration (overrides collection)
     */
    struct NFTRoyalty {
        bool hasCustomRoyalty;
        uint256 totalPercentage;
        RoyaltyRecipient[] recipients;
        mapping(address => uint256) recipientIndex;
    }

    // Collection-level royalties
    mapping(address => CollectionRoyalty) public collectionRoyalties;

    // NFT-level royalties (collection => tokenId => royalty)
    mapping(address => mapping(uint256 => NFTRoyalty)) public nftRoyalties;

    // Tracking all registered collections and creators
    EnumerableSet.AddressSet private registeredCollections;
    mapping(address => EnumerableSet.AddressSet) private collectionCreators;

    // Royalty distribution tracking
    mapping(address => mapping(address => uint256)) public pendingRoyalties; // recipient => collection => amount
    mapping(address => uint256) public totalRoyaltysPaid;

    // Maximum royalty percentage (50% = 5000 basis points)
    uint256 public constant MAX_ROYALTY_PERCENTAGE = 5000;

    // Minimum recipient percentage (0.1% = 10 basis points)
    uint256 public constant MIN_RECIPIENT_PERCENTAGE = 10;

    // Events
    event RoyaltySetForCollection(
        address indexed collection,
        uint256 totalPercentage,
        uint256 recipientCount
    );

    event RoyaltyRecipientAdded(
        address indexed collection,
        address indexed recipient,
        uint256 percentage
    );

    event RoyaltyRecipientRemoved(
        address indexed collection,
        address indexed recipient
    );

    event RoyaltySetForNFT(
        address indexed collection,
        uint256 indexed tokenId,
        uint256 totalPercentage,
        uint256 recipientCount
    );

    event RoyaltyDistributed(
        address indexed collection,
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 amount
    );

    event RoyaltyClaimed(
        address indexed recipient,
        address indexed collection,
        uint256 amount
    );

    event CollectionRegistered(address indexed collection);

    event CollectionUnregistered(address indexed collection);

    /**
     * @dev Register a collection for royalty tracking
     */
    function registerCollection(address _collection) external onlyOwner {
        require(_collection != address(0), "Invalid collection address");
        require(!registeredCollections.contains(_collection), "Collection already registered");

        registeredCollections.add(_collection);
        emit CollectionRegistered(_collection);
    }

    /**
     * @dev Unregister a collection
     */
    function unregisterCollection(address _collection) external onlyOwner {
        require(registeredCollections.contains(_collection), "Collection not registered");
        registeredCollections.remove(_collection);
        emit CollectionUnregistered(_collection);
    }

    /**
     * @dev Set collection-level royalties (creator calls this)
     */
    function setCollectionRoyalty(
        address _collection,
        RoyaltyRecipient[] calldata _recipients
    ) external {
        require(registeredCollections.contains(_collection), "Collection not registered");
        require(msg.sender == owner() || collectionCreators[_collection].contains(msg.sender),
            "Only collection creator or owner");
        require(_recipients.length > 0, "At least one recipient required");
        require(_recipients.length <= 10, "Maximum 10 recipients");

        CollectionRoyalty storage royalty = collectionRoyalties[_collection];
        uint256 totalPercentage = 0;

        // Clear existing recipients
        for (uint256 i = 0; i < royalty.recipients.length; i++) {
            delete royalty.recipientIndex[royalty.recipients[i].recipient];
        }
        delete royalty.recipients;

        // Add new recipients
        for (uint256 i = 0; i < _recipients.length; i++) {
            require(_recipients[i].recipient != address(0), "Invalid recipient");
            require(_recipients[i].percentage >= MIN_RECIPIENT_PERCENTAGE, "Percentage too low");
            require(royalty.recipientIndex[_recipients[i].recipient] == 0, "Duplicate recipient");

            royalty.recipients.push(_recipients[i]);
            royalty.recipientIndex[_recipients[i].recipient] = i + 1;
            totalPercentage += _recipients[i].percentage;
        }

        require(totalPercentage <= MAX_ROYALTY_PERCENTAGE, "Total percentage exceeds maximum");

        royalty.totalPercentage = totalPercentage;
        royalty.enabled = true;

        // Track creator if not already tracking
        if (!collectionCreators[_collection].contains(msg.sender)) {
            collectionCreators[_collection].add(msg.sender);
        }

        emit RoyaltySetForCollection(_collection, totalPercentage, _recipients.length);
    }

    /**
     * @dev Add a recipient to collection royalties
     */
    function addRoyaltyRecipient(
        address _collection,
        address _recipient,
        uint256 _percentage
    ) external {
        require(registeredCollections.contains(_collection), "Collection not registered");
        require(msg.sender == owner() || collectionCreators[_collection].contains(msg.sender),
            "Only collection creator or owner");
        require(_recipient != address(0), "Invalid recipient");
        require(_percentage >= MIN_RECIPIENT_PERCENTAGE, "Percentage too low");

        CollectionRoyalty storage royalty = collectionRoyalties[_collection];
        require(royalty.recipientIndex[_recipient] == 0, "Recipient already exists");
        require(
            royalty.totalPercentage + _percentage <= MAX_ROYALTY_PERCENTAGE,
            "Would exceed maximum royalty"
        );

        royalty.recipients.push(RoyaltyRecipient(_recipient, _percentage));
        royalty.recipientIndex[_recipient] = royalty.recipients.length;
        royalty.totalPercentage += _percentage;

        emit RoyaltyRecipientAdded(_collection, _recipient, _percentage);
    }

    /**
     * @dev Remove a recipient from collection royalties
     */
    function removeRoyaltyRecipient(address _collection, address _recipient) external {
        require(registeredCollections.contains(_collection), "Collection not registered");
        require(msg.sender == owner() || collectionCreators[_collection].contains(msg.sender),
            "Only collection creator or owner");

        CollectionRoyalty storage royalty = collectionRoyalties[_collection];
        uint256 index = royalty.recipientIndex[_recipient];
        require(index > 0, "Recipient not found");

        uint256 actualIndex = index - 1;
        RoyaltyRecipient memory removedRecipient = royalty.recipients[actualIndex];

        // Move last recipient to this position
        if (actualIndex < royalty.recipients.length - 1) {
            royalty.recipients[actualIndex] = royalty.recipients[royalty.recipients.length - 1];
            royalty.recipientIndex[royalty.recipients[actualIndex].recipient] = index;
        }

        royalty.recipients.pop();
        delete royalty.recipientIndex[_recipient];
        royalty.totalPercentage -= removedRecipient.percentage;

        emit RoyaltyRecipientRemoved(_collection, _recipient);
    }

    /**
     * @dev Set NFT-level royalties (overrides collection)
     */
    function setNFTRoyalty(
        address _collection,
        uint256 _tokenId,
        RoyaltyRecipient[] calldata _recipients
    ) external {
        require(registeredCollections.contains(_collection), "Collection not registered");
        require(msg.sender == owner() || collectionCreators[_collection].contains(msg.sender),
            "Only collection creator or owner");
        require(_recipients.length > 0 && _recipients.length <= 10, "Invalid recipient count");

        NFTRoyalty storage nftRoyalty = nftRoyalties[_collection][_tokenId];
        uint256 totalPercentage = 0;

        // Clear existing
        for (uint256 i = 0; i < nftRoyalty.recipients.length; i++) {
            delete nftRoyalty.recipientIndex[nftRoyalty.recipients[i].recipient];
        }
        delete nftRoyalty.recipients;

        // Add new
        for (uint256 i = 0; i < _recipients.length; i++) {
            require(_recipients[i].recipient != address(0), "Invalid recipient");
            require(_recipients[i].percentage >= MIN_RECIPIENT_PERCENTAGE, "Percentage too low");
            require(nftRoyalty.recipientIndex[_recipients[i].recipient] == 0, "Duplicate");

            nftRoyalty.recipients.push(_recipients[i]);
            nftRoyalty.recipientIndex[_recipients[i].recipient] = i + 1;
            totalPercentage += _recipients[i].percentage;
        }

        require(totalPercentage <= MAX_ROYALTY_PERCENTAGE, "Total percentage exceeds maximum");

        nftRoyalty.totalPercentage = totalPercentage;
        nftRoyalty.hasCustomRoyalty = true;

        emit RoyaltySetForNFT(_collection, _tokenId, totalPercentage, _recipients.length);
    }

    /**
     * @dev Calculate royalties for a sale
     */
    function getRoyaltyInfo(
        address _collection,
        uint256 _tokenId,
        uint256 _salePrice
    ) external view returns (address[] memory recipients, uint256[] memory amounts) {
        NFTRoyalty storage nftRoyalty = nftRoyalties[_collection][_tokenId];

        if (nftRoyalty.hasCustomRoyalty) {
            return _calculateRoyalties(nftRoyalty.recipients, _salePrice);
        }

        CollectionRoyalty storage collRoyalty = collectionRoyalties[_collection];
        if (collRoyalty.enabled) {
            return _calculateRoyalties(collRoyalty.recipients, _salePrice);
        }

        // No royalties
        address[] memory emptyRecipients = new address[](0);
        uint256[] memory emptyAmounts = new uint256[](0);
        return (emptyRecipients, emptyAmounts);
    }

    /**
     * @dev Internal function to calculate royalty amounts
     */
    function _calculateRoyalties(
        RoyaltyRecipient[] storage _recipients,
        uint256 _salePrice
    ) internal view returns (address[] memory recipients, uint256[] memory amounts) {
        recipients = new address[](_recipients.length);
        amounts = new uint256[](_recipients.length);

        for (uint256 i = 0; i < _recipients.length; i++) {
            recipients[i] = _recipients[i].recipient;
            amounts[i] = (_salePrice * _recipients[i].percentage) / 10000;
        }

        return (recipients, amounts);
    }

    /**
     * @dev Record royalty distribution (called by marketplace)
     */
    function recordRoyaltyDistribution(
        address _collection,
        uint256 _tokenId,
        address _recipient,
        uint256 _amount
    ) external onlyOwner {
        require(_recipient != address(0), "Invalid recipient");
        require(_amount > 0, "Invalid amount");

        pendingRoyalties[_recipient][_collection] += _amount;
        totalRoyaltysPaid[_collection] += _amount;

        emit RoyaltyDistributed(_collection, _tokenId, _recipient, _amount);
    }

    /**
     * @dev Claim pending royalties
     */
    function claimRoyalties(address _collection) external {
        uint256 amount = pendingRoyalties[msg.sender][_collection];
        require(amount > 0, "No pending royalties");

        pendingRoyalties[msg.sender][_collection] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit RoyaltyClaimed(msg.sender, _collection, amount);
    }

    /**
     * @dev Get collection royalty recipients
     */
    function getCollectionRoyalties(address _collection)
        external
        view
        returns (RoyaltyRecipient[] memory)
    {
        return collectionRoyalties[_collection].recipients;
    }

    /**
     * @dev Get NFT royalty recipients
     */
    function getNFTRoyalties(address _collection, uint256 _tokenId)
        external
        view
        returns (RoyaltyRecipient[] memory)
    {
        return nftRoyalties[_collection][_tokenId].recipients;
    }

    /**
     * @dev Get collection creators
     */
    function getCollectionCreators(address _collection)
        external
        view
        returns (address[] memory)
    {
        return collectionCreators[_collection].values();
    }

    /**
     * @dev Get all registered collections
     */
    function getRegisteredCollections() external view returns (address[] memory) {
        return registeredCollections.values();
    }

    /**
     * @dev Check if collection is registered
     */
    function isCollectionRegistered(address _collection) external view returns (bool) {
        return registeredCollections.contains(_collection);
    }

    /**
     * @dev Get pending royalties for recipient
     */
    function getPendingRoyalties(address _recipient, address _collection)
        external
        view
        returns (uint256)
    {
        return pendingRoyalties[_recipient][_collection];
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Receive ETH
     */
    receive() external payable {}
}
