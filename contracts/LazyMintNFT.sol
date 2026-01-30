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

    // Marketplace settings: fee taken on sale, rest to creator
    address public marketplaceOwner;
    uint256 public marketplaceFeePercentage = 25; // 2.5% = 25/1000 (legacy, use platformFeeBps)
    uint256 public platformFeeBps = 250; // 2.5% in basis points; taken by marketplace before crediting creator
    address payable public platformFeeReceiver; // Marketplace treasury wallet for this network

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
        platformFeeReceiver = payable(msg.sender); // Default: owner until admin sets per-network wallet
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
     * @dev Message hash including maxQuantity (pieces) for multi-piece redeem
     */
    function getMessageHashWithQuantity(
        string memory uri,
        uint256 royaltyPercentage,
        uint256 nonce,
        uint256 maxQuantity
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(uri, royaltyPercentage, nonce, maxQuantity));
    }

    /**
     * @dev Verify signature with quantity (for redeemNFTWithQuantity)
     */
    function verifySignatureWithQuantity(
        address creator,
        string memory uri,
        uint256 royaltyPercentage,
        uint256 nonce,
        uint256 maxQuantity,
        bytes memory signature
    ) public pure returns (bool) {
        bytes32 messageHash = getMessageHashWithQuantity(uri, royaltyPercentage, nonce, maxQuantity);
        address signer = recoverSigner(messageHash, signature);
        return signer == creator;
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
     * @dev Buyer redeems a lazy minted NFT. Payment is split: platform fee to marketplace treasury, rest to creator.
     */
    function redeemNFT(
        address creator,
        string memory uri,
        uint256 royaltyPercentage,
        uint256 salePrice,
        bytes memory signature
    ) external payable returns (uint256) {
        require(msg.value >= salePrice, "Insufficient value");
        require(royaltyPercentage <= 50, "Royalty too high (max 50%)");

        uint256 nonce = nonces[creator];
        require(
            verifySignature(creator, uri, royaltyPercentage, nonce, signature),
            "Invalid signature"
        );
        require(!_usedSignatures[signature], "Signature already used");

        nonces[creator]++;
        _usedSignatures[signature] = true;

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);

        nftMetadata[tokenId] = NFTMetadata({
            creator: creator,
            royaltyPercentage: royaltyPercentage,
            salePrice: salePrice,
            minted: true
        });

        // Split payment: platform fee to marketplace wallet, rest to creator
        uint256 feeAmount = (salePrice * platformFeeBps) / 10000;
        uint256 creatorAmount = salePrice - feeAmount;
        if (feeAmount > 0 && platformFeeReceiver != address(0)) {
            (bool feeOk, ) = platformFeeReceiver.call{value: feeAmount}("");
            require(feeOk, "Platform fee transfer failed");
        }
        if (creatorAmount > 0) {
            (bool creatorOk, ) = payable(creator).call{value: creatorAmount}("");
            require(creatorOk, "Creator payment failed");
        }

        // Refund excess
        if (msg.value > salePrice) {
            payable(msg.sender).call{value: msg.value - salePrice}("");
        }

        emit NFTRedeemed(tokenId, creator, msg.sender, uri, salePrice);

        return tokenId;
    }

    /**
     * @dev Redeem multiple pieces in one tx. Creator must have signed with getMessageHashWithQuantity(uri, royaltyPercentage, nonce, maxQuantity).
     * Creator is retained in nftMetadata for royalties on secondary sales.
     */
    function redeemNFTWithQuantity(
        address creator,
        string memory uri,
        uint256 royaltyPercentage,
        uint256 pricePerPiece,
        uint256 quantity,
        uint256 maxQuantity,
        bytes memory signature
    ) external payable returns (uint256 firstTokenId) {
        require(quantity >= 1 && quantity <= maxQuantity, "Invalid quantity");
        uint256 totalPrice = pricePerPiece * quantity;
        require(msg.value >= totalPrice, "Insufficient value");
        require(royaltyPercentage <= 50, "Royalty too high (max 50%)");

        uint256 nonce = nonces[creator];
        require(
            verifySignatureWithQuantity(creator, uri, royaltyPercentage, nonce, maxQuantity, signature),
            "Invalid signature"
        );
        require(!_usedSignatures[signature], "Signature already used");

        nonces[creator]++;
        _usedSignatures[signature] = true;

        firstTokenId = _tokenIdCounter.current();
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _mint(msg.sender, tokenId);
            _setTokenURI(tokenId, uri);
            nftMetadata[tokenId] = NFTMetadata({
                creator: creator,
                royaltyPercentage: royaltyPercentage,
                salePrice: pricePerPiece,
                minted: true
            });
            emit NFTRedeemed(tokenId, creator, msg.sender, uri, pricePerPiece);
        }

        uint256 feeAmount = (totalPrice * platformFeeBps) / 10000;
        uint256 creatorAmount = totalPrice - feeAmount;
        if (feeAmount > 0 && platformFeeReceiver != address(0)) {
            (bool feeOk, ) = platformFeeReceiver.call{value: feeAmount}("");
            require(feeOk, "Platform fee transfer failed");
        }
        if (creatorAmount > 0) {
            (bool creatorOk, ) = payable(creator).call{value: creatorAmount}("");
            require(creatorOk, "Creator payment failed");
        }
        if (msg.value > totalPrice) {
            payable(msg.sender).call{value: msg.value - totalPrice}("");
        }
        return firstTokenId;
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

        uint256 totalValue = 0;
        for (uint256 j = 0; j < salePrices.length; j++) {
            totalValue += salePrices[j];
        }
        require(msg.value >= totalValue, "Insufficient value for batch");

        uint256[] memory tokenIds = new uint256[](creators.length);

        for (uint256 i = 0; i < creators.length; i++) {
            tokenIds[i] = this.redeemNFT{value: salePrices[i]}(
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
     * @dev Set sale fee and treasury (marketplace wallet for this network). Fee in basis points (e.g. 250 = 2.5%).
     */
    function setPlatformFeeAndReceiver(uint256 _feeBps, address payable _receiver) external onlyOwner {
        require(_feeBps <= 1000, "Fee too high (max 10%)");
        platformFeeBps = _feeBps;
        platformFeeReceiver = _receiver;
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
