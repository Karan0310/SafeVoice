// src/services/notificationService.js - Comprehensive Notification Service
const nodemailer = require('nodemailer');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

class NotificationService {
  constructor(db) {
    this.db = db;
    this.emailEnabled = process.env.EMAIL_ENABLED === 'true';
    this.smsEnabled = process.env.SMS_ENABLED === 'true';
    
    // Initialize email transporter if enabled
    if (this.emailEnabled) {
      this.initializeEmailService();
    }
    
    // Initialize SMS service if enabled
    if (this.smsEnabled) {
      this.initializeSMSService();
    }

    console.log(`📧 Notification Service initialized:`);
    console.log(`   Email: ${this.emailEnabled ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   SMS: ${this.smsEnabled ? 'ENABLED' : 'DISABLED'}`);
  }

  // Initialize email service
  initializeEmailService() {
    try {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER || process.env.SMTP_USER,
          pass: process.env.EMAIL_APP_PASSWORD || process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false // For development
        }
      });

      // Verify email configuration
      this.emailTransporter.verify((error, success) => {
        if (error) {
          console.error('❌ Email service configuration error:', error.message);
          this.emailEnabled = false;
        } else {
          console.log('✅ Email service ready');
        }
      });

    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.emailEnabled = false;
    }
  }

  // Initialize SMS service (basic structure)
  initializeSMSService() {
    try {
      // Twilio configuration example
      if (process.env.SMS_ACCOUNT_SID && process.env.SMS_AUTH_TOKEN) {
        // const twilio = require('twilio');
        // this.smsClient = twilio(process.env.SMS_ACCOUNT_SID, process.env.SMS_AUTH_TOKEN);
        console.log('✅ SMS service configuration found');
      } else {
        console.log('⚠️  SMS service credentials not configured');
        this.smsEnabled = false;
      }
    } catch (error) {
      console.error('❌ Failed to initialize SMS service:', error);
      this.smsEnabled = false;
    }
  }

  // Create notification in database
  async createNotification(userId, type, title, message, metadata = {}) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO notifications (userId, reportId, type, title, message, metadata, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      this.db.run(query, [
        userId,
        metadata.reportId || null,
        type,
        title,
        message,
        JSON.stringify(metadata)
      ], function(err) {
        if (err) {
          console.error('❌ Error creating notification:', err);
          reject(err);
        } else {
          console.log(`📢 Notification created: ${title} for user ${userId}`);
          resolve({
            id: this.lastID,
            userId,
            type,
            title,
            message,
            metadata,
            createdAt: new Date().toISOString()
          });
        }
      });
    });
  }

  // Get user notifications
  async getUserNotifications(userId, limit = 50) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, userId, reportId, type, title, message, metadata, isRead, createdAt, readAt
        FROM notifications
        WHERE userId = ?
        ORDER BY createdAt DESC
        LIMIT ?
      `;

      this.db.all(query, [userId, limit], (err, notifications) => {
        if (err) {
          console.error('❌ Error fetching notifications:', err);
          reject(err);
        } else {
          const parsedNotifications = notifications.map(notif => ({
            ...notif,
            metadata: notif.metadata ? JSON.parse(notif.metadata) : {},
            isRead: !!notif.isRead
          }));
          resolve(parsedNotifications);
        }
      });
    });
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE notifications 
        SET isRead = 1, readAt = CURRENT_TIMESTAMP
        WHERE id = ? AND userId = ?
      `;

      this.db.run(query, [notificationId, userId], function(err) {
        if (err) {
          console.error('❌ Error marking notification as read:', err);
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Notification not found'));
        } else {
          console.log(`📖 Notification ${notificationId} marked as read`);
          resolve();
        }
      });
    });
  }

  // Send notification (database + email/SMS if configured)
  async sendNotification(userId, type, title, message, metadata = {}) {
    try {
      // Create notification in database
      const notification = await this.createNotification(userId, type, title, message, metadata);

      // Get user contact information
      const userInfo = await this.getUserContactInfo(userId);

      // Send email if enabled and user has email
      if (this.emailEnabled && userInfo && userInfo.email) {
        try {
          await this.sendEmailNotification(userInfo.email, title, message, metadata);
          console.log(`📧 Email notification sent to ${userInfo.email}`);
        } catch (emailError) {
          console.error('❌ Email notification failed:', emailError.message);
        }
      }

      // Send SMS if enabled and user has phone
      if (this.smsEnabled && userInfo && userInfo.phone) {
        try {
          await this.sendSMSNotification(userInfo.phone, title, message);
          console.log(`📱 SMS notification sent to ${userInfo.phone}`);
        } catch (smsError) {
          console.error('❌ SMS notification failed:', smsError.message);
        }
      }

      return notification;

    } catch (error) {
      console.error('❌ Failed to send notification:', error);
      throw error;
    }
  }

  // Get user contact information
  async getUserContactInfo(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT u.email, r.contact_info, r.contact_method
        FROM users u
        LEFT JOIN reports r ON u.id = r.user_id
        WHERE u.id = ?
        LIMIT 1
      `;

      this.db.get(query, [userId], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? {
            email: result.email || (result.contact_method === 'email' ? result.contact_info : null),
            phone: result.contact_method === 'phone' ? result.contact_info : null
          } : null);
        }
      });
    });
  }

  // Send email notification
  async sendEmailNotification(email, title, message, metadata = {}) {
    if (!this.emailEnabled || !this.emailTransporter) {
      throw new Error('Email service not available');
    }

    const htmlContent = this.generateEmailHTML(title, message, metadata);

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'SafeVoice Portal'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `SafeVoice: ${title}`,
      text: message,
      html: htmlContent
    };

    return this.emailTransporter.sendMail(mailOptions);
  }

  // Generate email HTML template
  generateEmailHTML(title, message, metadata) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { padding: 15px; font-size: 12px; color: #666; text-align: center; }
            .button { display: inline-block; padding: 10px 20px; background: #4f46e5; color: white; text-decoration: none; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🛡️ SafeVoice Portal</h1>
            </div>
            <div class="content">
                <h2>${title}</h2>
                <p>${message}</p>
                
                ${metadata.reportId ? `
                <p><strong>Report ID:</strong> ${metadata.reportId}</p>
                ` : ''}
                
                ${metadata.actionUrl ? `
                <p><a href="${metadata.actionUrl}" class="button">View Details</a></p>
                ` : ''}
            </div>
            <div class="footer">
                <p>This is an automated message from SafeVoice Portal. Please do not reply to this email.</p>
                <p>If you have questions, please log in to your account or contact support.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Send SMS notification (basic implementation)
  async sendSMSNotification(phone, title, message) {
    if (!this.smsEnabled) {
      throw new Error('SMS service not available');
    }

    // Twilio implementation example
    // if (this.smsClient) {
    //   const smsMessage = `SafeVoice: ${title}\n\n${message}`;
    //   return this.smsClient.messages.create({
    //     body: smsMessage,
    //     from: process.env.SMS_FROM_NUMBER,
    //     to: phone
    //   });
    // }

    console.log(`📱 SMS would be sent to ${phone}: ${title}`);
    return Promise.resolve(); // Mock success
  }

  // Predefined notification types
  static TYPES = {
    CASE_UPDATE: 'case_update',
    STATUS_CHANGE: 'status_change',
    NEW_MESSAGE: 'new_message',
    SESSION_REMINDER: 'session_reminder',
    SESSION_CONFIRMED: 'session_confirmed',
    DOCUMENT_UPLOAD: 'document_upload',
    URGENT_ALERT: 'urgent_alert',
    SYSTEM_MAINTENANCE: 'system_maintenance'
  };

  // Quick notification methods
  async notifyStatusChange(userId, reportId, oldStatus, newStatus, notes = '') {
    return this.sendNotification(
      userId,
      NotificationService.TYPES.STATUS_CHANGE,
      'Case Status Updated',
      `Your case status has been updated from "${oldStatus}" to "${newStatus}".${notes ? ` Notes: ${notes}` : ''}`,
      { reportId, oldStatus, newStatus, notes }
    );
  }

  async notifyNewMessage(userId, reportId, senderName, preview) {
    return this.sendNotification(
      userId,
      NotificationService.TYPES.NEW_MESSAGE,
      'New Message Received',
      `You have a new message from ${senderName}: ${preview.substring(0, 100)}...`,
      { reportId, senderName }
    );
  }

  async notifySessionReminder(userId, reportId, sessionType, date, time) {
    return this.sendNotification(
      userId,
      NotificationService.TYPES.SESSION_REMINDER,
      'Session Reminder',
      `Reminder: Your ${sessionType} session is scheduled for ${date} at ${time}.`,
      { reportId, sessionType, date, time }
    );
  }
}

// Export singleton instance
let notificationService = null;

function initializeNotificationService(db) {
  if (!notificationService) {
    notificationService = new NotificationService(db);
  }
  return notificationService;
}

module.exports = {
  NotificationService,
  initializeNotificationService,
  getInstance: () => notificationService
};