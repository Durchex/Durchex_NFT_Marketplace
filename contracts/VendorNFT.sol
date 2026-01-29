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
    address[] public vendorList;

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
        if (!authorizedVendors[_vendor]) {
            authorizedVendors[_vendor] = true;
            vendorList.push(_vendor);
            emit VendorAdded(_vendor);
        }
    }

    // Remove authorized vendor
    function removeVendor(address _vendor) external onlyOwner {
        if (authorizedVendors[_vendor]) {
            authorizedVendors[_vendor] = false;
            // Remove from vendorList array
            for (uint256 i = 0; i < vendorList.length; i++) {
                if (vendorList[i] == _vendor) {
                    vendorList[i] = vendorList[vendorList.length - 1];
                    vendorList.pop();
                    break;
                }
            }
            emit VendorRemoved(_vendor);
        }
    }

    // Check if address is authorized vendor
    function isAuthorizedVendor(address _vendor) external view returns (bool) {
        return authorizedVendors[_vendor] || owner() == _vendor;
    }

    // Get all authorized vendors
    function getAllVendors() external view returns (address[] memory) {
        return vendorList;
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

    // Vendor mint function - authorized vendors can mint NFTs
    function vendorMint(string memory _tokenURI, address _contractAddress) external onlyAuthorizedVendor returns (uint256) {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _mint(msg.sender, tokenId);

        // Note: In a real implementation, you'd set the token URI
        // For now, we'll skip this as it requires additional setup

        return tokenId;
    }

    // Vendor batch mint function - authorized vendors can mint multiple NFTs
    function vendorBatchMint(string[] memory _tokenURIs) external onlyAuthorizedVendor {
        for (uint256 i = 0; i < _tokenURIs.length; i++) {
            _tokenIdCounter.increment();
            uint256 tokenId = _tokenIdCounter.current();
            _mint(msg.sender, tokenId);
            // Set token URI if needed
        }
    }

    // Get NFT by ID
    function getNFTById(uint256 _tokenId) external view returns (address nftOwner, string memory uri) {
        require(_exists(_tokenId), "Token does not exist");
        nftOwner = ownerOf(_tokenId);
        uri = ""; // Would return actual URI in full implementation
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