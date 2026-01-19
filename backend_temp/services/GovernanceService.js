import { ethers } from "ethers";

class GovernanceService {
  constructor() {
    this.proposals = new Map();
    this.votes = new Map();
    this.timelocks = new Map();
  }

  /**
   * Create a new governance proposal
   */
  async createProposal(proposerAddress, title, description, category, actions, votingPeriod = 259200) {
    try {
      const proposalId = `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const proposal = {
        id: proposalId,
        proposer: proposerAddress,
        title,
        description,
        category,
        actions,
        state: 'PENDING',
        createdAt: new Date(),
        startBlock: Math.floor(Date.now() / 1000),
        endBlock: Math.floor(Date.now() / 1000) + votingPeriod,
        forVotes: 0,
        againstVotes: 0,
        abstainVotes: 0,
        eta: null,
        signatures: actions.map(a => `${a.target}:${a.calldata}`),
      };

      this.proposals.set(proposalId, proposal);
      this.votes.set(proposalId, {
        forVoters: new Set(),
        againstVoters: new Set(),
        abstainVoters: new Set(),
        voterReceipts: new Map(),
      });

      return {
        success: true,
        proposalId,
        proposal,
        message: 'Proposal created successfully'
      };
    } catch (error) {
      console.error('Error creating proposal:', error);
      throw error;
    }
  }

  /**
   * Vote on a proposal
   */
  async castVote(proposalId, voterAddress, support, votes, reason = '') {
    try {
      const proposal = this.proposals.get(proposalId);
      if (!proposal) {
        throw new Error('Proposal not found');
      }

      if (proposal.state !== 'ACTIVE' && proposal.state !== 'PENDING') {
        throw new Error(`Cannot vote on proposal in ${proposal.state} state`);
      }

      const voteData = this.votes.get(proposalId);
      if (!voteData) {
        throw new Error('Vote data not found');
      }

      const hasVoted = voteData.forVoters.has(voterAddress) || 
                       voteData.againstVoters.has(voterAddress) || 
                       voteData.abstainVoters.has(voterAddress);
      
      if (hasVoted) {
        throw new Error('Voter has already voted on this proposal');
      }

      switch (support) {
        case 0:
          voteData.againstVoters.add(voterAddress);
          proposal.againstVotes += votes;
          break;
        case 1:
          voteData.forVoters.add(voterAddress);
          proposal.forVotes += votes;
          break;
        case 2:
          voteData.abstainVoters.add(voterAddress);
          proposal.abstainVotes += votes;
          break;
        default:
          throw new Error('Invalid vote type');
      }

      voteData.voterReceipts.set(voterAddress, {
        support,
        votes,
        reason,
        timestamp: new Date(),
        txHash: `0x${Math.random().toString(16).substr(2)}`
      });

      return {
        success: true,
        proposalId,
        voterAddress,
        support: ['Against', 'For', 'Abstain'][support],
        votes,
        message: 'Vote cast successfully'
      };
    } catch (error) {
      console.error('Error casting vote:', error);
      throw error;
    }
  }

  /**
   * Get proposal details
   */
  getProposal(proposalId) {
    try {
      const proposal = this.proposals.get(proposalId);
      if (!proposal) {
        throw new Error('Proposal not found');
      }

      const voteData = this.votes.get(proposalId);
      const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
      const quorum = this.calculateQuorum(totalVotes);

      return {
        ...proposal,
        stats: {
          totalVotes,
          forPercentage: totalVotes > 0 ? ((proposal.forVotes / totalVotes) * 100).toFixed(2) : 0,
          againstPercentage: totalVotes > 0 ? ((proposal.againstVotes / totalVotes) * 100).toFixed(2) : 0,
          abstainPercentage: totalVotes > 0 ? ((proposal.abstainVotes / totalVotes) * 100).toFixed(2) : 0,
          quorumMet: totalVotes >= quorum,
          quorumRequired: quorum,
          wouldPass: proposal.forVotes > (totalVotes / 2),
        },
        voters: {
          forCount: voteData.forVoters.size,
          againstCount: voteData.againstVoters.size,
          abstainCount: voteData.abstainVoters.size,
        }
      };
    } catch (error) {
      console.error('Error getting proposal:', error);
      throw error;
    }
  }

  /**
   * Get all proposals with optional filtering
   */
  getProposals(state = null, category = null, limit = 50) {
    try {
      let proposals = Array.from(this.proposals.values());

      if (state) {
        proposals = proposals.filter(p => p.state === state);
      }

      if (category) {
        proposals = proposals.filter(p => p.category === category);
      }

      proposals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return proposals.slice(0, limit).map(p => this.getProposal(p.id));
    } catch (error) {
      console.error('Error getting proposals:', error);
      throw error;
    }
  }

  /**
   * Queue a proposal for execution
   */
  async queueProposal(proposalId, eta) {
    try {
      const proposal = this.proposals.get(proposalId);
      if (!proposal) {
        throw new Error('Proposal not found');
      }

      const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
      if (proposal.forVotes <= totalVotes / 2) {
        throw new Error('Proposal did not receive majority support');
      }

      if (Math.floor(Date.now() / 1000) < proposal.endBlock) {
        throw new Error('Voting period has not ended');
      }

      proposal.state = 'QUEUED';
      proposal.eta = eta;

      this.timelocks.set(proposalId, {
        eta,
        executed: false,
        cancelled: false,
        createdAt: new Date(),
      });

      return {
        success: true,
        proposalId,
        eta,
        message: 'Proposal queued for execution'
      };
    } catch (error) {
      console.error('Error queuing proposal:', error);
      throw error;
    }
  }

  /**
   * Execute a queued proposal
   */
  async executeProposal(proposalId) {
    try {
      const proposal = this.proposals.get(proposalId);
      if (!proposal) {
        throw new Error('Proposal not found');
      }

      if (proposal.state !== 'QUEUED') {
        throw new Error('Proposal is not in QUEUED state');
      }

      const timelock = this.timelocks.get(proposalId);
      if (!timelock) {
        throw new Error('Timelock not found');
      }

      const now = Math.floor(Date.now() / 1000);
      if (now < timelock.eta) {
        throw new Error(`Timelock delay not met. Execution available at ${new Date(timelock.eta * 1000)}`);
      }

      if (timelock.executed) {
        throw new Error('Proposal has already been executed');
      }

      if (timelock.cancelled) {
        throw new Error('Proposal execution has been cancelled');
      }

      const executionResults = await Promise.all(
        proposal.actions.map(action => this._executeAction(action))
      );

      proposal.state = 'EXECUTED';
      timelock.executed = true;
      timelock.executedAt = new Date();

      return {
        success: true,
        proposalId,
        results: executionResults,
        message: 'Proposal executed successfully'
      };
    } catch (error) {
      console.error('Error executing proposal:', error);
      throw error;
    }
  }

  /**
   * Cancel a proposal
   */
  async cancelProposal(proposalId, cancellerAddress) {
    try {
      const proposal = this.proposals.get(proposalId);
      if (!proposal) {
        throw new Error('Proposal not found');
      }

      if (proposal.proposer !== cancellerAddress && !this._isAdmin(cancellerAddress)) {
        throw new Error('Only proposer or admin can cancel');
      }

      proposal.state = 'CANCELLED';

      const timelock = this.timelocks.get(proposalId);
      if (timelock) {
        timelock.cancelled = true;
      }

      return {
        success: true,
        proposalId,
        message: 'Proposal cancelled'
      };
    } catch (error) {
      console.error('Error cancelling proposal:', error);
      throw error;
    }
  }

  /**
   * Get vote receipt for a voter
   */
  getVoteReceipt(proposalId, voterAddress) {
    try {
      const voteData = this.votes.get(proposalId);
      if (!voteData) {
        throw new Error('Vote data not found');
      }

      const receipt = voteData.voterReceipts.get(voterAddress);
      if (!receipt) {
        return { hasVoted: false, message: 'Voter has not voted on this proposal' };
      }

      return {
        hasVoted: true,
        voterAddress,
        proposalId,
        support: ['Against', 'For', 'Abstain'][receipt.support],
        votes: receipt.votes,
        reason: receipt.reason,
        timestamp: receipt.timestamp,
        txHash: receipt.txHash
      };
    } catch (error) {
      console.error('Error getting vote receipt:', error);
      throw error;
    }
  }

  /**
   * Get governance stats
   */
  getGovernanceStats() {
    try {
      const allProposals = Array.from(this.proposals.values());
      
      return {
        totalProposals: allProposals.length,
        activeProposals: allProposals.filter(p => p.state === 'ACTIVE').length,
        passedProposals: allProposals.filter(p => p.state === 'EXECUTED').length,
        defeatedProposals: allProposals.filter(p => p.state === 'DEFEATED').length,
        totalVotes: Array.from(this.votes.values()).reduce(
          (sum, v) => sum + v.forVoters.size + v.againstVoters.size + v.abstainVoters.size, 
          0
        ),
        categories: this._countByCategory(allProposals),
        states: this._countByState(allProposals),
      };
    } catch (error) {
      console.error('Error getting governance stats:', error);
      throw error;
    }
  }

  /**
   * Calculate quorum requirement
   */
  calculateQuorum(totalVotes) {
    return Math.ceil(totalVotes * 0.04);
  }

  /**
   * Execute a governance action
   * @private
   */
  async _executeAction(action) {
    try {
      return {
        target: action.target,
        success: true,
        result: `Action executed: ${action.description}`,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        target: action.target,
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check if address is admin
   * @private
   */
  _isAdmin(address) {
    return false;
  }

  /**
   * Count proposals by category
   * @private
   */
  _countByCategory(proposals) {
    const counts = {};
    proposals.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }

  /**
   * Count proposals by state
   * @private
   */
  _countByState(proposals) {
    const counts = {};
    proposals.forEach(p => {
      counts[p.state] = (counts[p.state] || 0) + 1;
    });
    return counts;
  }

  /**
   * Get trending proposals
   */
  getTrendingProposals(limit = 10) {
    try {
      const proposals = Array.from(this.proposals.values())
        .filter(p => p.state === 'ACTIVE' || p.state === 'PENDING')
        .sort((a, b) => {
          const totalVotesA = a.forVotes + a.againstVotes + a.abstainVotes;
          const totalVotesB = b.forVotes + b.againstVotes + b.abstainVotes;
          return totalVotesB - totalVotesA;
        });

      return proposals.slice(0, limit).map(p => this.getProposal(p.id));
    } catch (error) {
      console.error('Error getting trending proposals:', error);
      throw error;
    }
  }

  /**
   * Get proposal timeline
   */
  getProposalTimeline(proposalId) {
    try {
      const proposal = this.proposals.get(proposalId);
      if (!proposal) {
        throw new Error('Proposal not found');
      }

      const timelock = this.timelocks.get(proposalId);

      return {
        proposalId,
        created: proposal.createdAt,
        votingStart: new Date(proposal.startBlock * 1000),
        votingEnd: new Date(proposal.endBlock * 1000),
        queued: proposal.state === 'QUEUED' ? new Date() : null,
        executable: timelock?.eta ? new Date(timelock.eta * 1000) : null,
        executed: timelock?.executedAt || null,
        currentState: proposal.state,
      };
    } catch (error) {
      console.error('Error getting proposal timeline:', error);
      throw error;
    }
  }

  /**
   * Delegate voting power
   */
  async delegateVotingPower(delegatorAddress, delegateeAddress, votingPower) {
    try {
      return {
        success: true,
        delegator: delegatorAddress,
        delegatee: delegateeAddress,
        votingPower,
        message: 'Voting power delegated successfully'
      };
    } catch (error) {
      console.error('Error delegating voting power:', error);
      throw error;
    }
  }
}

export default new GovernanceService();
