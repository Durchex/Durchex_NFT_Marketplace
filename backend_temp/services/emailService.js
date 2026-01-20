import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

// Email templates
const emailTemplates = {
  'listing-request-approved': (data) => ({
    subject: `Your NFT Listing Request Has Been Approved! 🎉`,
    html: `
      <h2>Great News, ${data.requesterName}!</h2>
      <p>Your NFT listing request for "<strong>${data.nftName}</strong>" has been approved by our admin team.</p>
      
      <p><strong>Request Details:</strong></p>
      <ul>
        <li>NFT Name: ${data.nftName}</li>
        <li>Target Creator: ${data.targetCreatorName}</li>
      </ul>
      
      ${data.adminNotes ? `<p><strong>Admin Notes:</strong> ${data.adminNotes}</p>` : ''}
      
      <p>You can now proceed with your listing. Thank you for using Durchex!</p>
      
      <p>Best regards,<br/>Durchex Team</p>
    `
  }),
  
  'listing-request-rejected': (data) => ({
    subject: `Your NFT Listing Request Has Been Declined`,
    html: `
      <h2>Listing Request Update</h2>
      <p>Hello ${data.requesterName},</p>
      
      <p>Unfortunately, your NFT listing request for "<strong>${data.nftName}</strong>" has been declined by our admin team.</p>
      
      <p><strong>Reason:</strong> ${data.reason}</p>
      
      ${data.adminNotes ? `<p><strong>Additional Notes:</strong> ${data.adminNotes}</p>` : ''}
      
      <p>If you have questions or would like to resubmit, please feel free to contact us.</p>
      
      <p>Best regards,<br/>Durchex Team</p>
    `
  }),
  
  'admin-listing-approved': (data) => ({
    subject: `[ADMIN] Listing Request Approved: ${data.nftName}`,
    html: `
      <h2>Listing Request Approved</h2>
      <p><strong>Request ID:</strong> ${data.requestId}</p>
      <p><strong>Requester:</strong> ${data.requesterName}</p>
      <p><strong>Target Creator:</strong> ${data.targetCreatorName}</p>
      <p><strong>NFT Name:</strong> ${data.nftName}</p>
      
      <p>Status: <span style="color: green; font-weight: bold;">APPROVED</span></p>
    `
  }),
  
  'admin-listing-rejected': (data) => ({
    subject: `[ADMIN] Listing Request Rejected: ${data.nftName}`,
    html: `
      <h2>Listing Request Rejected</h2>
      <p><strong>Request ID:</strong> ${data.requestId}</p>
      <p><strong>Requester:</strong> ${data.requesterName}</p>
      <p><strong>Target Creator:</strong> ${data.targetCreatorName}</p>
      <p><strong>NFT Name:</strong> ${data.nftName}</p>
      <p><strong>Reason:</strong> ${data.reason}</p>
      
      <p>Status: <span style="color: red; font-weight: bold;">REJECTED</span></p>
    `
  }),
  
  'listing-request-submitted': (data) => ({
    subject: `New NFT Listing Request Received`,
    html: `
      <h2>Hello ${data.targetCreatorName},</h2>
      
      <p><strong>${data.requesterName}</strong> has requested to list an NFT on your profile:</p>
      
      <p><strong>NFT Details:</strong></p>
      <ul>
        <li>Name: ${data.nftName}</li>
        <li>Description: ${data.nftDescription || 'N/A'}</li>
      </ul>
      
      ${data.requestMessage ? `<p><strong>Message:</strong> ${data.requestMessage}</p>` : ''}
      
      <p>Please review this request and get back to the requester or wait for admin approval.</p>
      
      <p>Best regards,<br/>Durchex Team</p>
    `
  })
};

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    try {
      // Check if we have email configuration
      const emailService = process.env.EMAIL_SERVICE || 'gmail';
      const emailUser = process.env.EMAIL_USER;
      const emailPassword = process.env.EMAIL_PASSWORD;

      if (!emailUser || !emailPassword) {
        logger.warn('Email service not configured - emails will not be sent');
        return;
      }

      this.transporter = nodemailer.createTransport({
        service: emailService,
        auth: {
          user: emailUser,
          pass: emailPassword
        }
      });

      logger.info('Email service initialized', { service: emailService });
    } catch (error) {
      logger.error('Failed to initialize email service', { error: error.message });
    }
  }

  /**
   * Send email notification
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.template - Template name
   * @param {Object} options.data - Template data
   * @param {string} options.html - Custom HTML (overrides template)
   */
  async sendEmailNotification(options) {
    try {
      if (!this.transporter) {
        logger.warn('Email service not initialized - skipping email send');
        return;
      }

      const { to, subject, template, data = {}, html } = options;

      if (!to || !subject) {
        throw new Error('Email recipient and subject are required');
      }

      // Use custom HTML or get from template
      let emailHtml = html;
      if (!emailHtml && template && emailTemplates[template]) {
        const templateConfig = emailTemplates[template](data);
        emailHtml = templateConfig.html;
      }

      if (!emailHtml) {
        throw new Error('No email template or HTML provided');
      }

      // Add footer to HTML
      const fullHtml = `
        ${emailHtml}
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          This is an automated email from Durchex NFT Marketplace.
          Please do not reply directly to this email.
        </p>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@durchex.com',
        to,
        subject,
        html: fullHtml
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', { to, subject, messageId: info.messageId });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Failed to send email', { error: error.message, to: options.to });
      throw error;
    }
  }

  /**
   * Send email to multiple recipients
   */
  async sendBulkEmails(recipients, options) {
    try {
      const results = [];
      for (const email of recipients) {
        try {
          const result = await this.sendEmailNotification({
            ...options,
            to: email
          });
          results.push({ email, success: true, ...result });
        } catch (error) {
          results.push({ email, success: false, error: error.message });
        }
      }
      return results;
    } catch (error) {
      logger.error('Failed to send bulk emails', { error: error.message });
      throw error;
    }
  }

  /**
   * Send listing request notification to admin
   */
  async notifyAdminListingRequest(listingRequest) {
    try {
      const adminEmails = [
        process.env.ADMIN_EMAIL || 'admin@durchex.com',
        ...((process.env.ADMIN_EMAILS || '').split(',').filter(e => e))
      ];

      const data = {
        requestId: listingRequest.requestId,
        requesterName: listingRequest.requesterName,
        targetCreatorName: listingRequest.targetCreatorName,
        nftName: listingRequest.nftDetails?.name,
        requestMessage: listingRequest.requestMessage
      };

      return await this.sendBulkEmails(adminEmails, {
        subject: `[ADMIN REVIEW] New NFT Listing Request: ${data.nftName}`,
        html: `
          <h2>New Listing Request for Admin Review</h2>
          <p><strong>Request ID:</strong> ${data.requestId}</p>
          <p><strong>Requester:</strong> ${data.requesterName}</p>
          <p><strong>Target Creator:</strong> ${data.targetCreatorName}</p>
          <p><strong>NFT Name:</strong> ${data.nftName}</p>
          ${data.requestMessage ? `<p><strong>Message:</strong> ${data.requestMessage}</p>` : ''}
          <p><strong>Status:</strong> <span style="color: orange; font-weight: bold;">PENDING REVIEW</span></p>
          <p>Please log in to the admin dashboard to review and approve/reject this request.</p>
        `
      });
    } catch (error) {
      logger.error('Failed to notify admin of listing request', { error: error.message });
      throw error;
    }
  }
}

export default new EmailService();
export const sendEmailNotification = (options) => {
  const emailService = new EmailService();
  return emailService.sendEmailNotification(options);
};
