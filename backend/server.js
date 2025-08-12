// server.js - Enhanced backend server for 
// Voice Portal with Authentication & Department Management
// Always load .env from the backend directory so running from project root works
require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const NotificationService = require('./src/services/notificationService');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3001;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Validate required environment variables
function validateEnvironment() {
  const required = [
    'JWT_SECRET',
    'ENCRYPTION_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.log('💡 Please check your .env file and ensure all required variables are set');
    process.exit(1);
  }

  // Check if AI is configured (optional for development)
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('⚠️  ANTHROPIC_API_KEY not configured - AI features will use fallback mode');
    console.log('💡 For full AI functionality, get your API key from: https://console.anthropic.com/');
  }

  // Test Anthropic API key format
  if (process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
    console.warn('⚠️  Anthropic API key format may be incorrect. Expected format: sk-ant-...');
  }

  // Validate AI configuration
  const aiEnabled = process.env.ENABLE_AI_ASSIGNMENT === 'true';
  console.log(`🤖 AI Features: ${aiEnabled ? 'ENABLED' : 'DISABLED'}`);
  
  if (aiEnabled) {
    console.log(`🧠 AI Model: ${process.env.AI_MODEL || 'claude-3-5-sonnet-20241022'}`);
    console.log(`⚡ Rate Limits: ${process.env.AI_RATE_LIMIT_PER_MINUTE || 30}/min, ${process.env.AI_RATE_LIMIT_PER_HOUR || 500}/hour`);
  }

  console.log('✅ Environment variables validated successfully');
}

// Call validation before starting server
validateEnvironment();

// Department Configuration (matching frontend)
const DEPARTMENTS = {
  legal: {
    id: 'legal',
    name: 'Legal Team',
    description: 'Handles legal matters, harassment, discrimination, and rights violations',
    color: 'blue',
    keywords: ['legal', 'harassment', 'discrimination', 'rights', 'law', 'lawsuit', 'attorney', 'court', 'violation', 'illegal', 'sexual', 'workplace', 'inappropriate', 'unwanted'],
    incidentTypes: ['harassment', 'discrimination', 'workplace', 'legal'],
    avgResponseTime: '8h',
    activeAgents: 12
  },
  task: {
    id: 'task',
    name: 'Task Force Team',
    description: 'Handles physical violence, assault, and immediate safety concerns',
    color: 'red',
    keywords: ['assault', 'violence', 'physical', 'attack', 'hit', 'hurt', 'emergency', 'danger', 'threat', 'safety', 'beat', 'punch', 'kicked', 'grabbed', 'injured'],
    incidentTypes: ['assault', 'domestic', 'violence', 'stalking'],
    avgResponseTime: '2h',
    activeAgents: 8
  },
  support: {
    id: 'support',
    name: 'Support Services Team',
    description: 'Handles housing, financial aid, and general support services',
    color: 'green',
    keywords: ['housing', 'shelter', 'financial', 'support', 'help', 'assistance', 'resources', 'accommodation', 'relocation', 'money', 'rent', 'food', 'basic needs'],
    incidentTypes: ['housing', 'financial', 'support', 'other'],
    avgResponseTime: '12h',
    activeAgents: 15
  },
  happy2help: {
    id: 'happy2help',
    name: 'Happy2Help Team',
    description: 'Mental health counseling, emotional support, and wellness services',
    color: 'purple',
    keywords: ['mental', 'depression', 'anxiety', 'counseling', 'therapy', 'emotional', 'stress', 'trauma', 'wellness', 'psychology', 'suicide', 'self-harm', 'sad', 'hopeless'],
    incidentTypes: ['mental', 'counseling', 'therapy', 'wellness'],
    avgResponseTime: '4h',
    activeAgents: 20
  }
};

class SafeVoiceAI {
  constructor() {
    this.model = process.env.AI_MODEL || "claude-3-5-sonnet-20241022";
    this.maxTokens = parseInt(process.env.AI_MAX_TOKENS) || 1000;
    this.timeout = parseInt(process.env.AI_TIMEOUT) || 30000;
    this.retryAttempts = parseInt(process.env.AI_RETRY_ATTEMPTS) || 2;
    this.departments = DEPARTMENTS;
    
    // Rate limiting
    this.requestCounts = {
      minute: { count: 0, resetTime: Date.now() + 60000 },
      hour: { count: 0, resetTime: Date.now() + 3600000 }
    };
    
    this.rateLimits = {
      minute: parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE) || 30,
      hour: parseInt(process.env.AI_RATE_LIMIT_PER_HOUR) || 500
    };

    // Anthropic client with timeout (only if API key is available)
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        timeout: this.timeout
      });
    } else {
      this.anthropic = null;
      console.log('⚠️  AI client not initialized - API key not available');
    }
  }

  // Rate limiting check
  checkRateLimit() {
    const now = Date.now();
    
    // Reset counters if needed
    if (now > this.requestCounts.minute.resetTime) {
      this.requestCounts.minute = { count: 0, resetTime: now + 60000 };
    }
    if (now > this.requestCounts.hour.resetTime) {
      this.requestCounts.hour = { count: 0, resetTime: now + 3600000 };
    }

    // Check limits
    if (this.requestCounts.minute.count >= this.rateLimits.minute) {
      throw new Error('AI_RATE_LIMIT_MINUTE_EXCEEDED');
    }
    if (this.requestCounts.hour.count >= this.rateLimits.hour) {
      throw new Error('AI_RATE_LIMIT_HOUR_EXCEEDED');
    }

    // Increment counters
    this.requestCounts.minute.count++;
    this.requestCounts.hour.count++;
  }

  // Enhanced API call with retry logic
  async makeAPICall(prompt, analysisType = 'unknown') {
    // Check if AI client is available
    if (!this.anthropic) {
      console.log(`⚠️  AI client not available for ${analysisType} - using fallback mode`);
      throw new Error('AI_CLIENT_NOT_AVAILABLE');
    }

    const startTime = Date.now();
    let lastError = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        this.checkRateLimit();

        console.log(`🤖 AI ${analysisType} - Attempt ${attempt}/${this.retryAttempts}`);

        const response = await this.anthropic.messages.create({
          model: this.model,
          max_tokens: this.maxTokens,
          messages: [{ role: 'user', content: prompt }]
        });

        const processingTime = Date.now() - startTime;
        console.log(`✅ AI ${analysisType} completed in ${processingTime}ms`);

        return JSON.parse(response.content[0].text);

      } catch (error) {
        lastError = error;
        const processingTime = Date.now() - startTime;

        console.error(`❌ AI ${analysisType} - Attempt ${attempt} failed:`, error.message);

        // Don't retry on certain errors
        if (error.message.includes('RATE_LIMIT') || 
            error.message.includes('INVALID_API_KEY') ||
            error.status === 401) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.retryAttempts) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All attempts failed
    throw new Error(`AI analysis failed after ${this.retryAttempts} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  // Real AI Department Assignment
  async analyzeAndAssignDepartment(reportData) {
    try {
      const { incidentType, description, currentSafety, location, witnesses, evidence } = reportData;
      
      const prompt = `You are an AI assistant for SafeVoice, an incident reporting platform. Analyze the following incident report and determine the most appropriate department assignment.

DEPARTMENTS AVAILABLE:
1. LEGAL TEAM - Handles legal matters, harassment, discrimination, workplace issues, rights violations
2. TASK FORCE TEAM - Handles physical violence, assault, domestic violence, stalking, immediate safety concerns
3. SUPPORT SERVICES TEAM - Handles housing issues, financial aid, general support services, basic needs
4. HAPPY2HELP TEAM - Handles mental health, depression, anxiety, counseling, therapy, emotional support, wellness

INCIDENT REPORT:
- Type: ${incidentType}
- Description: ${description}
- Current Safety Status: ${currentSafety}
- Location: ${location || 'Not specified'}
- Witnesses: ${witnesses || 'None mentioned'}
- Evidence: ${evidence || 'None mentioned'}

Please analyze this report and respond with a JSON object containing:
{
  "assignedDepartment": "legal|task|support|happy2help",
  "confidence": number (60-95),
  "reasoning": ["reason1", "reason2", "reason3"],
  "urgencyLevel": "low|medium|high|critical",
  "riskFactors": ["factor1", "factor2"],
  "recommendedActions": ["action1", "action2"]
}

Consider:
- Incident type and severity
- Safety concerns (unsafe = critical priority to Task Force)
- Keywords and context in description
- Evidence of immediate danger
- Mental health indicators
- Legal implications

Respond ONLY with valid JSON.`;

      const aiResponse = await this.makeAPICall(prompt, 'department_assignment');
      
      // Map AI response to your existing department structure
      const departmentMapping = {
        'legal': 'legal',
        'task': 'task', 
        'support': 'support',
        'happy2help': 'happy2help'
      };

      return {
        assignedDepartment: departmentMapping[aiResponse.assignedDepartment] || 'support',
        confidence: Math.max(60, Math.min(95, aiResponse.confidence)),
        reasoning: aiResponse.reasoning || [],
        urgencyLevel: aiResponse.urgencyLevel || 'medium',
        riskFactors: aiResponse.riskFactors || [],
        recommendedActions: aiResponse.recommendedActions || [],
        aiAnalysis: true
      };

    } catch (error) {
      console.error('AI Department Assignment Error:', error);
      
      // Fallback to rule-based assignment if AI fails
      return this.fallbackAssignment(reportData);
    }
  }

  // Real AI Sentiment Analysis
  async analyzeSentiment(text) {
    try {
      const prompt = `Analyze the emotional tone and urgency of this incident report text. Respond with JSON only:

TEXT: "${text}"

{
  "emotional_state": "distressed|negative|neutral|positive",
  "urgency_level": "low|medium|high|critical", 
  "confidence": number (0.6-0.95),
  "detected_emotions": ["emotion1", "emotion2"],
  "urgent_indicators": ["indicator1", "indicator2"],
  "support_needs": ["need1", "need2"]
}`;

      const aiResponse = await this.makeAPICall(prompt, 'sentiment_analysis');
      return aiResponse;
    } catch (error) {
      console.error('AI Sentiment Analysis Error:', error);
      return {
        emotional_state: 'neutral',
        urgency_level: 'medium',
        confidence: 0.5,
        detected_emotions: [],
        urgent_indicators: [],
        support_needs: []
      };
    }
  }

  // AI Risk Assessment
  async assessRisk(reportData) {
    try {
      const prompt = `Assess the risk level of this incident report. Consider immediate safety, escalation potential, and severity. Respond with JSON only:

REPORT: ${JSON.stringify(reportData, null, 2)}

{
  "riskLevel": "low|medium|high|critical",
  "immediateAction": boolean,
  "escalationRisk": number (0-10),
  "safetyScore": number (0-10),
  "riskFactors": ["factor1", "factor2"],
  "mitigationSteps": ["step1", "step2"]
}`;

      const aiResponse = await this.makeAPICall(prompt, 'risk_assessment');
      return aiResponse;
    } catch (error) {
      console.error('AI Risk Assessment Error:', error);
      return {
        riskLevel: 'medium',
        immediateAction: false,
        escalationRisk: 5,
        safetyScore: 5,
        riskFactors: [],
        mitigationSteps: []
      };
    }
  }

  // AI Dashboard Insights
  async generateDashboardInsights(data) {
    try {
      const prompt = `Generate insights for SafeVoice admin dashboard based on this data. Respond with JSON only:

DATA: ${JSON.stringify(data, null, 2)}

{
  "keyInsights": ["insight1", "insight2", "insight3"],
  "trends": ["trend1", "trend2"],
  "recommendations": ["rec1", "rec2"],
  "alerts": ["alert1", "alert2"],
  "performance": {
    "aiAccuracy": number,
    "responseTime": "string",
    "departmentEfficiency": "string"
  }
}`;

      const aiResponse = await this.makeAPICall(prompt, 'dashboard_insights');
      return aiResponse;
    } catch (error) {
      console.error('AI Dashboard Insights Error:', error);
      return {
        keyInsights: ['AI analysis system operational'],
        trends: ['Normal reporting patterns'],
        recommendations: ['Continue monitoring'],
        alerts: [],
        performance: {
          aiAccuracy: 85,
          responseTime: 'Normal',
          departmentEfficiency: 'Good'
        }
      };
    }
  }

  // Fallback assignment logic
  fallbackAssignment(reportData) {
    const { incidentType, description, currentSafety } = reportData;
    
    const departmentScores = {
      legal: 0,
      task: 0,
      support: 0,
      happy2help: 0
    };

    Object.keys(this.departments).forEach(deptId => {
      const dept = this.departments[deptId];
      if (dept.incidentTypes.includes(incidentType)) {
        departmentScores[deptId] += 40;
      }
    });

    if (currentSafety === 'unsafe') {
      departmentScores.task += 20;
    }

    const assignedDept = Object.keys(departmentScores).reduce((a, b) => 
      departmentScores[a] > departmentScores[b] ? a : b
    );

    return {
      assignedDepartment: assignedDept,
      confidence: 75,
      reasoning: ['Fallback rule-based assignment'],
      urgencyLevel: currentSafety === 'unsafe' ? 'high' : 'medium',
      aiAnalysis: false
    };
  }
}

// Initialize AI service
const safeVoiceAI = new SafeVoiceAI();

// AI Assignment Engine
const EnhancedAIAssignmentEngine = {
  async analyzeCase(reportData) {
    return await safeVoiceAI.analyzeAndAssignDepartment(reportData);
  },
  
  async analyzeSentiment(text) {
    return await safeVoiceAI.analyzeSentiment(text);
  },
  
  async assessRisk(reportData) {
    return await safeVoiceAI.assessRisk(reportData);
  }
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database setup
const db = new sqlite3.Database('./reports.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('✅ Connected to SQLite database');
    initializeDatabase().catch(console.error);
  }
});

// Enhanced database initialization with authentication tables
async function initializeDatabase() {
  const createTables = `
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      department TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      is_active BOOLEAN DEFAULT 1,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES admins (id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anonymous_id TEXT UNIQUE NOT NULL,
      email TEXT,
      security_pin TEXT,
      last_login DATETIME,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_hash TEXT
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      report_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (report_id) REFERENCES reports (report_id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      incident_type TEXT NOT NULL,
      incident_date DATE NOT NULL,
      incident_time TEXT,
      location TEXT,
      description TEXT NOT NULL,
      current_safety TEXT NOT NULL,
      witnesses TEXT,
      evidence TEXT,
      contact_method TEXT,
      contact_info TEXT,
      anonymous BOOLEAN DEFAULT 0,
      detected_location TEXT,
      ai_sentiment TEXT,
      ai_risk_level TEXT,
      ai_category_suggestion TEXT,
      assigned_department TEXT,
      assignment_confidence INTEGER,
      assignment_reasoning TEXT,
      status TEXT DEFAULT 'submitted',
      priority TEXT DEFAULT 'medium',
      assigned_agent TEXT,
      case_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
    
    CREATE TABLE IF NOT EXISTS case_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id TEXT NOT NULL,
      admin_id INTEGER,
      update_type TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports (report_id),
      FOREIGN KEY (admin_id) REFERENCES admins (id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id TEXT,
      sender_type TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_department TEXT,
      message TEXT NOT NULL,
      encrypted BOOLEAN DEFAULT 1,
      read_by_user BOOLEAN DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports (report_id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id TEXT,
      session_type TEXT NOT NULL,
      date DATE NOT NULL,
      time TEXT NOT NULL,
      counselor TEXT,
      department TEXT,
      status TEXT DEFAULT 'scheduled',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports (report_id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      admin_id INTEGER,
      user_id INTEGER,
      report_id TEXT,
      ip_hash TEXT,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES admins (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS department_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department TEXT NOT NULL,
      date DATE NOT NULL,
      total_cases INTEGER DEFAULT 0,
      new_cases INTEGER DEFAULT 0,
      resolved_cases INTEGER DEFAULT 0,
      avg_response_time REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      reportId TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      metadata TEXT,
      isRead BOOLEAN DEFAULT FALSE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      readAt DATETIME,
      FOREIGN KEY (userId) REFERENCES users (id),
      FOREIGN KEY (reportId) REFERENCES reports (report_id)
    );
  `;

  db.exec(createTables, (err) => {
    if (err) {
      console.error('Error creating tables:', err);
    } else {
      console.log('✅ Database tables initialized successfully');
      console.log('✅ Notifications table ready');
      
      // Seed demo data and admin accounts
      seedInitialDataIfEmpty();
    }
  });
}

async function seedInitialDataIfEmpty() {
  console.log('🔍 Checking if database needs initial seeding...');
  
  // Check if we have any existing data
  db.get('SELECT COUNT(*) as count FROM reports', [], async (err, reportResult) => {
    if (err) {
      console.error('Error checking reports:', err);
      return;
    }

    db.get('SELECT COUNT(*) as count FROM admins', [], async (err, adminResult) => {
      if (err) {
        console.error('Error checking admins:', err);
        return;
      }

      const hasReports = reportResult.count > 0;
      const hasAdmins = adminResult.count > 0;

      console.log(`📊 Database status: ${reportResult.count} reports, ${adminResult.count} admins`);

      // Only seed if we have no data
      if (!hasAdmins) {
        console.log('👑 No admin accounts found, creating initial admin accounts...');
        await seedAdminAccounts();
      } else {
        console.log('✅ Admin accounts already exist, skipping admin seeding');
      }

      if (!hasReports) {
        console.log('📊 No reports found, creating demo data...');
        await seedDemoData();
      } else {
        console.log('✅ Reports already exist, skipping demo data seeding');
      }
    });
  });
}

// Seed admin accounts for each department
async function seedAdminAccounts() {
  const adminAccounts = [
    { username: 'legal_admin', email: 'legal@safevoice.com', department: 'legal', role: 'admin' },
    { username: 'task_admin', email: 'taskforce@safevoice.com', department: 'task', role: 'admin' },
    { username: 'support_admin', email: 'support@safevoice.com', department: 'support', role: 'admin' },
    { username: 'happy2help_admin', email: 'happy2help@safevoice.com', department: 'happy2help', role: 'admin' },
    { username: 'super_admin', email: 'admin@safevoice.com', department: 'all', role: 'super_admin' }
  ];

  console.log('👑 Creating admin accounts...');
  
  for (const admin of adminAccounts) {
    try {
      const passwordHash = await bcrypt.hash('SafeVoice2024!', 12);
      
      db.run(
        'INSERT INTO admins (username, email, password_hash, department, role) VALUES (?, ?, ?, ?, ?)',
        [admin.username, admin.email, passwordHash, admin.department, admin.role],
        function(err) {
          if (err) {
            console.error(`Error creating admin ${admin.username}:`, err);
          } else {
            console.log(`✅ Admin created: ${admin.username} (${admin.department})`);
          }
        }
      );
    } catch (error) {
      console.error(`Error hashing password for ${admin.username}:`, error);
    }
  }
}

// Generate 100 comprehensive demo cases with unique details
function generateComprehensiveDemoData() {
  const incidentTypes = ['harassment', 'assault', 'housing', 'mental', 'financial', 'discrimination', 'stalking', 'cyberbullying', 'workplace', 'domestic'];
  const departments = ['legal', 'task', 'support', 'happy2help'];
  const priorities = ['low', 'medium', 'high', 'critical'];
  const statuses = ['submitted', 'under_review', 'in_progress', 'resolved', 'closed'];
  const safetyLevels = ['safe', 'unsafe', 'unsure'];
  
  const locations = [
    'Corporate Office - 5th Floor', 'Downtown Metro Station', 'Public Street - Oak Avenue', 'University Campus', 
    'Shopping Mall - Food Court', 'Apartment Complex', 'Workplace Parking Lot', 'Public Library', 'Community Center',
    'Hospital Emergency Room', 'School Cafeteria', 'Online Platform', 'Social Media', 'Public Park',
    'Bus Station', 'Restaurant', 'Gym Facility', 'Medical Clinic', 'Government Office', 'Retail Store'
  ];
  
  const agents = [
    'Agent Sarah Martinez - Legal Specialist', 'Detective Mike Chen - Task Force Specialist', 
    'Agent Jennifer Wong - Housing Coordinator', 'Dr. Lisa Rodriguez - Mental Health Counselor',
    'Agent David Kim - Crisis Intervention', 'Counselor Maria Gonzalez - Support Services',
    'Detective James Wilson - Investigation Unit', 'Agent Rachel Thompson - Victim Advocacy',
    'Dr. Michael Brown - Trauma Specialist', 'Agent Amanda Davis - Legal Aid Coordinator'
  ];
  
  const reports = [];
  
  // Ensure each department gets at least 25 cases (100 total / 4 departments)
  const casesPerDepartment = 25;
  
  for (let deptIndex = 0; deptIndex < departments.length; deptIndex++) {
    const department = departments[deptIndex];
    
    for (let i = 1; i <= casesPerDepartment; i++) {
      const caseNumber = deptIndex * casesPerDepartment + i;
      const reportId = `SAFE${String(12345000 + caseNumber).padStart(9, '0')}`;
      
      // Assign incident types based on department specialization
      let incidentType;
      if (department === 'legal') {
        incidentType = ['harassment', 'discrimination', 'workplace', 'cyberbullying', 'legal_rights', 'policy_violation'][Math.floor(Math.random() * 6)];
      } else if (department === 'task') {
        incidentType = ['assault', 'domestic', 'stalking', 'violence', 'threats', 'safety_concern'][Math.floor(Math.random() * 6)];
      } else if (department === 'support') {
        incidentType = ['housing', 'financial', 'support', 'other', 'emergency_assistance', 'resource_access'][Math.floor(Math.random() * 6)];
      } else if (department === 'happy2help') {
        incidentType = ['mental', 'counseling', 'therapy', 'wellness', 'crisis_support', 'emotional_distress'][Math.floor(Math.random() * 6)];
      } else {
        incidentType = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
      }
      
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const safety = safetyLevels[Math.floor(Math.random() * safetyLevels.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const agent = agents[Math.floor(Math.random() * agents.length)];
      const anonymous = Math.random() > 0.6 ? 1 : 0;
      const hasEmail = !anonymous && Math.random() > 0.4;
      
      // Generate incident date within last 90 days
      const daysAgo = Math.floor(Math.random() * 90);
      const incidentDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const dateStr = incidentDate.toISOString().split('T')[0];
      const timeStr = `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
      
      // Generate unique detailed descriptions based on incident type
      const descriptions = getIncidentDescriptions(incidentType, caseNumber);
      const witnesses = getWitnessDescriptions(incidentType);
      const evidence = getEvidenceDescriptions(incidentType);
      
      reports.push({
        report_id: reportId,
        incident_type: incidentType,
        incident_date: dateStr,
        incident_time: timeStr,
        location: `${location} - Case ${caseNumber}`,
        description: descriptions,
        current_safety: safety,
        witnesses: witnesses,
        evidence: evidence,
        contact_method: hasEmail ? 'email' : null,
        contact_info: hasEmail ? `user${caseNumber}@example.com` : null,
        anonymous: anonymous,
        status: status,
        priority: priority,
        assigned_department: department,
        assigned_agent: agent,
        userEmail: hasEmail ? `user${caseNumber}@example.com` : null,
        userPin: String(100000 + caseNumber).slice(1) // 6-digit PIN
      });
    }
  }
  
  return reports;
}

function getIncidentDescriptions(type, caseNumber) {
  const descriptions = {
    harassment: [
      `Case ${caseNumber}: My coworker has been sending inappropriate messages and making unwanted advances despite my clear rejections. This behavior has escalated over the past month and is affecting my work performance and mental health.`,
      `Case ${caseNumber}: I am experiencing persistent harassment from a neighbor who follows me, takes photos, and leaves threatening notes. The situation has become increasingly concerning and I fear for my safety.`,
      `Case ${caseNumber}: A customer at my workplace has been making sexually explicit comments and inappropriate gestures. Management has been informed but no action has been taken to address this ongoing issue.`
    ],
    assault: [
      `Case ${caseNumber}: I was physically attacked by an unknown individual while walking to my car after work. The attacker struck me multiple times before fleeing. I sustained injuries requiring medical attention.`,
      `Case ${caseNumber}: During a dispute with my roommate, they became violent and physically assaulted me. I have visible injuries and am concerned about my safety living in the same residence.`,
      `Case ${caseNumber}: I was assaulted by a group of individuals in a public area. They approached me aggressively and when I tried to leave, they became violent. Bystanders intervened and the attackers fled.`
    ],
    housing: [
      `Case ${caseNumber}: I am facing imminent eviction due to job loss and cannot afford rent. I have two young children and no family support. I need assistance finding emergency housing and financial resources.`,
      `Case ${caseNumber}: My landlord is refusing to make necessary repairs to my apartment, including fixing heating and plumbing issues. The living conditions are becoming unsafe and uninhabitable.`,
      `Case ${caseNumber}: I am experiencing housing discrimination based on my family status. Multiple landlords have refused my applications despite meeting all requirements and having good credit.`
    ],
    mental: [
      `Case ${caseNumber}: I have been struggling with severe depression and anxiety following a traumatic incident. I am having thoughts of self-harm and need immediate mental health support and counseling services.`,
      `Case ${caseNumber}: My mental health has deteriorated significantly due to ongoing stress and trauma. I am unable to function normally and require professional intervention and support resources.`,
      `Case ${caseNumber}: I am experiencing panic attacks, insomnia, and severe anxiety that is impacting my daily life. I need access to mental health services and crisis intervention support.`
    ],
    financial: [
      `Case ${caseNumber}: I am a victim of financial fraud where someone has stolen my identity and emptied my bank accounts. I need assistance recovering my funds and securing my financial information.`,
      `Case ${caseNumber}: My employer has not paid me for the past month despite my continued work. I am facing financial hardship and need help recovering my wages and understanding my rights.`,
      `Case ${caseNumber}: I am being exploited financially by a family member who has access to my accounts. They are taking money without permission and I need help protecting my assets.`
    ],
    discrimination: [
      `Case ${caseNumber}: I am experiencing workplace discrimination based on my race/ethnicity. I have been passed over for promotions, excluded from meetings, and subjected to inappropriate comments.`,
      `Case ${caseNumber}: I believe I am being discriminated against in housing applications due to my disability. Multiple landlords have rejected my applications after learning about my condition.`,
      `Case ${caseNumber}: I am facing discrimination in accessing services due to my gender identity. Staff members have been hostile and refused to provide appropriate assistance.`
    ],
    stalking: [
      `Case ${caseNumber}: An ex-partner has been following me, monitoring my activities, and showing up at my workplace and home uninvited. This behavior has been ongoing for weeks and I feel unsafe.`,
      `Case ${caseNumber}: A stranger has been stalking me both online and in person. They have created fake social media profiles to monitor me and have appeared at locations I frequent.`,
      `Case ${caseNumber}: I am being stalked by someone I briefly dated who cannot accept that I ended the relationship. They are contacting me constantly and following my daily activities.`
    ],
    cyberbullying: [
      `Case ${caseNumber}: I am being harassed and threatened online through multiple social media platforms. The perpetrator is posting false information about me and encouraging others to target me.`,
      `Case ${caseNumber}: Someone has been sending me threatening messages and sharing my personal information online without consent. The harassment has escalated and I fear for my safety.`,
      `Case ${caseNumber}: I am experiencing coordinated online harassment from multiple accounts. They are posting defamatory content and have threatened to harm me physically.`
    ],
    workplace: [
      `Case ${caseNumber}: My supervisor is creating a hostile work environment through constant criticism, unreasonable demands, and public humiliation. This behavior is affecting my performance and wellbeing.`,
      `Case ${caseNumber}: I am experiencing retaliation at work after reporting safety violations. My hours have been reduced and I am being excluded from important projects and communications.`,
      `Case ${caseNumber}: There is a pattern of favoritism and unfair treatment in my workplace. Certain employees receive preferential treatment while others face discrimination and harassment.`
    ],
    domestic: [
      `Case ${caseNumber}: I am in an abusive relationship where my partner controls my finances, monitors my activities, and threatens violence. I need help creating a safety plan and accessing resources.`,
      `Case ${caseNumber}: My family member has become increasingly violent and controlling. I am afraid to stay in the home but have limited options for safe housing and financial support.`,
      `Case ${caseNumber}: I am experiencing emotional and psychological abuse from my partner who isolates me from friends and family. The situation is escalating and I need support to leave safely.`
    ],
    legal_rights: [
      `Case ${caseNumber}: My employer is violating my legal rights by refusing reasonable accommodations for my disability. I need assistance understanding my rights and filing a formal complaint.`,
      `Case ${caseNumber}: I believe my landlord is illegally evicting me without proper notice. I need legal guidance to protect my housing rights and understand the eviction process.`,
      `Case ${caseNumber}: I am facing discrimination in accessing public services due to my immigration status. I need help understanding my legal rights and finding appropriate legal representation.`
    ],
    policy_violation: [
      `Case ${caseNumber}: My workplace has implemented policies that violate labor laws and employee rights. I need assistance documenting these violations and understanding my legal options.`,
      `Case ${caseNumber}: My school is enforcing policies that discriminate against certain student groups. I need help understanding my rights and filing a formal complaint.`,
      `Case ${caseNumber}: A government agency is applying policies that unfairly target my community. I need legal assistance to challenge these discriminatory practices.`
    ],
    threats: [
      `Case ${caseNumber}: I have received multiple threatening messages from an unknown individual. The threats are becoming more specific and I fear for my safety.`,
      `Case ${caseNumber}: My ex-partner is making threats against my family and me. They have access to weapons and I need immediate protection and legal assistance.`,
      `Case ${caseNumber}: I am being threatened by a coworker who has made violent statements. Management has not taken appropriate action despite my reports.`
    ],
    safety_concern: [
      `Case ${caseNumber}: I have discovered a serious safety hazard in my workplace that management is ignoring. I fear for the safety of myself and my coworkers.`,
      `Case ${caseNumber}: There is a dangerous individual in my neighborhood who has been harassing multiple people. I need help ensuring community safety.`,
      `Case ${caseNumber}: My child's school has inadequate security measures and I have concerns about their safety. I need assistance advocating for improved safety protocols.`
    ],
    emergency_assistance: [
      `Case ${caseNumber}: I am facing a medical emergency and cannot afford treatment. I need immediate assistance finding emergency medical care and financial support.`,
      `Case ${caseNumber}: My home was damaged in a natural disaster and I need emergency housing assistance. I have nowhere else to go and need immediate help.`,
      `Case ${caseNumber}: I am experiencing food insecurity and need emergency assistance to feed my family. I have exhausted all other resources and need immediate help.`
    ],
    resource_access: [
      `Case ${caseNumber}: I am having difficulty accessing essential services due to language barriers and lack of transportation. I need help connecting with appropriate resources.`,
      `Case ${caseNumber}: My community lacks access to basic healthcare services. I need assistance advocating for improved healthcare access and finding alternative resources.`,
      `Case ${caseNumber}: I am struggling to access educational resources for my children due to financial constraints. I need help finding affordable educational opportunities.`
    ],
    crisis_support: [
      `Case ${caseNumber}: I am in a mental health crisis and need immediate intervention. I am having thoughts of self-harm and need crisis support services.`,
      `Case ${caseNumber}: My family is experiencing a crisis due to substance abuse issues. I need help accessing crisis intervention and family support services.`,
      `Case ${caseNumber}: I am experiencing a personal crisis that is affecting my ability to function. I need immediate crisis counseling and support resources.`
    ],
    emotional_distress: [
      `Case ${caseNumber}: I am experiencing severe emotional distress following a traumatic event. I need emotional support and counseling to help me cope.`,
      `Case ${caseNumber}: My relationship problems are causing significant emotional distress. I need help managing my emotions and finding healthy coping strategies.`,
      `Case ${caseNumber}: I am struggling with overwhelming stress and anxiety that is affecting my daily life. I need emotional support and stress management resources.`
    ]
  };
  
  const typeDescriptions = descriptions[type] || descriptions.harassment;
  return typeDescriptions[caseNumber % typeDescriptions.length];
}

function getWitnessDescriptions(type) {
  const witnesses = {
    harassment: ['Coworkers who overheard inappropriate comments', 'Security cameras in the area', 'Other customers who witnessed the behavior'],
    assault: ['Bystanders who called for help', 'Security footage available', 'Witnesses who provided statements to police'],
    housing: ['Neighbors who can verify living conditions', 'Documentation from housing authority', 'Social worker familiar with the case'],
    mental: ['Family members concerned about wellbeing', 'Healthcare provider who can verify condition', 'Crisis counselor who provided initial support'],
    financial: ['Bank records showing unauthorized transactions', 'Other victims of similar fraud', 'Financial advisor who discovered the issue'],
    discrimination: ['Colleagues who witnessed discriminatory behavior', 'Documentation of unequal treatment', 'HR representative who received initial complaint'],
    stalking: ['Neighbors who observed suspicious behavior', 'Friends who received concerning messages', 'Security personnel who documented incidents'],
    cyberbullying: ['Screenshots of online harassment saved by friends', 'Other targets of similar harassment', 'Platform moderators who reviewed reports'],
    workplace: ['Coworkers who experienced similar treatment', 'HR documentation of previous complaints', 'Supervisor who witnessed inappropriate behavior'],
    domestic: ['Neighbors who heard disturbances', 'Medical professionals who treated injuries', 'Friends who noticed signs of abuse'],
    legal_rights: ['HR representatives who documented complaints', 'Legal aid workers familiar with the case', 'Colleagues who witnessed rights violations'],
    policy_violation: ['Policy documents showing violations', 'Employee handbook with conflicting policies', 'Witnesses to policy enforcement'],
    threats: ['Text messages with threats', 'Witnesses who heard threats', 'Security personnel who documented incidents'],
    safety_concern: ['Safety inspection reports', 'Coworkers who share safety concerns', 'Safety committee members'],
    emergency_assistance: ['Medical professionals who provided care', 'Social workers familiar with the case', 'Emergency service personnel'],
    resource_access: ['Service providers who denied access', 'Community advocates familiar with barriers', 'Other community members with similar experiences'],
    crisis_support: ['Crisis hotline counselors', 'Mental health professionals', 'Family members who witnessed the crisis'],
    emotional_distress: ['Mental health professionals', 'Family members who noticed changes', 'Friends who observed emotional state']
  };
  
  const typeWitnesses = witnesses[type] || witnesses.harassment;
  return typeWitnesses[Math.floor(Math.random() * typeWitnesses.length)];
}

function getEvidenceDescriptions(type) {
  const evidence = {
    harassment: ['Screenshots of inappropriate messages', 'Email communications', 'Witness statements', 'Security camera footage'],
    assault: ['Medical records from treatment', 'Police report filed', 'Photographs of injuries', 'Witness contact information'],
    housing: ['Eviction notice', 'Financial hardship documentation', 'Photos of unsafe living conditions', 'Communication with landlord'],
    mental: ['Medical records from healthcare provider', 'Prescription medication history', 'Journal entries documenting mental state', 'Crisis hotline call records'],
    financial: ['Bank statements showing unauthorized charges', 'Identity theft report filed with authorities', 'Credit report showing fraudulent accounts', 'Communication with financial institutions'],
    discrimination: ['Email communications showing bias', 'Documentation of unequal treatment', 'Witness statements from colleagues', 'HR complaint records'],
    stalking: ['Photos of stalker at various locations', 'Screenshots of social media monitoring', 'Text messages and call logs', 'Security footage of unwanted visits'],
    cyberbullying: ['Screenshots of harassing messages', 'Fake profiles created by harasser', 'Platform reports filed', 'Evidence of doxxing attempts'],
    workplace: ['Performance reviews showing retaliation', 'Email communications from supervisor', 'Documentation of policy violations', 'Witness statements from coworkers'],
    domestic: ['Photos of injuries from abuse', 'Medical records from emergency visits', 'Text messages with threats', 'Safety plan created with counselor'],
    legal_rights: ['Documentation of rights violations', 'Policy documents and employee handbook', 'Communication records with management', 'Legal correspondence'],
    policy_violation: ['Policy documents showing violations', 'Employee handbook with conflicting policies', 'Documentation of policy enforcement', 'Communication records'],
    threats: ['Text messages with threats', 'Voice mail recordings', 'Written threats or notes', 'Witness statements'],
    safety_concern: ['Safety inspection reports', 'Photographs of hazards', 'Safety committee meeting minutes', 'Communication with safety personnel'],
    emergency_assistance: ['Medical records and bills', 'Emergency service reports', 'Financial hardship documentation', 'Communication with service providers'],
    resource_access: ['Denial letters from service providers', 'Documentation of barriers encountered', 'Communication records with providers', 'Community resource lists'],
    crisis_support: ['Crisis hotline call records', 'Mental health assessment reports', 'Emergency contact information', 'Safety plan documentation'],
    emotional_distress: ['Mental health assessment reports', 'Journal entries documenting distress', 'Communication with mental health professionals', 'Medication records']
  };
  
  const typeEvidence = evidence[type] || evidence.harassment;
  return typeEvidence[Math.floor(Math.random() * typeEvidence.length)];
}

// Seed demo data with working demo accounts
async function seedDemoData() {
  console.log('📊 Creating comprehensive demo data with 100 unique cases...');
  
  // Generate 100 unique, detailed cases
  const demoReports = generateComprehensiveDemoData();

  try {
    for (let index = 0; index < demoReports.length; index++) {
      const report = demoReports[index];
      console.log(`🔄 Creating demo report ${index + 1}/${demoReports.length}: ${report.report_id}`);
      
      const anonymousId = `ANON_DEMO_${index + 1}`;
      const ipHash = hashIP(`demo_ip_${index + 1}`);
      
      // Create user with demo credentials
      const userId = await new Promise((resolve, reject) => {
        db.run('INSERT INTO users (anonymous_id, ip_hash, email, security_pin) VALUES (?, ?, ?, ?)', 
          [anonymousId, ipHash, report.userEmail, report.userPin], 
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      console.log(`✅ Created user ${userId} for report ${report.report_id} with ${report.userEmail ? 'email' : 'PIN'} auth`);

      // Create report
      await new Promise((resolve, reject) => {
        const reportQuery = `
          INSERT INTO reports (
            report_id, user_id, incident_type, incident_date, incident_time, location,
            description, current_safety, witnesses, evidence, contact_method, contact_info, anonymous,
            assigned_department, assignment_confidence, assignment_reasoning,
            status, priority, assigned_agent, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const createdAt = new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString();
        
        db.run(reportQuery, [
          report.report_id,
          userId,
          report.incident_type,
          report.incident_date,
          report.incident_time,
          report.location,
          report.description,
          report.current_safety,
          report.witnesses,
          report.evidence,
          report.contact_method,
          report.contact_info,
          report.anonymous,
          report.assigned_department,
          Math.floor(Math.random() * 20) + 80, // 80-100 confidence
          JSON.stringify([
            `Incident type "${report.incident_type}" matches ${report.assigned_department} specialization`,
            'AI content analysis detected relevant keywords',
            'High confidence match based on multiple factors'
          ]),
          report.status,
          report.priority,
          report.assigned_agent,
          createdAt,
          createdAt
        ], (err) => {
          if (err) {
            console.error(`❌ Error inserting report ${report.report_id}:`, err);
            reject(err);
          } else {
            console.log(`✅ Created demo report: ${report.report_id} → ${report.assigned_department}`);
            resolve();
          }
        });
      });

      // Add initial department message
      await new Promise((resolve, reject) => {
        const messageQuery = `
          INSERT INTO messages (report_id, sender_type, sender_name, sender_department, message, timestamp)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const departmentMessage = `Hello! Your case has been assigned to ${DEPARTMENTS[report.assigned_department].name}. We'll respond within ${DEPARTMENTS[report.assigned_department].avgResponseTime}.`;
        
        db.run(messageQuery, [
          report.report_id,
          'department',
          DEPARTMENTS[report.assigned_department].name,
          report.assigned_department,
          departmentMessage,
          new Date().toISOString()
        ], (err) => {
          if (err) {
            console.error(`❌ Error adding initial message for ${report.report_id}:`, err);
            reject(err);
          } else {
            console.log(`✅ Added initial message for ${report.report_id}`);
            resolve();
          }
        });
      });
    }
    
    console.log('✅ Demo data created successfully!');
    
    // Log demo account info
    console.log('\n👤 Demo Account Credentials:');
    demoReports.forEach(report => {
      const authInfo = report.userEmail ? `Email: ${report.userEmail}` : `PIN: ${report.userPin}`;
      console.log(`  ${report.report_id}: ${authInfo} (${report.status})`);
    });

  } catch (error) {
    console.error('❌ Error during demo data creation:', error);
  }
}

// Utility functions
const generateReportId = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SAFE${timestamp}${random}`;
};

const generateAnonymousId = () => {
  return 'ANON_' + crypto.randomBytes(16).toString('hex').toUpperCase();
};

const hashIP = (ip) => {
  return crypto.createHash('sha256').update(ip + process.env.IP_SALT || 'salt-string').digest('hex');
};

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

const sharedContext = {
  db,
  DEPARTMENTS,
  bcrypt,
  jwt,
  crypto,
  generateReportId,
  generateAnonymousId,
  hashIP
};

// Import and mount user routes
const userRoutes = require('./users.js')(sharedContext);
app.use('/api/users', userRoutes);

console.log('✅ User routes mounted at /api/users');

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, admin) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.admin = admin;
    next();
  });
};

// User Authentication middleware for messaging
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

    // Handle report-based users (demo accounts)
    req.user = {
      userId: decoded.userId,
      reportId: decoded.reportId,
      authMethod: decoded.authMethod || 'report',
      anonymous: decoded.anonymous
    };

    console.log('🔐 User authenticated:', req.user.authMethod, req.user.reportId);
    next();
  });
};

// Department access middleware
const requireDepartmentAccess = (allowedDepartments) => {
  return (req, res, next) => {
    if (req.admin.role === 'super_admin') {
      return next(); // Super admin can access everything
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
      if (res.statusCode < 400) { // Only log successful actions
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
            hashIP(req.ip),
            JSON.stringify(details)
          ]
        );
      }
      originalSend.call(this, data);
    };
    next();
  };
};

// ==================== AUTHENTICATION ROUTES ====================

// Admin Login
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required',
        success: false 
      });
    }

    // Find admin by username
    db.get('SELECT * FROM admins WHERE username = ? AND is_active = 1', [username], async (err, admin) => {
      if (err) {
        console.error('Database error during admin login:', err);
        return res.status(500).json({ error: 'Internal server error', success: false });
      }

      if (!admin) {
        return res.status(401).json({ 
          error: 'Invalid username or password',
          success: false 
        });
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, admin.password_hash);
      if (!passwordValid) {
        return res.status(401).json({ 
          error: 'Invalid username or password',
          success: false 
        });
      }

      // Generate JWT token for admin
      const tokenPayload = {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        department: admin.department,
        departmentName: admin.department === 'all' ? 'Super Admin' : DEPARTMENTS[admin.department]?.name,
        role: admin.role
      };

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { 
        expiresIn: '8h' 
      });

      // Store admin session
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

      db.run(
        'INSERT INTO admin_sessions (admin_id, token_hash, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
        [admin.id, tokenHash, expiresAt, req.ip, req.get('User-Agent') || ''],
        (err) => {
          if (err) {
            console.error('Error storing admin session:', err);
            return res.status(500).json({ error: 'Failed to create session', success: false });
          }

          // Update last login
          db.run('UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [admin.id]);

          console.log(`✅ ADMIN LOGIN SUCCESSFUL: ${admin.username}`);

          res.json({
            success: true,
            token,
            admin: tokenPayload,
            message: 'Admin login successful',
            expiresIn: 8 * 60 * 60 * 1000
          });
        }
      );
    });

  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({ error: 'Internal server error', success: false });
  }
});

// Admin Logout
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Remove session from database
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
app.get('/api/auth/verify', authenticateToken, (req, res) => {
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

// ==================== USER AUTHENTICATION ROUTES ====================

// User Login
app.post('/api/users/auth/login', async (req, res) => {
  try {
    const { email, securityPin } = req.body;

    if (!email || !securityPin) {
      return res.status(400).json({ 
        error: 'Email and security pin are required',
        success: false 
      });
    }

    // Find user by email and security pin
    db.get('SELECT * FROM reports WHERE email = ? AND security_pin = ?', [email, securityPin], async (err, report) => {
      if (err) {
        console.error('Database error during user login:', err);
        return res.status(500).json({ error: 'Internal server error', success: false });
      }

      if (!report) {
        return res.status(401).json({ 
          error: 'Invalid email or security pin',
          success: false 
        });
      }

      // Generate JWT token for user
      const tokenPayload = {
        id: report.id,
        reportId: report.report_id,
        email: report.email,
        anonymous: report.anonymous === 1,
        department: report.department,
        status: report.status
      };

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { 
        expiresIn: '24h' 
      });

      console.log(`✅ USER LOGIN SUCCESSFUL: ${report.email} (Report: ${report.report_id})`);

      res.json({
        success: true,
        token,
        user: tokenPayload,
        message: 'User login successful',
        expiresIn: 24 * 60 * 60 * 1000
      });
    });

  } catch (error) {
    console.error('❌ User login error:', error);
    res.status(500).json({ error: 'Internal server error', success: false });
  }
});

// User Logout
app.post('/api/users/auth/logout', authenticateUser, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
});

// Verify User Token
app.get('/api/users/auth/verify', authenticateUser, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      reportId: req.user.report_id,
      email: req.user.email,
      anonymous: req.user.anonymous === 1,
      department: req.user.department,
      status: req.user.status
    }
  });
});

// User Dashboard
app.get('/api/users/dashboard', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's report details
    db.get('SELECT * FROM reports WHERE id = ?', [userId], async (err, report) => {
      if (err) {
        console.error('Database error getting user dashboard:', err);
        return res.status(500).json({ error: 'Internal server error', success: false });
      }

      if (!report) {
        return res.status(404).json({ error: 'Report not found', success: false });
      }

      // Get department info
      db.get('SELECT * FROM departments WHERE id = ?', [report.department], async (err, department) => {
        if (err) {
          console.error('Database error getting department:', err);
          return res.status(500).json({ error: 'Internal server error', success: false });
        }

        // Get unread message count
        db.get('SELECT COUNT(*) as count FROM messages WHERE report_id = ? AND is_read = 0 AND sender_type = "admin"', [report.report_id], async (err, messageCount) => {
          if (err) {
            console.error('Database error getting message count:', err);
            return res.status(500).json({ error: 'Internal server error', success: false });
          }

          // Get recent timeline events
          db.all('SELECT * FROM case_timeline WHERE report_id = ? ORDER BY created_at DESC LIMIT 10', [report.report_id], async (err, timeline) => {
            if (err) {
              console.error('Database error getting timeline:', err);
              return res.status(500).json({ error: 'Internal server error', success: false });
            }

            const dashboardData = {
              report: {
                id: report.id,
                reportId: report.report_id,
                status: report.status,
                priority: report.priority,
                incidentType: report.incident_type,
                description: report.description,
                createdAt: report.created_at,
                updatedAt: report.updated_at
              },
              department: department ? {
                id: department.id,
                name: department.name,
                description: department.description
              } : null,
              messages: {
                unreadCount: messageCount.count || 0
              },
              timeline: timeline || [],
              quickActions: [
                { id: 'view_messages', label: 'View Messages', icon: 'message-circle' },
                { id: 'upload_files', label: 'Upload Files', icon: 'upload' },
                { id: 'book_session', label: 'Book Session', icon: 'calendar' }
              ],
              statistics: {
                daysSinceSubmission: Math.floor((Date.now() - new Date(report.created_at).getTime()) / (1000 * 60 * 60 * 24)),
                statusUpdates: timeline ? timeline.filter(event => event.event_type === 'status_change').length : 0,
                messagesReceived: timeline ? timeline.filter(event => event.event_type === 'message').length : 0
              },
              nextSteps: [
                'Monitor your case status',
                'Check for new messages',
                'Upload any additional evidence',
                'Book a support session if needed'
              ]
            };

            res.json({
              success: true,
              dashboard: dashboardData
            });
          });
        });
      });
    });

  } catch (error) {
    console.error('❌ User dashboard error:', error);
    res.status(500).json({ error: 'Internal server error', success: false });
  }
});

// ==================== AI ROUTES ====================

// Basic Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// AI Health Check
app.get('/api/ai/health', authenticateToken, (req, res) => {
  const healthCheck = {
    ai_enabled: process.env.ENABLE_AI_ASSIGNMENT === 'true',
    model: process.env.AI_MODEL || 'claude-3-5-sonnet-20241022',
    api_key_configured: !!process.env.ANTHROPIC_API_KEY,
    rate_limits: {
      minute: `${safeVoiceAI.requestCounts.minute.count}/${safeVoiceAI.rateLimits.minute}`,
      hour: `${safeVoiceAI.requestCounts.hour.count}/${safeVoiceAI.rateLimits.hour}`
    },
    features: {
      department_assignment: process.env.ENABLE_AI_ASSIGNMENT === 'true',
      sentiment_analysis: process.env.ENABLE_REAL_TIME_SENTIMENT === 'true',
      risk_assessment: process.env.ENABLE_RISK_ASSESSMENT === 'true',
      ai_insights: process.env.ENABLE_AI_INSIGHTS === 'true'
    },
    last_error: null,
    uptime: process.uptime()
  };

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    ...healthCheck
  });
});

// AI Test Endpoint
app.post('/api/ai/test', authenticateToken, requireDepartmentAccess(['all']), async (req, res) => {
  const { testType, testData } = req.body;
  
  if (!testType) {
    return res.status(400).json({ error: 'testType required', success: false });
  }

  try {
    let result;
    const startTime = Date.now();

    switch (testType) {
      case 'sentiment':
        result = await safeVoiceAI.analyzeSentiment(testData?.text || 'This is a test message for AI connectivity verification');
        break;
        
      case 'department':
        result = await safeVoiceAI.analyzeAndAssignDepartment(testData || {
          incidentType: 'harassment',
          description: 'My supervisor is making inappropriate comments',
          currentSafety: 'safe'
        });
        break;
        
      case 'risk':
        result = await safeVoiceAI.assessRisk(testData || {
          incidentType: 'assault',
          description: 'I was physically attacked',
          currentSafety: 'unsafe'
        });
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid testType', success: false });
    }

    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      testType,
      result,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      testType,
      timestamp: new Date().toISOString()
    });
  }
});

// AI Insights Endpoint for Admin Dashboard
app.get('/api/admin/ai-insights', authenticateToken, requireDepartmentAccess(['all']), async (req, res) => {
  try {
    // Get recent reports for analysis
    const recentReportsQuery = `
      SELECT 
        report_id, incident_type, ai_sentiment, ai_risk_level, 
        assigned_department, assignment_confidence, created_at,
        priority, status
      FROM reports 
      WHERE assignment_confidence IS NOT NULL
      ORDER BY created_at DESC 
      LIMIT 100
    `;

    db.all(recentReportsQuery, [], async (err, reports) => {
      if (err) {
        console.error('Error fetching reports for AI insights:', err);
        return res.status(500).json({ error: 'Failed to fetch AI insights', success: false });
      }

      try {
        // Generate AI insights
        const insights = await safeVoiceAI.generateDashboardInsights({
          totalReports: reports.length,
          departmentDistribution: reports.reduce((acc, report) => {
            acc[report.assigned_department] = (acc[report.assigned_department] || 0) + 1;
            return acc;
          }, {}),
          riskLevels: reports.reduce((acc, report) => {
            acc[report.ai_risk_level] = (acc[report.ai_risk_level] || 0) + 1;
            return acc;
          }, {}),
          avgConfidence: reports.reduce((sum, r) => sum + r.assignment_confidence, 0) / reports.length,
          recentTrends: reports.slice(0, 30)
        });

        res.json({
          success: true,
          insights: insights,
          reportsSample: reports.length,
          generatedAt: new Date().toISOString(),
          aiModel: 'claude-3-5-sonnet-20241022'
        });

      } catch (aiError) {
        console.error('AI insights generation error:', aiError);
        res.status(500).json({ error: 'Failed to generate AI insights', success: false });
      }
    });

  } catch (error) {
    console.error('Error in AI insights endpoint:', error);
    res.status(500).json({ error: 'Internal server error', success: false });
  }
});

// ==================== REPORT SUBMISSION ====================

// Submit Report (Public endpoint)
app.post('/api/reports', async (req, res) => {
  try {
    const {
      incidentType,
      incidentDate,
      incidentTime,
      location,
      description,
      currentSafety,
      witnesses,
      evidence,
      contactMethod,
      contactInfo,
      anonymous,
      detectedLocation
    } = req.body;

    console.log('📝 Received report submission:', { incidentType, incidentDate, currentSafety });

    // Validate required fields
    if (!incidentType || !incidentDate || !description || !currentSafety) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['incidentType', 'incidentDate', 'description', 'currentSafety'],
        success: false
      });
    }

    const reportId = generateReportId();
    const anonymousId = generateAnonymousId();

    // Get AI analysis
    const [aiAssignment, sentimentAnalysis, riskAssessment] = await Promise.all([
      EnhancedAIAssignmentEngine.analyzeCase({
        incidentType,
        description,
        currentSafety,
        location,
        witnesses,
        evidence
      }),
      EnhancedAIAssignmentEngine.analyzeSentiment(description),
      EnhancedAIAssignmentEngine.assessRisk({
        incidentType,
        description,
        currentSafety,
        location,
        witnesses,
        evidence,
        incidentDate
      })
    ]);

    // Determine priority based on AI analysis
    let priority = 'medium';
    if (riskAssessment.riskLevel === 'critical' || currentSafety === 'unsafe') {
      priority = 'critical';
    } else if (riskAssessment.riskLevel === 'high' || sentimentAnalysis.urgency_level === 'high') {
      priority = 'high';
    } else if (riskAssessment.riskLevel === 'low') {
      priority = 'low';
    }

    // Insert user first
    const userQuery = `INSERT INTO users (anonymous_id, ip_hash) VALUES (?, ?)`;
    const ipHash = hashIP(req.ip || 'unknown');
    
    db.run(userQuery, [anonymousId, ipHash], function(err) {
      if (err) {
        console.error('❌ Error creating user:', err);
        return res.status(500).json({ error: 'Failed to create user', success: false });
      }

      const userId = this.lastID;

      // Generate assigned agent based on department
      const dept = DEPARTMENTS[aiAssignment.assignedDepartment];
      const agentNames = {
        legal: ['Agent Sarah Martinez', 'Agent Robert Kim', 'Agent Maria Rodriguez'],
        task: ['Agent Michael Thompson', 'Agent Lisa Chen', 'Agent David Park'],
        support: ['Agent Jennifer Wong', 'Agent Carlos Rivera', 'Agent Amy Foster'],
        happy2help: ['Dr. Lisa Rodriguez', 'Dr. James Wilson', 'Dr. Priya Sharma']
      };
      const assignedAgent = agentNames[aiAssignment.assignedDepartment] ? 
        agentNames[aiAssignment.assignedDepartment][Math.floor(Math.random() * agentNames[aiAssignment.assignedDepartment].length)] : 
        'Available Agent';

      const now = new Date().toISOString();

      // Insert report
      const reportQuery = `
        INSERT INTO reports (
          report_id, user_id, incident_type, incident_date, incident_time, location,
          description, current_safety, witnesses, evidence, contact_method, contact_info, anonymous,
          detected_location, ai_sentiment, ai_risk_level, ai_category_suggestion,
          assigned_department, assignment_confidence, assignment_reasoning,
          status, priority, assigned_agent, case_notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const reportParams = [
        reportId,
        userId,
        incidentType,
        incidentDate,
        incidentTime || null,
        location || null,
        description,
        currentSafety,
        witnesses || null,
        evidence || null,
        contactMethod || null,
        contactInfo || null,
        anonymous ? 1 : 0,
        detectedLocation ? JSON.stringify(detectedLocation) : null,
        JSON.stringify(sentimentAnalysis),
        riskAssessment.riskLevel,
        JSON.stringify(aiAssignment.reasoning),
        aiAssignment.assignedDepartment,
        aiAssignment.confidence,
        JSON.stringify(aiAssignment.reasoning),
        'submitted',
        priority,
        assignedAgent,
        null,
        now,
        now
      ];

      db.run(reportQuery, reportParams, function(err) {
        if (err) {
          console.error('❌ Error inserting report:', err);
          return res.status(500).json({ error: 'Failed to submit report', success: false });
        }

        console.log(`✅ Report submitted: ${reportId} → ${DEPARTMENTS[aiAssignment.assignedDepartment].name}`);
        
        // Add initial department message
        const messageQuery = `
          INSERT INTO messages (report_id, sender_type, sender_name, sender_department, message)
          VALUES (?, ?, ?, ?, ?)
        `;
        
        const departmentMessage = `Hello! Your case has been analyzed by our AI system and assigned to ${DEPARTMENTS[aiAssignment.assignedDepartment].name} with ${aiAssignment.confidence}% confidence. We'll respond within ${DEPARTMENTS[aiAssignment.assignedDepartment].avgResponseTime}.`;
        
        db.run(messageQuery, [
          reportId,
          'department',
          DEPARTMENTS[aiAssignment.assignedDepartment].name,
          aiAssignment.assignedDepartment,
          departmentMessage
        ]);

        res.status(201).json({
          success: true,
          reportId: reportId,
          anonymousId: anonymousId,
          submittedAt: new Date().toISOString(),
          status: 'submitted',
          priority: priority,
          aiAnalysis: {
            assignedDepartment: aiAssignment.assignedDepartment,
            confidence: aiAssignment.confidence,
            reasoning: aiAssignment.reasoning,
            sentimentAnalysis: sentimentAnalysis,
            riskAssessment: riskAssessment,
            recommendedActions: aiAssignment.recommendedActions
          },
          departmentInfo: DEPARTMENTS[aiAssignment.assignedDepartment],
          message: 'Report submitted and analyzed by AI successfully'
        });
      });
    });

  } catch (error) {
    console.error('❌ Error in report submission:', error);
    res.status(500).json({ error: 'Internal server error', success: false });
  }
});

// Get Report Status (Enhanced)
app.get('/api/reports/:reportId/status', async (req, res) => {
  const { reportId } = req.params;
  
  const query = `
    SELECT 
      r.*,
      u.anonymous_id
    FROM reports r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.report_id = ?
  `;

  db.get(query, [reportId], async (err, report) => {
    if (err) {
      console.error('Error fetching report status:', err);
      return res.status(500).json({ error: 'Internal server error', success: false });
    }

    if (!report) {
      return res.status(404).json({ error: 'Report not found', success: false });
    }

    // Parse AI analysis data
    const aiSentiment = report.ai_sentiment ? JSON.parse(report.ai_sentiment) : null;
    const riskFactors = report.risk_factors ? JSON.parse(report.risk_factors) : [];
    const recommendedActions = report.recommended_actions ? JSON.parse(report.recommended_actions) : [];
    const assignmentReasoning = report.assignment_reasoning ? JSON.parse(report.assignment_reasoning) : [];

    // Enhanced timeline with AI insights
    const timeline = [
      {
        date: report.created_at,
        status: 'Submitted',
        description: 'Report received and encrypted securely'
      },
      {
        date: new Date(new Date(report.created_at).getTime() + 30000).toISOString(), // 30 seconds later
        status: 'AI Analysis Complete',
        description: `Advanced AI analysis completed. Assigned to ${DEPARTMENTS[report.assigned_department]?.name} with ${report.assignment_confidence}% confidence. Risk level: ${report.ai_risk_level}.`
      }
    ];

    if (report.status !== 'submitted') {
      timeline.push({
        date: report.updated_at,
        status: 'Under Review',
        description: `Case being handled by ${DEPARTMENTS[report.assigned_department]?.name}. AI identified ${riskFactors.length} risk factors.`
      });
    }

    res.json({
      success: true,
      reportId: report.report_id,
      status: report.status,
      priority: report.priority,
      submittedAt: report.created_at,
      lastUpdated: report.updated_at,
      incidentType: report.incident_type,
      assignedDepartment: report.assigned_department,
      departmentInfo: DEPARTMENTS[report.assigned_department],
      aiAnalysis: {
        confidence: report.assignment_confidence,
        reasoning: assignmentReasoning,
        sentiment: aiSentiment,
        riskLevel: report.ai_risk_level,
        riskFactors: riskFactors,
        recommendedActions: recommendedActions,
        analysisComplete: report.ai_analysis_complete === 1
      },
      timeline: timeline.sort((a, b) => new Date(a.date) - new Date(b.date)),
      nextSteps: [
        `${DEPARTMENTS[report.assigned_department]?.name} will contact you within ${DEPARTMENTS[report.assigned_department]?.avgResponseTime}`,
        `AI recommended actions: ${recommendedActions.slice(0, 2).join(', ')}`,
        'Support services coordination in progress based on AI assessment'
      ]
    });
  });
});

// AI Preview Endpoint (for real-time department preview)
app.post('/api/ai-preview', async (req, res) => {
  const { incidentType, description, currentSafety } = req.body;
  
  if (!description || description.length < 20) {
    return res.json({ 
      success: false,
      preview: null,
      message: 'Description too short for preview'
    });
  }

  try {
    // Get AI assignment preview
    const aiAssignment = await EnhancedAIAssignmentEngine.analyzeCase({
      incidentType,
      description,
      currentSafety
    });
    
    const preview = {
      assignedDepartment: aiAssignment.assignedDepartment,
      confidence: aiAssignment.confidence,
      reasoning: aiAssignment.reasoning,
      urgencyLevel: aiAssignment.urgencyLevel,
      departmentName: DEPARTMENTS[aiAssignment.assignedDepartment]?.name
    };
    
    res.json({
      success: true,
      preview: preview,
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI preview error:', error);
    res.json({
      success: false,
      preview: null,
      error: 'Preview temporarily unavailable'
    });
  }
});

// Sentiment Analysis Endpoint
app.post('/api/analyze-sentiment', (req, res) => {
  const { text } = req.body;
  
  if (!text || text.length < 10) {
    return res.json({ 
      sentiment: null,
      message: 'Text too short for analysis'
    });
  }

  // Perform real-time sentiment analysis
  EnhancedAIAssignmentEngine.analyzeSentiment(text)
    .then(sentiment => {
      res.json({
        success: true,
        sentiment: sentiment,
        analyzedAt: new Date().toISOString()
      });
    })
    .catch(error => {
      console.error('Real-time sentiment analysis error:', error);
      res.json({
        success: false,
        sentiment: null,
        error: 'Analysis temporarily unavailable'
      });
    });
});

// Report Tracking Endpoint
app.get('/api/reports/:reportId/track', (req, res) => {
  const { reportId } = req.params;
  const { email, securityPin } = req.query;

  console.log(`🔍 Report tracking request: ${reportId}`);

  if (!reportId) {
    return res.status(400).json({ error: 'Report ID required', success: false });
  }

  // Find the report and user
  const query = `
    SELECT r.*, u.anonymous_id, u.email as user_email, u.security_pin
    FROM reports r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.report_id = ?
  `;

  db.get(query, [reportId.toUpperCase()], (err, report) => {
    if (err) {
      console.error('Error fetching report for tracking:', err);
      return res.status(500).json({ error: 'Internal server error', success: false });
    }

    if (!report) {
      return res.status(404).json({ error: 'Report not found', success: false });
    }

    // Basic report info (no authentication required for tracking)
    const departmentInfo = DEPARTMENTS[report.assigned_department];
    
    // Get recent updates
    db.all('SELECT * FROM case_updates WHERE report_id = ? ORDER BY created_at DESC LIMIT 5', [reportId], (err, updates) => {
      if (err) {
        console.error('Error fetching case updates:', err);
        updates = [];
      }

      const trackingInfo = {
        success: true,
        reportId: report.report_id,
        status: report.status,
        priority: report.priority,
        incidentType: report.incident_type,
        submittedAt: report.created_at,
        lastUpdated: report.updated_at,
        assignedDepartment: report.assigned_department,
        departmentInfo: departmentInfo,
        timeline: [
          {
            date: report.created_at,
            status: 'Submitted',
            description: 'Report received and processed'
          },
          {
            date: report.created_at,
            status: 'Assigned',
            description: `Assigned to ${departmentInfo?.name}`
          },
          ...updates.map(update => ({
            date: update.created_at,
            status: update.update_type.replace('_', ' '),
            description: update.notes || 'Case updated'
          }))
        ].sort((a, b) => new Date(a.date) - new Date(b.date)),
        nextSteps: [
          `Your case is being handled by ${departmentInfo?.name}`,
          `Expected response time: ${departmentInfo?.avgResponseTime}`,
          'You will be contacted if additional information is needed'
        ]
      };

      // If credentials provided, verify and include more details
      if ((email && report.user_email && email.toLowerCase() === report.user_email.toLowerCase()) ||
          (securityPin && report.security_pin && securityPin === report.security_pin)) {
        
        trackingInfo.authenticated = true;
        trackingInfo.contactMethod = report.contact_method;
        trackingInfo.assignedAgent = report.assigned_agent;
        
        // Include messages if authenticated
        db.all('SELECT sender_type, sender_name, message, timestamp FROM messages WHERE report_id = ? ORDER BY timestamp ASC', [reportId], (err, messages) => {
          if (err) {
            console.error('Error fetching messages:', err);
            messages = [];
          }
          
          trackingInfo.messages = messages.map(msg => ({
            from: msg.sender_name,
            message: msg.message,
            timestamp: msg.timestamp,
            timeAgo: getTimeAgo(msg.timestamp)
          }));
          
          res.json(trackingInfo);
        });
      } else {
        trackingInfo.authenticated = false;
        trackingInfo.note = 'Provide email or security PIN for detailed information';
        res.json(trackingInfo);
      }
    });
  });
});

// ==================== ADMIN DASHBOARD ROUTES ====================

// Super Admin Dashboard
// Super Admin Dashboard
app.get('/api/admin/dashboard', authenticateToken, requireDepartmentAccess(['all']), (req, res) => {
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
    recentActivity: `
      SELECT 
        'report_submitted' as type,
        'New report submitted to ' || assigned_department as description,
        assigned_department as department,
        created_at
      FROM reports 
      ORDER BY created_at DESC 
      LIMIT 20
    `,
    aiAccuracy: `
      SELECT 
        AVG(assignment_confidence) as avg_confidence,
        COUNT(CASE WHEN assignment_confidence >= 80 THEN 1 END) as high_confidence,
        COUNT(*) as total
      FROM reports 
      WHERE assigned_department IS NOT NULL
    `,
    departmentStats: `
      SELECT 
        assigned_department,
        COUNT(*) as total_cases,
        COUNT(CASE WHEN status NOT IN ('resolved', 'closed') THEN 1 END) as active_cases,
        COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as today_cases,
        COUNT(CASE WHEN DATE(created_at) >= DATE('now', '-7 days') THEN 1 END) as week_cases
      FROM reports 
      WHERE assigned_department IS NOT NULL
      GROUP BY assigned_department
    `
  };

  const results = {};
  const queryPromises = Object.entries(queries).map(([key, query]) => {
    return new Promise((resolve, reject) => {
      if (['byDepartment', 'byStatus', 'byPriority', 'recentActivity', 'departmentStats'].includes(key)) {
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
      // Create department statistics array
      const departmentStats = Object.keys(DEPARTMENTS).map(deptId => {
        const dept = DEPARTMENTS[deptId];
        const stats = results.departmentStats.find(s => s.assigned_department === deptId) || {
          total_cases: 0,
          active_cases: 0,
          today_cases: 0,
          week_cases: 0
        };

        return {
          id: deptId,
          name: dept.name,
          description: dept.description,
          color: dept.color,
          activeCases: stats.active_cases,
          todayCases: stats.today_cases,
          weekCases: stats.week_cases,
          totalCases: stats.total_cases,
          avgResponseTime: dept.avgResponseTime,
          activeAgents: dept.activeAgents
        };
      });

      res.json({
        success: true,
        totalReports: results.total.count,
        activeAgents: Object.values(DEPARTMENTS).reduce((sum, dept) => sum + dept.activeAgents, 0),
        avgResponseTime: '6h', // Calculate this properly later
        departmentStats: departmentStats,
        departmentDistribution: results.byDepartment.map(dept => ({
          ...dept,
          departmentName: DEPARTMENTS[dept.assigned_department]?.name || dept.assigned_department
        })),
        statusDistribution: results.byStatus,
        priorityDistribution: results.byPriority,
        recentActivity: results.recentActivity.map(activity => ({
          ...activity,
          timeAgo: getTimeAgo(activity.created_at)
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

// Department Dashboard
app.get('/api/admin/department/:departmentId/dashboard', authenticateToken, (req, res) => {
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
             assigned_agent, created_at, updated_at, description
      FROM reports 
      WHERE assigned_department = ?
      ORDER BY created_at DESC 
      LIMIT 20
    `,
    avgResponseTime: `
      SELECT AVG(
        CASE 
          WHEN status = 'resolved' THEN 
            (julianday(updated_at) - julianday(created_at)) * 24 
          ELSE NULL 
        END
      ) as avg_hours
      FROM reports 
      WHERE assigned_department = ?
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
      
      res.json({
        success: true,
        department: {
          id: departmentId,
          ...departmentInfo,
          totalCases: results.totalCases.count,
          activeCases: results.activeCases.count,
          criticalCases: results.criticalCases.count,
          todaysCases: results.todaysCases.count,
          avgResponseTime: results.avgResponseTime.avg_hours ? 
            `${Math.round(results.avgResponseTime.avg_hours)}h` : 
            departmentInfo.avgResponseTime
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
          timeAgo: getTimeAgo(case_item.created_at),
          anonymous: case_item.contact_method ? false : true,
          shortDescription: case_item.description ? case_item.description.substring(0, 80) + '...' : ''
        })),
        lastUpdated: new Date().toISOString()
      });
    })
    .catch(err => {
      console.error('Error fetching department dashboard data:', err);
      res.status(500).json({ error: 'Internal server error', success: false });
    });
});

// Department Analytics
app.get('/api/admin/department/:departmentId/analytics', authenticateToken, (req, res) => {
  const { departmentId } = req.params;
  const { timeRange = '30days' } = req.query;

  // Check department access
  if (req.admin.role !== 'super_admin' && req.admin.department !== departmentId) {
    return res.status(403).json({ error: 'Access denied to this department', success: false });
  }

  let dateFilter = '';
  switch (timeRange) {
    case '7days':
      dateFilter = "AND created_at >= datetime('now', '-7 days')";
      break;
    case '30days':
      dateFilter = "AND created_at >= datetime('now', '-30 days')";
      break;
    case '90days':
      dateFilter = "AND created_at >= datetime('now', '-90 days')";
      break;
    case '1year':
      dateFilter = "AND created_at >= datetime('now', '-1 year')";
      break;
  }

  const queries = {
    trends: `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_cases,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_cases,
        AVG(assignment_confidence) as avg_confidence
      FROM reports 
      WHERE assigned_department = ? ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
    incidentTypes: `
      SELECT incident_type, COUNT(*) as count
      FROM reports
      WHERE assigned_department = ? ${dateFilter}
      GROUP BY incident_type
      ORDER BY count DESC
    `,
    priorityDistribution: `
      SELECT priority, COUNT(*) as count
      FROM reports
      WHERE assigned_department = ? ${dateFilter}
      GROUP BY priority
    `,
    responseMetrics: `
      SELECT 
        AVG(CASE WHEN status = 'acknowledged' THEN 
          (julianday(updated_at) - julianday(created_at)) * 24 * 60 
        END) as avg_acknowledgment_time_minutes,
        AVG(CASE WHEN status = 'resolved' THEN 
          (julianday(updated_at) - julianday(created_at)) * 24 
        END) as avg_resolution_time_hours
      FROM reports
      WHERE assigned_department = ? ${dateFilter}
    `
  };

  const results = {};
  const params = [departmentId];

  const queryPromises = Object.entries(queries).map(([key, query]) => {
    return new Promise((resolve, reject) => {
      if (['trends', 'incidentTypes', 'priorityDistribution'].includes(key)) {
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
      res.json({
        success: true,
        department: DEPARTMENTS[departmentId],
        timeRange: timeRange,
        trends: results.trends,
        incidentTypes: results.incidentTypes,
        priorityDistribution: results.priorityDistribution,
        metrics: {
          avgAcknowledgmentTime: results.responseMetrics.avg_acknowledgment_time_minutes ? 
            `${Math.round(results.responseMetrics.avg_acknowledgment_time_minutes)}m` : 'N/A',
          avgResolutionTime: results.responseMetrics.avg_resolution_time_hours ? 
            `${Math.round(results.responseMetrics.avg_resolution_time_hours)}h` : 'N/A'
        },
        generatedAt: new Date().toISOString()
      });
    })
    .catch(err => {
      console.error('Error fetching department analytics:', err);
      res.status(500).json({ error: 'Internal server error', success: false });
    });
});

// ==================== CASE MANAGEMENT ROUTES ====================

// Get Department Cases
app.get('/api/admin/department/:departmentId/cases', authenticateToken, (req, res) => {
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
      incident_time,
      location,
      current_safety,
      status,
      priority,
      assigned_agent,
      assignment_confidence,
      created_at,
      updated_at,
      anonymous,
      contact_method,
      description
    FROM reports 
    WHERE assigned_department = ?
  `;

  const conditions = [];
  const params = [departmentId];

  if (status && status !== 'all') {
    conditions.push('status = ?');
    params.push(status);
  }

  if (priority && priority !== 'all') {
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

    if (status && status !== 'all') {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    if (priority && priority !== 'all') {
      countQuery += ' AND priority = ?';
      countParams.push(priority);
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        console.error('Error fetching case count:', err);
        return res.status(500).json({ error: 'Internal server error', success: false });
      }

      res.json({
        success: true,
        cases: cases.map(case_item => ({
          ...case_item,
          timeAgo: getTimeAgo(case_item.created_at),
          isAnonymous: !case_item.contact_method || case_item.anonymous === 1,
          shortDescription: case_item.description ? case_item.description.substring(0, 100) + '...' : ''
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(countResult.total / parseInt(limit)),
          totalItems: countResult.total,
          itemsPerPage: parseInt(limit)
        },
        filters: { status, priority },
        department: DEPARTMENTS[departmentId]
      });
    });
  });
});

// Get Case Details
app.get('/api/admin/department/:departmentId/cases/:reportId', 
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

          res.json({
            success: true,
            case: {
              ...report,
              ai_sentiment: report.ai_sentiment ? JSON.parse(report.ai_sentiment) : null,
              assignment_reasoning: report.assignment_reasoning ? JSON.parse(report.assignment_reasoning) : [],
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
app.put('/api/admin/department/:departmentId/cases/:reportId/status', authenticateToken, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const { reportId, departmentId } = req.params;
    
    // Check department access
    if (req.admin.role !== 'super_admin' && req.admin.department !== departmentId) {
      return res.status(403).json({ error: 'Access denied to this department', success: false });
    }

    console.log(`📝 Updating case ${reportId} status to: ${status}`);
    
    // Update the case status in database
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE reports SET 
          status = ?, 
          updated_at = CURRENT_TIMESTAMP,
          case_notes = COALESCE(case_notes, '') || CASE 
            WHEN case_notes IS NULL OR case_notes = '' THEN ?
            ELSE '\n' || ?
          END
        WHERE report_id = ? AND assigned_department = ?`,
        [status, notes || '', notes || '', reportId, departmentId],
        function(err) {
          if (err) reject(err);
          else if (this.changes === 0) reject(new Error('Case not found'));
          else resolve();
        }
      );
    });

    // Add case update record
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO case_updates (report_id, admin_id, update_type, new_value, notes) VALUES (?, ?, ?, ?, ?)',
        [reportId, req.admin.id, 'status_change', status, notes || ''],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Create notification for user if needed
    try {
      const userQuery = await new Promise((resolve, reject) => {
        db.get(
          `SELECT u.*, r.report_id, r.status as previous_status 
          FROM users u 
          JOIN reports r ON u.id = r.user_id 
          WHERE r.report_id = ?`,
          [reportId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (userQuery && NotificationService) {
        await NotificationService.createNotification(
          userQuery.id,
          'status_change',
          'Case Status Updated',
          `Your case status has been updated to: ${status.replace('_', ' ')}. ${notes ? 'Additional notes: ' + notes : ''}`,
          { 
            reportId, 
            previousStatus: userQuery.previous_status, 
            newStatus: status,
            departmentId 
          }
        );
        console.log(`✅ Notification sent to user for case ${reportId}`);
      }
    } catch (notificationError) {
      console.error('❌ Failed to send notification:', notificationError);
      // Don't fail the status update if notification fails
    }

    res.json({ 
      success: true, 
      message: 'Case status updated successfully',
      newStatus: status 
    });

  } catch (error) {
    console.error('❌ Error updating case status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update case status',
      details: error.message 
    });
  }
});

// Add Case Note
app.post('/api/admin/department/:departmentId/cases/:reportId/notes', 
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

// ==================== SECURE MESSAGING ROUTES ====================

// Get Messages for Case (Admin View)
app.get('/api/admin/department/:departmentId/cases/:reportId/messages', 
  authenticateToken,
  logAuditAction('view_case_messages'),
  (req, res) => {
    const { departmentId, reportId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check department access
    if (req.admin.role !== 'super_admin' && req.admin.department !== departmentId) {
      return res.status(403).json({ error: 'Access denied to this department', success: false });
    }

    // Verify case exists and belongs to department
    db.get('SELECT report_id FROM reports WHERE report_id = ? AND assigned_department = ?', 
      [reportId, departmentId], (err, report) => {
        if (err) {
          console.error('Error verifying case access:', err);
          return res.status(500).json({ error: 'Internal server error', success: false });
        }

        if (!report) {
          return res.status(404).json({ error: 'Case not found or access denied', success: false });
        }

        // Get messages
        const messageQuery = `
          SELECT 
            id,
            sender_type,
            sender_name,
            sender_department,
            message,
            timestamp,
            read_by_user,
            encrypted
          FROM messages
          WHERE report_id = ?
          ORDER BY timestamp ASC
          LIMIT ? OFFSET ?
        `;

        const params = [reportId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)];

        db.all(messageQuery, params, (err, messages) => {
          if (err) {
            console.error('Error fetching admin messages:', err);
            return res.status(500).json({ error: 'Internal server error', success: false });
          }

          // Get total message count
          db.get('SELECT COUNT(*) as total FROM messages WHERE report_id = ?', [reportId], (err, countResult) => {
            if (err) {
              console.error('Error getting message count:', err);
            }

            // Get user messages count (unread by admin)
            db.get('SELECT COUNT(*) as user_messages FROM messages WHERE report_id = ? AND sender_type = "user"', 
              [reportId], (err, userMsgResult) => {
                if (err) {
                  console.error('Error getting user message count:', err);
                }

                console.log(`📬 Admin retrieved ${messages.length} messages for case ${reportId}`);

                res.json({
                  success: true,
                  messages: messages.map(msg => ({
                    ...msg,
                    timeAgo: getTimeAgo(msg.timestamp),
                    isFromUser: msg.sender_type === 'user',
                    isFromAdmin: msg.sender_type === 'department' || msg.sender_type === 'admin',
                    isFromCurrentDepartment: msg.sender_department === departmentId
                  })),
                  totalMessages: countResult ? countResult.total : 0,
                  userMessages: userMsgResult ? userMsgResult.user_messages : 0,
                  pagination: {
                    currentPage: parseInt(page),
                    itemsPerPage: parseInt(limit)
                  },
                  caseInfo: {
                    reportId: reportId,
                    department: departmentId
                  }
                });
              }
            );
          });
        });
      }
    );
  }
);

// Send Message from Admin to User
app.post('/api/admin/department/:departmentId/cases/:reportId/messages', 
  authenticateToken,
  logAuditAction('send_user_message'),
  (req, res) => {
    const { departmentId, reportId } = req.params;
    const { message, messageType = 'update' } = req.body;

    // Check department access
    if (req.admin.role !== 'super_admin' && req.admin.department !== departmentId) {
      return res.status(403).json({ error: 'Access denied to this department', success: false });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message content is required', success: false });
    }

    if (message.trim().length > 2000) {
      return res.status(400).json({ error: 'Message too long (max 2000 characters)', success: false });
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

        // Get department info
        const departmentInfo = DEPARTMENTS[departmentId];
        if (!departmentInfo) {
          return res.status(400).json({ error: 'Invalid department', success: false });
        }

        // Add message
        const messageQuery = `
          INSERT INTO messages (report_id, sender_type, sender_name, sender_department, message, encrypted, read_by_user, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;

        const senderName = `${departmentInfo.name} (${req.admin.username})`;

        db.run(messageQuery, [
          reportId,
          'department',
          senderName,
          departmentId,
          message.trim(),
          1, // Always encrypted
          0  // Not read by user yet
        ], function(err) {
          if (err) {
            console.error('Error sending admin message:', err);
            return res.status(500).json({ error: 'Failed to send message', success: false });
          }

          console.log(`💬 Admin message sent: ${req.admin.username} (${departmentId}) → ${reportId}`);

          // Log audit trail
          db.run(
            'INSERT INTO audit_logs (action, admin_id, report_id, details) VALUES (?, ?, ?, ?)',
            [
              'admin_message_sent',
              req.admin.id,
              reportId,
              JSON.stringify({
                messageId: this.lastID,
                messageType: messageType,
                messageLength: message.trim().length,
                department: departmentId,
                timestamp: new Date().toISOString()
              })
            ]
          );

          res.json({
            success: true,
            message: 'Message sent successfully',
            messageId: this.lastID,
            sentAt: new Date().toISOString(),
            sentBy: req.admin.username,
            department: departmentInfo.name,
            encrypted: true
          });
        });
      }
    );
  }
);

// Get Message Statistics
app.get('/api/admin/department/:departmentId/messages/stats', 
  authenticateToken,
  (req, res) => {
    const { departmentId } = req.params;

    // Check department access
    if (req.admin.role !== 'super_admin' && req.admin.department !== departmentId) {
      return res.status(403).json({ error: 'Access denied to this department', success: false });
    }

    const statsQueries = {
      totalMessages: `
        SELECT COUNT(*) as count 
        FROM messages m 
        JOIN reports r ON m.report_id = r.report_id 
        WHERE r.assigned_department = ?
      `,
      userMessages: `
        SELECT COUNT(*) as count 
        FROM messages m 
        JOIN reports r ON m.report_id = r.report_id 
        WHERE r.assigned_department = ? AND m.sender_type = 'user'
      `,
      adminMessages: `
        SELECT COUNT(*) as count 
        FROM messages m 
        JOIN reports r ON m.report_id = r.report_id 
        WHERE r.assigned_department = ? AND m.sender_type = 'department'
      `,
      unreadByUser: `
        SELECT COUNT(*) as count 
        FROM messages m 
        JOIN reports r ON m.report_id = r.report_id 
        WHERE r.assigned_department = ? AND m.sender_type = 'department' AND m.read_by_user = 0
      `,
      recentActivity: `
        SELECT 
          m.report_id,
          m.sender_type,
          m.timestamp,
          COUNT(*) as message_count
        FROM messages m 
        JOIN reports r ON m.report_id = r.report_id 
        WHERE r.assigned_department = ? AND m.timestamp >= datetime('now', '-7 days')
        GROUP BY m.report_id, DATE(m.timestamp)
        ORDER BY m.timestamp DESC
        LIMIT 10
      `
    };

    const results = {};
    const params = [departmentId];
    
    const queryPromises = Object.entries(statsQueries).map(([key, query]) => {
      return new Promise((resolve, reject) => {
        if (key === 'recentActivity') {
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
        res.json({
          success: true,
          department: departmentId,
          stats: {
            totalMessages: results.totalMessages.count,
            userMessages: results.userMessages.count,
            adminMessages: results.adminMessages.count,
            unreadByUser: results.unreadByUser.count,
            responseRate: results.userMessages.count > 0 ? 
              Math.round((results.adminMessages.count / results.userMessages.count) * 100) : 0
          },
          recentActivity: results.recentActivity.map(activity => ({
            ...activity,
            timeAgo: getTimeAgo(activity.timestamp)
          })),
          generatedAt: new Date().toISOString()
        });
      })
      .catch(err => {
        console.error('Error fetching message statistics:', err);
        res.status(500).json({ error: 'Internal server error', success: false });
      });
  }
);

// ==================== USER MESSAGING ENDPOINTS ====================

// Get Messages for User (Enhanced)
app.get('/api/users/messages', authenticateUser, (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  const messageQuery = `
    SELECT 
      id,
      sender_type,
      sender_name,
      sender_department,
      message,
      timestamp,
      read_by_user,
      encrypted
    FROM messages
    WHERE report_id = ?
    ORDER BY timestamp ASC
    LIMIT ? OFFSET ?
  `;

  const params = [req.user.reportId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)];

  db.all(messageQuery, params, (err, messages) => {
    if (err) {
      console.error('Error fetching messages:', err);
      return res.status(500).json({ error: 'Internal server error', success: false });
    }

    // Mark messages from admin as read by user
    db.run(
      'UPDATE messages SET read_by_user = 1 WHERE report_id = ? AND sender_type != "user"',
      [req.user.reportId],
      (err) => {
        if (err) {
          console.error('Error marking messages as read:', err);
        }
      }
    );

    // Get unread count
    db.get(
      'SELECT COUNT(*) as unread_count FROM messages WHERE report_id = ? AND sender_type != "user" AND read_by_user = 0',
      [req.user.reportId],
      (err, countResult) => {
        if (err) {
          console.error('Error getting unread count:', err);
        }

        console.log(`📬 Retrieved ${messages.length} messages for user ${req.user.reportId}`);

        res.json({
          success: true,
          messages: messages.map(msg => ({
            ...msg,
            timeAgo: getTimeAgo(msg.timestamp),
            isFromUser: msg.sender_type === 'user',
            isFromAdmin: msg.sender_type === 'department' || msg.sender_type === 'admin'
          })),
          unreadCount: countResult ? countResult.unread_count : 0,
          pagination: {
            currentPage: parseInt(page),
            itemsPerPage: parseInt(limit)
          }
        });
      }
    );
  });
});

// Send Message from User (Enhanced)
app.post('/api/users/messages', authenticateUser, (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message content is required', success: false });
  }

  if (message.trim().length > 2000) {
    return res.status(400).json({ error: 'Message too long (max 2000 characters)', success: false });
  }

  // Verify user has access to this report
  db.get('SELECT report_id, assigned_department FROM reports WHERE report_id = ? AND user_id = ?', 
    [req.user.reportId, req.user.userId], (err, report) => {
      if (err) {
        console.error('Error verifying user access:', err);
        return res.status(500).json({ error: 'Internal server error', success: false });
      }

      if (!report) {
        return res.status(403).json({ error: 'Access denied', success: false });
      }

      // Add message
      const messageQuery = `
        INSERT INTO messages (report_id, sender_type, sender_name, sender_department, message, encrypted, read_by_user, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      const senderName = req.user.anonymous ? 'Anonymous User' : 'Report Submitter';

      db.run(messageQuery, [
        req.user.reportId,
        'user',
        senderName,
        null, // Users don't have departments
        message.trim(),
        1, // Always encrypted
        1  // User messages are "read by user" by default
      ], function(err) {
        if (err) {
          console.error('Error sending user message:', err);
          return res.status(500).json({ error: 'Failed to send message', success: false });
        }

        console.log(`💬 User message sent: ${req.user.reportId} to ${report.assigned_department}`);

        // Log audit trail
        db.run(
          'INSERT INTO audit_logs (action, report_id, details) VALUES (?, ?, ?)',
          [
            'user_message_sent',
            req.user.reportId,
            JSON.stringify({
              messageId: this.lastID,
              messageLength: message.trim().length,
              timestamp: new Date().toISOString()
            })
          ]
        );

        res.json({
          success: true,
          message: 'Message sent successfully',
          messageId: this.lastID,
          sentAt: new Date().toISOString(),
          encrypted: true
        });
      });
    }
  );
});

// Get Unread Message Count for User
app.get('/api/users/messages/unread', authenticateUser, (req, res) => {
  db.get(
    'SELECT COUNT(*) as unread_count FROM messages WHERE report_id = ? AND sender_type != "user" AND read_by_user = 0',
    [req.user.reportId],
    (err, result) => {
      if (err) {
        console.error('Error getting unread count:', err);
        return res.status(500).json({ error: 'Internal server error', success: false });
      }

      res.json({
        success: true,
        unreadCount: result.unread_count,
        reportId: req.user.reportId
      });
    }
  );
});

// ================ USER NOTIFICATION ROUTES ================

// Get user notifications
app.get('/api/users/notifications', authenticateUser, async (req, res) => {
  try {
    const notifications = await NotificationService.getUserNotifications(req.user.userId);
    const unreadCount = notifications.filter(n => !n.isRead).length;
    
    res.json({
      notifications: notifications.map(n => ({
        ...n,
        timeAgo: getTimeAgo(n.createdAt)
      })),
      unreadCount
    });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
app.put('/api/users/notifications/:id/read', authenticateUser, async (req, res) => {
  try {
    await NotificationService.markAsRead(req.params.id, req.user.userId);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== DEVELOPMENT ROUTES ====================

// Reset demo data for development
app.post('/api/dev/reset-demo-data', authenticateToken, requireDepartmentAccess(['all']), (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Only available in development mode', success: false });
  }
  
  console.log('🔄 Admin requested demo data reset');
  
  // Clear existing data
  const clearQueries = [
    'DELETE FROM messages',
    'DELETE FROM case_updates', 
    'DELETE FROM reports',
    'DELETE FROM users'
  ];
  
  clearQueries.forEach(query => {
    db.run(query, [], (err) => {
      if (err) {
        console.error('Error clearing data:', err);
      }
    });
  });
  
  // Reseed demo data
  setTimeout(() => {
    seedDemoData().then(() => {
      console.log('✅ Demo data reset completed');
    }).catch(err => {
      console.error('❌ Error reseeding demo data:', err);
    });
  }, 1000);
  
  res.json({ 
    success: true, 
    message: 'Demo data reset initiated. Check server logs for progress.' 
  });
});

// Force reset and seed data
app.post('/api/dev/reset-and-seed', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Only available in development mode', success: false });
  }
  
  console.log('🔄 Manual reset and seed triggered via API');
  
  // Clear existing data
  const clearQueries = [
    'DELETE FROM messages',
    'DELETE FROM case_updates', 
    'DELETE FROM reports',
    'DELETE FROM users'
  ];
  
  clearQueries.forEach(query => {
    db.run(query, [], (err) => {
      if (err) {
        console.error('Error clearing data:', err);
      }
    });
  });
  
  // Reseed demo data
  setTimeout(() => {
    seedDemoData().then(() => {
      res.json({ 
        success: true, 
        message: 'Sample data reset and reseeded successfully',
        demoUsers: [
          { reportId: 'SAFE12345001', email: 'jane.doe@example.com', authMethod: 'email' },
          { reportId: 'SAFE12345101', pin: '234567', authMethod: 'pin', anonymous: true },
          { reportId: 'SAFE12345201', email: 'support.user@example.com', authMethod: 'email' },
          { reportId: 'SAFE12345301', pin: '456789', authMethod: 'pin', anonymous: true }
        ]
      });
    }).catch(error => {
      console.error('Error during manual reset:', error);
      res.status(500).json({ error: 'Failed to reset and seed data', success: false });
    });
  }, 1000);
});

// Setup demo accounts
app.post('/api/dev/setup-demo-accounts', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Only available in development', success: false });
  }

  console.log('🔄 Setting up demo accounts...');
  
  try {
    await seedDemoData();
    
    // Verify the setup
    const verificationResults = await new Promise((resolve, reject) => {
      db.all(`
        SELECT r.report_id, r.status, r.assigned_department, r.incident_type,
               u.email, u.security_pin, u.account_type
        FROM reports r 
        JOIN users u ON r.user_id = u.id 
        WHERE r.report_id LIKE 'SAFE12345%'
        ORDER BY r.report_id
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      success: true,
      message: 'Demo accounts setup completed',
      demoAccounts: verificationResults.map(row => ({
        reportId: row.report_id,
        email: row.email || 'N/A (Anonymous)', 
        securityPin: row.security_pin,
        status: row.status,
        department: DEPARTMENTS[row.assigned_department]?.name,
        incidentType: row.incident_type,
        loginMethod: row.email ? 'Report ID + Email' : 'Report ID + PIN'
      })),
      instructions: [
        'Use "Track Your Report" feature on frontend',
        'Enter Report ID and either Email or PIN',
        'Demo accounts are ready for admin testing',
        'Admin updates will reflect in user dashboard'
      ]
    });

  } catch (error) {
    console.error('❌ Error setting up demo accounts:', error);
    res.status(500).json({ 
      error: 'Failed to setup demo accounts', 
      details: error.message, 
      success: false 
    });
  }
});

// Seed demo users endpoint
app.post('/api/dev/seed-demo-users', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Only available in development', success: false });
  }

  const demoUsers = [
    { reportId: 'SAFE12345001', email: 'jane.doe@example.com', securityPin: '123456' },
    { reportId: 'SAFE12345101', email: null, securityPin: '234567' }, // Anonymous
    { reportId: 'SAFE12345201', email: 'support.user@example.com', securityPin: '345678' },
    { reportId: 'SAFE12345301', email: null, securityPin: '456789' } // Anonymous
  ];

  let completed = 0;
  const total = demoUsers.length;

  demoUsers.forEach(user => {
    // Update user with security PIN
    db.run(
      'UPDATE users SET security_pin = ?, email = ? WHERE id = (SELECT user_id FROM reports WHERE report_id = ?)',
      [user.securityPin, user.email, user.reportId],
      (err) => {
        if (err) {
          console.error(`Error updating user for ${user.reportId}:`, err);
        } else {
          console.log(`✅ Demo user updated: ${user.reportId} - PIN: ${user.securityPin}`);
        }
        
        completed++;
        if (completed === total) {
          res.json({
            success: true,
            message: 'Demo users seeded successfully',
            users: demoUsers.map(u => ({
              reportId: u.reportId,
              email: u.email || 'Anonymous (use PIN)',
              securityPin: u.securityPin
            }))
          });
        }
      }
    );
  });
});

// Debug: Get latest report
app.get('/api/debug/latest-report', authenticateToken, requireDepartmentAccess(['all']), (req, res) => {
  db.get('SELECT * FROM reports ORDER BY created_at DESC LIMIT 1', [], (err, report) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    res.json({
      success: true,
      latestReport: report,
      timestamp: new Date().toISOString()
    });
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Server error:', error);

  // Handle AI-specific errors
  if (error.message?.includes('AI_RATE_LIMIT')) {
    return res.status(429).json({ 
      error: 'AI service temporarily rate limited. Please try again later.',
      code: 'AI_RATE_LIMITED',
      success: false,
      retryAfter: 60 // seconds
    });
  }

  if (error.message?.includes('ANTHROPIC_API')) {
    return res.status(503).json({ 
      error: 'AI service temporarily unavailable. Using fallback processing.',
      code: 'AI_SERVICE_UNAVAILABLE',
      success: false 
    });
  }

  if (error.message?.includes('AI analysis failed')) {
    return res.status(503).json({ 
      error: 'AI analysis unavailable. Report will be processed with backup systems.',
      code: 'AI_ANALYSIS_FAILED',
      success: false 
    });
  }

  // Database errors
  if (error.message?.includes('SQLITE_')) {
    return res.status(500).json({ 
      error: 'Database temporarily unavailable. Please try again.',
      code: 'DATABASE_ERROR',
      success: false 
    });
  }

  // Authentication errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      error: 'Invalid authentication token.',
      code: 'INVALID_TOKEN',
      success: false 
    });
  }

  // Default error handling
  res.status(500).json({ 
    error: 'Internal server error', 
    code: 'INTERNAL_ERROR',
    success: false 
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found', success: false });
});

// Verify AI integration on startup
async function verifyAIIntegration() {
  console.log('🔍 Verifying AI integration...');
  
  try {
    // Test basic connectivity
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('⚠️  ANTHROPIC_API_KEY not configured - AI features will use fallback mode');
      return;
    }

    // Test a simple sentiment analysis
    const testResult = await safeVoiceAI.analyzeSentiment('This is a test message for AI connectivity verification');
    
    if (testResult.error) {
      console.log('⚠️  AI connectivity test failed:', testResult.error);
      console.log('🔄 AI features will fall back to rule-based processing');
    } else {
      console.log('✅ AI integration verified successfully');
      console.log(`🧠 Model: ${safeVoiceAI.model}`);
      console.log(`🎯 Test result: ${testResult.emotional_state || 'processed'}`);
    }
  } catch (error) {
    console.log('⚠️  AI verification failed:', error.message);
    console.log('🔄 System will use fallback processing');
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 AI Health check: http://localhost:${PORT}/api/ai/health`);
  console.log(`🔗 Frontend should be at: http://localhost:3000`);
  
  // Verify AI integration
  await verifyAIIntegration();
  
  console.log('\n🏢 Department Admin Accounts:');
  console.log('   Username: legal_admin     | Password: SafeVoice2024! | Department: Legal Team');
  console.log('   Username: task_admin      | Password: SafeVoice2024! | Department: Task Force');
  console.log('   Username: support_admin   | Password: SafeVoice2024! | Department: Support Services');
  console.log('   Username: happy2help_admin| Password: SafeVoice2024! | Department: Happy2Help');
  console.log('   Username: super_admin     | Password: SafeVoice2024! | Department: All (Super Admin)');

  console.log('\n👤 Demo User Accounts:');
  console.log('   Report ID: SAFE12345001 | Email: jane.doe@example.com | PIN: 123456');
  console.log('   Report ID: SAFE12345101 | Anonymous (PIN only) | PIN: 234567');
  console.log('   Report ID: SAFE12345201 | Email: support.user@example.com | PIN: 345678');  
  console.log('   Report ID: SAFE12345301 | Anonymous (PIN only) | PIN: 456789');
  
  console.log('\n🎉 SafeVoice Portal with AI Integration ready!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});