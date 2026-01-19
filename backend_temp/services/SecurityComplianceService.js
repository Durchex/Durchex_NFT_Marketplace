/**
 * Security & Compliance Service - KYC, AML, Fraud Detection, Contract Security
 * Features:
 * - Know Your Customer (KYC) verification
 * - Anti-Money Laundering (AML) screening
 * - Security audits and contract verification
 * - Fraud detection and risk scoring
 * - Compliance reporting
 */

const logger = require('../utils/logger');

class SecurityComplianceService {
  constructor() {
    this.kycVerifications = new Map();
    this.amlFlags = new Map();
    this.securityAudits = new Map();
    this.fraudScores = new Map();
    this.complianceReports = [];
    
    // Risk tiers
    this.riskTiers = {
      LOW: 0.25,
      MEDIUM: 0.5,
      HIGH: 0.75,
      CRITICAL: 1.0
    };
    
    // KYC levels
    this.kycLevels = ['UNVERIFIED', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3'];
    
    // Compliance rules
    this.complianceRules = this.initializeComplianceRules();
  }

  // ========== KYC Verification ==========

  /**
   * Initiate KYC verification
   */
  async initiateKYCVerification(userAddress, data) {
    try {
      if (!userAddress || !data) {
        throw new Error('User address and KYC data required');
      }

      const verification = {
        id: `kyc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userAddress,
        status: 'PENDING',
        level: 'LEVEL_1',
        submittedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          country: data.country,
          documentType: data.documentType,
          documentId: data.documentId,
          verificationMethod: 'manual' // or 'automated'
        },
        riskScore: this.calculateInitialRiskScore(data),
        flags: []
      };

      // Check for initial red flags
      const flags = this.checkKYCRedFlags(verification);
      if (flags.length > 0) {
        verification.flags = flags;
        verification.status = 'FLAGGED';
      }

      this.kycVerifications.set(userAddress, verification);

      logger.info('KYC verification initiated', {
        userAddress,
        level: verification.level,
        riskScore: verification.riskScore
      });

      return verification;
    } catch (error) {
      logger.error('KYC verification error', { error: error.message });
      throw error;
    }
  }

  /**
   * Approve KYC verification
   */
  async approveKYCVerification(userAddress, approverAddress, level = 'LEVEL_1') {
    try {
      const verification = this.kycVerifications.get(userAddress);
      
      if (!verification) {
        throw new Error('KYC verification not found');
      }

      verification.status = 'APPROVED';
      verification.level = level;
      verification.approvedAt = new Date();
      verification.approvedBy = approverAddress;

      logger.info('KYC verification approved', {
        userAddress,
        level,
        approver: approverAddress
      });

      return verification;
    } catch (error) {
      logger.error('KYC approval error', { error: error.message });
      throw error;
    }
  }

  /**
   * Reject KYC verification
   */
  async rejectKYCVerification(userAddress, reason, rejectedBy) {
    try {
      const verification = this.kycVerifications.get(userAddress);
      
      if (!verification) {
        throw new Error('KYC verification not found');
      }

      verification.status = 'REJECTED';
      verification.rejectionReason = reason;
      verification.rejectedAt = new Date();
      verification.rejectedBy = rejectedBy;

      logger.warn('KYC verification rejected', {
        userAddress,
        reason
      });

      return verification;
    } catch (error) {
      logger.error('KYC rejection error', { error: error.message });
      throw error;
    }
  }

  /**
   * Get KYC status for user
   */
  async getKYCStatus(userAddress) {
    try {
      const verification = this.kycVerifications.get(userAddress);
      
      if (!verification) {
        return {
          status: 'UNVERIFIED',
          level: 'UNVERIFIED'
        };
      }

      return {
        status: verification.status,
        level: verification.level,
        expiresAt: verification.expiresAt,
        riskScore: verification.riskScore,
        flags: verification.flags
      };
    } catch (error) {
      logger.error('Get KYC status error', { error: error.message });
      throw error;
    }
  }

  // ========== AML Screening ==========

  /**
   * Screen transaction for AML compliance
   */
  async screenTransaction(transactionData) {
    try {
      const {
        fromAddress,
        toAddress,
        amount,
        token,
        transactionHash
      } = transactionData;

      const screening = {
        id: `aml-${Date.now()}`,
        transactionHash,
        fromAddress,
        toAddress,
        amount,
        token,
        timestamp: new Date(),
        status: 'CLEAR',
        riskScore: 0,
        flags: []
      };

      // Check for suspicious patterns
      const flags = this.checkAMLRedFlags(transactionData);
      
      if (flags.length > 0) {
        screening.flags = flags;
        screening.status = 'FLAGGED';
        screening.riskScore = Math.min(1.0, flags.length * 0.1);
        
        // Store flagged transaction
        this.amlFlags.set(transactionHash, screening);
        
        logger.warn('Transaction flagged for AML review', {
          transactionHash,
          flags: flags.length
        });
      }

      return screening;
    } catch (error) {
      logger.error('AML screening error', { error: error.message });
      throw error;
    }
  }

  /**
   * Get AML flags for review
   */
  async getAMLFlags(limit = 50) {
    try {
      const flags = Array.from(this.amlFlags.values())
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, limit);
      
      return flags;
    } catch (error) {
      logger.error('Get AML flags error', { error: error.message });
      throw error;
    }
  }

  /**
   * Resolve AML flag
   */
  async resolveAMLFlag(transactionHash, resolution, reviewedBy) {
    try {
      const flag = this.amlFlags.get(transactionHash);
      
      if (!flag) {
        throw new Error('AML flag not found');
      }

      flag.resolution = resolution; // 'APPROVED', 'REJECTED', 'ESCALATED'
      flag.resolvedAt = new Date();
      flag.reviewedBy = reviewedBy;

      logger.info('AML flag resolved', {
        transactionHash,
        resolution
      });

      return flag;
    } catch (error) {
      logger.error('Resolve AML flag error', { error: error.message });
      throw error;
    }
  }

  // ========== Security Audits ==========

  /**
   * Create security audit
   */
  async createSecurityAudit(contractAddress, auditType, auditorAddress) {
    try {
      const audit = {
        id: `audit-${Date.now()}`,
        contractAddress,
        type: auditType, // 'CODE_REVIEW', 'FUNCTIONAL_TEST', 'PENETRATION_TEST'
        auditorAddress,
        startDate: new Date(),
        status: 'IN_PROGRESS',
        findings: [],
        vulnerabilities: {
          critical: [],
          high: [],
          medium: [],
          low: []
        },
        score: 0
      };

      this.securityAudits.set(audit.id, audit);

      logger.info('Security audit created', {
        auditId: audit.id,
        contractAddress,
        type: auditType
      });

      return audit;
    } catch (error) {
      logger.error('Create security audit error', { error: error.message });
      throw error;
    }
  }

  /**
   * Add finding to security audit
   */
  async addAuditFinding(auditId, finding) {
    try {
      const audit = this.securityAudits.get(auditId);
      
      if (!audit) {
        throw new Error('Audit not found');
      }

      const auditFinding = {
        id: `finding-${Date.now()}`,
        severity: finding.severity, // 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
        title: finding.title,
        description: finding.description,
        recommendation: finding.recommendation,
        status: 'OPEN'
      };

      audit.findings.push(auditFinding);
      audit.vulnerabilities[finding.severity.toLowerCase()].push(auditFinding);

      // Calculate audit score
      audit.score = this.calculateAuditScore(audit);

      logger.info('Audit finding added', {
        auditId,
        severity: finding.severity
      });

      return auditFinding;
    } catch (error) {
      logger.error('Add audit finding error', { error: error.message });
      throw error;
    }
  }

  /**
   * Complete security audit
   */
  async completeSecurityAudit(auditId, reviewedBy) {
    try {
      const audit = this.securityAudits.get(auditId);
      
      if (!audit) {
        throw new Error('Audit not found');
      }

      audit.status = 'COMPLETED';
      audit.endDate = new Date();
      audit.reviewedBy = reviewedBy;

      logger.info('Security audit completed', {
        auditId,
        score: audit.score
      });

      return audit;
    } catch (error) {
      logger.error('Complete audit error', { error: error.message });
      throw error;
    }
  }

  /**
   * Get security audit
   */
  async getSecurityAudit(auditId) {
    try {
      const audit = this.securityAudits.get(auditId);
      
      if (!audit) {
        throw new Error('Audit not found');
      }

      return audit;
    } catch (error) {
      logger.error('Get security audit error', { error: error.message });
      throw error;
    }
  }

  // ========== Fraud Detection ==========

  /**
   * Calculate fraud score for user
   */
  async calculateFraudScore(userAddress, activity) {
    try {
      let score = 0;
      const details = [];

      // Check transaction velocity
      if (activity.transactionCount > 100 && activity.timeWindow < 3600) {
        score += 0.25;
        details.push('High transaction velocity');
      }

      // Check amount anomalies
      if (activity.averageAmount && activity.currentAmount > activity.averageAmount * 5) {
        score += 0.2;
        details.push('Unusual transaction amount');
      }

      // Check geographic inconsistencies
      if (activity.previousCountry && activity.currentCountry !== activity.previousCountry) {
        score += 0.15;
        details.push('Geographic anomaly');
      }

      // Check new recipient patterns
      if (activity.newRecipientCount > activity.historicalCount * 2) {
        score += 0.15;
        details.push('Unusual recipient pattern');
      }

      // Check for mixing patterns (chain hopping)
      if (activity.chainSwaps > 10 && activity.timeWindow < 86400) {
        score += 0.2;
        details.push('Suspicious chain swapping');
      }

      // Normalize score
      const fraudScore = Math.min(1.0, score);

      const fraud = {
        userAddress,
        score: fraudScore,
        riskLevel: this.getRiskLevel(fraudScore),
        details,
        timestamp: new Date()
      };

      this.fraudScores.set(userAddress, fraud);

      if (fraudScore > 0.6) {
        logger.warn('High fraud score detected', {
          userAddress,
          score: fraudScore,
          details
        });
      }

      return fraud;
    } catch (error) {
      logger.error('Fraud score calculation error', { error: error.message });
      throw error;
    }
  }

  /**
   * Get fraud score for user
   */
  async getFraudScore(userAddress) {
    try {
      const fraud = this.fraudScores.get(userAddress);
      
      if (!fraud) {
        return {
          score: 0,
          riskLevel: 'LOW',
          details: []
        };
      }

      return fraud;
    } catch (error) {
      logger.error('Get fraud score error', { error: error.message });
      throw error;
    }
  }

  // ========== Compliance Reporting ==========

  /**
   * Generate compliance report
   */
  async generateComplianceReport(startDate, endDate) {
    try {
      const report = {
        id: `report-${Date.now()}`,
        period: { startDate, endDate },
        generatedAt: new Date(),
        sections: {
          kyc: this.getKYCReport(),
          aml: this.getAMLReport(),
          audit: this.getAuditReport(),
          fraud: this.getFraudReport()
        }
      };

      this.complianceReports.push(report);

      logger.info('Compliance report generated', {
        reportId: report.id,
        period: `${startDate} to ${endDate}`
      });

      return report;
    } catch (error) {
      logger.error('Generate compliance report error', { error: error.message });
      throw error;
    }
  }

  /**
   * Get compliance reports
   */
  async getComplianceReports(limit = 10) {
    try {
      return this.complianceReports
        .sort((a, b) => b.generatedAt - a.generatedAt)
        .slice(0, limit);
    } catch (error) {
      logger.error('Get compliance reports error', { error: error.message });
      throw error;
    }
  }

  // ========== Private Helper Methods ==========

  initializeComplianceRules() {
    return {
      maxTransactionAmount: 100000, // USD
      maxDailyVolume: 500000, // USD
      minKYCLevel: 'LEVEL_1',
      amlThreshold: 0.5,
      fraudThreshold: 0.6,
      autoFlagCountries: ['IRAN', 'NORTH_KOREA', 'SYRIA'],
      restrictedEntities: []
    };
  }

  calculateInitialRiskScore(data) {
    let score = 0;

    // Check country risk
    if (this.complianceRules.autoFlagCountries.includes(data.country)) {
      score += 0.5;
    }

    // Check age (must be 18+)
    const age = this.calculateAge(data.dateOfBirth);
    if (age < 18) {
      score += 0.3;
    } else if (age > 80) {
      score += 0.1; // Slight additional scrutiny
    }

    return Math.min(1.0, score);
  }

  checkKYCRedFlags(verification) {
    const flags = [];

    if (this.complianceRules.autoFlagCountries.includes(verification.data.country)) {
      flags.push('High-risk country');
    }

    if (!verification.data.documentId) {
      flags.push('Missing document');
    }

    if (verification.riskScore > 0.5) {
      flags.push('High initial risk score');
    }

    return flags;
  }

  checkAMLRedFlags(transaction) {
    const flags = [];

    // Check round amounts (potential layering)
    if (transaction.amount % 1000 === 0) {
      flags.push('Round amount');
    }

    // Check for rapid transfers
    if (transaction.timestamp && Date.now() - transaction.timestamp < 60000) {
      flags.push('Rapid transaction');
    }

    // Check high amount
    if (transaction.amount > this.complianceRules.maxTransactionAmount) {
      flags.push('Exceeds amount threshold');
    }

    return flags;
  }

  calculateAge(dateOfBirth) {
    const today = new Date();
    let age = today.getFullYear() - new Date(dateOfBirth).getFullYear();
    const monthDiff = today.getMonth() - new Date(dateOfBirth).getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < new Date(dateOfBirth).getDate())) {
      age--;
    }
    return age;
  }

  calculateAuditScore(audit) {
    const criticalCount = audit.vulnerabilities.critical.length;
    const highCount = audit.vulnerabilities.high.length;
    const mediumCount = audit.vulnerabilities.medium.length;

    let score = 100;
    score -= criticalCount * 30;
    score -= highCount * 15;
    score -= mediumCount * 5;

    return Math.max(0, score);
  }

  getRiskLevel(score) {
    if (score < 0.25) return 'LOW';
    if (score < 0.5) return 'MEDIUM';
    if (score < 0.75) return 'HIGH';
    return 'CRITICAL';
  }

  getKYCReport() {
    const verifications = Array.from(this.kycVerifications.values());
    return {
      total: verifications.length,
      approved: verifications.filter(v => v.status === 'APPROVED').length,
      pending: verifications.filter(v => v.status === 'PENDING').length,
      rejected: verifications.filter(v => v.status === 'REJECTED').length,
      flagged: verifications.filter(v => v.status === 'FLAGGED').length
    };
  }

  getAMLReport() {
    const flags = Array.from(this.amlFlags.values());
    return {
      total: flags.length,
      cleared: flags.filter(f => f.resolution === 'APPROVED').length,
      escalated: flags.filter(f => f.resolution === 'ESCALATED').length,
      rejected: flags.filter(f => f.resolution === 'REJECTED').length,
      avgRiskScore: flags.length > 0 ? flags.reduce((sum, f) => sum + f.riskScore, 0) / flags.length : 0
    };
  }

  getAuditReport() {
    const audits = Array.from(this.securityAudits.values());
    return {
      total: audits.length,
      completed: audits.filter(a => a.status === 'COMPLETED').length,
      inProgress: audits.filter(a => a.status === 'IN_PROGRESS').length,
      avgScore: audits.length > 0 ? audits.reduce((sum, a) => sum + a.score, 0) / audits.length : 0,
      criticalFindings: audits.reduce((sum, a) => sum + a.vulnerabilities.critical.length, 0)
    };
  }

  getFraudReport() {
    const frauds = Array.from(this.fraudScores.values());
    return {
      total: frauds.length,
      highRisk: frauds.filter(f => f.riskLevel === 'HIGH' || f.riskLevel === 'CRITICAL').length,
      avgScore: frauds.length > 0 ? frauds.reduce((sum, f) => sum + f.score, 0) / frauds.length : 0
    };
  }
}

module.exports = SecurityComplianceService;
