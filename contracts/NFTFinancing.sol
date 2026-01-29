// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title NFTFinancing
 * @dev Advanced NFT-backed financing contract
 * Features:
 * - Collateralized loans using NFTs
 * - Dynamic interest rates based on NFT risk
 * - Fractional ownership financing
 * - Liquidation mechanisms
 * - Payment scheduling
 * - Default insurance pool
 */
contract NFTFinancing is Ownable, ReentrancyGuard, Pausable {
    
    // ========== Types ==========
    struct Loan {
        address borrower;
        address nftContract;
        uint256 nftTokenId;
        uint256 loanAmount;
        uint256 principalRemaining;
        uint256 interestRate; // in basis points (100 = 1%)
        uint256 collateralValue;
        uint256 loanStartTime;
        uint256 maturityDate;
        uint256 lastPaymentTime;
        LoanStatus status;
        uint256 defaultFeeAccrued;
    }

    struct RiskAssessment {
        uint256 collectionFloorPrice;
        uint256 volatilityScore;
        uint256 liquidityScore;
        uint256 riskTier; // 0-4
        uint256 assessmentTime;
    }

    struct FractionalPosition {
        address owner;
        uint256 loanId;
        uint256 sharePercentage;
        uint256 investmentAmount;
        uint256 rewardsEarned;
    }

    struct PaymentSchedule {
        uint256 loanId;
        uint256 monthlyPayment;
        uint256 nextPaymentDue;
        uint256 paymentsRemaining;
        uint256 totalPaymentsMade;
    }

    enum LoanStatus {
        ACTIVE,
        PENDING_LIQUIDATION,
        LIQUIDATED,
        REPAID,
        DEFAULTED
    }

    enum RiskTier {
        LOW,
        MODERATE,
        MEDIUM,
        HIGH,
        VERY_HIGH
    }

    // ========== State Variables ==========
    mapping(uint256 => Loan) public loans;
    mapping(uint256 => RiskAssessment) public riskAssessments;
    mapping(uint256 => FractionalPosition[]) public fractionalPositions;
    mapping(uint256 => PaymentSchedule) public paymentSchedules;
    mapping(address => uint256[]) public borrowerLoans;
    mapping(address => uint256) public liquidityProviderStakes;
    
    uint256 public nextLoanId = 1;
    address public stablecoin;
    address public insurancePool;
    
    // Interest rate parameters (in basis points)
    uint256[] public interestRatesByRisk = [500, 800, 1200, 1600, 2500]; // 5%, 8%, 12%, 16%, 25%
    uint256 public baseInterestRate = 500; // 5%
    uint256 public platformFeePercentage = 200; // 2%
    uint256 public liquidationThreshold = 7000; // 70% of collateral value
    uint256 public defaultLiquidationPenalty = 1500; // 15% penalty fee
    uint256 public insurancePoolPercentage = 100; // 1% to insurance
    
    uint256 public totalLoanVolume = 0;
    uint256 public totalDefaultedAmount = 0;
    uint256 public insuranceReserves = 0;

    // ========== Events ==========
    event LoanCreated(uint256 indexed loanId, address indexed borrower, address indexed nftContract, uint256 nftTokenId, uint256 loanAmount, uint256 interestRate);
    event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amountRepaid);
    event PaymentMade(uint256 indexed loanId, address indexed borrower, uint256 paymentAmount, uint256 principalRemaining);
    event LiquidationInitiated(uint256 indexed loanId, address indexed nftContract, uint256 nftTokenId);
    event LiquidationCompleted(uint256 indexed loanId, uint256 liquidationPrice);
    event DefaultOccurred(uint256 indexed loanId, address indexed borrower);
    event FractionalPositionCreated(uint256 indexed loanId, address indexed investor, uint256 sharePercentage);
    event RiskAssessmentUpdated(uint256 indexed loanId, uint256 riskTier, uint256 newInterestRate);
    event InsuranceClaimPaid(uint256 indexed loanId, uint256 claimAmount);

    // ========== Modifiers ==========
    modifier validLoan(uint256 loanId) {
        require(loanId > 0 && loanId < nextLoanId, "Invalid loan ID");
        _;
    }

    modifier onlyBorrower(uint256 loanId) {
        require(msg.sender == loans[loanId].borrower, "Only borrower can perform this action");
        _;
    }

    modifier activeLoan(uint256 loanId) {
        require(loans[loanId].status == LoanStatus.ACTIVE, "Loan is not active");
        _;
    }

    // ========== Constructor ==========
    constructor(address _stablecoin, address _insurancePool) {
        stablecoin = _stablecoin;
        insurancePool = _insurancePool;
    }

    // ========== Loan Creation ==========

    /**
     * @dev Create a new collateralized loan
     * @param nftContract Address of NFT contract
     * @param nftTokenId Token ID of NFT collateral
     * @param loanAmount Amount to borrow
     * @param loanDuration Duration in days
     * @return loanId The ID of the created loan
     */
    function createLoan(
        address nftContract,
        uint256 nftTokenId,
        uint256 loanAmount,
        uint256 loanDuration
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(nftContract != address(0), "Invalid NFT contract");
        require(loanAmount > 0, "Loan amount must be positive");
        require(loanDuration > 0 && loanDuration <= 1825, "Invalid loan duration"); // Max 5 years
        
        // Verify NFT ownership
        require(IERC721(nftContract).ownerOf(nftTokenId) == msg.sender, "Not NFT owner");
        
        // Assess risk and collateral value
        RiskAssessment memory assessment = _assessRisk(nftContract, nftTokenId);
        uint256 maxLoanAmount = _calculateMaxLoanAmount(assessment.collectionFloorPrice, assessment.riskTier);
        
        require(loanAmount <= maxLoanAmount, "Loan amount exceeds maximum");
        
        // Transfer NFT to contract as collateral
        IERC721(nftContract).transferFrom(msg.sender, address(this), nftTokenId);
        
        // Calculate interest rate based on risk
        uint256 interestRate = interestRatesByRisk[assessment.riskTier];
        
        // Create loan record
        uint256 loanId = nextLoanId++;
        uint256 maturityDate = block.timestamp + (loanDuration * 1 days);
        
        loans[loanId] = Loan({
            borrower: msg.sender,
            nftContract: nftContract,
            nftTokenId: nftTokenId,
            loanAmount: loanAmount,
            principalRemaining: loanAmount,
            interestRate: interestRate,
            collateralValue: assessment.collectionFloorPrice,
            loanStartTime: block.timestamp,
            maturityDate: maturityDate,
            lastPaymentTime: block.timestamp,
            status: LoanStatus.ACTIVE,
            defaultFeeAccrued: 0
        });
        
        // Store risk assessment
        riskAssessments[loanId] = assessment;
        
        // Create payment schedule
        uint256 monthlyPayment = _calculateMonthlyPayment(loanAmount, interestRate, loanDuration);
        paymentSchedules[loanId] = PaymentSchedule({
            loanId: loanId,
            monthlyPayment: monthlyPayment,
            nextPaymentDue: block.timestamp + 30 days,
            paymentsRemaining: (loanDuration / 30) + 1,
            totalPaymentsMade: 0
        });
        
        borrowerLoans[msg.sender].push(loanId);
        totalLoanVolume += loanAmount;
        
        // Transfer stablecoin to borrower
        uint256 platformFee = (loanAmount * platformFeePercentage) / 10000;
        uint256 insuranceFee = (loanAmount * insurancePoolPercentage) / 10000;
        uint256 borrowerAmount = loanAmount - platformFee - insuranceFee;
        
        insuranceReserves += insuranceFee;
        require(IERC20(stablecoin).transfer(msg.sender, borrowerAmount), "Transfer failed");
        
        emit LoanCreated(loanId, msg.sender, nftContract, nftTokenId, loanAmount, interestRate);
        
        return loanId;
    }

    // ========== Loan Repayment ==========

    /**
     * @dev Make a payment towards the loan
     * @param loanId ID of the loan
     * @param paymentAmount Amount to pay
     */
    function makePayment(
        uint256 loanId,
        uint256 paymentAmount
    ) external nonReentrant validLoan(loanId) onlyBorrower(loanId) activeLoan(loanId) {
        Loan storage loan = loans[loanId];
        PaymentSchedule storage schedule = paymentSchedules[loanId];
        
        require(paymentAmount > 0, "Payment amount must be positive");
        
        // Calculate interest accrued
        uint256 timeElapsed = block.timestamp - loan.lastPaymentTime;
        uint256 interestAccrued = _calculateAccruedInterest(
            loan.principalRemaining,
            loan.interestRate,
            timeElapsed
        );
        
        // Add default fees if payment is late
        if (block.timestamp > schedule.nextPaymentDue) {
            uint256 daysLate = (block.timestamp - schedule.nextPaymentDue) / 1 days;
            loan.defaultFeeAccrued += (loan.principalRemaining * 100 * daysLate) / 10000; // 1% per day
        }
        
        uint256 totalDue = loan.principalRemaining + interestAccrued + loan.defaultFeeAccrued;
        require(paymentAmount <= totalDue, "Payment exceeds total amount due");
        
        // Transfer stablecoin from borrower
        require(IERC20(stablecoin).transferFrom(msg.sender, address(this), paymentAmount), "Transfer failed");
        
        // Apply payment: first to default fees, then interest, then principal
        uint256 remainingPayment = paymentAmount;
        
        if (loan.defaultFeeAccrued > 0) {
            uint256 feePortion = _min(remainingPayment, loan.defaultFeeAccrued);
            loan.defaultFeeAccrued -= feePortion;
            remainingPayment -= feePortion;
        }
        
        if (remainingPayment > 0 && interestAccrued > 0) {
            uint256 interestPortion = _min(remainingPayment, interestAccrued);
            remainingPayment -= interestPortion;
        }
        
        if (remainingPayment > 0) {
            loan.principalRemaining -= remainingPayment;
        }
        
        loan.lastPaymentTime = block.timestamp;
        schedule.totalPaymentsMade++;
        schedule.nextPaymentDue = block.timestamp + 30 days;
        
        // Check if loan is fully repaid
        if (loan.principalRemaining == 0) {
            loan.status = LoanStatus.REPAID;
            _releaseLoanCollateral(loanId);
            emit LoanRepaid(loanId, msg.sender, paymentAmount);
        } else {
            emit PaymentMade(loanId, msg.sender, paymentAmount, loan.principalRemaining);
        }
    }

    /**
     * @dev Repay entire loan at once
     * @param loanId ID of the loan
     */
    function repayFullLoan(uint256 loanId) external nonReentrant validLoan(loanId) onlyBorrower(loanId) activeLoan(loanId) {
        Loan storage loan = loans[loanId];
        
        uint256 timeElapsed = block.timestamp - loan.lastPaymentTime;
        uint256 interestAccrued = _calculateAccruedInterest(
            loan.principalRemaining,
            loan.interestRate,
            timeElapsed
        );
        
        uint256 totalRepayment = loan.principalRemaining + interestAccrued + loan.defaultFeeAccrued;
        
        // Transfer stablecoin
        require(IERC20(stablecoin).transferFrom(msg.sender, address(this), totalRepayment), "Transfer failed");
        
        loan.status = LoanStatus.REPAID;
        loan.principalRemaining = 0;
        
        _releaseLoanCollateral(loanId);
        
        emit LoanRepaid(loanId, msg.sender, totalRepayment);
    }

    // ========== Liquidation ==========

    /**
     * @dev Initiate liquidation if loan is underwater
     * @param loanId ID of the loan
     */
    function initiateLiquidation(uint256 loanId) external validLoan(loanId) activeLoan(loanId) nonReentrant {
        Loan storage loan = loans[loanId];
        
        // Check if loan meets liquidation criteria
        uint256 currentCollateralValue = _getCurrentNFTValue(loan.nftContract, loan.nftTokenId);
        uint256 outstandingDebt = loan.principalRemaining + _calculateAccruedInterest(
            loan.principalRemaining,
            loan.interestRate,
            block.timestamp - loan.lastPaymentTime
        );
        
        require(
            currentCollateralValue < (outstandingDebt * 100) / liquidationThreshold,
            "Loan is not underwater"
        );
        
        loan.status = LoanStatus.PENDING_LIQUIDATION;
        
        emit LiquidationInitiated(loanId, loan.nftContract, loan.nftTokenId);
    }

    /**
     * @dev Complete liquidation of collateral
     * @param loanId ID of the loan
     * @param liquidationPrice Price at which NFT was liquidated
     */
    function completeLiquidation(
        uint256 loanId,
        uint256 liquidationPrice
    ) external onlyOwner validLoan(loanId) nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.PENDING_LIQUIDATION, "Not in liquidation status");
        
        uint256 outstandingDebt = loan.principalRemaining + loan.defaultFeeAccrued;
        uint256 liquidationPenalty = (liquidationPrice * defaultLiquidationPenalty) / 10000;
        uint256 totalLiquidationCost = outstandingDebt + liquidationPenalty;
        
        if (liquidationPrice >= totalLiquidationCost) {
            // Surplus available for borrower
            uint256 surplus = liquidationPrice - totalLiquidationCost;
            require(IERC20(stablecoin).transfer(loan.borrower, surplus), "Transfer failed");
        } else if (liquidationPrice < outstandingDebt) {
            // Shortfall covered by insurance
            uint256 shortfall = outstandingDebt - liquidationPrice;
            require(shortfall <= insuranceReserves, "Insufficient insurance reserves");
            insuranceReserves -= shortfall;
            totalDefaultedAmount += shortfall;
            emit InsuranceClaimPaid(loanId, shortfall);
        }
        
        loan.status = LoanStatus.LIQUIDATED;
        
        emit LiquidationCompleted(loanId, liquidationPrice);
    }

    // ========== Risk Assessment ==========

    /**
     * @dev Update risk assessment for a loan
     * @param loanId ID of the loan
     * @param newFloorPrice New floor price for collection
     */
    function updateRiskAssessment(
        uint256 loanId,
        uint256 newFloorPrice
    ) external onlyOwner validLoan(loanId) {
        RiskAssessment storage assessment = riskAssessments[loanId];
        assessment.collectionFloorPrice = newFloorPrice;
        assessment.assessmentTime = block.timestamp;
        
        // Recalculate risk tier
        assessment.riskTier = _calculateRiskTier(assessment);
        
        // Update interest rate
        Loan storage loan = loans[loanId];
        uint256 newInterestRate = interestRatesByRisk[assessment.riskTier];
        loan.interestRate = newInterestRate;
        
        emit RiskAssessmentUpdated(loanId, assessment.riskTier, newInterestRate);
    }

    // ========== Fractional Financing ==========

    /**
     * @dev Create fractional position for a loan
     * @param loanId ID of the loan
     * @param sharePercentage Percentage of loan to finance
     */
    function createFractionalPosition(
        uint256 loanId,
        uint256 sharePercentage
    ) external nonReentrant validLoan(loanId) {
        require(sharePercentage > 0 && sharePercentage <= 10000, "Invalid share percentage");
        
        Loan storage loan = loans[loanId];
        uint256 investmentAmount = (loan.loanAmount * sharePercentage) / 10000;
        
        // Investor receives fractional position
        fractionalPositions[loanId].push(FractionalPosition({
            owner: msg.sender,
            loanId: loanId,
            sharePercentage: sharePercentage,
            investmentAmount: investmentAmount,
            rewardsEarned: 0
        }));
        
        // Investor receives interest on their share
        require(IERC20(stablecoin).transferFrom(msg.sender, address(this), investmentAmount), "Transfer failed");
        
        emit FractionalPositionCreated(loanId, msg.sender, sharePercentage);
    }

    /**
     * @dev Claim rewards on fractional position
     * @param loanId ID of the loan
     */
    function claimFractionalRewards(uint256 loanId) external nonReentrant validLoan(loanId) {
        FractionalPosition[] storage positions = fractionalPositions[loanId];
        
        for (uint256 i = 0; i < positions.length; i++) {
            if (positions[i].owner == msg.sender) {
                uint256 rewards = positions[i].rewardsEarned;
                require(rewards > 0, "No rewards to claim");
                
                positions[i].rewardsEarned = 0;
                require(IERC20(stablecoin).transfer(msg.sender, rewards), "Transfer failed");
                
                return;
            }
        }
        
        revert("No fractional position found");
    }

    // ========== Internal Functions ==========

    /**
     * @dev Release collateral to borrower
     */
    function _releaseLoanCollateral(uint256 loanId) internal {
        Loan storage loan = loans[loanId];
        IERC721(loan.nftContract).transferFrom(address(this), loan.borrower, loan.nftTokenId);
    }

    /**
     * @dev Assess risk of NFT collateral
     */
    function _assessRisk(address nftContract, uint256 nftTokenId) internal view returns (RiskAssessment memory) {
        return RiskAssessment({
            collectionFloorPrice: _getCurrentNFTValue(nftContract, nftTokenId),
            volatilityScore: 50, // Placeholder
            liquidityScore: 60, // Placeholder
            riskTier: 2, // Medium risk default
            assessmentTime: block.timestamp
        });
    }

    /**
     * @dev Calculate maximum loan amount based on collateral
     */
    function _calculateMaxLoanAmount(uint256 collateralValue, uint256 riskTier) internal view returns (uint256) {
        uint256[] memory ltv = new uint256[](5);
        ltv[0] = 8000;
        ltv[1] = 7000;
        ltv[2] = 6000;
        ltv[3] = 5000;
        ltv[4] = 4000;
        return (collateralValue * ltv[riskTier]) / 10000;
    }

    /**
     * @dev Calculate monthly payment using amortization
     */
    function _calculateMonthlyPayment(uint256 principal, uint256 monthlyRate, uint256 months) internal pure returns (uint256) {
        if (monthlyRate == 0) return principal / months;
        
        uint256 monthlyRateDecimal = monthlyRate / 12 / 100;
        uint256 numerator = principal * monthlyRateDecimal * ((monthlyRateDecimal + 1) ** months);
        uint256 denominator = ((monthlyRateDecimal + 1) ** months) - 1;
        
        return numerator / denominator;
    }

    /**
     * @dev Calculate accrued interest
     */
    function _calculateAccruedInterest(uint256 principal, uint256 annualRate, uint256 timeElapsed) internal pure returns (uint256) {
        return (principal * annualRate * timeElapsed) / (365 days * 10000);
    }

    /**
     * @dev Get current NFT value (simplified)
     */
    function _getCurrentNFTValue(address nftContract, uint256 nftTokenId) internal view returns (uint256) {
        // Placeholder - would integrate with oracle
        return 10 ether;
    }

    /**
     * @dev Calculate risk tier
     */
    function _calculateRiskTier(RiskAssessment memory assessment) internal pure returns (uint256) {
        if (assessment.volatilityScore > 80) return 4;
        if (assessment.volatilityScore > 60) return 3;
        if (assessment.volatilityScore > 40) return 2;
        if (assessment.volatilityScore > 20) return 1;
        return 0;
    }

    /**
     * @dev Return minimum of two values
     */
    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    // ========== View Functions ==========

    /**
     * @dev Get loan details
     */
    function getLoanDetails(uint256 loanId) external view validLoan(loanId) returns (Loan memory) {
        return loans[loanId];
    }

    /**
     * @dev Get all loans for borrower
     */
    function getBorrowerLoans(address borrower) external view returns (uint256[] memory) {
        return borrowerLoans[borrower];
    }

    /**
     * @dev Get current debt for a loan
     */
    function getCurrentDebt(uint256 loanId) external view validLoan(loanId) returns (uint256) {
        Loan memory loan = loans[loanId];
        uint256 interestAccrued = _calculateAccruedInterest(
            loan.principalRemaining,
            loan.interestRate,
            block.timestamp - loan.lastPaymentTime
        );
        return loan.principalRemaining + interestAccrued + loan.defaultFeeAccrued;
    }

    /**
     * @dev Check if loan is eligible for liquidation
     */
    function isLiquidationEligible(uint256 loanId) external view validLoan(loanId) returns (bool) {
        Loan memory loan = loans[loanId];
        uint256 currentValue = _getCurrentNFTValue(loan.nftContract, loan.nftTokenId);
        uint256 debt = this.getCurrentDebt(loanId);
        return currentValue < (debt * 100) / liquidationThreshold;
    }
}
