/**
 * Minimal FinancingService stub (ESM) so financing routes don't 500 when app.locals.financingService is set.
 * Replace with real FinancingService (contract-backed) when ready.
 */
class FinancingServiceStub {
  constructor() {
    this.loans = new Map();
  }

  async createLoan(nftContract, nftTokenId, loanAmount, loanDuration) {
    const id = this.loans.size + 1;
    const loan = { id, nftContract, nftTokenId, loanAmount, loanDuration, state: 'active', createdAt: new Date().toISOString() };
    this.loans.set(id, loan);
    return loan;
  }

  async getLoanAnalytics(loanId) {
    const loan = this.loans.get(loanId);
    if (!loan) throw new Error('Loan not found');
    return { currentDebt: loan.loanAmount, daysRemaining: 30, monthlyPayment: loan.loanAmount / 12 };
  }

  async getUserLoans(userAddress) {
    return Array.from(this.loans.values()).filter((l) => l.borrower === userAddress || !l.borrower);
  }

  async makePayment(loanId, amount) {
    const loan = this.loans.get(loanId);
    if (!loan) throw new Error('Loan not found');
    return { remaining: Math.max(0, (loan.loanAmount || 0) - amount) };
  }

  async repayFullLoan(loanId) {
    const loan = this.loans.get(loanId);
    if (!loan) throw new Error('Loan not found');
    this.loans.delete(loanId);
    return { repaid: true };
  }

  async getRiskAssessment(loanId) {
    return { tier: 'LOW', score: 80 };
  }

  async getPortfolioStats(userAddress) {
    return { totalBorrowed: 0, totalCollateral: 0 };
  }

  getPaymentHistory() {
    return [];
  }

  async initiateLiquidation(loanId) {
    throw new Error('Liquidation not implemented in stub');
  }

  async createFractionalPosition(loanId, sharePercentage) {
    return { positionId: 1 };
  }

  async claimFractionalRewards(loanId) {
    return { claimed: '0' };
  }
}

export default FinancingServiceStub;
