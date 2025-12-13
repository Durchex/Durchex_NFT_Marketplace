// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract VendorNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // Authorized vendors who can mint NFTs
    mapping(address => bool) public authorizedVendors;

    // Minting fee
    uint256 public mintingFee = 0.001 ether; // 0.001 ETH

    // Events
    event VendorAdded(address indexed vendor);
    event VendorRemoved(address indexed vendor);
    event MintingFeeUpdated(uint256 newFee);

    constructor(address payable _developer) ERC721("VendorNFT", "VNFT") {
        transferOwnership(_developer);
        authorizedVendors[_developer] = true;
    }

    // Modifier to check if caller is authorized vendor
    modifier onlyAuthorizedVendor() {
        require(authorizedVendors[msg.sender] || owner() == msg.sender, "Not authorized to mint");
        _;
    }

    // Add authorized vendor
    function addVendor(address _vendor) external onlyOwner {
        authorizedVendors[_vendor] = true;
        emit VendorAdded(_vendor);
    }

    // Remove authorized vendor
    function removeVendor(address _vendor) external onlyOwner {
        authorizedVendors[_vendor] = false;
        emit VendorRemoved(_vendor);
    }

    // Check if address is authorized vendor
    function isAuthorizedVendor(address _vendor) external view returns (bool) {
        return authorizedVendors[_vendor] || owner() == _vendor;
    }

    // Get all authorized vendors (simplified - returns count)
    function getAllVendors() external view returns (address[] memory) {
        // This is a simplified implementation
        // In production, you'd want to maintain an array of vendors
        address[] memory vendors = new address[](1);
        vendors[0] = owner();
        return vendors;
    }

    // Update minting fee
    function updateMintingFee(uint256 _newFee) external onlyOwner {
        mintingFee = _newFee;
        emit MintingFeeUpdated(_newFee);
    }

    // Get minting fee
    function getMintingFee() external view returns (uint256) {
        return mintingFee;
    }

    // Public mint function - anyone can mint by paying fee
    function publicMint(string memory _tokenURI, address _contractAddress) external payable returns (uint256) {
        require(msg.value >= mintingFee, "Insufficient payment for minting fee");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _mint(msg.sender, tokenId);

        // Note: In a real implementation, you'd set the token URI
        // For now, we'll skip this as it requires additional setup

        return tokenId;
    }

    // Developer mint function - only owner can mint for free
    function devMint(string[] memory _tokenURIs) external onlyOwner {
        for (uint256 i = 0; i < _tokenURIs.length; i++) {
            _tokenIdCounter.increment();
            uint256 tokenId = _tokenIdCounter.current();
            _mint(msg.sender, tokenId);
            // Set token URI if needed
        }
    }

    // Get NFT by ID
    function getNFTById(uint256 _tokenId) external view returns (address owner, string memory tokenURI) {
        require(_exists(_tokenId), "Token does not exist");
        owner = ownerOf(_tokenId);
        tokenURI = ""; // Would return actual URI in full implementation
    }

    // Withdraw funds
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Override tokenURI if needed
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        // Return IPFS or other URI
        return "";
    }

    // Receive function to accept ETH
    receive() external payable {}
}