// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LazyMintNFT
 * @dev Lazy minting implementation - creators sign metadata, NFTs only minted on sale
 * Gas cost: ZERO for creators, paid by buyer at purchase
 */
contract LazyMintNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    using ECDSA for bytes32;

    Counters.Counter private _tokenIdCounter;

    // Track nonce per creator to prevent replay attacks
    mapping(address => uint256) public nonces;

    // Track which signatures have been used (additional safety)
    mapping(bytes => bool) private _usedSignatures;

    // Store minimal metadata on-chain
    struct NFTMetadata {
        address creator;
        uint256 royaltyPercentage;
        uint256 salePrice; // last sale price
        bool minted;
    }

    mapping(uint256 => NFTMetadata) public nftMetadata;

    // Marketplace settings
    address public marketplaceOwner;
    uint256 public marketplaceFeePercentage = 25; // 2.5% = 25/1000

    event LazyMintCreated(
        address indexed creator,
        string uri,
        uint256 royaltyPercentage,
        uint256 nonce
    );

    event NFTRedeemed(
        uint256 indexed tokenId,
        address indexed creator,
        address indexed buyer,
        string uri,
        uint256 salePrice
    );

    event NFTTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
    );

    event RoyaltyPaid(
        uint256 indexed tokenId,
        address indexed creator,
        uint256 amount
    );

    constructor() ERC721("DurchexLazyNFT", "THRX-LAZY") {
        marketplaceOwner = msg.sender;
    }

    /**
     * @dev Generate the message hash for signing
     * Creator signs this message off-chain
     */
    function getMessageHash(
        string memory uri,
        uint256 royaltyPercentage,
        uint256 nonce
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(uri, royaltyPercentage, nonce));
    }

    /**
     * @dev Convert hash to Eth signed message hash
     */
    function getEthSignedMessageHash(bytes32 messageHash)
        public
        pure
        returns (bytes32)
    {
        return messageHash.toEthSignedMessageHash();
    }

    /**
     * @dev Recover signer from signature
     */
    function recoverSigner(bytes32 message, bytes memory sig)
        public
        pure
        returns (address)
    {
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(message);
        return ethSignedMessageHash.recover(sig);
    }

    /**
     * @dev Verify signature is valid
     */
    function verifySignature(
        address creator,
        string memory uri,
        uint256 royaltyPercentage,
        uint256 nonce,
        bytes memory signature
    ) public pure returns (bool) {
        bytes32 messageHash = getMessageHash(uri, royaltyPercentage, nonce);
        address signer = recoverSigner(messageHash, signature);
        return signer == creator;
    }

    /**
     * @dev Buyer redeems a lazy minted NFT
     * Creator's signature is verified, then NFT is minted
     * Marketplace and royalties handled in separate transactions
     */
    function redeemNFT(
        address creator,
        string memory uri,
        uint256 royaltyPercentage,
        uint256 salePrice,
        bytes memory signature
    ) external payable returns (uint256) {
        // Validate royalty percentage
        require(royaltyPercentage <= 50, "Royalty too high (max 50%)");

        // Get creator's current nonce
        uint256 nonce = nonces[creator];

        // Verify signature
        require(
            verifySignature(creator, uri, royaltyPercentage, nonce, signature),
            "Invalid signature"
        );

        // Prevent signature reuse
        require(!_usedSignatures[signature], "Signature already used");

        // Increment nonce to prevent replay attacks
        nonces[creator]++;
        _usedSignatures[signature] = true;

        // Mint token ID
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        // Mint to buyer
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);

        // Store metadata
        nftMetadata[tokenId] = NFTMetadata({
            creator: creator,
            royaltyPercentage: royaltyPercentage,
            salePrice: salePrice,
            minted: true
        });

        emit NFTRedeemed(tokenId, creator, msg.sender, uri, salePrice);

        return tokenId;
    }

    /**
     * @dev Batch redeem multiple lazy minted NFTs
     * More gas efficient than individual redemptions
     */
    function batchRedeemNFTs(
        address[] memory creators,
        string[] memory uris,
        uint256[] memory royaltyPercentages,
        uint256[] memory salePrices,
        bytes[] memory signatures
    ) external payable returns (uint256[] memory) {
        require(
            creators.length == uris.length &&
                uris.length == royaltyPercentages.length &&
                royaltyPercentages.length == salePrices.length &&
                salePrices.length == signatures.length,
            "Array lengths don't match"
        );

        uint256[] memory tokenIds = new uint256[](creators.length);

        for (uint256 i = 0; i < creators.length; i++) {
            tokenIds[i] = redeemNFT(
                creators[i],
                uris[i],
                royaltyPercentages[i],
                salePrices[i],
                signatures[i]
            );
        }

        return tokenIds;
    }

    /**
     * @dev Distribute royalties to creator
     * Called by marketplace after successful sale
     */
    function payRoyalty(uint256 tokenId) external payable {
        require(_exists(tokenId), "Token doesn't exist");
        require(msg.value > 0, "No payment provided");

        NFTMetadata storage metadata = nftMetadata[tokenId];
        uint256 royaltyAmount = (msg.value * metadata.royaltyPercentage) / 100;

        if (royaltyAmount > 0) {
            (bool success, ) = metadata.creator.call{value: royaltyAmount}("");
            require(success, "Royalty transfer failed");
            emit RoyaltyPaid(tokenId, metadata.creator, royaltyAmount);
        }
    }

    /**
     * @dev Standard ERC2981 royalty info for marketplaces
     */
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        returns (address, uint256)
    {
        require(_exists(tokenId), "Token doesn't exist");
        NFTMetadata storage metadata = nftMetadata[tokenId];
        uint256 royaltyAmount = (salePrice * metadata.royaltyPercentage) / 100;
        return (metadata.creator, royaltyAmount);
    }

    /**
     * @dev Get NFT metadata
     */
    function getNFTMetadata(uint256 tokenId)
        external
        view
        returns (NFTMetadata memory)
    {
        require(_exists(tokenId), "Token doesn't exist");
        return nftMetadata[tokenId];
    }

    /**
     * @dev Get creator's current nonce
     */
    function getCreatorNonce(address creator) external view returns (uint256) {
        return nonces[creator];
    }

    /**
     * @dev Set marketplace fee percentage (only owner)
     */
    function setMarketplaceFee(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 100, "Fee too high (max 10%)");
        marketplaceFeePercentage = newFeePercentage;
    }

    /**
     * @dev Update marketplace owner (only owner)
     */
    function setMarketplaceOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        marketplaceOwner = newOwner;
    }

    /**
     * @dev Calculate total supply of minted tokens
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @dev Emergency function to recover mistaken payments
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Allow contract to receive ETH
     */
    receive() external payable {}
}
