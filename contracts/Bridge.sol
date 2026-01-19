// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@layerzerolabs/lz-evm-sdk-v1-0.2/contracts/lzApp/NonblockingLzApp.sol";

/**
 * @title Cross-Chain Bridge
 * @notice Facilitates NFT transfers between Ethereum, Polygon, and Arbitrum using LayerZero
 */
contract Bridge is NonblockingLzApp, Ownable, ReentrancyGuard {
    // Chain IDs for supported networks
    uint16 public constant ETHEREUM_CHAIN_ID = 101;
    uint16 public constant POLYGON_CHAIN_ID = 109;
    uint16 public constant ARBITRUM_CHAIN_ID = 110;

    // Supported token standards
    enum TokenType { ERC721, ERC1155, ERC20 }

    // Bridge transfer status
    enum TransferStatus { Pending, Completed, Failed, Cancelled }

    // Bridge transfer information
    struct BridgeTransfer {
        address initiator;
        address tokenAddress;
        TokenType tokenType;
        uint256 tokenId; // For ERC721/ERC1155
        uint256 amount; // For ERC20/ERC1155
        uint16 sourceChain;
        uint16 destinationChain;
        address destinationAddress;
        TransferStatus status;
        uint256 timestamp;
        bytes32 transactionHash;
    }

    // Bridge configuration
    struct BridgeConfig {
        uint256 fee; // Platform fee in basis points (e.g., 50 = 0.5%)
        bool paused;
        uint256 minGasLimit;
    }

    // Chain bridge information
    struct ChainBridge {
        address bridgeAddress;
        bool supported;
        uint256 gasPrice;
    }

    // State variables
    mapping(uint16 => ChainBridge) public chainBridges;
    mapping(bytes32 => BridgeTransfer) public transfers;
    mapping(address => bytes32[]) public userTransfers;

    BridgeConfig public config;
    address public treasury;
    uint256 public totalTransfersProcessed;
    uint256 public totalVolumeProcessed; // In wei/units

    // Events
    event TransferInitiated(
        bytes32 indexed transferId,
        address indexed initiator,
        address indexed tokenAddress,
        uint16 sourceChain,
        uint16 destinationChain,
        uint256 amount,
        uint256 fee
    );

    event TransferCompleted(
        bytes32 indexed transferId,
        address indexed recipient,
        address indexed tokenAddress,
        uint256 amount
    );

    event TransferFailed(
        bytes32 indexed transferId,
        string reason
    );

    event ChainConfigured(
        uint16 chainId,
        address bridgeAddress,
        bool supported
    );

    event FeeUpdated(uint256 oldFee, uint256 newFee);

    // Constructor
    constructor(
        address _lzEndpoint,
        address _treasury
    ) NonblockingLzApp(_lzEndpoint) {
        require(_treasury != address(0), "Invalid treasury address");
        treasury = _treasury;
        config.fee = 50; // 0.5% default fee
        config.minGasLimit = 200000;
    }

    /**
     * @notice Configure a bridge on another chain
     * @param _chainId Layer Zero chain ID
     * @param _bridgeAddress Address of the bridge contract on destination chain
     * @param _supported Whether this chain is supported
     */
    function configureBridge(
        uint16 _chainId,
        address _bridgeAddress,
        bool _supported
    ) external onlyOwner {
        require(_bridgeAddress != address(0) || !_supported, "Invalid bridge address");
        
        chainBridges[_chainId] = ChainBridge({
            bridgeAddress: _bridgeAddress,
            supported: _supported,
            gasPrice: 0
        });

        emit ChainConfigured(_chainId, _bridgeAddress, _supported);
    }

    /**
     * @notice Bridge ERC721 NFT to another chain
     * @param _nftAddress Address of the ERC721 contract
     * @param _tokenId Token ID to bridge
     * @param _destinationChain Target chain ID
     * @param _recipient Recipient address on destination chain
     */
    function bridgeERC721(
        address _nftAddress,
        uint256 _tokenId,
        uint16 _destinationChain,
        address _recipient
    ) external payable nonReentrant returns (bytes32) {
        require(_nftAddress != address(0), "Invalid NFT address");
        require(_recipient != address(0), "Invalid recipient");
        require(chainBridges[_destinationChain].supported, "Destination chain not supported");
        require(!config.paused, "Bridge is paused");

        // Transfer NFT from user to contract
        IERC721(_nftAddress).transferFrom(msg.sender, address(this), _tokenId);

        // Create transfer record
        bytes32 transferId = _createTransferId(msg.sender, _nftAddress, _tokenId, block.timestamp);
        
        BridgeTransfer storage transfer = transfers[transferId];
        transfer.initiator = msg.sender;
        transfer.tokenAddress = _nftAddress;
        transfer.tokenType = TokenType.ERC721;
        transfer.tokenId = _tokenId;
        transfer.amount = 1;
        transfer.sourceChain = _getCurrentChain();
        transfer.destinationChain = _destinationChain;
        transfer.destinationAddress = _recipient;
        transfer.status = TransferStatus.Pending;
        transfer.timestamp = block.timestamp;
        transfer.transactionHash = keccak256(abi.encodePacked(transferId));

        userTransfers[msg.sender].push(transferId);

        // Calculate fee
        uint256 fee = (msg.value * config.fee) / 10000;
        require(msg.value > fee, "Insufficient payment for fee");

        // Send message to destination chain
        bytes memory payload = abi.encode(
            transferId,
            TokenType.ERC721,
            _nftAddress,
            _tokenId,
            1,
            _recipient,
            msg.sender
        );

        _lzSend(
            _destinationChain,
            payload,
            payable(msg.sender),
            address(0x0),
            bytes("")
        );

        // Transfer fee to treasury
        _transferFees(fee);

        totalTransfersProcessed++;
        totalVolumeProcessed += 1;

        emit TransferInitiated(
            transferId,
            msg.sender,
            _nftAddress,
            _getCurrentChain(),
            _destinationChain,
            1,
            fee
        );

        return transferId;
    }

    /**
     * @notice Bridge ERC1155 NFT to another chain
     * @param _nftAddress Address of the ERC1155 contract
     * @param _tokenId Token ID to bridge
     * @param _amount Amount to bridge
     * @param _destinationChain Target chain ID
     * @param _recipient Recipient address on destination chain
     */
    function bridgeERC1155(
        address _nftAddress,
        uint256 _tokenId,
        uint256 _amount,
        uint16 _destinationChain,
        address _recipient
    ) external payable nonReentrant returns (bytes32) {
        require(_nftAddress != address(0), "Invalid NFT address");
        require(_amount > 0, "Amount must be greater than 0");
        require(_recipient != address(0), "Invalid recipient");
        require(chainBridges[_destinationChain].supported, "Destination chain not supported");
        require(!config.paused, "Bridge is paused");

        // Transfer NFT from user to contract
        IERC1155(_nftAddress).safeTransferFrom(
            msg.sender,
            address(this),
            _tokenId,
            _amount,
            ""
        );

        // Create transfer record
        bytes32 transferId = _createTransferId(msg.sender, _nftAddress, _tokenId, block.timestamp);
        
        BridgeTransfer storage transfer = transfers[transferId];
        transfer.initiator = msg.sender;
        transfer.tokenAddress = _nftAddress;
        transfer.tokenType = TokenType.ERC1155;
        transfer.tokenId = _tokenId;
        transfer.amount = _amount;
        transfer.sourceChain = _getCurrentChain();
        transfer.destinationChain = _destinationChain;
        transfer.destinationAddress = _recipient;
        transfer.status = TransferStatus.Pending;
        transfer.timestamp = block.timestamp;
        transfer.transactionHash = keccak256(abi.encodePacked(transferId));

        userTransfers[msg.sender].push(transferId);

        // Calculate fee
        uint256 fee = (msg.value * config.fee) / 10000;
        require(msg.value > fee, "Insufficient payment for fee");

        // Send message to destination chain
        bytes memory payload = abi.encode(
            transferId,
            TokenType.ERC1155,
            _nftAddress,
            _tokenId,
            _amount,
            _recipient,
            msg.sender
        );

        _lzSend(
            _destinationChain,
            payload,
            payable(msg.sender),
            address(0x0),
            bytes("")
        );

        // Transfer fee to treasury
        _transferFees(fee);

        totalTransfersProcessed++;
        totalVolumeProcessed += _amount;

        emit TransferInitiated(
            transferId,
            msg.sender,
            _nftAddress,
            _getCurrentChain(),
            _destinationChain,
            _amount,
            fee
        );

        return transferId;
    }

    /**
     * @notice Handle incoming message from LayerZero
     * @param _srcChainId Source chain ID
     * @param _from Source address
     * @param _nonce Message nonce
     * @param _payload Message payload
     */
    function _nonblockingLzReceive(
        uint16 _srcChainId,
        bytes memory _from,
        uint64 _nonce,
        bytes memory _payload
    ) internal override {
        (
            bytes32 transferId,
            TokenType tokenType,
            address tokenAddress,
            uint256 tokenId,
            uint256 amount,
            address recipient,
            address initiator
        ) = abi.decode(_payload, (bytes32, TokenType, address, uint256, uint256, address, address));

        try {
            if (tokenType == TokenType.ERC721) {
                IERC721(tokenAddress).transferFrom(address(this), recipient, tokenId);
            } else if (tokenType == TokenType.ERC1155) {
                IERC1155(tokenAddress).safeTransferFrom(
                    address(this),
                    recipient,
                    tokenId,
                    amount,
                    ""
                );
            }

            // Update transfer status
            transfers[transferId].status = TransferStatus.Completed;

            emit TransferCompleted(transferId, recipient, tokenAddress, amount);
        } catch Error(string memory reason) {
            transfers[transferId].status = TransferStatus.Failed;
            emit TransferFailed(transferId, reason);
        }
    }

    /**
     * @notice Set bridge fee
     * @param _fee New fee in basis points
     */
    function setFee(uint256 _fee) external onlyOwner {
        require(_fee <= 500, "Fee too high (max 5%)");
        uint256 oldFee = config.fee;
        config.fee = _fee;
        emit FeeUpdated(oldFee, _fee);
    }

    /**
     * @notice Pause/unpause bridge
     * @param _paused True to pause, false to unpause
     */
    function setPaused(bool _paused) external onlyOwner {
        config.paused = _paused;
    }

    /**
     * @notice Get transfer history for user
     * @param _user User address
     * @return Array of transfer IDs
     */
    function getUserTransfers(address _user) external view returns (bytes32[] memory) {
        return userTransfers[_user];
    }

    /**
     * @notice Get transfer details
     * @param _transferId Transfer ID
     * @return Transfer details
     */
    function getTransferDetails(bytes32 _transferId) external view returns (BridgeTransfer memory) {
        return transfers[_transferId];
    }

    /**
     * @notice Get bridge statistics
     * @return Struct containing bridge stats
     */
    function getBridgeStats() external view returns (
        uint256 totalTransfers,
        uint256 totalVolume,
        uint256 platformFee,
        bool isPaused
    ) {
        return (
            totalTransfersProcessed,
            totalVolumeProcessed,
            config.fee,
            config.paused
        );
    }

    /**
     * @notice Withdraw accumulated fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        (bool success, ) = treasury.call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    // Internal helper functions

    /**
     * @notice Create unique transfer ID
     */
    function _createTransferId(
        address _initiator,
        address _token,
        uint256 _tokenId,
        uint256 _timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_initiator, _token, _tokenId, _timestamp));
    }

    /**
     * @notice Get current chain ID (stub for LayerZero)
     */
    function _getCurrentChain() internal pure returns (uint16) {
        // This would be set based on deployment environment
        return ETHEREUM_CHAIN_ID;
    }

    /**
     * @notice Transfer fees to treasury
     */
    function _transferFees(uint256 _fee) internal {
        if (_fee > 0) {
            (bool success, ) = treasury.call{value: _fee}("");
            require(success, "Fee transfer failed");
        }
    }

    // ERC1155 receiver implementation
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    // Receive ETH
    receive() external payable {}
}
