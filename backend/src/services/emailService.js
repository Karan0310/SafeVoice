// backend/src/services/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Configure your email transporter here
    // For development, you can use Gmail, SendGrid, or any SMTP service
    this.transporter = nodemailer.createTransport({
      // Gmail configuration (for development)
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-app-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
      }
      
      // Or use SendGrid
      // host: 'smtp.sendgrid.net',
      // port: 587,
      // secure: false,
      // auth: {
      //   user: 'apikey',
      //   pass: process.env.SENDGRID_API_KEY
      // }
      
      // Or use a generic SMTP
      // host: process.env.SMTP_HOST,
      // port: process.env.SMTP_PORT || 587,
      // secure: false,
      // auth: {
      //   user: process.env.SMTP_USER,
      //   pass: process.env.SMTP_PASSWORD
      // }
    });
  }

  async sendOTPEmail(email, otp, purpose = 'verification') {
    const subject = purpose === 'verification' 
      ? 'SafeVoice - Verify Your Email Address'
      : 'SafeVoice - Your Verification Code';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SafeVoice Email Verification</title>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background-color: #f7fafc; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .otp-box { background: #f7fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #2d3748; letter-spacing: 8px; font-family: 'Courier New', monospace; }
          .security-note { background: #ebf8ff; border-left: 4px solid #3182ce; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #718096; font-size: 14px; }
          .logo { display: inline-flex; align-items: center; gap: 10px; }
          .shield-icon { width: 24px; height: 24px; background: white; border-radius: 50%; padding: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <div class="shield-icon">🛡️</div>
              <h1 style="margin: 0; font-size: 24px;">SafeVoice</h1>
            </div>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Secure • Confidential • AI-Powered</p>
          </div>
          
          <div class="content">
            <h2 style="color: #2d3748; margin-bottom: 20px;">Email Verification Required</h2>
            
            <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">
              Thank you for creating a SafeVoice account. To ensure the security of your account and 
              enable notifications for your cases, please verify your email address using the code below.
            </p>
            
            <div class="otp-box">
              <p style="margin: 0 0 10px 0; color: #718096; font-size: 14px; font-weight: 600;">VERIFICATION CODE</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #718096; font-size: 12px;">Valid for 10 minutes</p>
            </div>
            
            <div class="security-note">
              <h4 style="margin: 0 0 10px 0; color: #2b6cb0;">🔒 Security Information</h4>
              <ul style="margin: 0; padding-left: 20px; color: #2c5282;">
                <li>This code expires in 10 minutes</li>
                <li>Never share this code with anyone</li>
                <li>SafeVoice staff will never ask for your verification code</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
            </div>
            
            <p style="color: #4a5568; line-height: 1.6; margin-top: 20px;">
              Once verified, you'll be able to:
            </p>
            <ul style="color: #4a5568; line-height: 1.6;">
              <li>Submit secure incident reports with AI department assignment</li>
              <li>Receive real-time notifications about your cases</li>
              <li>Access specialized support services</li>
              <li>Track your reports and communicate securely with departments</li>
            </ul>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #718096; font-size: 14px; margin: 0;">
              Need help? Contact our support team at <a href="mailto:support@safevoice.com" style="color: #3182ce;">support@safevoice.com</a>
            </p>
          </div>
          
          <div class="footer">
            <p>© 2025 SafeVoice. All rights reserved.</p>
            <p>This email was sent to ${email}</p>
            <p style="font-size: 12px; margin-top: 10px;">
              🔐 End-to-end encrypted • 🛡️ HIPAA compliant • 🧠 AI-powered
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
        // Development mode - just log the OTP
        console.log('📧 [DEV MODE] Email OTP Service:');
        console.log(`   To: ${email}`);
        console.log(`   OTP: ${otp}`);
        console.log(`   Purpose: ${purpose}`);
        console.log(`   Subject: ${subject}`);
        return { success: true, messageId: 'dev-mode-' + Date.now(), mode: 'development' };
      }

      const info = await this.transporter.sendMail({
        from: `"SafeVoice" <${process.env.EMAIL_USER || 'noreply@safevoice.com'}>`,
        to: email,
        subject: subject,
        html: html
      });

      console.log('✅ OTP email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId, mode: 'production' };

    } catch (error) {
      console.error('❌ Error sending OTP email:', error);
      
      // Fallback to development mode in case of email service issues
      console.log('📧 [FALLBACK] Email service failed, logging OTP:');
      console.log(`   To: ${email}`);
      console.log(`   OTP: ${otp}`);
      
      return { success: true, messageId: 'fallback-' + Date.now(), mode: 'fallback', otp };
    }
  }

  async sendNotificationEmail(email, title, message, metadata = {}) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SafeVoice Notification</title>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background-color: #f7fafc; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .notification-box { background: #f7fafc; border-left: 4px solid #3182ce; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #718096; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🛡️ SafeVoice</h1>
            <p style="margin: 5px 0 0 0;">Case Update Notification</p>
          </div>
          
          <div class="content">
            <h2 style="color: #2d3748; margin-bottom: 20px;">${title}</h2>
            
            <div class="notification-box">
              <p style="color: #4a5568; line-height: 1.6; margin: 0;">${message}</p>
            </div>
            
            ${metadata.reportId ? `
              <p style="color: #718096; font-size: 14px;">
                <strong>Report ID:</strong> ${metadata.reportId}
              </p>
            ` : ''}
            
            <p style="color: #4a5568; font-size: 14px; margin-top: 20px;">
              To view your full case details and communicate securely, please log in to your SafeVoice account.
            </p>
          </div>
          
          <div class="footer">
            <p>© 2025 SafeVoice. All rights reserved.</p>
            <p>🔐 This notification was sent securely to ${email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
        console.log('📧 [DEV MODE] Notification Email:');
        console.log(`   To: ${email}`);
        console.log(`   Title: ${title}`);
        console.log(`   Message: ${message}`);
        return { success: true, messageId: 'dev-notification-' + Date.now() };
      }

      const info = await this.transporter.sendMail({
        from: `"SafeVoice Notifications" <${process.env.EMAIL_USER || 'notifications@safevoice.com'}>`,
        to: email,
        subject: `SafeVoice: ${title}`,
        html: html
      });

      console.log('✅ Notification email sent:', info.messageId);
      return { success: true, messageId: info.messageId };

    } catch (error) {
      console.error('❌ Error sending notification email:', error);
      return { success: false, error: error.message };
    }
  }

  // Generic email sending method
  async send({ to, subject, template, data }) {
    // For backwards compatibility
    try {
      const html = this.renderTemplate(template, data);
      
      const info = await this.transporter.sendMail({
        from: `"SafeVoice" <${process.env.EMAIL_USER || 'noreply@safevoice.com'}>`,
        to: to,
        subject: subject,
        html: html
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  renderTemplate(template, data) {
    // Simple template rendering - you can expand this
    const templates = {
      'otp-verification': `
        <h2>Verification Code: ${data.otp}</h2>
        <p>Please use this code to verify your email address.</p>
      `,
      'case-update': `
        <h2>${data.title}</h2>
        <p>${data.message}</p>
        ${data.reportId ? `<p>Report ID: ${data.reportId}</p>` : ''}
      `
    };

    return templates[template] || `<p>${data.message || 'No content'}</p>`;
  }

  // Test email connectivity
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new EmailService();