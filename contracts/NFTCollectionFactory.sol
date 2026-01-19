// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IDurchexNFT {
    function initialize(
        string memory name,
        string memory symbol,
        address owner,
        uint256 royaltyPercentage,
        address royaltyRecipient
    ) external;
}

/**
 * @title NFTCollectionFactory
 * @dev Factory contract for creating ERC-721 collections with standardized deployment
 * @notice Each collection gets its own proxy clone of the template contract
 */
contract NFTCollectionFactory is Ownable, ReentrancyGuard {
    using Clones for address;

    // ============ State Variables ============
    
    address public templateAddress;
    address[] public collections;
    
    mapping(address => CollectionMetadata) public collectionInfo;
    mapping(address => bool) public isValidCollection;

    // ============ Events ============
    
    event CollectionCreated(
        address indexed collectionAddress,
        string name,
        string symbol,
        address indexed creator,
        uint256 timestamp
    );
    
    event TemplateUpdated(address indexed newTemplate);
    event CollectionRegistered(address indexed collection, address indexed creator);

    // ============ Structs ============
    
    struct CollectionMetadata {
        address creator;
        string name;
        string symbol;
        uint256 createdAt;
        uint256 royaltyPercentage;
        address royaltyRecipient;
        bool active;
    }

    // ============ Constructor ============
    
    constructor(address _templateAddress) {
        require(_templateAddress != address(0), "Invalid template");
        templateAddress = _templateAddress;
    }

    // ============ External Functions ============
    
    /**
     * @dev Create a new NFT collection
     * @param name Collection name
     * @param symbol Collection symbol
     * @param royaltyPercentage Royalty percentage (e.g., 250 = 2.5%)
     * @param royaltyRecipient Address to receive royalties
     * @return proxy Address of the new collection contract
     */
    function createCollection(
        string memory name,
        string memory symbol,
        uint256 royaltyPercentage,
        address royaltyRecipient
    ) external nonReentrant returns (address) {
        require(bytes(name).length > 0, "Name required");
        require(bytes(symbol).length > 0, "Symbol required");
        require(royaltyPercentage <= 10000, "Royalty too high"); // Max 100%
        require(royaltyRecipient != address(0), "Invalid royalty recipient");

        // Clone template contract
        address proxy = templateAddress.clone();
        
        // Initialize the cloned contract
        IDurchexNFT(proxy).initialize(
            name,
            symbol,
            msg.sender,
            royaltyPercentage,
            royaltyRecipient
        );

        // Register collection
        collections.push(proxy);
        collectionInfo[proxy] = CollectionMetadata({
            creator: msg.sender,
            name: name,
            symbol: symbol,
            createdAt: block.timestamp,
            royaltyPercentage: royaltyPercentage,
            royaltyRecipient: royaltyRecipient,
            active: true
        });
        
        isValidCollection[proxy] = true;

        emit CollectionCreated(proxy, name, symbol, msg.sender, block.timestamp);
        emit CollectionRegistered(proxy, msg.sender);

        return proxy;
    }

    /**
     * @dev Update the template contract (admin only)
     * @param newTemplate Address of new template contract
     */
    function updateTemplate(address newTemplate) external onlyOwner {
        require(newTemplate != address(0), "Invalid template");
        templateAddress = newTemplate;
        emit TemplateUpdated(newTemplate);
    }

    /**
     * @dev Deactivate a collection (admin only)
     * @param collectionAddress Address of collection to deactivate
     */
    function deactivateCollection(address collectionAddress) external onlyOwner {
        require(isValidCollection[collectionAddress], "Not a valid collection");
        collectionInfo[collectionAddress].active = false;
    }

    /**
     * @dev Reactivate a collection (admin only)
     * @param collectionAddress Address of collection to reactivate
     */
    function reactivateCollection(address collectionAddress) external onlyOwner {
        require(isValidCollection[collectionAddress], "Not a valid collection");
        collectionInfo[collectionAddress].active = true;
    }

    // ============ View Functions ============
    
    /**
     * @dev Get total number of collections created
     */
    function getCollectionCount() external view returns (uint256) {
        return collections.length;
    }

    /**
     * @dev Get collection address by index
     */
    function getCollectionByIndex(uint256 index) external view returns (address) {
        require(index < collections.length, "Index out of bounds");
        return collections[index];
    }

    /**
     * @dev Get all collections (paginated)
     */
    function getCollections(uint256 offset, uint256 limit) 
        external 
        view 
        returns (address[] memory) 
    {
        require(offset < collections.length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > collections.length) {
            end = collections.length;
        }

        address[] memory result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = collections[i];
        }

        return result;
    }

    /**
     * @dev Get collections by creator
     */
    function getCollectionsByCreator(address creator) 
        external 
        view 
        returns (address[] memory) 
    {
        address[] memory result = new address[](collections.length);
        uint256 count = 0;

        for (uint256 i = 0; i < collections.length; i++) {
            if (collectionInfo[collections[i]].creator == creator) {
                result[count] = collections[i];
                count++;
            }
        }

        // Resize array to actual count
        address[] memory final_result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            final_result[i] = result[i];
        }

        return final_result;
    }

    /**
     * @dev Get collection metadata
     */
    function getCollectionMetadata(address collectionAddress) 
        external 
        view 
        returns (CollectionMetadata memory) 
    {
        require(isValidCollection[collectionAddress], "Collection not found");
        return collectionInfo[collectionAddress];
    }

    /**
     * @dev Check if address is a valid collection
     */
    function isCollection(address addr) external view returns (bool) {
        return isValidCollection[addr];
    }
}
