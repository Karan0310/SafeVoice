// users.js - User authentication and management routes for SafeVoice

const express = require('express');
const router = express.Router();

module.exports = (sharedContext) => {
  const { db, bcrypt, jwt, crypto, hashIP } = sharedContext;

  // User Authentication middleware for this module
  const authenticateUser = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required', success: false });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('JWT verification error:', err);
        return res.status(403).json({ error: 'Invalid or expired token', success: false });
      }

      // Handle different user authentication methods
      req.user = {
        userId: decoded.userId,
        reportId: decoded.reportId,
        authMethod: decoded.authMethod || 'report',
        anonymous: decoded.anonymous || false
      };

      console.log(`🔐 User authenticated: ${req.user.authMethod} for report ${req.user.reportId}`);
      next();
    });
  };

  // Rate limiting for auth endpoints
  const authLimiter = require('express-rate-limit')({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // ==================== USER AUTHENTICATION ====================

  // User Login (Report-based authentication)
  router.post('/auth/login', authLimiter, async (req, res) => {
    try {
      const { reportId, email, securityPin } = req.body;

      console.log(`🔑 User login attempt for report: ${reportId}`);

      if (!reportId) {
        return res.status(400).json({ 
          error: 'Report ID is required',
          success: false 
        });
      }

      if (!email && !securityPin) {
        return res.status(400).json({ 
          error: 'Either email or security PIN is required',
          success: false 
        });
      }

      // Find the report and associated user
      const query = `
        SELECT r.*, u.anonymous_id, u.email as user_email, u.security_pin, u.id as user_id
        FROM reports r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.report_id = ?
      `;

      db.get(query, [reportId.toUpperCase()], async (err, result) => {
        if (err) {
          console.error('Database error during user login:', err);
          return res.status(500).json({ error: 'Internal server error', success: false });
        }

        if (!result) {
          return res.status(404).json({ 
            error: 'Report not found',
            success: false 
          });
        }

        // Verify credentials
        let authenticated = false;
        let authMethod = '';

        if (email && result.user_email) {
          if (email.toLowerCase() === result.user_email.toLowerCase()) {
            authenticated = true;
            authMethod = 'email';
          }
        }

        if (securityPin && result.security_pin) {
          if (securityPin === result.security_pin) {
            authenticated = true;
            authMethod = 'pin';
          }
        }

        if (!authenticated) {
          return res.status(401).json({ 
            error: 'Invalid credentials',
            success: false 
          });
        }

        // Generate JWT token for user
        const tokenPayload = {
          userId: result.user_id,
          reportId: result.report_id,
          authMethod: authMethod,
          anonymous: result.anonymous === 1
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { 
          expiresIn: '24h' 
        });

        // Store user session
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        db.run(
          'INSERT INTO user_sessions (user_id, report_id, token_hash, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
          [result.user_id, result.report_id, tokenHash, expiresAt, req.ip, req.get('User-Agent') || ''],
          (err) => {
            if (err) {
              console.error('Error storing user session:', err);
              return res.status(500).json({ error: 'Failed to create session', success: false });
            }

            // Update last login
            db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP, last_active = CURRENT_TIMESTAMP WHERE id = ?', [result.user_id]);

            console.log(`✅ USER LOGIN SUCCESSFUL: ${authMethod} auth for report ${result.report_id}`);

            res.json({
              success: true,
              token,
              user: {
                reportId: result.report_id,
                authMethod: authMethod,
                anonymous: result.anonymous === 1,
                userId: result.user_id
              },
              message: 'User login successful',
              expiresIn: 24 * 60 * 60 * 1000
            });
          }
        );
      });

    } catch (error) {
      console.error('❌ User login error:', error);
      res.status(500).json({ error: 'Internal server error', success: false });
    }
  });

  // User Logout
  router.post('/auth/logout', authenticateUser, (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      // Remove session from database
      db.run('DELETE FROM user_sessions WHERE token_hash = ?', [tokenHash], (err) => {
        if (err) {
          console.error('Error removing user session:', err);
        }
      });
    }

    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  });

  // Verify User Token
  router.get('/auth/verify', authenticateUser, (req, res) => {
    res.json({
      success: true,
      user: {
        userId: req.user.userId,
        reportId: req.user.reportId,
        authMethod: req.user.authMethod,
        anonymous: req.user.anonymous
      }
    });
  });

  // ==================== USER PROFILE MANAGEMENT ====================

  // Get User Dashboard Data
  router.get('/dashboard', authenticateUser, (req, res) => {
    const { userId, reportId } = req.user;
    
    console.log(`📊 User dashboard request for user ${userId}, report ${reportId}`);
    
    // Get user's reports and basic stats
    const userReportsQuery = `
      SELECT r.*, u.anonymous_id
      FROM reports r
      JOIN users u ON r.user_id = u.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `;
    
    db.all(userReportsQuery, [userId], (err, reports) => {
      if (err) {
        console.error('Error fetching user reports:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to fetch dashboard data' 
        });
      }
      
      // Calculate stats
      const totalReports = reports.length;
      const resolvedReports = reports.filter(r => r.status === 'resolved').length;
      const pendingReports = reports.filter(r => r.status === 'submitted' || r.status === 'acknowledged' || r.status === 'under_review').length;
      const inProgressReports = reports.filter(r => r.status === 'in_progress').length;
      
      // Get recent messages count
      const messagesQuery = `
        SELECT COUNT(*) as messageCount 
        FROM messages 
        WHERE report_id IN (${reports.map(() => '?').join(',')}) 
        AND sender_type = 'department'
        AND read_by_user = 0
      `;
      
      const reportIds = reports.map(r => r.report_id);
      
      if (reportIds.length > 0) {
        db.get(messagesQuery, reportIds, (msgErr, messageResult) => {
          const unreadMessages = msgErr ? 0 : (messageResult?.messageCount || 0);
          
          res.json({
            success: true,
            dashboard: {
              user: {
                id: userId,
                reportId: reportId,
                anonymous_id: reports[0]?.anonymous_id || `USER_${userId}`
              },
              stats: {
                totalReports,
                resolvedReports,
                pendingReports,
                inProgressReports,
                unreadMessages
              },
              recentReports: reports.slice(0, 5), // Last 5 reports
              notifications: []
            }
          });
        });
      } else {
        // User has no reports yet
        res.json({
          success: true,
          dashboard: {
            user: {
              id: userId,
              reportId: reportId,
              anonymous_id: `USER_${userId}`
            },
            stats: {
              totalReports: 0,
              resolvedReports: 0,
              pendingReports: 0,
              inProgressReports: 0,
              unreadMessages: 0
            },
            recentReports: [],
            notifications: []
          }
        });
      }
    });
  });

  // Get User Notifications
  router.get('/notifications', authenticateUser, (req, res) => {
    const { userId, reportId } = req.user;
    
    console.log(`🔔 User notifications request for user ${userId}, report ${reportId}`);
    
    // Get notifications for user's reports
    const notificationsQuery = `
      SELECT 
        m.id,
        m.report_id,
        m.sender_type,
        m.sender_name,
        m.sender_department,
        m.message,
        m.timestamp,
        m.read_by_user,
        r.incident_type,
        r.status as report_status,
        r.priority
      FROM messages m
      JOIN reports r ON m.report_id = r.report_id
      WHERE r.user_id = ?
      AND m.sender_type = 'department'
      ORDER BY m.timestamp DESC
      LIMIT 50
    `;
    
    db.all(notificationsQuery, [userId], (err, messages) => {
      if (err) {
        console.error('Error fetching user notifications:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to fetch notifications' 
        });
      }
      
      // Transform messages into notification format
      const notifications = messages.map(msg => ({
        id: msg.id,
        type: 'message',
        title: `Update on ${msg.report_id}`,
        message: msg.message,
        reportId: msg.report_id,
        timestamp: msg.timestamp,
        read: msg.read_by_user === 1,
        priority: msg.priority === 'critical' ? 'urgent' : (msg.priority === 'high' ? 'high' : 'normal'),
        department: msg.sender_department,
        senderName: msg.sender_name
      }));
      
      res.json({
        success: true,
        notifications
      });
    });
  });

  // Get User Messages
  router.get('/messages', authenticateUser, (req, res) => {
    const { userId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    console.log(`💬 User messages request for user ${userId}, page ${page}`);
    
    // Get messages for user's reports
    const messagesQuery = `
      SELECT 
        m.*,
        r.incident_type,
        r.status as report_status,
        r.priority
      FROM messages m
      JOIN reports r ON m.report_id = r.report_id
      WHERE r.user_id = ?
      ORDER BY m.timestamp DESC
      LIMIT ? OFFSET ?
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM messages m
      JOIN reports r ON m.report_id = r.report_id
      WHERE r.user_id = ?
    `;
    
    // Get total count first
    db.get(countQuery, [userId], (countErr, countResult) => {
      if (countErr) {
        console.error('Error counting user messages:', countErr);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to fetch messages' 
        });
      }
      
      const totalMessages = countResult?.total || 0;
      
      // Get messages
      db.all(messagesQuery, [userId, limit, offset], (err, messages) => {
        if (err) {
          console.error('Error fetching user messages:', err);
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch messages' 
          });
        }
        
        res.json({
          success: true,
          messages,
          pagination: {
            page,
            limit,
            total: totalMessages,
            totalPages: Math.ceil(totalMessages / limit)
          }
        });
      });
    });
  });

  // Get User Profile
  router.get('/profile', authenticateUser, (req, res) => {
    const { userId } = req.user;
    
    const query = `
      SELECT u.*, r.report_id, r.status, r.priority, r.assigned_department, r.created_at as report_created
      FROM users u
      LEFT JOIN reports r ON u.id = r.user_id
      WHERE u.id = ?
    `;

    db.get(query, [userId], (err, profile) => {
      if (err) {
        console.error('Error fetching user profile:', err);
        return res.status(500).json({ error: 'Internal server error', success: false });
      }

      if (!profile) {
        return res.status(404).json({ error: 'User profile not found', success: false });
      }

      res.json({
        success: true,
        profile: {
          userId: profile.id,
          anonymousId: profile.anonymous_id,
          email: profile.email,
          lastLogin: profile.last_login,
          lastActive: profile.last_active,
          createdAt: profile.created_at,
          report: {
            reportId: profile.report_id,
            status: profile.status,
            priority: profile.priority,
            assignedDepartment: profile.assigned_department,
            submittedAt: profile.report_created
          }
        }
      });
    });
  });

  // Update User Profile (limited fields)
  router.put('/profile', authenticateUser, (req, res) => {
    const { userId } = req.user;
    const { email } = req.body; // Only allow email updates for now
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required', success: false });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format', success: false });
    }

    const updateQuery = 'UPDATE users SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    
    db.run(updateQuery, [email, userId], function(err) {
      if (err) {
        console.error('Error updating user profile:', err);
        return res.status(500).json({ error: 'Failed to update profile', success: false });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found', success: false });
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        updatedFields: ['email']
      });
    });
  });

  // ==================== USER ACTIVITY TRACKING ====================

  // Update Last Active (heartbeat endpoint)
  router.post('/heartbeat', authenticateUser, (req, res) => {
    const { userId } = req.user;
    
    db.run('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?', [userId], (err) => {
      if (err) {
        console.error('Error updating user activity:', err);
      }
    });

    res.json({
      success: true,
      timestamp: new Date().toISOString()
    });
  });

  // Get User Activity Log
  router.get('/activity', authenticateUser, (req, res) => {
    const { userId } = req.user;
    const { limit = 50 } = req.query;
    
    const query = `
      SELECT action, details, timestamp 
      FROM audit_logs 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `;

    db.all(query, [userId, parseInt(limit)], (err, activities) => {
      if (err) {
        console.error('Error fetching user activity:', err);
        return res.status(500).json({ error: 'Internal server error', success: false });
      }

      res.json({
        success: true,
        activities: activities.map(activity => ({
          action: activity.action,
          details: activity.details ? JSON.parse(activity.details) : {},
          timestamp: activity.timestamp,
          timeAgo: getTimeAgo(activity.timestamp)
        }))
      });
    });
  });

  // ==================== SECURITY AND PREFERENCES ====================

  // Change Security PIN (for PIN-authenticated users)
  router.put('/security/pin', authenticateUser, async (req, res) => {
    const { userId, authMethod } = req.user;
    const { currentPin, newPin } = req.body;

    if (authMethod !== 'pin') {
      return res.status(400).json({ error: 'PIN change not available for this authentication method', success: false });
    }

    if (!currentPin || !newPin) {
      return res.status(400).json({ error: 'Current PIN and new PIN are required', success: false });
    }

    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      return res.status(400).json({ error: 'New PIN must be exactly 6 digits', success: false });
    }

    // Verify current PIN
    db.get('SELECT security_pin FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        console.error('Error verifying current PIN:', err);
        return res.status(500).json({ error: 'Internal server error', success: false });
      }

      if (!user || user.security_pin !== currentPin) {
        return res.status(401).json({ error: 'Current PIN is incorrect', success: false });
      }

      // Update to new PIN
      db.run('UPDATE users SET security_pin = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newPin, userId], function(err) {
        if (err) {
          console.error('Error updating security PIN:', err);
          return res.status(500).json({ error: 'Failed to update PIN', success: false });
        }

        // Log the security change
        db.run(
          'INSERT INTO audit_logs (action, user_id, ip_hash, details) VALUES (?, ?, ?, ?)',
          [
            'security_pin_changed',
            userId,
            hashIP(req.ip),
            JSON.stringify({ timestamp: new Date().toISOString() })
          ]
        );

        res.json({
          success: true,
          message: 'Security PIN updated successfully'
        });
      });
    });
  });

  // Get User Preferences
  router.get('/preferences', authenticateUser, (req, res) => {
    const { userId } = req.user;
    
    // For now, return default preferences
    // In a full implementation, you'd have a user_preferences table
    res.json({
      success: true,
      preferences: {
        language: 'en',
        notifications: {
          email: true,
          sms: false,
          push: true
        },
        privacy: {
          shareProgress: false,
          allowAnalytics: true
        },
        communication: {
          preferredMethod: 'email',
          availableHours: '9:00-17:00'
        }
      }
    });
  });

  // Update User Preferences
  router.put('/preferences', authenticateUser, (req, res) => {
    const { userId } = req.user;
    const { preferences } = req.body;
    
    if (!preferences) {
      return res.status(400).json({ error: 'Preferences object is required', success: false });
    }

    // For now, just acknowledge the update
    // In a full implementation, you'd update a user_preferences table
    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: preferences
    });
  });

  // ==================== UTILITY FUNCTIONS ====================

  // Get time ago helper function
  function getTimeAgo(date) {
    const now = new Date();
    const diffInMs = now - new Date(date);
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    
    return new Date(date).toLocaleDateString();
  }

  // ==================== HEALTH CHECK ====================

  // User service health check
  router.get('/health', (req, res) => {
    res.json({
      service: 'user-management',
      status: 'OK',
      timestamp: new Date().toISOString(),
      features: {
        authentication: 'enabled',
        profile_management: 'enabled',
        activity_tracking: 'enabled',
        security_features: 'enabled'
      }
    });
  });

  return router;
};