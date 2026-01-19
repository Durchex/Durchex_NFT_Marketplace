// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title DurchexTreasury
 * @dev Treasury management for Durchex DAO
 */
contract DurchexTreasury {
    // Treasury address (Governor Timelock)
    address public treasuryAdmin;

    // Allocation records
    struct Allocation {
        address recipient;
        uint256 amount;
        string description;
        uint256 timestamp;
        bool executed;
    }

    // Proposal records
    struct ProposalRecord {
        uint256 proposalId;
        uint256 totalBudget;
        uint256 allocatedAmount;
        bool approved;
        uint256 executedAt;
    }

    // Mappings
    mapping(uint256 => Allocation[]) public allocations;
    mapping(uint256 => ProposalRecord) public proposals;
    mapping(address => uint256) public tokenBalances;

    // Balance tracking
    uint256 public totalBalance;
    uint256 public totalAllocated;
    uint256 public totalSpent;

    // Events
    event FundsReceived(address indexed from, uint256 amount);
    event FundsAllocated(
        uint256 indexed proposalId,
        address indexed recipient,
        uint256 amount,
        string description
    );
    event FundsTransferred(address indexed to, uint256 amount);
    event FundsWithdrawn(address indexed from, uint256 amount);
    event TokensReceived(address indexed token, uint256 amount);
    event TreasuryAdminUpdated(address indexed newAdmin);

    constructor(address _treasuryAdmin) {
        require(_treasuryAdmin != address(0), "Invalid treasury admin");
        treasuryAdmin = _treasuryAdmin;
    }

    /**
     * @dev Receive ETH
     */
    receive() external payable {
        totalBalance += msg.value;
        emit FundsReceived(msg.sender, msg.value);
    }

    /**
     * @dev Receive ERC20 tokens
     */
    function receiveTokens(address _token, uint256 _amount) external {
        require(_token != address(0), "Invalid token");
        require(_amount > 0, "Amount must be > 0");

        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        tokenBalances[_token] += _amount;

        emit TokensReceived(_token, _amount);
    }

    /**
     * @dev Allocate funds from proposal
     */
    function allocateFunds(
        uint256 _proposalId,
        address _recipient,
        uint256 _amount,
        string memory _description
    ) external onlyTreasuryAdmin {
        require(_recipient != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be > 0");
        require(_amount <= totalBalance - totalSpent, "Insufficient balance");

        Allocation memory newAllocation = Allocation({
            recipient: _recipient,
            amount: _amount,
            description: _description,
            timestamp: block.timestamp,
            executed: false
        });

        allocations[_proposalId].push(newAllocation);
        totalAllocated += _amount;

        emit FundsAllocated(_proposalId, _recipient, _amount, _description);
    }

    /**
     * @dev Execute allocation
     */
    function executeAllocation(uint256 _proposalId, uint256 _allocationIndex)
        external
        onlyTreasuryAdmin
    {
        require(_proposalId > 0, "Invalid proposal ID");
        require(_allocationIndex < allocations[_proposalId].length, "Invalid allocation index");

        Allocation storage allocation = allocations[_proposalId][_allocationIndex];
        require(!allocation.executed, "Already executed");
        require(allocation.amount <= totalBalance - totalSpent, "Insufficient balance");

        allocation.executed = true;
        totalSpent += allocation.amount;

        (bool success, ) = payable(allocation.recipient).call{value: allocation.amount}("");
        require(success, "Transfer failed");

        emit FundsTransferred(allocation.recipient, allocation.amount);
    }

    /**
     * @dev Transfer ERC20 tokens
     */
    function transferTokens(
        address _token,
        address _recipient,
        uint256 _amount
    ) external onlyTreasuryAdmin {
        require(_token != address(0), "Invalid token");
        require(_recipient != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be > 0");
        require(tokenBalances[_token] >= _amount, "Insufficient token balance");

        tokenBalances[_token] -= _amount;
        IERC20(_token).transfer(_recipient, _amount);

        emit FundsTransferred(_recipient, _amount);
    }

    /**
     * @dev Approve proposal allocation
     */
    function approveProposal(uint256 _proposalId, uint256 _budget) external onlyTreasuryAdmin {
        ProposalRecord storage proposal = proposals[_proposalId];
        proposal.proposalId = _proposalId;
        proposal.totalBudget = _budget;
        proposal.approved = true;
    }

    /**
     * @dev Get allocations for proposal
     */
    function getAllocations(uint256 _proposalId)
        external
        view
        returns (Allocation[] memory)
    {
        return allocations[_proposalId];
    }

    /**
     * @dev Get allocation count for proposal
     */
    function getAllocationCount(uint256 _proposalId) external view returns (uint256) {
        return allocations[_proposalId].length;
    }

    /**
     * @dev Get specific allocation
     */
    function getAllocation(uint256 _proposalId, uint256 _index)
        external
        view
        returns (Allocation memory)
    {
        require(_index < allocations[_proposalId].length, "Invalid index");
        return allocations[_proposalId][_index];
    }

    /**
     * @dev Get treasury balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Get available balance
     */
    function getAvailableBalance() external view returns (uint256) {
        return totalBalance - totalSpent;
    }

    /**
     * @dev Get token balance
     */
    function getTokenBalance(address _token) external view returns (uint256) {
        return tokenBalances[_token];
    }

    /**
     * @dev Get treasury statistics
     */
    function getStats()
        external
        view
        returns (
            uint256 balance,
            uint256 allocated,
            uint256 spent,
            uint256 available
        )
    {
        return (totalBalance, totalAllocated, totalSpent, totalBalance - totalSpent);
    }

    /**
     * @dev Update treasury admin
     */
    function setTreasuryAdmin(address _newAdmin) external onlyTreasuryAdmin {
        require(_newAdmin != address(0), "Invalid admin");
        treasuryAdmin = _newAdmin;
        emit TreasuryAdminUpdated(_newAdmin);
    }

    /**
     * @dev Modifier to restrict to treasury admin
     */
    modifier onlyTreasuryAdmin() {
        require(msg.sender == treasuryAdmin, "Only treasury admin");
        _;
    }
}
