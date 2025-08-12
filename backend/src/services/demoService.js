// backend/src/services/demoService.js - Comprehensive Demo Service
const crypto = require('crypto');
const path = require('path');

class DemoService {
  constructor(db, notificationService, emailService) {
    this.db = db;
    this.notificationService = notificationService;
    this.emailService = emailService;
    this.isRunning = false;
    this.demoProgress = 0;
    this.demoSteps = [];
    
    console.log('🎭 Demo Service initialized');
  }

  // Start the comprehensive demo workflow
  async startDemo() {
    if (this.isRunning) {
      throw new Error('Demo is already running');
    }

    this.isRunning = true;
    this.demoProgress = 0;
    this.demoSteps = [];
    
    console.log('🚀 Starting comprehensive demo workflow...');
    
    try {
      // Step 1: Create a sample case
      await this.createSampleCase();
      this.demoProgress = 20;
      
      // Step 2: Simulate AI analysis and department assignment
      await this.simulateAIAnalysis();
      this.demoProgress = 40;
      
      // Step 3: Create admin notifications and assignments
      await this.createAdminNotifications();
      this.demoProgress = 60;
      
      // Step 4: Simulate case updates and status changes
      await this.simulateCaseUpdates();
      this.demoProgress = 80;
      
      // Step 5: Demonstrate notification system
      await this.demonstrateNotifications();
      this.demoProgress = 100;
      
      console.log('✅ Demo workflow completed successfully!');
      return {
        success: true,
        message: 'Demo workflow completed successfully',
        demoData: this.demoSteps
      };
      
    } catch (error) {
      console.error('❌ Demo workflow failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // Create a realistic sample case
  async createSampleCase() {
    console.log('📝 Creating sample case...');
    
    const sampleCase = {
      report_id: `DEMO_${Date.now()}`,
      anonymous_id: `ANON_DEMO_${Date.now()}`,
      incident_type: 'workplace_harassment',
      incident_date: new Date().toISOString().split('T')[0],
      incident_time: '14:30',
      location: 'Office Building A, Floor 3',
      current_safety: 'safe',
      description: 'A colleague has been making inappropriate comments and gestures during team meetings. This has been ongoing for several weeks and is creating a hostile work environment. I feel uncomfortable and unsafe in these situations.',
      witnesses: 'Several team members have witnessed this behavior',
      evidence: 'I have documented specific incidents with dates and times',
      contact_method: 'email',
      anonymous: true,
      priority: 'high',
      status: 'submitted',
      assigned_department: 'legal',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert the case into the database
    await this.insertCase(sampleCase);
    
    // Create user account for tracking
    const userData = {
      report_id: sampleCase.report_id,
      email: `demo_user_${Date.now()}@safevoice.demo`,
      security_pin: '1234',
      created_at: new Date().toISOString()
    };
    
    await this.createDemoUser(userData);
    
    this.demoSteps.push({
      step: 'Case Creation',
      description: 'Sample workplace harassment case created',
      data: sampleCase,
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Sample case created successfully');
    return sampleCase;
  }

  // Simulate AI analysis and department assignment
  async simulateAIAnalysis() {
    console.log('🤖 Simulating AI analysis...');
    
    // Simulate AI processing time
    await this.delay(2000);
    
    const analysisResult = {
      department_assignment: 'legal',
      confidence_score: 0.94,
      reasoning: 'High confidence in legal team assignment due to workplace harassment keywords and context',
      risk_assessment: 'medium',
      priority_level: 'high',
      ai_suggestions: [
        'Document all incidents with specific details',
        'Consider reporting to HR if available',
        'Maintain evidence of inappropriate behavior',
        'Seek legal counsel if situation escalates'
      ]
    };
    
    this.demoSteps.push({
      step: 'AI Analysis',
      description: 'AI analyzed case and assigned to Legal Team',
      data: analysisResult,
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ AI analysis simulation completed');
    return analysisResult;
  }

  // Create admin notifications and assignments
  async createAdminNotifications() {
    console.log('👥 Creating admin notifications...');
    
    // Simulate admin assignment
    const adminAssignment = {
      assigned_admin: 'legal_team_admin',
      assignment_time: new Date().toISOString(),
      case_priority: 'high',
      estimated_response_time: '4 hours',
      special_instructions: 'Handle with sensitivity - workplace harassment case'
    };
    
    // Create notification for admin
    await this.notificationService.createNotification(
      'legal_team_admin',
      'case_assigned',
      'New High-Priority Case Assigned',
      'A new workplace harassment case has been assigned to your department',
      {
        reportId: 'DEMO_CASE',
        priority: 'high',
        type: 'workplace_harassment'
      }
    );
    
    this.demoSteps.push({
      step: 'Admin Assignment',
      description: 'Case assigned to Legal Team admin',
      data: adminAssignment,
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Admin notifications created');
    return adminAssignment;
  }

  // Simulate case updates and status changes
  async simulateCaseUpdates() {
    console.log('🔄 Simulating case updates...');
    
    const updates = [
      {
        status: 'acknowledged',
        notes: 'Case received and under initial review',
        timestamp: new Date(Date.now() + 1000 * 60 * 30).toISOString() // 30 minutes later
      },
      {
        status: 'under_review',
        notes: 'Legal team conducting thorough investigation',
        timestamp: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString() // 2 hours later
      },
      {
        status: 'in_progress',
        notes: 'Contacting witnesses and gathering additional evidence',
        timestamp: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString() // 4 hours later
      }
    ];
    
    for (const update of updates) {
      await this.delay(1000); // 1 second between updates
      
      // Create notification for user
      await this.notificationService.createNotification(
        'demo_user',
        'status_update',
        'Case Status Updated',
        `Your case status has been updated to: ${update.status}`,
        {
          reportId: 'DEMO_CASE',
          oldStatus: 'submitted',
          newStatus: update.status,
          notes: update.notes
        }
      );
      
      this.demoSteps.push({
        step: 'Status Update',
        description: `Case status updated to ${update.status}`,
        data: update,
        timestamp: update.timestamp
      });
    }
    
    console.log('✅ Case updates simulation completed');
    return updates;
  }

  // Demonstrate notification system
  async demonstrateNotifications() {
    console.log('🔔 Demonstrating notification system...');
    
    const notificationTypes = [
      {
        type: 'message_received',
        title: 'New Message from Legal Team',
        message: 'We have some questions about your case. Please check your messages.',
        metadata: { reportId: 'DEMO_CASE', sender: 'Legal Team' }
      },
      {
        type: 'evidence_requested',
        title: 'Additional Evidence Requested',
        message: 'Please provide any additional documentation or evidence you may have.',
        metadata: { reportId: 'DEMO_CASE', deadline: '48 hours' }
      },
      {
        type: 'session_scheduled',
        title: 'Support Session Scheduled',
        message: 'A support session has been scheduled for tomorrow at 2:00 PM.',
        metadata: { reportId: 'DEMO_CASE', sessionType: 'Legal Consultation', date: 'Tomorrow', time: '2:00 PM' }
      }
    ];
    
    for (const notification of notificationTypes) {
      await this.delay(1500); // 1.5 seconds between notifications
      
      // Create notification
      await this.notificationService.createNotification(
        'demo_user',
        notification.type,
        notification.title,
        notification.message,
        notification.metadata
      );
      
      // Send email notification if enabled
      if (this.emailService && process.env.EMAIL_ENABLED === 'true') {
        try {
          await this.emailService.sendNotificationEmail(
            'demo_user@example.com',
            notification.title,
            notification.message,
            notification.metadata
          );
        } catch (error) {
          console.log('⚠️ Email notification failed (expected in demo):', error.message);
        }
      }
      
      this.demoSteps.push({
        step: 'Notification',
        description: `${notification.type} notification sent`,
        data: notification,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('✅ Notification system demonstration completed');
    return notificationTypes;
  }

  // Helper method to insert case into database
  async insertCase(caseData) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO reports (
          report_id, anonymous_id, incident_type, incident_date, incident_time,
          location, current_safety, description, witnesses, evidence,
          contact_method, anonymous, priority, status, assigned_department,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      this.db.run(query, [
        caseData.report_id,
        caseData.anonymous_id,
        caseData.incident_type,
        caseData.incident_date,
        caseData.incident_time,
        caseData.location,
        caseData.current_safety,
        caseData.description,
        caseData.witnesses,
        caseData.evidence,
        caseData.contact_method,
        caseData.anonymous ? 1 : 0,
        caseData.priority,
        caseData.status,
        caseData.assigned_department,
        caseData.created_at,
        caseData.updated_at
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  // Helper method to create demo user
  async createDemoUser(userData) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO users (report_id, email, security_pin, created_at)
        VALUES (?, ?, ?, ?)
      `;
      
      this.db.run(query, [
        userData.report_id,
        userData.email,
        userData.security_pin,
        userData.created_at
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  // Helper method to add delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get current demo status
  getDemoStatus() {
    return {
      isRunning: this.isRunning,
      progress: this.demoProgress,
      steps: this.demoSteps,
      currentStep: this.demoSteps[this.demoSteps.length - 1] || null
    };
  }

  // Stop demo if running
  stopDemo() {
    if (this.isRunning) {
      this.isRunning = false;
      console.log('⏹️ Demo stopped by user');
      return true;
    }
    return false;
  }

  // Reset demo data
  async resetDemoData() {
    console.log('🔄 Resetting demo data...');
    
    try {
      // Remove demo cases
      await this.removeDemoCases();
      
      // Remove demo users
      await this.removeDemoUsers();
      
      // Remove demo notifications
      await this.removeDemoNotifications();
      
      this.demoSteps = [];
      this.demoProgress = 0;
      
      console.log('✅ Demo data reset completed');
      return true;
    } catch (error) {
      console.error('❌ Failed to reset demo data:', error);
      throw error;
    }
  }

  // Remove demo cases
  async removeDemoCases() {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM reports WHERE report_id LIKE 'DEMO_%'`;
      this.db.run(query, [], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  // Remove demo users
  async removeDemoUsers() {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM users WHERE email LIKE '%@safevoice.demo'`;
      this.db.run(query, [], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  // Remove demo notifications
  async removeDemoNotifications() {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM notifications WHERE userId IN ('demo_user', 'legal_team_admin')`;
      this.db.run(query, [], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }
}

module.exports = DemoService;
