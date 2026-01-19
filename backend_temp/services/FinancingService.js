/**
 * FinancingService - NFT-Backed Financing Service
 * Handles loan management, risk assessment, and financing operations
 * Features:
 * - Loan creation and management
 * - Risk assessment and scoring
 * - Payment processing
 * - Liquidation handling
 * - Fractional position management
 */

const mongoose = require('mongoose');
const ethers = require('ethers');
const logger = require('../utils/logger');

class FinancingService {
  constructor(contractAddress, contractABI, provider, signer) {
    this.contractAddress = contractAddress;
    this.contractABI = contractABI;
    this.provider = provider;
    this.signer = signer;
    this.contract = null;
    this.loans = new Map();
    this.riskAssessments = new Map();
    this.paymentHistory = [];
    this.userLoans = new Map();
    
    this._initializeContract();
  }

  /**
   * Initialize smart contract connection
   */
  _initializeContract() {
    try {
      if (this.signer) {
        this.contract = new ethers.Contract(
          this.contractAddress,
          this.contractABI,
          this.signer
        );
      } else {
        this.contract = new ethers.Contract(
          this.contractAddress,
          this.contractABI,
          this.provider
        );
      }
      logger.info('NFTFinancing contract initialized', { address: this.contractAddress });
    } catch (error) {
      logger.error('Failed to initialize contract', { error: error.message });
    }
  }

  /**
   * Create a new loan
   */
  async createLoan(nftContract, nftTokenId, loanAmount, loanDuration) {
    try {
      logger.info('Creating loan', { nftContract, nftTokenId, loanAmount, loanDuration });
      
      // Validate inputs
      if (!ethers.isAddress(nftContract)) {
        throw new Error('Invalid NFT contract address');
      }
      
      if (loanAmount <= 0 || loanDuration <= 0) {
        throw new Error('Invalid loan parameters');
      }

      // Call contract method
      const tx = await this.contract.createLoan(
        nftContract,
        nftTokenId,
        ethers.parseUnits(loanAmount.toString(), 6),
        loanDuration
      );
      const receipt = await tx.wait();
      
      // Extract loan ID from event
      const event = receipt.events?.find(e => e.event === 'LoanCreated');
      const loanId = event?.args?.loanId?.toNumber();
      
      logger.info('Loan created successfully', { loanId, loanAmount });
      
      // Store loan info locally
      const loan = {
        id: loanId,
        borrower: this.signer.address,
        nftContract,
        nftTokenId,
        loanAmount,
        principalRemaining: loanAmount,
        interestRate: event?.args?.interestRate,
        status: 'ACTIVE',
        createdAt: new Date(),
        maturityDate: new Date(Date.now() + loanDuration * 24 * 60 * 60 * 1000)
      };
      
      this.loans.set(loanId, loan);
      this._recordUserLoan(this.signer.address, loanId);
      
      return loan;
    } catch (error) {
      logger.error('Failed to create loan', { error: error.message });
      throw error;
    }
  }

  /**
   * Make a payment towards loan
   */
  async makePayment(loanId, paymentAmount) {
    try {
      logger.info('Making payment', { loanId, paymentAmount });
      
      // Get stablecoin address and approve
      const stablecoinAddress = await this.contract.stablecoin();
      await this._approveTokens(stablecoinAddress, paymentAmount);
      
      // Make payment
      const tx = await this.contract.makePayment(
        loanId,
        ethers.parseUnits(paymentAmount.toString(), 6)
      );
      const receipt = await tx.wait();
      
      logger.info('Payment made successfully', { loanId });
      
      // Update local state
      const loan = this.loans.get(loanId);
      if (loan) {
        loan.principalRemaining -= paymentAmount;
      }
      
      // Record payment
      this._recordPayment({
        loanId,
        amount: paymentAmount,
        timestamp: new Date(),
        txHash: receipt.transactionHash
      });
      
      return {
        loanId,
        paymentAmount,
        txHash: receipt.transactionHash,
        remainingPrincipal: loan?.principalRemaining || 0
      };
    } catch (error) {
      logger.error('Failed to make payment', { error: error.message });
      throw error;
    }
  }

  /**
   * Repay entire loan
   */
  async repayFullLoan(loanId) {
    try {
      logger.info('Repaying full loan', { loanId });
      
      const loan = this.loans.get(loanId);
      if (!loan) throw new Error('Loan not found');
      
      // Get current debt
      const currentDebt = await this.contract.getCurrentDebt(loanId);
      const debtAmount = ethers.formatUnits(currentDebt, 6);
      
      // Approve and repay
      const stablecoinAddress = await this.contract.stablecoin();
      await this._approveTokens(stablecoinAddress, debtAmount);
      
      const tx = await this.contract.repayFullLoan(loanId);
      const receipt = await tx.wait();
      
      logger.info('Loan repaid', { loanId, totalRepayment: debtAmount });
      
      // Update loan status
      loan.status = 'REPAID';
      loan.principalRemaining = 0;
      
      this._recordPayment({
        loanId,
        amount: debtAmount,
        type: 'FULL_REPAYMENT',
        timestamp: new Date(),
        txHash: receipt.transactionHash
      });
      
      return {
        loanId,
        totalRepayment: debtAmount,
        txHash: receipt.transactionHash
      };
    } catch (error) {
      logger.error('Failed to repay loan', { error: error.message });
      throw error;
    }
  }

  /**
   * Get loan details with calculated metrics
   */
  async getLoanAnalytics(loanId) {
    try {
      const loan = this.loans.get(loanId);
      if (!loan) throw new Error('Loan not found');
      
      const currentDebt = await this.contract.getCurrentDebt(loanId);
      const isLiquidationEligible = await this.contract.isLiquidationEligible(loanId);
      
      const timeRemaining = (loan.maturityDate - Date.now()) / (1000 * 60 * 60 * 24);
      const monthlyPayment = this._calculateMonthlyPayment(
        loan.loanAmount,
        loan.interestRate / 100,
        timeRemaining / 30
      );
      
      return {
        loanId,
        ...loan,
        currentDebt: ethers.formatUnits(currentDebt, 6),
        daysRemaining: Math.ceil(timeRemaining),
        monthlyPayment,
        isLiquidationEligible,
        ltv: this._calculateLTV(loan.principalRemaining, loan.collateralValue || 10),
        apr: loan.interestRate
      };
    } catch (error) {
      logger.error('Failed to get loan analytics', { error: error.message });
      throw error;
    }
  }

  /**
   * Get risk assessment
   */
  async getRiskAssessment(loanId) {
    try {
      const assessment = this.riskAssessments.get(loanId);
      if (!assessment) throw new Error('Assessment not found');
      
      return {
        loanId,
        ...assessment,
        riskLevel: ['LOW', 'MODERATE', 'MEDIUM', 'HIGH', 'VERY_HIGH'][assessment.riskTier],
        recommendedInterestRate: [5, 8, 12, 16, 25][assessment.riskTier]
      };
    } catch (error) {
      logger.error('Failed to get risk assessment', { error: error.message });
      throw error;
    }
  }

  /**
   * Initiate liquidation
   */
  async initiateLiquidation(loanId) {
    try {
      logger.info('Initiating liquidation', { loanId });
      
      const isEligible = await this.contract.isLiquidationEligible(loanId);
      if (!isEligible) {
        throw new Error('Loan not eligible for liquidation');
      }
      
      const tx = await this.contract.initiateLiquidation(loanId);
      const receipt = await tx.wait();
      
      logger.info('Liquidation initiated', { loanId });
      
      const loan = this.loans.get(loanId);
      if (loan) {
        loan.status = 'PENDING_LIQUIDATION';
      }
      
      return {
        loanId,
        status: 'PENDING_LIQUIDATION',
        txHash: receipt.transactionHash
      };
    } catch (error) {
      logger.error('Failed to initiate liquidation', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user's loans
   */
  async getUserLoans(userAddress) {
    try {
      const loanIds = this.userLoans.get(userAddress) || [];
      const loans = [];
      
      for (const loanId of loanIds) {
        const loan = this.loans.get(loanId);
        if (loan) {
          loans.push(await this.getLoanAnalytics(loanId));
        }
      }
      
      return loans;
    } catch (error) {
      logger.error('Failed to get user loans', { error: error.message });
      throw error;
    }
  }

  /**
   * Get portfolio statistics
   */
  async getPortfolioStats(userAddress) {
    try {
      const userLoans = await this.getUserLoans(userAddress);
      
      const totalLoaned = userLoans.reduce((sum, loan) => sum + loan.loanAmount, 0);
      const totalDebt = userLoans.reduce((sum, loan) => sum + parseFloat(loan.currentDebt || 0), 0);
      const averageAPR = userLoans.length > 0
        ? userLoans.reduce((sum, loan) => sum + (loan.apr || 0), 0) / userLoans.length
        : 0;
      
      const activeLoan = userLoans.filter(l => l.status === 'ACTIVE').length;
      const liquidationRisk = userLoans.filter(l => l.isLiquidationEligible).length;
      
      return {
        totalLoaned,
        totalDebt,
        averageAPR: averageAPR.toFixed(2),
        activeLoanCount: activeLoan,
        totalLoans: userLoans.length,
        liquidationRiskCount: liquidationRisk,
        portfolioHealth: this._calculatePortfolioHealth(userLoans)
      };
    } catch (error) {
      logger.error('Failed to get portfolio stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Create fractional position
   */
  async createFractionalPosition(loanId, sharePercentage) {
    try {
      logger.info('Creating fractional position', { loanId, sharePercentage });
      
      const loan = this.loans.get(loanId);
      if (!loan) throw new Error('Loan not found');
      
      const investmentAmount = (loan.loanAmount * sharePercentage) / 100;
      
      // Approve and create position
      const stablecoinAddress = await this.contract.stablecoin();
      await this._approveTokens(stablecoinAddress, investmentAmount);
      
      const tx = await this.contract.createFractionalPosition(loanId, sharePercentage * 100);
      const receipt = await tx.wait();
      
      logger.info('Fractional position created', { loanId, investmentAmount });
      
      return {
        loanId,
        sharePercentage,
        investmentAmount,
        expectedInterest: this._calculateExpectedInterest(
          investmentAmount,
          loan.interestRate,
          loan.maturityDate
        ),
        txHash: receipt.transactionHash
      };
    } catch (error) {
      logger.error('Failed to create fractional position', { error: error.message });
      throw error;
    }
  }

  /**
   * Claim fractional rewards
   */
  async claimFractionalRewards(loanId) {
    try {
      logger.info('Claiming fractional rewards', { loanId });
      
      const tx = await this.contract.claimFractionalRewards(loanId);
      const receipt = await tx.wait();
      
      logger.info('Rewards claimed', { loanId });
      
      return {
        loanId,
        txHash: receipt.transactionHash
      };
    } catch (error) {
      logger.error('Failed to claim rewards', { error: error.message });
      throw error;
    }
  }

  /**
   * Get payment history
   */
  getPaymentHistory(loanId = null) {
    if (loanId) {
      return this.paymentHistory.filter(p => p.loanId === loanId);
    }
    return this.paymentHistory.slice(-100); // Last 100 payments
  }

  // ========== Private Helper Methods ==========

  /**
   * Approve token transfer
   */
  async _approveTokens(tokenAddress, amount) {
    try {
      const token = new ethers.Contract(
        tokenAddress,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        this.signer
      );
      
      const tx = await token.approve(
        this.contractAddress,
        ethers.parseUnits(amount.toString(), 6)
      );
      await tx.wait();
    } catch (error) {
      logger.error('Token approval failed', { error: error.message });
    }
  }

  /**
   * Record user loan
   */
  _recordUserLoan(userAddress, loanId) {
    if (!this.userLoans.has(userAddress)) {
      this.userLoans.set(userAddress, []);
    }
    this.userLoans.get(userAddress).push(loanId);
  }

  /**
   * Record payment
   */
  _recordPayment(paymentData) {
    this.paymentHistory.push({
      ...paymentData,
      timestamp: paymentData.timestamp || new Date()
    });
    
    if (this.paymentHistory.length > 1000) {
      this.paymentHistory = this.paymentHistory.slice(-1000);
    }
  }

  /**
   * Calculate monthly payment
   */
  _calculateMonthlyPayment(principal, monthlyRate, months) {
    if (months === 0 || monthlyRate === 0) return principal;
    const monthlyRateDecimal = monthlyRate / 12;
    return (principal * monthlyRateDecimal * Math.pow(1 + monthlyRateDecimal, months)) /
           (Math.pow(1 + monthlyRateDecimal, months) - 1);
  }

  /**
   * Calculate LTV
   */
  _calculateLTV(debt, collateralValue) {
    if (collateralValue === 0) return 0;
    return ((debt / collateralValue) * 100).toFixed(2);
  }

  /**
   * Calculate portfolio health
   */
  _calculatePortfolioHealth(loans) {
    if (loans.length === 0) return 'EXCELLENT';
    
    const liquidationRisk = loans.filter(l => l.isLiquidationEligible).length;
    const riskPercentage = (liquidationRisk / loans.length) * 100;
    
    if (riskPercentage === 0) return 'EXCELLENT';
    if (riskPercentage < 10) return 'GOOD';
    if (riskPercentage < 30) return 'FAIR';
    if (riskPercentage < 50) return 'POOR';
    return 'CRITICAL';
  }

  /**
   * Calculate expected interest
   */
  _calculateExpectedInterest(principal, apr, maturityDate) {
    const monthsRemaining = (maturityDate - Date.now()) / (1000 * 60 * 60 * 24 * 30);
    return (principal * (apr / 100) * monthsRemaining) / 12;
  }
}

module.exports = FinancingService;
