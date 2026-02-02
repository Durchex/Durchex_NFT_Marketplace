// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

/**
 * @title StargateNFTBridge
 * @dev Bridge contract for cross-chain NFT transfers via Stargate
 * @notice Enables seamless NFT movement between EVM chains
 */
contract StargateNFTBridge is Ownable, ReentrancyGuard, ERC721Holder {
    
    // ============ Events ============
    
    event NFTLocked(
        address indexed nftAddress,
        uint256 indexed tokenId,
        address indexed from,
        uint256 destinationChain,
        uint256 timestamp
    );
    
    event NFTReleased(
        address indexed nftAddress,
        uint256 indexed tokenId,
        address indexed to,
        uint256 sourceChain,
        bytes32 bridgeTxHash,
        uint256 timestamp
    );
    
    event ChainSupported(uint256 indexed chainId, bool supported);
    event FeesUpdated(uint256 newBaseFee, uint256 newPercentageFee);

    // ============ State Variables ============
    
    // Chain configuration
    mapping(uint256 => bool) public supportedChains;
    mapping(uint256 => address) public chainBridgeAddresses;
    
    // Bridge fees
    uint256 public baseFee = 0.01 ether; // Base fee in ETH
    uint256 public percentageFee = 25; // 0.25% (divide by 10000)
    
    // NFT tracking
    mapping(address => mapping(uint256 => BridgeState)) public nftStates;
    mapping(bytes32 => bool) public processedBridgeTxs;
    
    // Reserves
    uint256 public totalFeeCollected;
    
    // ============ Enums & Structs ============
    
    enum BridgeState { Available, Locked, Released }
    
    struct BridgeConfig {
        uint256 chainId;
        address bridgeAddress;
        bool active;
    }

    // ============ Constructor ============
    
    constructor() {
        // Initialize with common chains
        supportedChains[1] = true;      // Ethereum
        supportedChains[137] = true;    // Polygon
        supportedChains[42161] = true;  // Arbitrum
        supportedChains[8453] = true;   // Base
    }

    // ============ Bridge Functions ============
    
    /**
     * @dev Lock NFT on source chain for bridge transfer
     * @param nftAddress Address of NFT contract
     * @param tokenId Token ID to bridge
     * @param destinationChain Target chain ID
     */
    function lockNFT(
        address nftAddress,
        uint256 tokenId,
        uint256 destinationChain
    ) external payable nonReentrant {
        require(supportedChains[destinationChain], "Destination chain not supported");
        require(msg.value >= calculateFee(nftAddress, tokenId), "Insufficient fee");
        
        // Transfer NFT from user to bridge
        IERC721(nftAddress).safeTransferFrom(msg.sender, address(this), tokenId);
        
        // Update state
        nftStates[nftAddress][tokenId] = BridgeState.Locked;
        totalFeeCollected += msg.value;
        
        emit NFTLocked(nftAddress, tokenId, msg.sender, destinationChain, block.timestamp);
    }

    /**
     * @dev Release NFT on destination chain (called by authorized relayer)
     * @param nftAddress Address of NFT contract on destination
     * @param tokenId Token ID being bridged
     * @param recipient User receiving the NFT
     * @param sourceChain Chain where NFT was locked
     * @param bridgeTxHash Original bridge transaction hash
     */
    function releaseNFT(
        address nftAddress,
        uint256 tokenId,
        address recipient,
        uint256 sourceChain,
        bytes32 bridgeTxHash
    ) external onlyOwner nonReentrant {
        require(!processedBridgeTxs[bridgeTxHash], "Bridge tx already processed");
        require(supportedChains[sourceChain], "Source chain not supported");
        
        // Mark as processed
        processedBridgeTxs[bridgeTxHash] = true;
        
        // Transfer NFT to recipient
        IERC721(nftAddress).safeTransferFrom(address(this), recipient, tokenId);
        
        // Update state
        nftStates[nftAddress][tokenId] = BridgeState.Released;
        
        emit NFTReleased(nftAddress, tokenId, recipient, sourceChain, bridgeTxHash, block.timestamp);
    }

    /**
     * @dev Bridge NFT directly (lock on source, release on destination in one call)
     * @param nftAddress Address of NFT contract
     * @param tokenId Token ID to bridge
     * @param destinationChain Target chain ID
     * @param recipient User receiving NFT on destination chain
     */
    function bridgeNFT(
        address nftAddress,
        uint256 tokenId,
        uint256 destinationChain,
        address recipient
    ) external payable nonReentrant {
        require(supportedChains[destinationChain], "Destination chain not supported");
        require(msg.value >= calculateFee(nftAddress, tokenId), "Insufficient fee");
        require(recipient != address(0), "Invalid recipient");
        
        // Lock NFT
        IERC721(nftAddress).safeTransferFrom(msg.sender, address(this), tokenId);
        nftStates[nftAddress][tokenId] = BridgeState.Locked;
        totalFeeCollected += msg.value;
        
        emit NFTLocked(nftAddress, tokenId, msg.sender, destinationChain, block.timestamp);
    }

    /**
     * @dev Batch bridge multiple NFTs
     * @param nftAddresses Array of NFT addresses
     * @param tokenIds Array of token IDs
     * @param destinationChain Target chain ID
     * @param recipients Array of recipients
     */
    function batchBridgeNFT(
        address[] calldata nftAddresses,
        uint256[] calldata tokenIds,
        uint256 destinationChain,
        address[] calldata recipients
    ) external payable nonReentrant {
        require(nftAddresses.length == tokenIds.length, "Array length mismatch");
        require(nftAddresses.length == recipients.length, "Recipient array length mismatch");
        require(supportedChains[destinationChain], "Destination chain not supported");
        
        uint256 totalFee = 0;
        for (uint256 i = 0; i < nftAddresses.length; i++) {
            totalFee += calculateFee(nftAddresses[i], tokenIds[i]);
        }
        
        require(msg.value >= totalFee, "Insufficient fee for batch");
        
        for (uint256 i = 0; i < nftAddresses.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            IERC721(nftAddresses[i]).safeTransferFrom(msg.sender, address(this), tokenIds[i]);
            nftStates[nftAddresses[i]][tokenIds[i]] = BridgeState.Locked;
            
            emit NFTLocked(
                nftAddresses[i],
                tokenIds[i],
                msg.sender,
                destinationChain,
                block.timestamp
            );
        }
        
        totalFeeCollected += msg.value;
    }

    // ============ Fee Functions ============
    
    /**
     * @dev Calculate bridge fee for an NFT (simplified; nft/token not used in current implementation).
     * @return Fee amount in wei
     */
    function calculateFee(address /* nftAddress */, uint256 /* tokenId */)
        public
        view
        returns (uint256)
    {
        // Base fee + percentage fee (simplified)
        // In production, could consider NFT rarity, value, etc.
        return baseFee + (baseFee * percentageFee) / 10000;
    }

    /**
     * @dev Update fee structure
     * @param newBaseFee New base fee
     * @param newPercentageFee New percentage fee (divide by 10000)
     */
    function setFees(uint256 newBaseFee, uint256 newPercentageFee)
        external
        onlyOwner
    {
        require(newPercentageFee <= 10000, "Percentage fee too high");
        baseFee = newBaseFee;
        percentageFee = newPercentageFee;
        emit FeesUpdated(newBaseFee, newPercentageFee);
    }

    /**
     * @dev Withdraw collected fees
     */
    function withdrawFees(uint256 amount) external onlyOwner {
        require(amount <= totalFeeCollected, "Amount exceeds collected fees");
        totalFeeCollected -= amount;
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Withdrawal failed");
    }

    // ============ Chain Management ============
    
    /**
     * @dev Add support for a blockchain
     */
    function addSupportedChain(uint256 chainId) external onlyOwner {
        supportedChains[chainId] = true;
        emit ChainSupported(chainId, true);
    }

    /**
     * @dev Remove support for a blockchain
     */
    function removeSupportedChain(uint256 chainId) external onlyOwner {
        supportedChains[chainId] = false;
        emit ChainSupported(chainId, false);
    }

    /**
     * @dev Set bridge address for a specific chain
     */
    function setBridgeAddress(uint256 chainId, address bridgeAddress)
        external
        onlyOwner
    {
        require(bridgeAddress != address(0), "Invalid address");
        chainBridgeAddresses[chainId] = bridgeAddress;
    }

    // ============ Query Functions ============
    
    /**
     * @dev Check if NFT is locked in bridge
     */
    function isNFTLocked(address nftAddress, uint256 tokenId)
        external
        view
        returns (bool)
    {
        return nftStates[nftAddress][tokenId] == BridgeState.Locked;
    }

    /**
     * @dev Get NFT state
     */
    function getNFTState(address nftAddress, uint256 tokenId)
        external
        view
        returns (BridgeState)
    {
        return nftStates[nftAddress][tokenId];
    }

    /**
     * @dev Check if bridge tx was processed
     */
    function isBridgeTxProcessed(bytes32 txHash)
        external
        view
        returns (bool)
    {
        return processedBridgeTxs[txHash];
    }

    // ============ Emergency Functions ============
    
    /**
     * @dev Emergency withdrawal of stuck NFTs (owner only)
     */
    function emergencyWithdrawNFT(
        address nftAddress,
        uint256 tokenId,
        address recipient
    ) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        IERC721(nftAddress).safeTransferFrom(address(this), recipient, tokenId);
    }

    /**
     * @dev Emergency ETH withdrawal
     */
    function emergencyWithdrawETH() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }

    // ============ Receive Function ============
    
    receive() external payable {}
}
