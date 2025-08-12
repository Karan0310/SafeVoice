// routes/admin.js - Enhanced Admin Routes with Database Integration
const express = require('express');

module.exports = (sharedContext) => {
  const {
    db,
    DEPARTMENTS,
    authenticateToken,
    bcrypt,
    jwt,
    crypto
  } = sharedContext;

  const router = express.Router();

  // Rate limiting for auth endpoints
  const rateLimit = require('express-rate-limit');
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Department access middleware
  const requireDepartmentAccess = (allowedDepartments) => {
    return (req, res, next) => {
      if (req.admin.role === 'super_admin') {
        return next();
      }

      if (Array.isArray(allowedDepartments)) {
        if (!allowedDepartments.includes(req.admin.department)) {
          return res.status(403).json({ error: 'Insufficient department permissions' });
        }
      } else if (allowedDepartments !== req.admin.department) {
        return res.status(403).json({ error: 'Insufficient department permissions' });
      }

      next();
    };
  };

  // Audit logging middleware
  const logAuditAction = (action) => {
    return (req, res, next) => {
      const originalSend = res.send;
      res.send = function(data) {
        if (res.statusCode < 400) {
          const details = {
            method: req.method,
            url: req.url,
            params: req.params,
            body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined
          };

          db.run(
            'INSERT INTO audit_logs (action, admin_id, report_id, ip_hash, details) VALUES (?, ?, ?, ?, ?)',
            [
              action,
              req.admin ? req.admin.id : null,
              req.params.reportId || null,
              crypto.createHash('sha256').update(req.ip + 'salt').digest('hex'),
              JSON.stringify(details)
            ]
          );
        }
        originalSend.call(this, data);
      };
      next();
    };
  };

  // Utility function for time ago formatting
  function getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  }

  // ==================== AUTHENTICATION ROUTES ====================

  // Admin Login
  router.post('/auth/login', authLimiter, async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ 
          error: 'Username and password are required',
          success: false 
        });
      }

      // Find admin
      db.get('SELECT * FROM admins WHERE username = ? AND is_active = 1', [username], async (err, admin) => {
        if (err) {
          console.error('Database error during login:', err);
          return res.status(500).json({ error: 'Internal server error', success: false });
        }

        if (!admin) {
          return res.status(401).json({ 
            error: 'Invalid credentials',
            success: false 
          });
        }

        try {
          // Verify password
          const isValidPassword = await bcrypt.compare(password, admin.password_hash);
          
          if (!isValidPassword) {
            return res.status(401).json({ 
              error: 'Invalid credentials',
              success: false 
            });
          }

          // Generate JWT token
          const tokenPayload = {
            id: admin.id,
            username: admin.username,
            email: admin.email,
            department: admin.department,
            role: admin.role
          };

          const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { 
            expiresIn: '24h' 
          });

          // Store session
          const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

          db.run(
            'INSERT INTO admin_sessions (admin_id, token_hash, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
            [admin.id, tokenHash, expiresAt, req.ip, req.get('User-Agent') || '']
          );

          // Update last login
          db.run('UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [admin.id]);

          console.log(`👤 Admin login: ${admin.username} (${admin.department})`);

          res.json({
            success: true,
            token,
            admin: {
              id: admin.id,
              username: admin.username,
              email: admin.email,
              department: admin.department,
              departmentName: admin.department === 'all' ? 'Super Admin' : DEPARTMENTS[admin.department]?.name,
              role: admin.role,
              lastLogin: admin.last_login
            },
            expiresIn: 24 * 60 * 60 * 1000
          });

        } catch (passwordError) {
          console.error('Password verification error:', passwordError);
          return res.status(500).json({ error: 'Authentication error', success: false });
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error', success: false });
    }
  });

  // Admin Logout
  router.post('/auth/logout', authenticateToken, (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      db.run('DELETE FROM admin_sessions WHERE token_hash = ?', [tokenHash], (err) => {
        if (err) {
          console.error('Error removing session:', err);
        }
      });
    }

    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  });

  // Verify Token
  router.get('/auth/verify', authenticateToken, (req, res) => {
    res.json({
      success: true,
      admin: {
        id: req.admin.id,
        username: req.admin.username,
        email: req.admin.email,
        department: req.admin.department,
        departmentName: req.admin.department === 'all' ? 'Super Admin' : DEPARTMENTS[req.admin.department]?.name,
        role: req.admin.role
      }
    });
  });

  // ==================== DASHBOARD ROUTES ====================

  // Super Admin Dashboard
  router.get('/dashboard', authenticateToken, requireDepartmentAccess(['all']), (req, res) => {
    const queries = {
      total: 'SELECT COUNT(*) as count FROM reports',
      byDepartment: `
        SELECT assigned_department, COUNT(*) as count, 
               AVG(assignment_confidence) as avg_confidence
        FROM reports 
        WHERE assigned_department IS NOT NULL
        GROUP BY assigned_department
      `,
      byStatus: `
        SELECT status, COUNT(*) as count 
        FROM reports 
        GROUP BY status
      `,
      byPriority: `
        SELECT priority, COUNT(*) as count 
        FROM reports 
        GROUP BY priority
      `,
      recentReports: `
        SELECT report_id, incident_type, assigned_department, status, priority, created_at
        FROM reports 
        ORDER BY created_at DESC 
        LIMIT 10
      `,
      aiAccuracy: `
        SELECT 
          AVG(assignment_confidence) as avg_confidence,
          COUNT(CASE WHEN assignment_confidence >= 80 THEN 1 END) as high_confidence,
          COUNT(*) as total
        FROM reports 
        WHERE assigned_department IS NOT NULL
      `
    };

    const results = {};
    const queryPromises = Object.entries(queries).map(([key, query]) => {
      return new Promise((resolve, reject) => {
        if (['byDepartment', 'byStatus', 'byPriority', 'recentReports'].includes(key)) {
          db.all(query, [], (err, rows) => {
            if (err) reject(err);
            else {
              results[key] = rows;
              resolve();
            }
          });
        } else {
          db.get(query, [], (err, result) => {
            if (err) reject(err);
            else {
              results[key] = result;
              resolve();
            }
          });
        }
      });
    });

    Promise.all(queryPromises)
      .then(() => {
        res.json({
          success: true,
          totalReports: results.total.count,
          departmentDistribution: results.byDepartment.map(dept => ({
            ...dept,
            departmentName: DEPARTMENTS[dept.assigned_department]?.name || dept.assigned_department
          })),
          statusDistribution: results.byStatus,
          priorityDistribution: results.byPriority,
          recentReports: results.recentReports.map(report => ({
            ...report,
            departmentName: DEPARTMENTS[report.assigned_department]?.name || report.assigned_department,
            timeAgo: getTimeAgo(report.created_at)
          })),
          aiMetrics: {
            averageConfidence: Math.round(results.aiAccuracy.avg_confidence || 0),
            highConfidenceRate: Math.round((results.aiAccuracy.high_confidence / results.aiAccuracy.total) * 100) || 0,
            totalAssignments: results.aiAccuracy.total
          },
          departments: DEPARTMENTS,
          lastUpdated: new Date().toISOString()
        });
      })
      .catch(err => {
        console.error('Error fetching dashboard data:', err);
        res.status(500).json({ error: 'Internal server error', success: false });
      });
  });

  // ==================== DEPARTMENT ROUTES ====================

  // Department-Specific Dashboard
  router.get('/department/:departmentId/dashboard', authenticateToken, (req, res) => {
    const { departmentId } = req.params;
    
    // Check department access
    if (req.admin.role !== 'super_admin' && req.admin.department !== departmentId) {
      return res.status(403).json({ error: 'Access denied to this department', success: false });
    }

    if (!DEPARTMENTS[departmentId]) {
      return res.status(404).json({ error: 'Department not found', success: false });
    }

    const queries = {
      totalCases: 'SELECT COUNT(*) as count FROM reports WHERE assigned_department = ?',
      activeCases: 'SELECT COUNT(*) as count FROM reports WHERE assigned_department = ? AND status NOT IN ("resolved", "closed")',
      criticalCases: 'SELECT COUNT(*) as count FROM reports WHERE assigned_department = ? AND priority = "critical"',
      todaysCases: 'SELECT COUNT(*) as count FROM reports WHERE assigned_department = ? AND DATE(created_at) = DATE("now")',
      casesByStatus: `
        SELECT status, COUNT(*) as count 
        FROM reports 
        WHERE assigned_department = ?
        GROUP BY status
      `,
      casesByPriority: `
        SELECT priority, COUNT(*) as count 
        FROM reports 
        WHERE assigned_department = ?
        GROUP BY priority
      `,
      recentCases: `
        SELECT report_id, incident_type, status, priority, current_safety, 
               assigned_agent, created_at, updated_at
        FROM reports 
        WHERE assigned_department = ?
        ORDER BY created_at DESC 
        LIMIT 20
      `
    };

    const results = {};
    const params = [departmentId];
    
    const queryPromises = Object.entries(queries).map(([key, query]) => {
      return new Promise((resolve, reject) => {
        if (['casesByStatus', 'casesByPriority', 'recentCases'].includes(key)) {
          db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else {
              results[key] = rows;
              resolve();
            }
          });
        } else {
          db.get(query, params, (err, result) => {
            if (err) reject(err);
            else {
              results[key] = result;
              resolve();
            }
          });
        }
      });
    });

    Promise.all(queryPromises)
      .then(() => {
        const departmentInfo = DEPARTMENTS[departmentId];
        
        console.log(`📊 ${departmentInfo.name} dashboard accessed by ${req.admin.username}`);
        
        res.json({
          success: true,
          department: {
            id: departmentId,
            ...departmentInfo,
            totalCases: results.totalCases.count,
            activeCases: results.activeCases.count,
            criticalCases: results.criticalCases.count,
            todaysCases: results.todaysCases.count
          },
          statistics: {
            casesByStatus: results.casesByStatus,
            casesByPriority: results.casesByPriority,
            totalCases: results.totalCases.count,
            resolutionRate: results.casesByStatus.length > 0 ? 
              Math.round((results.casesByStatus.find(s => s.status === 'resolved')?.count || 0) / results.totalCases.count * 100) : 0
          },
          recentCases: results.recentCases.map(case_item => ({
            ...case_item,
            timeAgo: getTimeAgo(case_item.created_at)
          })),
          lastUpdated: new Date().toISOString()
        });
      })
      .catch(err => {
        console.error('Error fetching department dashboard data:', err);
        res.status(500).json({ error: 'Internal server error', success: false });
      });
  });

  // Get Department Cases with Filtering
  router.get('/department/:departmentId/cases', authenticateToken, (req, res) => {
    const { departmentId } = req.params;
    const { status, priority, page = 1, limit = 20 } = req.query;
    
    // Check department access
    if (req.admin.role !== 'super_admin' && req.admin.department !== departmentId) {
      return res.status(403).json({ error: 'Access denied to this department', success: false });
    }

    let query = `
      SELECT 
        report_id,
        incident_type,
        incident_date,
        location,
        current_safety,
        status,
        priority,
        assigned_agent,
        assignment_confidence,
        created_at,
        updated_at,
        anonymous,
        contact_method
      FROM reports 
      WHERE assigned_department = ?
    `;

    const conditions = [];
    const params = [departmentId];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (priority) {
      conditions.push('priority = ?');
      params.push(priority);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    db.all(query, params, (err, cases) => {
      if (err) {
        console.error('Error fetching department cases:', err);
        return res.status(500).json({ error: 'Internal server error', success: false });
      }

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM reports WHERE assigned_department = ?';
      let countParams = [departmentId];

      if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }

      if (priority) {
        countQuery += ' AND priority = ?';
        countParams.push(priority);
      }

      db.get(countQuery, countParams, (err, countResult) => {
        if (err) {
          console.error('Error fetching case count:', err);
          return res.status(500).json({ error: 'Internal server error', success: false });
        }

        console.log(`📋 ${departmentId} admin viewing ${cases.length} cases`);

        res.json({
          success: true,
          cases: cases.map(case_item => ({
            ...case_item,
            timeAgo: getTimeAgo(case_item.created_at),
            isAnonymous: !case_item.contact_method || case_item.anonymous === 1
          })),
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(countResult.total / parseInt(limit)),
            totalItems: countResult.total,
            itemsPerPage: parseInt(limit)
          },
          filters: { status, priority }
        });
      });
    });
  });

  // Get Detailed Case Information
  router.get('/department/:departmentId/cases/:reportId', 
    authenticateToken, 
    logAuditAction('view_case_details'),
    (req, res) => {
      const { departmentId, reportId } = req.params;
      
      // Check department access
      if (req.admin.role !== 'super_admin' && req.admin.department !== departmentId) {
        return res.status(403).json({ error: 'Access denied to this department', success: false });
      }

      const query = `
        SELECT 
          r.*,
          u.anonymous_id,
          u.created_at as user_created_at
        FROM reports r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.report_id = ? AND r.assigned_department = ?
      `;

      db.get(query, [reportId, departmentId], (err, report) => {
        if (err) {
          console.error('Error fetching case details:', err);
          return res.status(500).json({ error: 'Internal server error', success: false });
        }

        if (!report) {
          return res.status(404).json({ error: 'Case not found or access denied', success: false });
        }

        // Get case updates
        const updatesQuery = `
          SELECT cu.*, a.username as admin_username
          FROM case_updates cu
          LEFT JOIN admins a ON cu.admin_id = a.id
          WHERE cu.report_id = ?
          ORDER BY cu.created_at DESC
        `;

        db.all(updatesQuery, [reportId], (err, updates) => {
          if (err) {
            console.error('Error fetching case updates:', err);
            updates = [];
          }

          // Get messages
          const messagesQuery = `
            SELECT sender_type, sender_name, sender_department, message, timestamp
            FROM messages
            WHERE report_id = ?
            ORDER BY timestamp ASC
          `;

          db.all(messagesQuery, [reportId], (err, messages) => {
            if (err) {
              console.error('Error fetching messages:', err);
              messages = [];
            }

            console.log(`👁️ Admin viewing case details: ${reportId}`);

            res.json({
              success: true,
              case: {
                ...report,
                detected_location: report.detected_location ? JSON.parse(report.detected_location) : null,
                ai_sentiment: report.ai_sentiment ? JSON.parse(report.ai_sentiment) : null,
                timeAgo: getTimeAgo(report.created_at),
                isAnonymous: !report.contact_method || report.anonymous === 1
              },
              updates: updates,
              messages: messages,
              departmentInfo: DEPARTMENTS[departmentId]
            });
          });
        });
      });
    }
  );

  // Update Case Status
  router.put('/department/:departmentId/cases/:reportId/status', 
    authenticateToken,
    logAuditAction('update_case_status'),
    (req, res) => {
      const { departmentId, reportId } = req.params;
      const { status, notes, assignedAgent } = req.body;

      // Check department access
      if (req.admin.role !== 'super_admin' && req.admin.department !== departmentId) {
        return res.status(403).json({ error: 'Access denied to this department', success: false });
      }

      if (!status) {
        return res.status(400).json({ error: 'Status is required', success: false });
      }

      const validStatuses = ['submitted', 'acknowledged', 'under_review', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status', success: false });
      }

      // Get current status first
      db.get('SELECT status, assigned_agent FROM reports WHERE report_id = ? AND assigned_department = ?', 
        [reportId, departmentId], (err, currentReport) => {
          if (err) {
            console.error('Error fetching current report:', err);
            return res.status(500).json({ error: 'Internal server error', success: false });
          }

          if (!currentReport) {
            return res.status(404).json({ error: 'Case not found', success: false });
          }

          // Update report
          const updateFields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
          const updateParams = [status];

          if (assignedAgent) {
            updateFields.push('assigned_agent = ?');
            updateParams.push(assignedAgent);
          }

          updateParams.push(reportId, departmentId);

          const updateQuery = `UPDATE reports SET ${updateFields.join(', ')} WHERE report_id = ? AND assigned_department = ?`;

          db.run(updateQuery, updateParams, function(err) {
            if (err) {
              console.error('Error updating case status:', err);
              return res.status(500).json({ error: 'Failed to update case', success: false });
            }

            // Log the update
            const logQuery = `
              INSERT INTO case_updates (report_id, admin_id, update_type, old_value, new_value, notes)
              VALUES (?, ?, ?, ?, ?, ?)
            `;

            db.run(logQuery, [
              reportId,
              req.admin.id,
              'status_change',
              currentReport.status,
              status,
              notes || `Status updated by ${req.admin.username}`
            ]);

            console.log(`✅ Case ${reportId} status updated to ${status} by ${req.admin.username}`);

            res.json({
              success: true,
              message: 'Case status updated successfully',
              newStatus: status,
              updatedAt: new Date().toISOString()
            });
          });
        }
      );
    }
  );

  // Add Case Note
  router.post('/department/:departmentId/cases/:reportId/notes', 
    authenticateToken,
    logAuditAction('add_case_note'),
    (req, res) => {
      const { departmentId, reportId } = req.params;
      const { note } = req.body;

      // Check department access
      if (req.admin.role !== 'super_admin' && req.admin.department !== departmentId) {
        return res.status(403).json({ error: 'Access denied to this department', success: false });
      }

      if (!note || !note.trim()) {
        return res.status(400).json({ error: 'Note content is required', success: false });
      }

      // Verify case exists and belongs to department
      db.get('SELECT report_id FROM reports WHERE report_id = ? AND assigned_department = ?', 
        [reportId, departmentId], (err, report) => {
          if (err) {
            console.error('Error verifying case:', err);
            return res.status(500).json({ error: 'Internal server error', success: false });
          }

          if (!report) {
            return res.status(404).json({ error: 'Case not found', success: false });
          }

          // Add case update
          const updateQuery = `
            INSERT INTO case_updates (report_id, admin_id, update_type, notes)
            VALUES (?, ?, ?, ?)
          `;

          db.run(updateQuery, [reportId, req.admin.id, 'note', note.trim()], function(err) {
            if (err) {
              console.error('Error adding case note:', err);
              return res.status(500).json({ error: 'Failed to add note', success: false });
            }

            res.json({
              success: true,
              message: 'Note added successfully',
              noteId: this.lastID,
              createdAt: new Date().toISOString()
            });
          });
        }
      );
    }
  );

  // Send Message to User
  router.post('/department/:departmentId/cases/:reportId/messages', 
    authenticateToken,
    logAuditAction('send_message'),
    (req, res) => {
      const { departmentId, reportId } = req.params;
      const { message } = req.body;

      // Check department access
      if (req.admin.role !== 'super_admin' && req.admin.department !== departmentId) {
        return res.status(403).json({ error: 'Access denied to this department', success: false });
      }

      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message content is required', success: false });
      }

      // Verify case exists and belongs to department
      db.get('SELECT report_id FROM reports WHERE report_id = ? AND assigned_department = ?', 
        [reportId, departmentId], (err, report) => {
          if (err) {
            console.error('Error verifying case:', err);
            return res.status(500).json({ error: 'Internal server error', success: false });
          }

          if (!report) {
            return res.status(404).json({ error: 'Case not found', success: false });
          }

          // Add message
          const messageQuery = `
            INSERT INTO messages (report_id, sender_type, sender_name, sender_department, message)
            VALUES (?, ?, ?, ?, ?)
          `;

          db.run(messageQuery, [
            reportId,
            'department',
            `${DEPARTMENTS[departmentId].name} (${req.admin.username})`,
            departmentId,
            message.trim()
          ], function(err) {
            if (err) {
              console.error('Error sending message:', err);
              return res.status(500).json({ error: 'Failed to send message', success: false });
            }

            res.json({
              success: true,
              message: 'Message sent successfully',
              messageId: this.lastID,
              sentAt: new Date().toISOString()
            });
          });
        }
      );
    }
  );

  return router;
};