// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title DurchexNFT
 * @dev Standard ERC-721 contract template with EIP-2981 royalties
 * @notice This is deployed via NFTCollectionFactory as a proxy clone
 */
contract DurchexNFT is 
    ERC721, 
    ERC721Enumerable, 
    ERC721Burnable, 
    ERC2981, 
    Ownable, 
    Initializable 
{
    using Counters for Counters.Counter;

    // ============ State Variables ============
    
    Counters.Counter private _tokenIdCounter;
    
    string private _baseTokenURI;
    
    mapping(uint256 => string) private _tokenURIs;
    mapping(address => bool) public minters;
    
    uint256 public royaltyPercentage;
    address public royaltyRecipient;

    // ============ Events ============
    
    event Minted(address indexed to, uint256 indexed tokenId, string uri);
    event BaseURIUpdated(string newBaseURI);
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);

    // ============ Constructor ============
    
    constructor() ERC721("", "") {
        // Constructor left empty for proxy compatibility
    }

    // ============ Initialization (called once via factory) ============
    
    /**
     * @dev Initialize the contract (called by factory)
     * @param name Collection name
     * @param symbol Collection symbol
     * @param owner Collection owner
     * @param _royaltyPercentage Royalty percentage (e.g., 250 = 2.5%)
     * @param _royaltyRecipient Address to receive royalties
     */
    function initialize(
        string memory name,
        string memory symbol,
        address owner,
        uint256 _royaltyPercentage,
        address _royaltyRecipient
    ) public initializer {
        require(owner != address(0), "Invalid owner");
        require(_royaltyPercentage <= 10000, "Royalty too high");
        require(_royaltyRecipient != address(0), "Invalid royalty recipient");

        // Set ERC721 name and symbol
        ERC721._name = name;
        ERC721._symbol = symbol;
        
        // Transfer ownership to specified owner
        _transferOwnership(owner);
        
        // Set royalty info
        royaltyPercentage = _royaltyPercentage;
        royaltyRecipient = _royaltyRecipient;
        
        _setDefaultRoyalty(_royaltyRecipient, _royaltyPercentage);
        
        // Start token ID counter at 1
        _tokenIdCounter.increment();
        
        // Add owner as initial minter
        minters[owner] = true;
    }

    // ============ Minting Functions ============
    
    /**
     * @dev Mint a new NFT
     * @param to Address to mint to
     * @param uri Metadata URI (IPFS link or other)
     */
    function mint(address to, string memory uri) public onlyMinter returns (uint256) {
        require(to != address(0), "Invalid recipient");
        require(bytes(uri).length > 0, "URI required");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = uri;

        emit Minted(to, tokenId, uri);

        return tokenId;
    }

    /**
     * @dev Batch mint multiple NFTs
     * @param to Address to mint to
     * @param uris Array of metadata URIs
     */
    function batchMint(address to, string[] memory uris) 
        public 
        onlyMinter 
        returns (uint256[] memory) 
    {
        require(to != address(0), "Invalid recipient");
        require(uris.length > 0, "No URIs provided");

        uint256[] memory tokenIds = new uint256[](uris.length);

        for (uint256 i = 0; i < uris.length; i++) {
            require(bytes(uris[i]).length > 0, "URI required");
            
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();

            _safeMint(to, tokenId);
            _tokenURIs[tokenId] = uris[i];
            
            tokenIds[i] = tokenId;
            emit Minted(to, tokenId, uris[i]);
        }

        return tokenIds;
    }

    // ============ Admin Functions ============
    
    /**
     * @dev Add a minter role (owner only)
     */
    function addMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid minter");
        minters[minter] = true;
        emit MinterAdded(minter);
    }

    /**
     * @dev Remove a minter role (owner only)
     */
    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }

    /**
     * @dev Set base URI for all tokens
     */
    function setBaseURI(string memory uri) external onlyOwner {
        _baseTokenURI = uri;
        emit BaseURIUpdated(uri);
    }

    /**
     * @dev Update royalty info
     */
    function setRoyaltyInfo(uint256 percentage, address recipient) 
        external 
        onlyOwner 
    {
        require(percentage <= 10000, "Royalty too high");
        require(recipient != address(0), "Invalid recipient");
        
        royaltyPercentage = percentage;
        royaltyRecipient = recipient;
        
        _setDefaultRoyalty(recipient, percentage);
    }

    // ============ View Functions ============
    
    /**
     * @dev Get current token ID counter
     */
    function getNextTokenId() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @dev Get total minted tokens
     */
    function getTotalMinted() external view returns (uint256) {
        return _tokenIdCounter.current() - 1; // -1 because counter starts at 1
    }

    /**
     * @dev Check if address is a minter
     */
    function isMinter(address account) external view returns (bool) {
        return minters[account];
    }

    // ============ Override Functions ============
    
    /**
     * @dev Get token URI
     */
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override 
        returns (string memory) 
    {
        _requireMinted(tokenId);
        
        string memory uri = _tokenURIs[tokenId];
        if (bytes(uri).length > 0) {
            return uri;
        }
        
        if (bytes(_baseTokenURI).length > 0) {
            return string(abi.encodePacked(_baseTokenURI, _uint2str(tokenId)));
        }
        
        return "";
    }

    /**
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev See {ERC721-_beforeTokenTransfer}
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /**
     * @dev See {ERC721-_afterTokenTransfer}
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721) {
        super._afterTokenTransfer(from, to, tokenId, batchSize);
    }

    /**
     * @dev See {ERC721-_burn}
     */
    function _burn(uint256 tokenId) internal override(ERC721) {
        super._burn(tokenId);
        if (bytes(_tokenURIs[tokenId]).length != 0) {
            delete _tokenURIs[tokenId];
        }
    }

    // ============ Internal Utilities ============
    
    /**
     * @dev Check minter permission
     */
    modifier onlyMinter() {
        require(minters[msg.sender], "Not authorized to mint");
        _;
    }

    /**
     * @dev Convert uint256 to string
     */
    function _uint2str(uint256 _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}
