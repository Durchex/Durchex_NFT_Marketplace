// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * Collection Contract
 * Allows users to create and manage NFT collections
 * Groups related NFTs together for discovery and organization
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Collection is Ownable {
    using Counters for Counters.Counter;
    using Strings for uint256;

    // ==================== Data Structures ====================

    struct CollectionMetadata {
        string name;
        string description;
        string imageURI;
        string externalLink;
        address creator;
        uint256 createdAt;
        uint256 updatedAt;
        bool isVerified;
        bool isActive;
    }

    struct NFTInCollection {
        address nftContract;
        uint256 tokenId;
        uint256 addedAt;
    }

    // ==================== State Variables ====================

    Counters.Counter private collectionIds;
    
    mapping(uint256 => CollectionMetadata) public collections;
    mapping(uint256 => NFTInCollection[]) public collectionNFTs;
    mapping(uint256 => mapping(bytes32 => bool)) private nftExists;
    mapping(address => uint256[]) public userCollections;
    mapping(uint256 => uint256) public collectionNFTCount;
    mapping(uint256 => uint256) public collectionFloorPrice;

    // ==================== Events ====================

    event CollectionCreated(
        uint256 indexed collectionId,
        address indexed creator,
        string name,
        uint256 timestamp
    );

    event NFTAddedToCollection(
        uint256 indexed collectionId,
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 timestamp
    );

    event NFTRemovedFromCollection(
        uint256 indexed collectionId,
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 timestamp
    );

    event CollectionMetadataUpdated(
        uint256 indexed collectionId,
        string name,
        uint256 timestamp
    );

    event CollectionDeleted(
        uint256 indexed collectionId,
        uint256 timestamp
    );

    event CollectionVerified(
        uint256 indexed collectionId,
        uint256 timestamp
    );

    // ==================== Collection Management ====================

    /**
     * Create new collection
     */
    function createCollection(
        string memory _name,
        string memory _description,
        string memory _imageURI,
        string memory _externalLink
    ) external returns (uint256) {
        require(bytes(_name).length > 0, "Collection name required");
        require(bytes(_name).length <= 100, "Name too long");

        uint256 collectionId = collectionIds.current();
        collectionIds.increment();

        collections[collectionId] = CollectionMetadata({
            name: _name,
            description: _description,
            imageURI: _imageURI,
            externalLink: _externalLink,
            creator: msg.sender,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            isVerified: false,
            isActive: true
        });

        userCollections[msg.sender].push(collectionId);
        collectionNFTCount[collectionId] = 0;

        emit CollectionCreated(collectionId, msg.sender, _name, block.timestamp);

        return collectionId;
    }

    /**
     * Add NFT to collection
     */
    function addNFTToCollection(
        uint256 _collectionId,
        address _nftContract,
        uint256 _tokenId
    ) external {
        require(_collectionExists(_collectionId), "Collection does not exist");
        require(collections[_collectionId].creator == msg.sender, "Only creator can modify");
        require(collections[_collectionId].isActive, "Collection is inactive");
        require(_nftContract != address(0), "Invalid NFT contract");

        bytes32 nftHash = keccak256(abi.encodePacked(_nftContract, _tokenId));
        require(!nftExists[_collectionId][nftHash], "NFT already in collection");

        collectionNFTs[_collectionId].push(
            NFTInCollection({
                nftContract: _nftContract,
                tokenId: _tokenId,
                addedAt: block.timestamp
            })
        );

        nftExists[_collectionId][nftHash] = true;
        collectionNFTCount[_collectionId]++;

        collections[_collectionId].updatedAt = block.timestamp;

        emit NFTAddedToCollection(_collectionId, _nftContract, _tokenId, block.timestamp);
    }

    /**
     * Remove NFT from collection
     */
    function removeNFTFromCollection(
        uint256 _collectionId,
        address _nftContract,
        uint256 _tokenId
    ) external {
        require(_collectionExists(_collectionId), "Collection does not exist");
        require(collections[_collectionId].creator == msg.sender, "Only creator can modify");

        bytes32 nftHash = keccak256(abi.encodePacked(_nftContract, _tokenId));
        require(nftExists[_collectionId][nftHash], "NFT not in collection");

        NFTInCollection[] storage nfts = collectionNFTs[_collectionId];
        for (uint256 i = 0; i < nfts.length; i++) {
            if (nfts[i].nftContract == _nftContract && nfts[i].tokenId == _tokenId) {
                nfts[i] = nfts[nfts.length - 1];
                nfts.pop();
                break;
            }
        }

        nftExists[_collectionId][nftHash] = false;
        collectionNFTCount[_collectionId]--;

        collections[_collectionId].updatedAt = block.timestamp;

        emit NFTRemovedFromCollection(_collectionId, _nftContract, _tokenId, block.timestamp);
    }

    /**
     * Update collection metadata
     */
    function updateCollectionMetadata(
        uint256 _collectionId,
        string memory _name,
        string memory _description,
        string memory _imageURI,
        string memory _externalLink
    ) external {
        require(_collectionExists(_collectionId), "Collection does not exist");
        require(collections[_collectionId].creator == msg.sender, "Only creator can modify");
        require(bytes(_name).length > 0, "Collection name required");

        collections[_collectionId].name = _name;
        collections[_collectionId].description = _description;
        collections[_collectionId].imageURI = _imageURI;
        collections[_collectionId].externalLink = _externalLink;
        collections[_collectionId].updatedAt = block.timestamp;

        emit CollectionMetadataUpdated(_collectionId, _name, block.timestamp);
    }

    /**
     * Delete collection (only creator, must be empty)
     */
    function deleteCollection(uint256 _collectionId) external {
        require(_collectionExists(_collectionId), "Collection does not exist");
        require(collections[_collectionId].creator == msg.sender, "Only creator can delete");
        require(collectionNFTCount[_collectionId] == 0, "Collection must be empty");

        collections[_collectionId].isActive = false;
        collections[_collectionId].updatedAt = block.timestamp;

        emit CollectionDeleted(_collectionId, block.timestamp);
    }

    /**
     * Verify collection (admin only)
     */
    function verifyCollection(uint256 _collectionId) external onlyOwner {
        require(_collectionExists(_collectionId), "Collection does not exist");

        collections[_collectionId].isVerified = true;
        collections[_collectionId].updatedAt = block.timestamp;

        emit CollectionVerified(_collectionId, block.timestamp);
    }

    // ==================== View Functions ====================

    /**
     * Get collection details
     */
    function getCollection(uint256 _collectionId)
        external
        view
        returns (CollectionMetadata memory)
    {
        require(_collectionExists(_collectionId), "Collection does not exist");
        return collections[_collectionId];
    }

    /**
     * Get collection NFTs
     */
    function getCollectionNFTs(uint256 _collectionId)
        external
        view
        returns (NFTInCollection[] memory)
    {
        require(_collectionExists(_collectionId), "Collection does not exist");
        return collectionNFTs[_collectionId];
    }

    /**
     * Get collection NFT count
     */
    function getNFTCount(uint256 _collectionId) external view returns (uint256) {
        require(_collectionExists(_collectionId), "Collection does not exist");
        return collectionNFTCount[_collectionId];
    }

    /**
     * Get user collections
     */
    function getUserCollections(address _user)
        external
        view
        returns (uint256[] memory)
    {
        return userCollections[_user];
    }

    /**
     * Get total collections
     */
    function getTotalCollections() external view returns (uint256) {
        return collectionIds.current();
    }

    /**
     * Check if NFT is in collection
     */
    function isNFTInCollection(
        uint256 _collectionId,
        address _nftContract,
        uint256 _tokenId
    ) external view returns (bool) {
        bytes32 nftHash = keccak256(abi.encodePacked(_nftContract, _tokenId));
        return nftExists[_collectionId][nftHash];
    }

    // ==================== Internal Functions ====================

    /**
     * Check if collection exists and is active
     */
    function _collectionExists(uint256 _collectionId) internal view returns (bool) {
        return collections[_collectionId].isActive;
    }
}
