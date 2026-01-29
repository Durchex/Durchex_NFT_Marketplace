// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

/**
 * @title GovernanceToken
 * @dev Governance token for Durchex DAO with voting capabilities
 */
contract GovernanceToken is
    ERC20,
    ERC20Burnable,
    ERC20Snapshot,
    Ownable,
    ERC20Permit,
    ERC20Votes
{
    // Constants
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18; // 100M tokens
    uint256 public constant MAX_SUPPLY = 150_000_000 * 10**18; // Max 150M tokens

    // Treasury address
    address public treasuryAddress;

    // Minting enabled flag
    bool public mintingEnabled = true;

    // Events
    event TreasuryAddressUpdated(address indexed newTreasury);
    event MintingEnabledChanged(bool enabled);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    constructor(address _initialTreasury) ERC20("DurchexDAO", "DXO") ERC20Permit("DurchexDAO") {
        require(_initialTreasury != address(0), "Invalid treasury address");

        treasuryAddress = _initialTreasury;

        // Mint initial supply to treasury
        _mint(_initialTreasury, INITIAL_SUPPLY);
        emit TokensMinted(_initialTreasury, INITIAL_SUPPLY);
    }

    /**
     * @dev Snapshot the current state of balances
     */
    function snapshot() public onlyOwner {
        _snapshot();
    }

    /**
     * @dev Update treasury address
     */
    function setTreasuryAddress(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid treasury address");
        treasuryAddress = _newTreasury;
        emit TreasuryAddressUpdated(_newTreasury);
    }

    /**
     * @dev Enable/disable minting
     */
    function setMintingEnabled(bool _enabled) external onlyOwner {
        mintingEnabled = _enabled;
        emit MintingEnabledChanged(_enabled);
    }

    /**
     * @dev Mint new tokens (only if minting is enabled and max supply not exceeded)
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(mintingEnabled, "Minting is disabled");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        require(to != address(0), "Invalid recipient");

        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Burn tokens
     */
    function burn(uint256 amount) public override {
        super.burn(amount);
        emit TokensBurned(_msgSender(), amount);
    }

    /**
     * @dev Burn tokens from specific address (requires approval)
     */
    function burnFrom(address account, uint256 amount) public override {
        super.burnFrom(account, amount);
        emit TokensBurned(account, amount);
    }

    /**
     * @dev Get voting power of an account
     */
    function getVotes(address account) public view override(ERC20Votes) returns (uint256) {
        return super.getVotes(account);
    }

    /**
     * @dev Get voting power at a specific block
     */
    function getPastVotes(address account, uint256 blockNumber)
        public
        view
        override(ERC20Votes)
        returns (uint256)
    {
        return super.getPastVotes(account, blockNumber);
    }

    /**
     * @dev Get total voting power at a specific block
     */
    function getPastTotalVotes(uint256 blockNumber)
        public
        view
        override(ERC20Votes)
        returns (uint256)
    {
        return super.getPastTotalVotes(blockNumber);
    }

    /**
     * @dev Get voting delegation
     */
    function delegates(address account) public view override(ERC20Votes) returns (address) {
        return super.delegates(account);
    }

    // Override required functions
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Snapshot, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(ERC20Permit) returns (uint256) {
        return super.nonces(owner);
    }
}
