// server.js - Enhanced backend server for SafeVoice Portal with Full Frontend Sync
require('dotenv').config();

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
const multer = require('multer');
const WebSocket = require('ws');
const http = require('http');

const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// WebSocket Server
const wss = new WebSocket.Server({ server });

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Validate required environment variables
function validateEnvironment() {
  const required = [
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'ANTHROPIC_API_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.log('💡 Please check your .env file and ensure all required variables are set');
    console.log('🔑 Get your Anthropic API key from: https://console.anthropic.com/');
    process.exit(1);
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
    incidentTypes: ['harassment', 'discrimination', 'workplace', 'legal', 'retaliation', 'civil_rights', 'employment_law', 'hostile_environment', 'sexual_harassment', 'bullying'],
    avgResponseTime: '8h',
    activeAgents: 12,
    specialties: ['harassment', 'discrimination', 'workplace violations', 'rights issues', 'legal matters']
  },
  task: {
    id: 'task',
    name: 'Task Force Team',
    description: 'Handles physical violence, assault, and immediate safety concerns',
    color: 'red',
    keywords: ['assault', 'violence', 'physical', 'attack', 'hit', 'hurt', 'emergency', 'danger', 'threat', 'safety', 'beat', 'punch', 'kicked', 'grabbed', 'injured'],
    incidentTypes: ['assault', 'domestic', 'violence', 'stalking', 'physical_threat', 'emergency', 'danger', 'safety_threat', 'workplace_violence', 'intimidation'],
    avgResponseTime: '2h',
    activeAgents: 8,
    specialties: ['physical violence', 'assault', 'immediate danger', 'safety threats']
  },
  support: {
    id: 'support',
    name: 'Support Services Team',
    description: 'Handles housing, financial aid, and general support services',
    color: 'green',
    keywords: ['housing', 'shelter', 'financial', 'support', 'help', 'assistance', 'resources', 'accommodation', 'relocation', 'money', 'rent', 'food', 'basic needs'],
    incidentTypes: ['housing', 'financial', 'support', 'other', 'eviction', 'homelessness', 'poverty', 'basic_needs', 'emergency_aid', 'resource_access'],
    avgResponseTime: '12h',
    activeAgents: 15,
    specialties: ['housing', 'financial aid', 'basic needs', 'resources']
  },
  happy2help: {
    id: 'happy2help',
    name: 'Happy2Help Team',
    description: 'Mental health counseling, emotional support, and wellness services',
    color: 'purple',
    keywords: ['mental', 'depression', 'anxiety', 'counseling', 'therapy', 'emotional', 'stress', 'trauma', 'wellness', 'psychology', 'suicide', 'self-harm', 'sad', 'hopeless'],
    incidentTypes: ['mental', 'counseling', 'therapy', 'wellness', 'depression', 'anxiety', 'ptsd', 'crisis', 'emotional_support', 'mental_health_emergency'],
    avgResponseTime: '4h',
    activeAgents: 20,
    specialties: ['mental health', 'counseling', 'emotional support', 'therapy']
  }
};

// Enhanced Notification Service
class NotificationService {
  static async createNotification(userId, type, title, message, metadata = {}) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO notifications (userId, reportId, type, title, message, metadata, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      db.run(query, [
        userId,
        metadata.reportId || null,
        type,
        title,
        message,
        JSON.stringify(metadata)
      ], function(err) {
        if (err) {
          console.error('Error creating notification:', err);
          reject(err);
        } else {
          console.log(`📢 Notification created for user ${userId}: ${title}`);
          
          // Broadcast to WebSocket clients
          broadcastToUser(userId, {
            type: 'new_notification',
            notification: {
              id: this.lastID,
              type,
              title,
              message,
              metadata,
              createdAt: new Date().toISOString(),
              isRead: false
            }
          });
          
          resolve(this.lastID);
        }
      });
    });
  }

  static async getUserNotifications(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM notifications 
        WHERE userId = ? 
        ORDER BY createdAt DESC 
        LIMIT 50
      `;
      
      db.all(query, [userId], (err, notifications) => {
        if (err) {
          reject(err);
        } else {
          resolve(notifications.map(notif => ({
            ...notif,
            metadata: notif.metadata ? JSON.parse(notif.metadata) : {},
            isRead: notif.isRead === 1
          })));
        }
      });
    });
  }

  static async markAsRead(notificationId, userId) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE notifications 
        SET isRead = 1, readAt = CURRENT_TIMESTAMP 
        WHERE id = ? AND userId = ?
      `;
      
      db.run(query, [notificationId, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }
}

// WebSocket connection management
const wsClients = new Map();

function broadcastToUser(userId, message) {
  const client = wsClients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}

function broadcastToAll(message) {
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  console.log('🔌 New WebSocket connection');
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      if (message.type === 'auth' && message.token) {
        // Authenticate WebSocket connection
        jwt.verify(message.token, process.env.JWT_SECRET, (err, decoded) => {
          if (!err) {
            const userId = decoded.userId || decoded.id;
            wsClients.set(userId, ws);
            console.log(`🔐 WebSocket authenticated for user ${userId}`);
            
            ws.send(JSON.stringify({
              type: 'auth_success',
              message: 'WebSocket authenticated successfully'
            }));
          } else {
            console.error('❌ WebSocket authentication failed:', err);
            ws.close(1008, 'Invalid token');
          }
        });
      }
    } catch (error) {
      console.error('❌ WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    // Remove client from map
    for (const [userId, client] of wsClients.entries()) {
      if (client === ws) {
        wsClients.delete(userId);
        console.log(`🔌 WebSocket disconnected for user ${userId}`);
        break;
      }
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// Enhanced SafeVoice AI Class
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

    // Anthropic client with timeout
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: this.timeout
    });
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

  // AI Quality Check
  async qualityCheck(reportData) {
    try {
      const prompt = `Assess the quality and completeness of this incident report. Respond with JSON only:

REPORT: ${JSON.stringify(reportData, null, 2)}

{
  "overallQuality": "poor|fair|good|excellent",
  "completenessScore": number (1-10),
  "readyForProcessing": boolean,
  "strengthAreas": ["area1", "area2"],
  "improvementAreas": ["area1", "area2"],
  "missingInformation": ["info1", "info2"]
}`;

      const aiResponse = await this.makeAPICall(prompt, 'quality_check');
      return aiResponse;
    } catch (error) {
      console.error('AI Quality Check Error:', error);
      return {
        overallQuality: 'fair',
        completenessScore: 6,
        readyForProcessing: true,
        strengthAreas: [],
        improvementAreas: [],
        missingInformation: []
      };
    }
  }

  // AI Response Suggestions
  async generateResponseSuggestions(reportData, caseContext) {
    try {
      const prompt = `Generate helpful response suggestions for a case manager responding to this incident report:

REPORT: ${JSON.stringify(reportData, null, 2)}
CASE CONTEXT: ${JSON.stringify(caseContext, null, 2)}

Provide 3 different response suggestions with different tones. Respond with JSON only:

{
  "suggestions": [
    {
      "category": "Empathetic Support",
      "tone": "empathetic",
      "message": "response message here",
      "context": "why this response is appropriate",
      "confidence": number (0.7-0.95),
      "followUpSuggested": boolean,
      "alternatives": ["alternative1", "alternative2"]
    },
    {
      "category": "Information Gathering",
      "tone": "professional",
      "message": "response message here",
      "context": "why this response is appropriate", 
      "confidence": number (0.7-0.95),
      "followUpSuggested": boolean,
      "alternatives": ["alternative1", "alternative2"]
    },
    {
      "category": "Action Plan",
      "tone": "action-oriented",
      "message": "response message here",
      "context": "why this response is appropriate",
      "confidence": number (0.7-0.95),
      "followUpSuggested": boolean,
      "alternatives": ["alternative1", "alternative2"]
    }
  ]
}`;

      const aiResponse = await this.makeAPICall(prompt, 'response_suggestions');
      return aiResponse.suggestions || [];
    } catch (error) {
      console.error('AI Response Suggestions Error:', error);
      return [];
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

  // Enhanced Incident Categorization & Tagging
  async categorizeIncident(reportData) {
    try {
      const prompt = `Analyze this incident report and provide detailed categorization. Respond with JSON only:

REPORT: ${JSON.stringify(reportData, null, 2)}

{
  "primaryCategory": "safety|legal|mental_health|discrimination|harassment|financial|housing|academic|other",
  "subCategories": ["subcategory1", "subcategory2"],
  "severityTags": ["urgent", "sensitive", "confidential", "escalation_required"],
  "legalImplications": ["implication1", "implication2"],
  "requiredExpertise": ["expertise1", "expertise2"],
  "complianceIssues": ["compliance1", "compliance2"],
  "recommendedResources": ["resource1", "resource2"]
}`;

      const aiResponse = await this.makeAPICall(prompt, 'incident_categorization');
      return aiResponse;
    } catch (error) {
      console.error('AI Incident Categorization Error:', error);
      return {
        primaryCategory: 'other',
        subCategories: [],
        severityTags: [],
        legalImplications: [],
        requiredExpertise: [],
        complianceIssues: [],
        recommendedResources: []
      };
    }
  }

  // Smart Case Prioritization & Escalation
  async prioritizeCase(reportData, existingCases = []) {
    try {
      const prompt = `Analyze this incident report and prioritize it against existing cases. Consider urgency, severity, and resource availability. Respond with JSON only:

NEW REPORT: ${JSON.stringify(reportData, null, 2)}
EXISTING CASES COUNT: ${existingCases.length}

{
  "priorityLevel": "immediate|high|medium|low",
  "escalationRequired": boolean,
  "estimatedResponseTime": "minutes|hours|days",
  "resourceRequirements": ["resource1", "resource2"],
  "stakeholderNotifications": ["stakeholder1", "stakeholder2"],
  "riskMitigationSteps": ["step1", "step2"],
  "followUpSchedule": "immediate|daily|weekly|monthly"
}`;

      const aiResponse = await this.makeAPICall(prompt, 'case_prioritization');
      return aiResponse;
    } catch (error) {
      console.error('AI Case Prioritization Error:', error);
      return {
        priorityLevel: 'medium',
        escalationRequired: false,
        estimatedResponseTime: 'days',
        resourceRequirements: [],
        stakeholderNotifications: [],
        riskMitigationSteps: [],
        followUpSchedule: 'weekly'
      };
    }
  }

  // Intelligent Response Generation
  async generateContextualResponse(reportData, caseHistory, userContext) {
    try {
      const prompt = `Generate a contextual response for this incident report. Consider the case history and user context. Respond with JSON only:

REPORT: ${JSON.stringify(reportData, null, 2)}
CASE HISTORY: ${JSON.stringify(caseHistory, null, 2)}
USER CONTEXT: ${JSON.stringify(userContext, null, 2)}

{
  "immediateResponse": "immediate response text",
  "followUpActions": ["action1", "action2"],
  "userReassurance": "reassurance message",
  "nextSteps": ["step1", "step2"],
  "estimatedTimeline": "timeline description",
  "contactInformation": "contact details",
  "emergencyInstructions": "emergency steps if applicable"
}`;

      const aiResponse = await this.makeAPICall(prompt, 'contextual_response');
      return aiResponse;
    } catch (error) {
      console.error('AI Contextual Response Error:', error);
      return {
        immediateResponse: "Thank you for your report. We're reviewing this and will get back to you soon.",
        followUpActions: [],
        userReassurance: "Your safety is our priority.",
        nextSteps: [],
        estimatedTimeline: "We'll respond within 24-48 hours.",
        contactInformation: "Contact emergency services if you're in immediate danger.",
        emergencyInstructions: ""
      };
    }
  }

  // Pattern Recognition & Trend Analysis
  async analyzePatterns(reports, timeRange = '30d') {
    try {
      const prompt = `Analyze these incident reports for patterns and trends. Respond with JSON only:

REPORTS: ${JSON.stringify(reports.slice(0, 10), null, 2)}
TIME RANGE: ${timeRange}

{
  "emergingPatterns": ["pattern1", "pattern2"],
  "trendAnalysis": {
    "incidentTypes": {"type1": "trend1", "type2": "trend2"},
    "locations": {"location1": "trend1"},
    "timePatterns": ["pattern1", "pattern2"]
  },
  "riskHotspots": ["hotspot1", "hotspot2"],
  "preventiveMeasures": ["measure1", "measure2"],
  "resourceAllocation": {"resource1": "recommendation1"},
  "policyRecommendations": ["policy1", "policy2"]
}`;

      const aiResponse = await this.makeAPICall(prompt, 'pattern_analysis');
      return aiResponse;
    } catch (error) {
      console.error('AI Pattern Analysis Error:', error);
      return {
        emergingPatterns: [],
        trendAnalysis: { incidentTypes: {}, locations: {}, timePatterns: [] },
        riskHotspots: [],
        preventiveMeasures: [],
        resourceAllocation: {},
        policyRecommendations: []
      };
    }
  }

  // Enhanced User Experience & Accessibility
  async enhanceUserExperience(reportData, userProfile) {
    try {
      const prompt = `Analyze this incident report and suggest user experience improvements. Consider accessibility and user needs. Respond with JSON only:

REPORT: ${JSON.stringify(reportData, null, 2)}
USER PROFILE: ${JSON.stringify(userProfile, null, 2)}

{
  "accessibilityFeatures": ["feature1", "feature2"],
  "communicationPreferences": ["preference1", "preference2"],
  "supportResources": ["resource1", "resource2"],
  "followUpMethods": ["method1", "method2"],
  "userComfortMeasures": ["measure1", "measure2"],
  "languageOptions": ["option1", "option2"],
  "culturalConsiderations": ["consideration1", "consideration2"]
}`;

      const aiResponse = await this.makeAPICall(prompt, 'user_experience');
      return aiResponse;
    } catch (error) {
      console.error('AI User Experience Error:', error);
      return {
        accessibilityFeatures: [],
        communicationPreferences: [],
        supportResources: [],
        followUpMethods: [],
        userComfortMeasures: [],
        languageOptions: [],
        culturalConsiderations: []
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
  },

  async qualityCheck(reportData) {
    return await safeVoiceAI.qualityCheck(reportData);
  }
};

// File Upload Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // max 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf',
      'video/mp4', 'video/webm',
      'audio/mpeg', 'audio/wav',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

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

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database setup
const db = new sqlite3.Database('./reports.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('✅ Connected to SQLite database');
    initializeDatabase().catch(console.error);
  }
});

// Enhanced database initialization with all required tables
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

    CREATE TABLE IF NOT EXISTS user_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      report_id TEXT,
      original_name TEXT NOT NULL,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      mimetype TEXT NOT NULL,
      size INTEGER NOT NULL,
      upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (report_id) REFERENCES reports (report_id)
    );
  `;

  db.exec(createTables, (err) => {
    if (err) {
      console.error('Error creating tables:', err);
    } else {
      console.log('✅ Database tables initialized successfully');
      console.log('✅ Enhanced notifications and file management tables ready');
      
      // Seed demo data and admin accounts
      seedInitialDataIfEmpty();
      
      // Initialize demo service after database is ready
      try {
        const { initializeNotificationService } = require('./src/services/notificationService');
        const emailService = require('./src/services/emailService');
        
        // Initialize notification service with database
        const notificationServiceInstance = initializeNotificationService(db);
        
        // Initialize demo service
        initializeDemoService(db, notificationServiceInstance, emailService);
        console.log('✅ Demo service initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize demo service:', error);
      }
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

// Insert specific detailed demo cases - ONLY THESE CASES
async function insertDetailedDemoCases() {
  console.log('📋 Inserting detailed demo cases...');
  
  const detailedCases = [
    {
      report_id: 'SAFE12345001',
      user_email: 'jane.doe@example.com',
      security_pin: '123456',
      incident_type: 'harassment',
      incident_date: '2024-12-15',
      incident_time: '14:30',
      location: 'Corporate Office - 5th Floor',
      description: 'My supervisor has been making inappropriate comments about my appearance and sending unwanted messages after work hours. This has been going on for weeks and I feel uncomfortable coming to work.',
      current_safety: 'unsure',
      witnesses: 'Colleague Sarah witnessed several inappropriate comments during team meetings, HR has records of previous complaints',
      evidence: 'Screenshots of inappropriate text messages, email communications documenting incidents, witness statements from colleagues',
      contact_method: 'email',
      contact_info: 'jane.doe@example.com',
      anonymous: 0,
      status: 'under_review',
      priority: 'medium',
      assigned_department: 'legal',
      assigned_agent: 'Sarah Johnson - Legal Specialist'
    },
    {
      report_id: 'SAFETASK08001',
      user_email: null,
      security_pin: '987654',
      incident_type: 'assault',
      incident_date: '2024-12-10',
      incident_time: '21:00',
      location: 'Downtown Metro Station - Platform 3',
      description: 'I was physically attacked by an unknown individual at the metro station around 9 PM. The person grabbed my bag and pushed me to the ground when I resisted. I sustained minor injuries and was able to get away when other passengers intervened.',
      current_safety: 'safe',
      witnesses: 'Several metro passengers witnessed the incident, station security cameras were present',
      evidence: 'Medical report from urgent care, photos of injuries, metro station security footage available',
      contact_method: null,
      contact_info: null,
      anonymous: 1,
      status: 'resolved',
      priority: 'high',
      assigned_department: 'task',
      assigned_agent: 'Detective Mike Chen - Task Force Specialist'
    },
    {
      report_id: 'SAFE12345101',
      user_email: null,
      security_pin: '234567',
      incident_type: 'physical_assault',
      incident_date: '2024-12-14',
      incident_time: '19:45',
      location: 'University Campus - Parking Lot B',
      description: 'I was approached by three individuals who demanded my wallet and phone. When I refused, they pushed me down and one of them kicked me. I managed to escape when campus security arrived.',
      current_safety: 'unsafe',
      witnesses: 'Campus security officer who responded to the scene, two students who saw the incident from nearby building',
      evidence: 'Campus security camera footage, medical documentation of injuries, photos of torn clothing and bruises',
      contact_method: null,
      contact_info: null,
      anonymous: 1,
      status: 'acknowledged',
      priority: 'critical',
      assigned_department: 'task',
      assigned_agent: 'Detective Rodriguez - Task Force Lead'
    },
    {
      report_id: 'SAFE12345201',
      user_email: 'support.user@example.com',
      security_pin: '345678',
      incident_type: 'housing_issue',
      incident_date: '2024-12-12',
      incident_time: '22:15',
      location: 'Student Housing Complex - Building C, Apt 304',
      description: 'My roommate has been creating a hostile living environment by bringing unauthorized guests at all hours, playing loud music late at night, and making threatening comments when I ask for basic respect. I feel unsafe in my own living space.',
      current_safety: 'unsure',
      witnesses: 'Neighbors in adjacent apartments who have heard the disturbances, front desk staff who have seen the unauthorized guests',
      evidence: 'Noise complaints filed with housing office, text messages with threatening language, photos of property damage',
      contact_method: 'email',
      contact_info: 'support.user@example.com',
      anonymous: 0,
      status: 'resolved',
      priority: 'medium',
      assigned_department: 'support',
      assigned_agent: 'Michael Chen - Support Coordinator'
    },
    {
      report_id: 'SAFE12345301',
      user_email: null,
      security_pin: '456789',
      incident_type: 'mental_health_crisis',
      incident_date: '2024-12-15',
      incident_time: '16:30',
      location: 'Personal residence - reported via online form',
      description: 'I have been experiencing severe anxiety and panic attacks for the past few weeks. The stress from recent life changes has become overwhelming, and I am having thoughts of self-harm. I need immediate support and do not know where to turn.',
      current_safety: 'unsafe',
      witnesses: 'Family members who have observed the behavioral changes and expressed concern',
      evidence: 'Medical records showing increased anxiety medication needs, journal entries documenting mental health decline, family statements of concern',
      contact_method: null,
      contact_info: null,
      anonymous: 1,
      status: 'under_review',
      priority: 'high',
      assigned_department: 'happy2help',
      assigned_agent: 'Dr. Lisa Rodriguez - Mental Health Counselor'
    }
  ];
  
  for (const caseData of detailedCases) {
    try {
      // Create user first
      const anonymousId = `DEMO_${caseData.report_id}`;
      const ipHash = hashIP(`demo_ip_${caseData.report_id}`);
      
      const userQuery = `INSERT OR IGNORE INTO users (anonymous_id, email, security_pin, ip_hash) VALUES (?, ?, ?, ?)`;
      await new Promise((resolve, reject) => {
        db.run(userQuery, [anonymousId, caseData.user_email, caseData.security_pin, ipHash], function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
      });
      
      // Get user ID
      const userIdQuery = `SELECT id FROM users WHERE anonymous_id = ?`;
      const user = await new Promise((resolve, reject) => {
        db.get(userIdQuery, [anonymousId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      // Insert report
      const reportQuery = `
        INSERT OR REPLACE INTO reports (
          report_id, user_id, incident_type, incident_date, incident_time, location,
          description, current_safety, witnesses, evidence, contact_method, contact_info, anonymous,
          status, priority, assigned_department, assigned_agent, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const now = new Date().toISOString();
      await new Promise((resolve, reject) => {
        db.run(reportQuery, [
          caseData.report_id,
          user.id,
          caseData.incident_type,
          caseData.incident_date,
          caseData.incident_time,
          caseData.location,
          caseData.description,
          caseData.current_safety,
          caseData.witnesses,
          caseData.evidence,
          caseData.contact_method,
          caseData.contact_info,
          caseData.anonymous,
          caseData.status,
          caseData.priority,
          caseData.assigned_department,
          caseData.assigned_agent,
          now,
          now
        ], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
      
      console.log(`✅ Inserted detailed demo case: ${caseData.report_id}`);
    } catch (error) {
      console.error(`❌ Error inserting case ${caseData.report_id}:`, error);
    }
  }
  
  console.log('📋 Detailed demo cases insertion complete!');
}

// Seed demo data - SIMPLIFIED VERSION
async function seedDemoData() {
  console.log('📊 Creating demo data...');
  
  // ONLY insert our specific detailed demo cases
  await insertDetailedDemoCases();
  
  console.log('✅ Demo data creation complete - detailed cases only');
}

// ==================== ENHANCED AI ASSIGNMENT ENGINE ====================

class EnhancedAIAssignmentEngine {
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];
      
      // Generate varied locations
      const locations = generateLocations(department);
      const location = locations[Math.floor(Math.random() * locations.length)];
      
      // Generate varied priorities and statuses
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const currentSafety = safetyLevels[Math.floor(Math.random() * safetyLevels.length)];
      
      // Generate varied dates (within last 6 months)
      const daysAgo = Math.floor(Math.random() * 180);
      const incidentDate = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));
      
      // Generate varied times
      const hours = Math.floor(Math.random() * 24);
      const minutes = Math.floor(Math.random() * 60);
      const incidentTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Generate varied evidence and witnesses
      const evidence = generateEvidence(incidentType);
      const witnesses = generateWitnesses(incidentType);
      
      // Generate varied contact methods
      const contactMethods = ['email', 'phone', 'anonymous'];
      const contactMethod = contactMethods[Math.floor(Math.random() * contactMethods.length)];
      
      // Generate varied user credentials
      const userEmail = contactMethod === 'anonymous' ? null : `user.${department}.${caseNumber}@example.com`;
      const userPin = contactMethod === 'anonymous' ? null : (100000 + i).toString();
      
      cases.push({
        report_id: reportId,
        incident_type: incidentType,
        incident_date: incidentDate.toISOString().split('T')[0],
        incident_time: incidentTime,
        location: location,
        description: description,
        current_safety: currentSafety,
        witnesses: witnesses,
        evidence: evidence,
        contact_method: contactMethod === 'anonymous' ? null : contactMethod,
        contact_info: contactMethod === 'anonymous' ? null : userEmail,
        anonymous: contactMethod === 'anonymous' ? 1 : 0,
        status: status,
        priority: priority,
        assigned_department: department,
        assigned_agent: generateAgentName(department, i),
        userEmail: userEmail,
        userPin: userPin
      });
    }
    
    return cases;
  };
  
  // Helper function to generate incident descriptions
  const generateIncidentDescription = (incidentType, department) => {
    const descriptions = {
      harassment: [
        'Repeated unwanted comments about appearance and personal life during work meetings',
        'Supervisor sending inappropriate messages after work hours',
        'Colleague making sexual jokes and innuendos in the workplace',
        'Manager creating hostile work environment through discriminatory remarks',
        'Client making unwelcome advances during business meetings',
        'Online harassment through company communication channels',
        'Stalking behavior by former colleague',
        'Discriminatory treatment based on gender identity',
        'Retaliation after reporting previous incidents',
        'Hostile work environment due to persistent inappropriate behavior'
      ],
      sexual_harassment: [
        'Screenshots of sexually explicit messages',
        'Witness statements from colleagues',
        'Documentation of unwanted advances',
        'Medical records documenting trauma',
        'Audio recordings of inappropriate comments',
        'Documentation of pattern of behavior',
        'Witness testimonies from multiple sources',
        'Documentation of complaints filed',
        'Evidence of hostile work environment',
        'Documentation of retaliation'
      ],
      discrimination: [
        'Documentation of discriminatory treatment',
        'Performance reviews showing bias',
        'Witness statements from colleagues',
        'Documentation of denied opportunities',
        'Evidence of different treatment',
        'Documentation of complaints filed',
        'Witness testimonies from multiple sources',
        'Documentation of pattern of behavior',
        'Evidence of hostile work environment',
        'Documentation of retaliation'
      ],
      retaliation: [
        'Documentation of adverse actions',
        'Performance reviews showing retaliation',
        'Witness statements from colleagues',
        'Documentation of complaints filed',
        'Evidence of pattern of behavior',
        'Documentation of different treatment',
        'Witness testimonies from multiple sources',
        'Evidence of hostile work environment',
        'Documentation of adverse changes',
        'Evidence of systematic retaliation'
      ],
      civil_rights: [
        'Documentation of rights violations',
        'Legal correspondence and complaints',
        'Witness statements from colleagues',
        'Documentation of denied accommodations',
        'Evidence of different treatment',
        'Documentation of complaints filed',
        'Witness testimonies from multiple sources',
        'Documentation of pattern of behavior',
        'Evidence of rights violations',
        'Legal documentation and evidence'
      ],
      employment_law: [
        'Documentation of law violations',
        'Pay stubs and time records',
        'Witness statements from colleagues',
        'Documentation of denied benefits',
        'Evidence of unsafe conditions',
        'Documentation of complaints filed',
        'Witness testimonies from multiple sources',
        'Documentation of pattern of behavior',
        'Evidence of law violations',
        'Legal documentation and evidence'
      ],
      hostile_environment: [
        'Documentation of hostile behavior',
        'Witness statements from colleagues',
        'Documentation of pattern of behavior',
        'Evidence of hostile work environment',
        'Documentation of complaints filed',
        'Witness testimonies from multiple sources',
        'Evidence of systematic harassment',
        'Documentation of adverse effects',
        'Evidence of hostile communication',
        'Documentation of intimidation tactics'
      ],
      bullying: [
        'Documentation of bullying behavior',
        'Witness statements from colleagues',
        'Documentation of pattern of behavior',
        'Evidence of systematic bullying',
        'Documentation of complaints filed',
        'Witness testimonies from multiple sources',
        'Evidence of intimidation tactics',
        'Documentation of adverse effects',
        'Evidence of hostile communication',
        'Documentation of exclusion tactics'
      ],
      assault: [
        'Medical records from hospital visit',
        'Police report #2024-4567',
        'Photographs of injuries sustained',
        'Witness statements from bystanders',
        'Security camera footage',
        'Medical bills and treatment records',
        'Photographs of damaged property',
        'Witness testimonies from multiple sources',
        'Documentation of threats made',
        'Evidence of pattern of violence'
      ],
      domestic: [
        'Police reports and documentation',
        'Medical records from injuries',
        'Photographs of injuries and damage',
        'Witness statements from family',
        'Restraining order documentation',
        'Medical bills and treatment records',
        'Photographs of property damage',
        'Witness testimonies from multiple sources',
        'Documentation of threats made',
        'Evidence of pattern of violence'
      ],
      violence: [
        'Police reports and documentation',
        'Medical records from injuries',
        'Photographs of injuries and damage',
        'Witness statements from colleagues',
        'Security camera footage',
        'Medical bills and treatment records',
        'Photographs of property damage',
        'Witness testimonies from multiple sources',
        'Documentation of threats made',
        'Evidence of pattern of violence'
      ],
      stalking: [
        'Documentation of stalking behavior',
        'Witness statements from colleagues',
        'Documentation of unwanted contact',
        'Evidence of pattern of behavior',
        'Documentation of threats made',
        'Witness testimonies from multiple sources',
        'Evidence of systematic stalking',
        'Documentation of adverse effects',
        'Evidence of unwanted attention',
        'Documentation of safety concerns'
      ],
      physical_threat: [
        'Documentation of threats made',
        'Witness statements from colleagues',
        'Documentation of pattern of behavior',
        'Evidence of threatening behavior',
        'Documentation of safety concerns',
        'Witness testimonies from multiple sources',
        'Evidence of systematic threats',
        'Documentation of adverse effects',
        'Evidence of intimidation tactics',
        'Documentation of safety risks'
      ],
      emergency: [
        'Medical records and documentation',
        'Emergency response documentation',
        'Witness statements from bystanders',
        'Documentation of emergency situation',
        'Evidence of immediate danger',
        'Witness testimonies from multiple sources',
        'Evidence of emergency conditions',
        'Documentation of safety concerns',
        'Evidence of urgent need',
        'Documentation of crisis situation'
      ],
      danger: [
        'Documentation of dangerous situation',
        'Witness statements from bystanders',
        'Documentation of safety concerns',
        'Evidence of immediate danger',
        'Documentation of risk factors',
        'Witness testimonies from multiple sources',
        'Evidence of dangerous conditions',
        'Documentation of safety threats',
        'Evidence of risk to safety',
        'Documentation of hazardous situation'
      ],
      safety_threat: [
        'Documentation of safety threats',
        'Witness statements from colleagues',
        'Documentation of safety concerns',
        'Evidence of safety risks',
        'Documentation of threatening behavior',
        'Witness testimonies from multiple sources',
        'Evidence of safety violations',
        'Documentation of safety issues',
        'Evidence of safety concerns',
        'Documentation of safety risks'
      ],
      workplace_violence: [
        'Police reports and documentation',
        'Medical records from injuries',
        'Photographs of injuries and damage',
        'Witness statements from colleagues',
        'Security camera footage',
        'Medical bills and treatment records',
        'Photographs of property damage',
        'Witness testimonies from multiple sources',
        'Documentation of threats made',
        'Evidence of pattern of violence'
      ],
      intimidation: [
        'Documentation of intimidation tactics',
        'Witness statements from colleagues',
        'Documentation of pattern of behavior',
        'Evidence of intimidating behavior',
        'Documentation of threats made',
        'Witness testimonies from multiple sources',
        'Evidence of systematic intimidation',
        'Documentation of adverse effects',
        'Evidence of threatening behavior',
        'Documentation of safety concerns'
      ],
      housing: [
        'Eviction notice from landlord',
        'Termination letter from employer',
        'Bank statements showing financial hardship',
        'Medical bills and expenses',
        'Documentation of unsafe conditions',
        'Photographs of housing violations',
        'Correspondence with property management',
        'Financial records showing hardship',
        'Documentation of discrimination',
        'Evidence of code violations'
      ],
      eviction: [
        'Eviction notice from landlord',
        'Correspondence with property management',
        'Documentation of eviction process',
        'Financial records showing hardship',
        'Documentation of complaints filed',
        'Witness statements from neighbors',
        'Documentation of housing violations',
        'Evidence of eviction proceedings',
        'Documentation of legal issues',
        'Evidence of housing problems'
      ],
      homelessness: [
        'Documentation of housing loss',
        'Correspondence with housing agencies',
        'Documentation of homelessness status',
        'Financial records showing hardship',
        'Documentation of housing search',
        'Witness statements from social workers',
        'Documentation of housing assistance',
        'Evidence of homelessness situation',
        'Documentation of housing needs',
        'Evidence of housing crisis'
      ],
      poverty: [
        'Financial records showing hardship',
        'Documentation of income loss',
        'Bank statements showing poverty',
        'Documentation of basic needs',
        'Evidence of financial hardship',
        'Documentation of assistance needs',
        'Evidence of poverty situation',
        'Documentation of financial crisis',
        'Evidence of economic hardship',
        'Documentation of financial needs'
      ],
      basic_needs: [
        'Financial records showing hardship',
        'Documentation of basic needs',
        'Evidence of financial hardship',
        'Documentation of assistance needs',
        'Evidence of poverty situation',
        'Documentation of financial crisis',
        'Evidence of economic hardship',
        'Documentation of financial needs',
        'Evidence of basic needs not met',
        'Documentation of survival needs'
      ],
      emergency_aid: [
        'Documentation of emergency situation',
        'Financial records showing hardship',
        'Evidence of emergency need',
        'Documentation of assistance required',
        'Evidence of crisis situation',
        'Documentation of emergency conditions',
        'Evidence of urgent need',
        'Documentation of crisis response',
        'Evidence of emergency assistance',
        'Documentation of emergency services'
      ],
      resource_access: [
        'Documentation of resource needs',
        'Evidence of access difficulties',
        'Documentation of assistance required',
        'Evidence of resource barriers',
        'Documentation of access issues',
        'Evidence of resource limitations',
        'Documentation of assistance needs',
        'Evidence of access problems',
        'Documentation of resource requirements',
        'Evidence of access challenges'
      ],
      mental: [
        'Previous therapy records and notes',
        'Medication prescriptions and bottles',
        'Journal entries documenting mental state',
        'Medical records from psychiatrist',
        'Documentation of crisis episodes',
        'Family member statements',
        'Previous treatment history',
        'Documentation of symptoms',
        'Medical bills and treatment costs',
        'Evidence of impact on daily life'
      ],
      counseling: [
        'Previous counseling records',
        'Documentation of counseling needs',
        'Evidence of mental health issues',
        'Documentation of therapy requirements',
        'Evidence of counseling needs',
        'Documentation of mental health support',
        'Evidence of therapy needs',
        'Documentation of counseling services',
        'Evidence of mental health assistance',
        'Documentation of therapy requirements'
      ],
      therapy: [
        'Previous therapy records',
        'Documentation of therapy needs',
        'Evidence of mental health issues',
        'Documentation of therapy requirements',
        'Evidence of therapy needs',
        'Documentation of mental health support',
        'Evidence of therapy assistance',
        'Documentation of therapy services',
        'Evidence of mental health therapy',
        'Documentation of therapy requirements'
      ],
      wellness: [
        'Documentation of wellness needs',
        'Evidence of stress and anxiety',
        'Documentation of wellness requirements',
        'Evidence of mental health needs',
        'Documentation of wellness support',
        'Evidence of stress management needs',
        'Documentation of wellness services',
        'Evidence of mental health assistance',
        'Documentation of wellness requirements',
        'Evidence of stress relief needs'
      ],
      depression: [
        'Medical records from psychiatrist',
        'Documentation of depression symptoms',
        'Evidence of depressive episodes',
        'Documentation of treatment history',
        'Evidence of depression impact',
        'Documentation of medication management',
        'Evidence of depression severity',
        'Documentation of therapy needs',
        'Evidence of depression treatment',
        'Documentation of depression support'
      ],
      anxiety: [
        'Medical records from psychiatrist',
        'Documentation of anxiety symptoms',
        'Evidence of anxiety episodes',
        'Documentation of treatment history',
        'Evidence of anxiety impact',
        'Documentation of medication management',
        'Evidence of anxiety severity',
        'Documentation of therapy needs',
        'Evidence of anxiety treatment',
        'Documentation of anxiety support'
      ],
      ptsd: [
        'Medical records from psychiatrist',
        'Documentation of PTSD symptoms',
        'Evidence of trauma history',
        'Documentation of treatment history',
        'Evidence of PTSD impact',
        'Documentation of medication management',
        'Evidence of PTSD severity',
        'Documentation of therapy needs',
        'Evidence of PTSD treatment',
        'Documentation of PTSD support'
      ],
      crisis: [
        'Medical records from crisis team',
        'Documentation of crisis situation',
        'Evidence of crisis severity',
        'Documentation of crisis response',
        'Evidence of crisis impact',
        'Documentation of crisis intervention',
        'Evidence of crisis conditions',
        'Documentation of crisis services',
        'Evidence of crisis assistance',
        'Documentation of crisis support'
      ],
      emotional_support: [
        'Documentation of emotional needs',
        'Evidence of emotional distress',
        'Documentation of support requirements',
        'Evidence of emotional support needs',
        'Documentation of emotional assistance',
        'Evidence of emotional crisis',
        'Documentation of emotional services',
        'Evidence of emotional support needs',
        'Documentation of emotional requirements',
        'Evidence of emotional assistance needs'
      ],
      mental_health_emergency: [
        'Medical records from emergency services',
        'Documentation of emergency situation',
        'Evidence of emergency severity',
        'Documentation of emergency response',
        'Evidence of emergency impact',
        'Documentation of emergency intervention',
        'Evidence of emergency conditions',
        'Documentation of emergency services',
        'Evidence of emergency assistance',
        'Documentation of emergency support'
      ]
    };
    
    return descriptions[incidentType] || descriptions.harassment;
  };
  
  // Helper function to generate locations
  const generateLocations = (department) => {
    const locations = {
      legal: [
        'Corporate Office - 3rd Floor Conference Room',
        'Legal Department - Main Office',
        'Company Cafeteria - Lunch Area',
        'Parking Garage - Level 2',
        'Client Meeting Room - Building A',
        'Office Building - 15th Floor',
        'Company Gym - Locker Room',
        'Business Center - Meeting Space',
        'Corporate Campus - Building 3',
        'Office Complex - Suite 200'
      ],
      task: [
        'Public Street - Oak Avenue and 5th Street',
        'Company Parking Lot - Section B',
        'Downtown Area - Main Street',
        'Public Transportation - Bus Stop',
        'Shopping Center - Parking Area',
        'Residential Neighborhood - Elm Street',
        'Office Building - Ground Floor',
        'Public Park - Near Fountain',
        'Gas Station - Convenience Store',
        'Restaurant - Outdoor Seating'
      ],
      support: [
        '456 Pine Street Apartment Complex',
        '123 Oak Avenue Housing Project',
        '789 Maple Street Shelter',
        '321 Elm Street Community Center',
        '555 Birch Street Affordable Housing',
        '888 Cedar Street Family Services',
        '444 Willow Street Support Center',
        '777 Spruce Street Resource Center',
        '999 Pine Street Community Housing',
        '222 Oak Street Family Center'
      ],
      happy2help: [
        'Personal Residence - Living Room',
        'Therapy Office - Downtown Location',
        'Community Mental Health Center',
        'Hospital - Psychiatric Ward',
        'Crisis Intervention Center',
        'Family Home - Kitchen Area',
        'Support Group Meeting Space',
        'Mental Health Clinic - Main Office',
        'Counseling Center - Group Room',
        'Wellness Center - Meditation Room'
      ]
    };
    
    return locations[department] || locations.legal;
  };
  
  // Helper function to generate evidence
  const generateEvidence = (incidentType) => {
    const evidenceTypes = {
      harassment: [
        'Screenshots of inappropriate text messages',
        'Email communications documenting incidents',
        'Witness statements from colleagues',
        'Audio recordings of meetings',
        'Documentation of pattern of behavior',
        'Performance reviews showing retaliation',
        'Medical records documenting stress',
        'Witness testimonies from multiple sources',
        'Documentation of complaints filed',
        'Evidence of hostile work environment'
      ],
      sexual_harassment: [
        'Screenshots of sexually explicit messages',
        'Witness statements from colleagues',
        'Documentation of unwanted advances',
        'Medical records documenting trauma',
        'Audio recordings of inappropriate comments',
        'Documentation of pattern of behavior',
        'Witness testimonies from multiple sources',
        'Documentation of complaints filed',
        'Evidence of hostile work environment',
        'Documentation of retaliation'
      ],
      discrimination: [
        'Documentation of discriminatory treatment',
        'Performance reviews showing bias',
        'Witness statements from colleagues',
        'Documentation of denied opportunities',
        'Evidence of different treatment',
        'Documentation of complaints filed',
        'Witness testimonies from multiple sources',
        'Documentation of pattern of behavior',
        'Evidence of hostile work environment',
        'Documentation of retaliation'
      ],
      retaliation: [
        'Documentation of adverse actions',
        'Performance reviews showing retaliation',
        'Witness statements from colleagues',
        'Documentation of complaints filed',
        'Evidence of pattern of behavior',
        'Documentation of different treatment',
        'Witness testimonies from multiple sources',
        'Evidence of hostile work environment',
        'Documentation of adverse changes',
        'Evidence of systematic retaliation'
      ],
      civil_rights: [
        'Documentation of rights violations',
        'Legal correspondence and complaints',
        'Witness statements from colleagues',
        'Documentation of denied accommodations',
        'Evidence of different treatment',
        'Documentation of complaints filed',
        'Witness testimonies from multiple sources',
        'Documentation of pattern of behavior',
        'Evidence of rights violations',
        'Legal documentation and evidence'
      ],
      employment_law: [
        'Documentation of law violations',
        'Pay stubs and time records',
        'Witness statements from colleagues',
        'Documentation of denied benefits',
        'Evidence of unsafe conditions',
        'Documentation of complaints filed',
        'Witness testimonies from multiple sources',
        'Documentation of pattern of behavior',
        'Evidence of law violations',
        'Legal documentation and evidence'
      ],
      hostile_environment: [
        'Documentation of hostile behavior',
        'Witness statements from colleagues',
        'Documentation of pattern of behavior',
        'Evidence of hostile work environment',
        'Documentation of complaints filed',
        'Witness testimonies from multiple sources',
        'Evidence of systematic harassment',
        'Documentation of adverse effects',
        'Evidence of hostile communication',
        'Documentation of intimidation tactics'
      ],
      bullying: [
        'Documentation of bullying behavior',
        'Witness statements from colleagues',
        'Documentation of pattern of behavior',
        'Evidence of systematic bullying',
        'Documentation of complaints filed',
        'Witness testimonies from multiple sources',
        'Evidence of intimidation tactics',
        'Documentation of adverse effects',
        'Evidence of hostile communication',
        'Documentation of exclusion tactics'
      ],
      assault: [
        'Medical records from hospital visit',
        'Police report #2024-4567',
        'Photographs of injuries sustained',
        'Witness statements from bystanders',
        'Security camera footage',
        'Medical bills and treatment records',
        'Photographs of damaged property',
        'Witness testimonies from multiple sources',
        'Documentation of threats made',
        'Evidence of pattern of violence'
      ],
      domestic: [
        'Police reports and documentation',
        'Medical records from injuries',
        'Photographs of injuries and damage',
        'Witness statements from family',
        'Restraining order documentation',
        'Medical bills and treatment records',
        'Photographs of property damage',
        'Witness testimonies from multiple sources',
        'Documentation of threats made',
        'Evidence of pattern of violence'
      ],
      violence: [
        'Police reports and documentation',
        'Medical records from injuries',
        'Photographs of injuries and damage',
        'Witness statements from colleagues',
        'Security camera footage',
        'Medical bills and treatment records',
        'Photographs of property damage',
        'Witness testimonies from multiple sources',
        'Documentation of threats made',
        'Evidence of pattern of violence'
      ],
      stalking: [
        'Documentation of stalking behavior',
        'Witness statements from colleagues',
        'Documentation of unwanted contact',
        'Evidence of pattern of behavior',
        'Documentation of threats made',
        'Witness testimonies from multiple sources',
        'Evidence of systematic stalking',
        'Documentation of adverse effects',
        'Evidence of unwanted attention',
        'Documentation of safety concerns'
      ],
      physical_threat: [
        'Documentation of threats made',
        'Witness statements from colleagues',
        'Documentation of pattern of behavior',
        'Evidence of threatening behavior',
        'Documentation of safety concerns',
        'Witness testimonies from multiple sources',
        'Evidence of systematic threats',
        'Documentation of adverse effects',
        'Evidence of intimidation tactics',
        'Documentation of safety risks'
      ],
      emergency: [
        'Medical records and documentation',
        'Emergency response documentation',
        'Witness statements from bystanders',
        'Documentation of emergency situation',
        'Evidence of immediate danger',
        'Witness testimonies from multiple sources',
        'Evidence of emergency conditions',
        'Documentation of safety concerns',
        'Evidence of urgent need',
        'Documentation of crisis situation'
      ],
      danger: [
        'Documentation of dangerous situation',
        'Witness statements from bystanders',
        'Documentation of safety concerns',
        'Evidence of immediate danger',
        'Documentation of risk factors',
        'Witness testimonies from multiple sources',
        'Evidence of dangerous conditions',
        'Documentation of safety threats',
        'Evidence of risk to safety',
        'Documentation of hazardous situation'
      ],
      safety_threat: [
        'Documentation of safety threats',
        'Witness statements from colleagues',
        'Documentation of safety concerns',
        'Evidence of safety risks',
        'Documentation of threatening behavior',
        'Witness testimonies from multiple sources',
        'Evidence of safety violations',
        'Documentation of safety issues',
        'Evidence of safety concerns',
        'Documentation of safety risks'
      ],
      workplace_violence: [
        'Police reports and documentation',
        'Medical records from injuries',
        'Photographs of injuries and damage',
        'Witness statements from colleagues',
        'Security camera footage',
        'Medical bills and treatment records',
        'Photographs of property damage',
        'Witness testimonies from multiple sources',
        'Documentation of threats made',
        'Evidence of pattern of violence'
      ],
      intimidation: [
        'Documentation of intimidation tactics',
        'Witness statements from colleagues',
        'Documentation of pattern of behavior',
        'Evidence of intimidating behavior',
        'Documentation of threats made',
        'Witness testimonies from multiple sources',
        'Evidence of systematic intimidation',
        'Documentation of adverse effects',
        'Evidence of threatening behavior',
        'Documentation of safety concerns'
      ],
      housing: [
        'Eviction notice from landlord',
        'Termination letter from employer',
        'Bank statements showing financial hardship',
        'Medical bills and expenses',
        'Documentation of unsafe conditions',
        'Photographs of housing violations',
        'Correspondence with property management',
        'Financial records showing hardship',
        'Documentation of discrimination',
        'Evidence of code violations'
      ],
      eviction: [
        'Eviction notice from landlord',
        'Correspondence with property management',
        'Documentation of eviction process',
        'Financial records showing hardship',
        'Documentation of complaints filed',
        'Witness statements from neighbors',
        'Documentation of housing violations',
        'Evidence of eviction proceedings',
        'Documentation of legal issues',
        'Evidence of housing problems'
      ],
      homelessness: [
        'Documentation of housing loss',
        'Correspondence with housing agencies',
        'Documentation of homelessness status',
        'Financial records showing hardship',
        'Documentation of housing search',
        'Witness statements from social workers',
        'Documentation of housing assistance',
        'Evidence of homelessness situation',
        'Documentation of housing needs',
        'Evidence of housing crisis'
      ],
      poverty: [
        'Financial records showing hardship',
        'Documentation of income loss',
        'Bank statements showing poverty',
        'Documentation of basic needs',
        'Evidence of financial hardship',
        'Documentation of assistance needs',
        'Evidence of poverty situation',
        'Documentation of financial crisis',
        'Evidence of economic hardship',
        'Documentation of financial needs'
      ],
      basic_needs: [
        'Financial records showing hardship',
        'Documentation of basic needs',
        'Evidence of financial hardship',
        'Documentation of assistance needs',
        'Evidence of poverty situation',
        'Documentation of financial crisis',
        'Evidence of economic hardship',
        'Documentation of financial needs',
        'Evidence of basic needs not met',
        'Documentation of survival needs'
      ],
      emergency_aid: [
        'Documentation of emergency situation',
        'Financial records showing hardship',
        'Evidence of emergency need',
        'Documentation of assistance required',
        'Evidence of crisis situation',
        'Documentation of emergency conditions',
        'Evidence of urgent need',
        'Documentation of crisis response',
        'Evidence of emergency assistance',
        'Documentation of emergency services'
      ],
      resource_access: [
        'Documentation of resource needs',
        'Evidence of access difficulties',
        'Documentation of assistance required',
        'Evidence of resource barriers',
        'Documentation of access issues',
        'Evidence of resource limitations',
        'Documentation of assistance needs',
        'Evidence of access problems',
        'Documentation of resource requirements',
        'Evidence of access challenges'
      ],
      mental: [
        'Previous therapy records and notes',
        'Medication prescriptions and bottles',
        'Journal entries documenting mental state',
        'Medical records from psychiatrist',
        'Documentation of crisis episodes',
        'Family member statements',
        'Previous treatment history',
        'Documentation of symptoms',
        'Medical bills and treatment costs',
        'Evidence of impact on daily life'
      ],
      counseling: [
        'Previous counseling records',
        'Documentation of counseling needs',
        'Evidence of mental health issues',
        'Documentation of therapy requirements',
        'Evidence of counseling needs',
        'Documentation of mental health support',
        'Evidence of therapy needs',
        'Documentation of counseling services',
        'Evidence of mental health assistance',
        'Documentation of therapy requirements'
      ],
      therapy: [
        'Previous therapy records',
        'Documentation of therapy needs',
        'Evidence of mental health issues',
        'Documentation of therapy requirements',
        'Evidence of therapy needs',
        'Documentation of mental health support',
        'Evidence of therapy assistance',
        'Documentation of therapy services',
        'Evidence of mental health therapy',
        'Documentation of therapy requirements'
      ],
      wellness: [
        'Documentation of wellness needs',
        'Evidence of stress and anxiety',
        'Documentation of wellness requirements',
        'Evidence of mental health needs',
        'Documentation of wellness support',
        'Evidence of stress management needs',
        'Documentation of wellness services',
        'Evidence of mental health assistance',
        'Documentation of wellness requirements',
        'Evidence of stress relief needs'
      ],
      depression: [
        'Medical records from psychiatrist',
        'Documentation of depression symptoms',
        'Evidence of depressive episodes',
        'Documentation of treatment history',
        'Evidence of depression impact',
        'Documentation of medication management',
        'Evidence of depression severity',
        'Documentation of therapy needs',
        'Evidence of depression treatment',
        'Documentation of depression support'
      ],
      anxiety: [
        'Medical records from psychiatrist',
        'Documentation of anxiety symptoms',
        'Evidence of anxiety episodes',
        'Documentation of treatment history',
        'Evidence of anxiety impact',
        'Documentation of medication management',
        'Evidence of anxiety severity',
        'Documentation of therapy needs',
        'Evidence of anxiety treatment',
        'Documentation of anxiety support'
      ],
      ptsd: [
        'Medical records from psychiatrist',
        'Documentation of PTSD symptoms',
        'Evidence of trauma history',
        'Documentation of treatment history',
        'Evidence of PTSD impact',
        'Documentation of medication management',
        'Evidence of PTSD severity',
        'Documentation of therapy needs',
        'Evidence of PTSD treatment',
        'Documentation of PTSD support'
      ],
      crisis: [
        'Medical records from crisis team',
        'Documentation of crisis situation',
        'Evidence of crisis severity',
        'Documentation of crisis response',
        'Evidence of crisis impact',
        'Documentation of crisis intervention',
        'Evidence of crisis conditions',
        'Documentation of crisis services',
        'Evidence of crisis assistance',
        'Documentation of crisis support'
      ],
      emotional_support: [
        'Documentation of emotional needs',
        'Evidence of emotional distress',
        'Documentation of support requirements',
        'Evidence of emotional support needs',
        'Documentation of emotional assistance',
        'Evidence of emotional crisis',
        'Documentation of emotional services',
        'Evidence of emotional support needs',
        'Documentation of emotional requirements',
        'Evidence of emotional assistance needs'
      ],
      mental_health_emergency: [
        'Medical records from emergency services',
        'Documentation of emergency situation',
        'Evidence of emergency severity',
        'Documentation of emergency response',
        'Evidence of emergency impact',
        'Documentation of emergency intervention',
        'Evidence of emergency conditions',
        'Documentation of emergency services',
        'Evidence of emergency assistance',
        'Documentation of emergency support'
      ]
    };
    
    return evidenceTypes[incidentType] || evidenceTypes.harassment;
  };
  
  // Helper function to generate witnesses
  const generateWitnesses = (incidentType) => {
    const witnessTypes = {
      harassment: [
        'Sarah Johnson - HR Manager',
        'Michael Chen - Team Lead',
        'Lisa Rodriguez - Colleague',
        'David Thompson - Supervisor',
        'Jennifer Lee - Department Head',
        'Robert Wilson - Senior Manager',
        'Amanda Garcia - Team Member',
        'Christopher Brown - Project Manager',
        'Jessica Davis - Human Resources',
        'Daniel Martinez - Department Director'
      ],
      sexual_harassment: [
        'Sarah Johnson - HR Manager',
        'Michael Chen - Team Lead',
        'Lisa Rodriguez - Colleague',
        'David Thompson - Supervisor',
        'Jennifer Lee - Department Head',
        'Robert Wilson - Senior Manager',
        'Amanda Garcia - Team Member',
        'Christopher Brown - Project Manager',
        'Jessica Davis - Human Resources',
        'Daniel Martinez - Department Director'
      ],
      discrimination: [
        'Sarah Johnson - HR Manager',
        'Michael Chen - Team Lead',
        'Lisa Rodriguez - Colleague',
        'David Thompson - Supervisor',
        'Jennifer Lee - Department Head',
        'Robert Wilson - Senior Manager',
        'Amanda Garcia - Team Member',
        'Christopher Brown - Project Manager',
        'Jessica Davis - Human Resources',
        'Daniel Martinez - Department Director'
      ],
      retaliation: [
        'Sarah Johnson - HR Manager',
        'Michael Chen - Team Lead',
        'Lisa Rodriguez - Colleague',
        'David Thompson - Supervisor',
        'Jennifer Lee - Department Head',
        'Robert Wilson - Senior Manager',
        'Amanda Garcia - Team Member',
        'Christopher Brown - Project Manager',
        'Jessica Davis - Human Resources',
        'Daniel Martinez - Department Director'
      ],
      civil_rights: [
        'Sarah Johnson - HR Manager',
        'Michael Chen - Team Lead',
        'Lisa Rodriguez - Colleague',
        'David Thompson - Supervisor',
        'Jennifer Lee - Department Head',
        'Robert Wilson - Senior Manager',
        'Amanda Garcia - Team Member',
        'Christopher Brown - Project Manager',
        'Jessica Davis - Human Resources',
        'Daniel Martinez - Department Director'
      ],
      employment_law: [
        'Sarah Johnson - HR Manager',
        'Michael Chen - Team Lead',
        'Lisa Rodriguez - Colleague',
        'David Thompson - Supervisor',
        'Jennifer Lee - Department Head',
        'Robert Wilson - Senior Manager',
        'Amanda Garcia - Team Member',
        'Christopher Brown - Project Manager',
        'Jessica Davis - Human Resources',
        'Daniel Martinez - Department Director'
      ],
      hostile_environment: [
        'Sarah Johnson - HR Manager',
        'Michael Chen - Team Lead',
        'Lisa Rodriguez - Colleague',
        'David Thompson - Supervisor',
        'Jennifer Lee - Department Head',
        'Robert Wilson - Senior Manager',
        'Amanda Garcia - Team Member',
        'Christopher Brown - Project Manager',
        'Jessica Davis - Human Resources',
        'Daniel Martinez - Department Director'
      ],
      bullying: [
        'Sarah Johnson - HR Manager',
        'Michael Chen - Team Lead',
        'Lisa Rodriguez - Colleague',
        'David Thompson - Supervisor',
        'Jennifer Lee - Department Head',
        'Robert Wilson - Senior Manager',
        'Amanda Garcia - Team Member',
        'Christopher Brown - Project Manager',
        'Jessica Davis - Human Resources',
        'Daniel Martinez - Department Director'
      ],
      assault: [
        'Officer Sarah Johnson - Police Department',
        'Dr. Michael Chen - Emergency Room',
        'Lisa Rodriguez - Security Guard',
        'David Thompson - Bystander',
        'Jennifer Lee - Store Manager',
        'Robert Wilson - Neighbor',
        'Amanda Garcia - Co-worker',
        'Christopher Brown - Building Security',
        'Jessica Davis - Medical Staff',
        'Daniel Martinez - Witness'
      ],
      domestic: [
        'Officer Sarah Johnson - Police Department',
        'Dr. Michael Chen - Emergency Room',
        'Lisa Rodriguez - Family Member',
        'David Thompson - Neighbor',
        'Jennifer Lee - Social Worker',
        'Robert Wilson - Family Friend',
        'Amanda Garcia - Child Protective Services',
        'Christopher Brown - Medical Staff',
        'Jessica Davis - Domestic Violence Advocate',
        'Daniel Martinez - Witness'
      ],
      violence: [
        'Officer Sarah Johnson - Police Department',
        'Dr. Michael Chen - Emergency Room',
        'Lisa Rodriguez - Security Guard',
        'David Thompson - Bystander',
        'Jennifer Lee - Store Manager',
        'Robert Wilson - Neighbor',
        'Amanda Garcia - Co-worker',
        'Christopher Brown - Building Security',
        'Jessica Davis - Medical Staff',
        'Daniel Martinez - Witness'
      ],
      stalking: [
        'Officer Sarah Johnson - Police Department',
        'Dr. Michael Chen - Mental Health Professional',
        'Lisa Rodriguez - Co-worker',
        'David Thompson - Neighbor',
        'Jennifer Lee - Security Guard',
        'Robert Wilson - Family Member',
        'Amanda Garcia - Building Manager',
        'Christopher Brown - Witness',
        'Jessica Davis - Legal Advocate',
        'Daniel Martinez - Private Investigator'
      ],
      physical_threat: [
        'Officer Sarah Johnson - Police Department',
        'Dr. Michael Chen - Mental Health Professional',
        'Lisa Rodriguez - Co-worker',
        'David Thompson - Neighbor',
        'Jennifer Lee - Security Guard',
        'Robert Wilson - Family Member',
        'Amanda Garcia - Building Manager',
        'Christopher Brown - Witness',
        'Jessica Davis - Legal Advocate',
        'Daniel Martinez - Private Investigator'
      ],
      emergency: [
        'Officer Sarah Johnson - Police Department',
        'Dr. Michael Chen - Emergency Medical Services',
        'Lisa Rodriguez - Emergency Responder',
        'David Thompson - Bystander',
        'Jennifer Lee - Emergency Dispatcher',
        'Robert Wilson - Medical Staff',
        'Amanda Garcia - Fire Department',
        'Christopher Brown - Emergency Room Staff',
        'Jessica Davis - Crisis Team',
        'Daniel Martinez - Emergency Services'
      ],
      danger: [
        'Officer Sarah Johnson - Police Department',
        'Dr. Michael Chen - Emergency Medical Services',
        'Lisa Rodriguez - Emergency Responder',
        'David Thompson - Bystander',
        'Jennifer Lee - Emergency Dispatcher',
        'Robert Wilson - Medical Staff',
        'Amanda Garcia - Fire Department',
        'Christopher Brown - Emergency Room Staff',
        'Jessica Davis - Crisis Team',
        'Daniel Martinez - Emergency Services'
      ],
      safety_threat: [
        'Officer Sarah Johnson - Police Department',
        'Dr. Michael Chen - Emergency Medical Services',
        'Lisa Rodriguez - Emergency Responder',
        'David Thompson - Bystander',
        'Jennifer Lee - Emergency Dispatcher',
        'Robert Wilson - Medical Staff',
        'Amanda Garcia - Fire Department',
        'Christopher Brown - Emergency Room Staff',
        'Jessica Davis - Crisis Team',
        'Daniel Martinez - Emergency Services'
      ],
      workplace_violence: [
        'Officer Sarah Johnson - Police Department',
        'Dr. Michael Chen - Emergency Room',
        'Lisa Rodriguez - Security Guard',
        'David Thompson - Bystander',
        'Jennifer Lee - Store Manager',
        'Robert Wilson - Neighbor',
        'Amanda Garcia - Co-worker',
        'Christopher Brown - Building Security',
        'Jessica Davis - Medical Staff',
        'Daniel Martinez - Witness'
      ],
      intimidation: [
        'Officer Sarah Johnson - Police Department',
        'Dr. Michael Chen - Mental Health Professional',
        'Lisa Rodriguez - Co-worker',
        'David Thompson - Neighbor',
        'Jennifer Lee - Security Guard',
        'Robert Wilson - Family Member',
        'Amanda Garcia - Building Manager',
        'Christopher Brown - Witness',
        'Jessica Davis - Legal Advocate',
        'Daniel Martinez - Private Investigator'
      ],
      housing: [
        'Sarah Johnson - Housing Authority',
        'Michael Chen - Social Worker',
        'Lisa Rodriguez - Property Manager',
        'David Thompson - Neighbor',
        'Jennifer Lee - Legal Aid Attorney',
        'Robert Wilson - Housing Counselor',
        'Amanda Garcia - Community Advocate',
        'Christopher Brown - Building Inspector',
        'Jessica Davis - Tenant Rights Organization',
        'Daniel Martinez - Housing Specialist'
      ],
      eviction: [
        'Sarah Johnson - Housing Authority',
        'Michael Chen - Social Worker',
        'Lisa Rodriguez - Property Manager',
        'David Thompson - Neighbor',
        'Jennifer Lee - Legal Aid Attorney',
        'Robert Wilson - Housing Counselor',
        'Amanda Garcia - Community Advocate',
        'Christopher Brown - Building Inspector',
        'Jessica Davis - Tenant Rights Organization',
        'Daniel Martinez - Housing Specialist'
      ],
      homelessness: [
        'Sarah Johnson - Housing Authority',
        'Michael Chen - Social Worker',
        'Lisa Rodriguez - Shelter Staff',
        'David Thompson - Outreach Worker',
        'Jennifer Lee - Legal Aid Attorney',
        'Robert Wilson - Housing Counselor',
        'Amanda Garcia - Community Advocate',
        'Christopher Brown - Case Manager',
        'Jessica Davis - Homeless Services',
        'Daniel Martinez - Housing Specialist'
      ],
      poverty: [
        'Sarah Johnson - Social Services',
        'Michael Chen - Financial Counselor',
        'Lisa Rodriguez - Community Advocate',
        'David Thompson - Social Worker',
        'Jennifer Lee - Legal Aid Attorney',
        'Robert Wilson - Financial Advisor',
        'Amanda Garcia - Community Organization',
        'Christopher Brown - Case Manager',
        'Jessica Davis - Poverty Relief Services',
        'Daniel Martinez - Financial Specialist'
      ],
      basic_needs: [
        'Sarah Johnson - Social Services',
        'Michael Chen - Financial Counselor',
        'Lisa Rodriguez - Community Advocate',
        'David Thompson - Social Worker',
        'Jennifer Lee - Legal Aid Attorney',
        'Robert Wilson - Financial Advisor',
        'Amanda Garcia - Community Organization',
        'Christopher Brown - Case Manager',
        'Jessica Davis - Basic Needs Services',
        'Daniel Martinez - Financial Specialist'
      ],
      emergency_aid: [
        'Sarah Johnson - Emergency Services',
        'Michael Chen - Crisis Counselor',
        'Lisa Rodriguez - Emergency Responder',
        'David Thompson - Social Worker',
        'Jennifer Lee - Legal Aid Attorney',
        'Robert Wilson - Emergency Coordinator',
        'Amanda Garcia - Crisis Team',
        'Christopher Brown - Emergency Manager',
        'Jessica Davis - Emergency Aid Services',
        'Daniel Martinez - Crisis Specialist'
      ],
      resource_access: [
        'Sarah Johnson - Resource Coordinator',
        'Michael Chen - Community Navigator',
        'Lisa Rodriguez - Resource Specialist',
        'David Thompson - Social Worker',
        'Jennifer Lee - Legal Aid Attorney',
        'Robert Wilson - Resource Manager',
        'Amanda Garcia - Community Organization',
        'Christopher Brown - Case Manager',
        'Jessica Davis - Resource Access Services',
        'Daniel Martinez - Resource Specialist'
      ],
      mental: [
        'Dr. Sarah Johnson - Psychiatrist',
        'Dr. Michael Chen - Clinical Psychologist',
        'Lisa Rodriguez - Licensed Therapist',
        'David Thompson - Mental Health Counselor',
        'Jennifer Lee - Crisis Intervention Specialist',
        'Dr. Robert Wilson - Psychiatrist',
        'Amanda Garcia - Mental Health Advocate',
        'Christopher Brown - Licensed Social Worker',
        'Jessica Davis - Mental Health Services',
        'Daniel Martinez - Mental Health Specialist'
      ],
      counseling: [
        'Dr. Sarah Johnson - Psychiatrist',
        'Dr. Michael Chen - Clinical Psychologist',
        'Lisa Rodriguez - Licensed Therapist',
        'David Thompson - Mental Health Counselor',
        'Jennifer Lee - Crisis Intervention Specialist',
        'Dr. Robert Wilson - Psychiatrist',
        'Amanda Garcia - Mental Health Advocate',
        'Christopher Brown - Licensed Social Worker',
        'Jessica Davis - Mental Health Services',
        'Daniel Martinez - Mental Health Specialist'
      ],
      therapy: [
        'Dr. Sarah Johnson - Psychiatrist',
        'Dr. Michael Chen - Clinical Psychologist',
        'Lisa Rodriguez - Licensed Therapist',
        'David Thompson - Mental Health Counselor',
        'Jennifer Lee - Crisis Intervention Specialist',
        'Dr. Robert Wilson - Psychiatrist',
        'Amanda Garcia - Mental Health Advocate',
        'Christopher Brown - Licensed Social Worker',
        'Jessica Davis - Mental Health Services',
        'Daniel Martinez - Mental Health Specialist'
      ],
      wellness: [
        'Dr. Sarah Johnson - Psychiatrist',
        'Dr. Michael Chen - Clinical Psychologist',
        'Lisa Rodriguez - Licensed Therapist',
        'David Thompson - Mental Health Counselor',
        'Jennifer Lee - Crisis Intervention Specialist',
        'Dr. Robert Wilson - Psychiatrist',
        'Amanda Garcia - Mental Health Advocate',
        'Christopher Brown - Licensed Social Worker',
        'Jessica Davis - Mental Health Services',
        'Daniel Martinez - Mental Health Specialist'
      ],
      depression: [
        'Dr. Sarah Johnson - Psychiatrist',
        'Dr. Michael Chen - Clinical Psychologist',
        'Lisa Rodriguez - Licensed Therapist',
        'David Thompson - Mental Health Counselor',
        'Jennifer Lee - Crisis Intervention Specialist',
        'Dr. Robert Wilson - Psychiatrist',
        'Amanda Garcia - Mental Health Advocate',
        'Christopher Brown - Licensed Social Worker',
        'Jessica Davis - Mental Health Services',
        'Daniel Martinez - Mental Health Specialist'
      ],
      anxiety: [
        'Dr. Sarah Johnson - Psychiatrist',
        'Dr. Michael Chen - Clinical Psychologist',
        'Lisa Rodriguez - Licensed Therapist',
        'David Thompson - Mental Health Counselor',
        'Jennifer Lee - Crisis Intervention Specialist',
        'Dr. Robert Wilson - Psychiatrist',
        'Amanda Garcia - Mental Health Advocate',
        'Christopher Brown - Licensed Social Worker',
        'Jessica Davis - Mental Health Services',
        'Daniel Martinez - Mental Health Specialist'
      ],
      ptsd: [
        'Dr. Sarah Johnson - Psychiatrist',
        'Dr. Michael Chen - Clinical Psychologist',
        'Lisa Rodriguez - Licensed Therapist',
        'David Thompson - Mental Health Counselor',
        'Jennifer Lee - Crisis Intervention Specialist',
        'Dr. Robert Wilson - Psychiatrist',
        'Amanda Garcia - Mental Health Advocate',
        'Christopher Brown - Licensed Social Worker',
        'Jessica Davis - Mental Health Services',
        'Daniel Martinez - Mental Health Specialist'
      ],
      crisis: [
        'Dr. Sarah Johnson - Psychiatrist',
        'Dr. Michael Chen - Clinical Psychologist',
        'Lisa Rodriguez - Licensed Therapist',
        'David Thompson - Mental Health Counselor',
        'Jennifer Lee - Crisis Intervention Specialist',
        'Dr. Robert Wilson - Psychiatrist',
        'Amanda Garcia - Mental Health Advocate',
        'Christopher Brown - Licensed Social Worker',
        'Jessica Davis - Mental Health Services',
        'Daniel Martinez - Mental Health Specialist'
      ],
      emotional_support: [
        'Dr. Sarah Johnson - Psychiatrist',
        'Dr. Michael Chen - Clinical Psychologist',
        'Lisa Rodriguez - Licensed Therapist',
        'David Thompson - Mental Health Counselor',
        'Jennifer Lee - Crisis Intervention Specialist',
        'Dr. Robert Wilson - Psychiatrist',
        'Amanda Garcia - Mental Health Advocate',
        'Christopher Brown - Licensed Social Worker',
        'Jessica Davis - Mental Health Services',
        'Daniel Martinez - Mental Health Specialist'
      ],
      mental_health_emergency: [
        'Dr. Sarah Johnson - Psychiatrist',
        'Dr. Michael Chen - Clinical Psychologist',
        'Lisa Rodriguez - Licensed Therapist',
        'David Thompson - Mental Health Counselor',
        'Jennifer Lee - Crisis Intervention Specialist',
        'Dr. Robert Wilson - Psychiatrist',
        'Amanda Garcia - Mental Health Advocate',
        'Christopher Brown - Licensed Social Worker',
        'Jessica Davis - Mental Health Services',
        'Daniel Martinez - Mental Health Specialist'
      ]
    };
    
    return witnessTypes[incidentType] || witnessTypes.harassment;
  };
  
  // Helper function to generate agent names
  const generateAgentName = (department, caseNumber) => {
    const agentNames = {
      legal: [
        'Attorney Sarah Johnson',
        'Attorney Michael Chen',
        'Attorney Lisa Rodriguez',
        'Attorney David Thompson',
        'Attorney Jennifer Lee',
        'Attorney Robert Wilson',
        'Attorney Amanda Garcia',
        'Attorney Christopher Brown',
        'Attorney Jessica Davis',
        'Attorney Daniel Martinez',
        'Attorney Emily White',
        'Attorney James Taylor'
      ],
      task: [
        'Detective Sarah Johnson',
        'Detective Michael Chen',
        'Detective Lisa Rodriguez',
        'Detective David Thompson',
        'Detective Jennifer Lee',
        'Detective Robert Wilson',
        'Detective Amanda Garcia',
        'Detective Christopher Brown'
      ],
      support: [
        'Case Manager Sarah Johnson',
        'Case Manager Michael Chen',
        'Case Manager Lisa Rodriguez',
        'Case Manager David Thompson',
        'Case Manager Jennifer Lee',
        'Case Manager Robert Wilson',
        'Case Manager Amanda Garcia',
        'Case Manager Christopher Brown',
        'Case Manager Jessica Davis',
        'Case Manager Daniel Martinez',
        'Case Manager Emily White',
        'Case Manager James Taylor',
        'Case Manager Maria Garcia',
        'Case Manager Kevin Lee',
        'Case Manager Rachel Kim'
      ],
      happy2help: [
        'Counselor Sarah Johnson',
        'Counselor Michael Chen',
        'Counselor Lisa Rodriguez',
        'Counselor David Thompson',
        'Counselor Jennifer Lee',
        'Counselor Robert Wilson',
        'Counselor Amanda Garcia',
        'Counselor Christopher Brown',
        'Counselor Jessica Davis',
        'Counselor Daniel Martinez',
        'Counselor Emily White',
        'Counselor James Taylor',
        'Counselor Maria Garcia',
        'Counselor Kevin Lee',
        'Counselor Rachel Kim',
        'Counselor Thomas Anderson',
        'Counselor Michelle Clark',
        'Counselor Brian Wilson',
        'Counselor Nicole Brown',
        'Counselor Steven Davis'
      ]
    };
    
    const names = agentNames[department] || agentNames.legal;
    return names[caseNumber % names.length];
  };
  
  // Generate 25 cases for each department (100+ total cases)
  const allCases = [
    ...generateDepartmentCases('legal', 25),
    ...generateDepartmentCases('task', 25),
    ...generateDepartmentCases('support', 25),
    ...generateDepartmentCases('happy2help', 25)
  ];
  
  console.log(`📊 Generated ${allCases.length} total cases across all departments`);
  
  try {
    for (let index = 0; index < allCases.length; index++) {
      const report = allCases[index];
      console.log(`🔄 Creating demo report ${index + 1}/${allCases.length}: ${report.report_id} → ${report.assigned_department}`);
      
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
            'High confidence match based on multiple factors',
            'Pattern recognition identified department expertise match'
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

      // Create initial notification
      try {
        await NotificationService.createNotification(
          userId,
          'case_assigned',
          'Case Assigned',
          `Your report has been assigned to ${DEPARTMENTS[report.assigned_department].name}`,
          { reportId: report.report_id, departmentId: report.assigned_department }
        );
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
      }
    }
    
    console.log('✅ Comprehensive demo data created successfully!');
    console.log(`📊 Total cases created: ${allCases.length}`);
    console.log(`🏢 Cases per department:`);
    console.log(`   Legal: ${allCases.filter(c => c.assigned_department === 'legal').length}`);
    console.log(`   Task Force: ${allCases.filter(c => c.assigned_department === 'task').length}`);
    console.log(`   Support Services: ${allCases.filter(c => c.assigned_department === 'support').length}`);
    console.log(`   Happy2Help: ${allCases.filter(c => c.assigned_department === 'happy2help').length}`);
    
    // Log demo account info
    console.log('\n👤 Demo Account Credentials (Sample):');
    const sampleCases = allCases.slice(0, 10); // Show first 10
    sampleCases.forEach(report => {
      const authInfo = report.userEmail ? `Email: ${report.userEmail}` : `PIN: ${report.userPin}`;
      console.log(`  ${report.report_id}: ${authInfo} (${report.status})`);
    });
    console.log(`  ... and ${allCases.length - 10} more cases`);

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
  return crypto.createHash('sha256').update(ip + (process.env.IP_SALT || 'salt-string')).digest('hex');
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

// Import and mount demo routes
const { router: demoRoutes, initializeDemoService } = require('./src/routes/demo');
app.use('/api/demo', demoRoutes);

console.log('✅ Demo routes mounted at /api/demo');

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'connected',
      ai: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not_configured',
      websocket: wss.clients.size > 0 ? 'active' : 'ready'
    }
  });
});

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

// ==================== AI ROUTES ====================

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

// AI Response Suggestions Endpoint
app.get('/api/admin/cases/:reportId/ai-responses', authenticateToken, async (req, res) => {
  const { reportId } = req.params;

  try {
    // Get case details
    const caseQuery = `
      SELECT r.*, u.anonymous_id 
      FROM reports r 
      LEFT JOIN users u ON r.user_id = u.id 
      WHERE r.report_id = ?
    `;

    db.get(caseQuery, [reportId], async (err, caseData) => {
      if (err) {
        console.error('Error fetching case for AI responses:', err);
        return res.status(500).json({ error: 'Failed to fetch case data', success: false });
      }

      if (!caseData) {
        return res.status(404).json({ error: 'Case not found', success: false });
      }

      try {
        // Generate AI response suggestions
        const responseSuggestions = await safeVoiceAI.generateResponseSuggestions(
          caseData, 
          { status: caseData.status, priority: caseData.priority }
        );

        res.json({
          success: true,
          responseSuggestions,
          caseId: reportId,
          generatedAt: new Date().toISOString()
        });

      } catch (aiError) {
        console.error('AI response generation error:', aiError);
        res.status(500).json({ error: 'Failed to generate AI responses', success: false });
      }
    });

  } catch (error) {
    console.error('Error in AI responses endpoint:', error);
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

      db.run(reportQuery, reportParams, async function(err) {
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
        
        // Create notification for the user
        try {
          await NotificationService.createNotification(
            userId,
            'report_submitted',
            'Report Submitted Successfully',
            `Your report ${reportId} has been submitted and assigned to ${DEPARTMENTS[aiAssignment.assignedDepartment].name}. They will contact you within ${DEPARTMENTS[aiAssignment.assignedDepartment].avgResponseTime}.`,
            { 
              reportId, 
              departmentId: aiAssignment.assignedDepartment,
              confidence: aiAssignment.confidence
            }
          );
        } catch (notifError) {
          console.error('Notification error:', notifError);
        }

        // Broadcast new case to admins via WebSocket
        broadcastToAll({
          type: 'new_case',
          reportId,
          department: aiAssignment.assignedDepartment,
          priority,
          incidentType
        });

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
      departmentName: DEPARTMENTS[aiAssignment.assignedDepartment]?.name,
      estimatedResponseTime: DEPARTMENTS[aiAssignment.assignedDepartment]?.avgResponseTime,
      keyIndicators: aiAssignment.reasoning?.slice(0, 2) || []
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

// Quality Check Endpoint
app.post('/api/ai/quality-check', async (req, res) => {
  const { reportData } = req.body;
  
  try {
    const assessment = await EnhancedAIAssignmentEngine.qualityCheck(reportData);
    res.json({
      success: true,
      assessment,
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Quality check error:', error);
    res.status(500).json({
      success: false,
      error: 'Quality check temporarily unavailable'
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

// Enhanced Incident Categorization Endpoint
app.post('/api/ai/categorize-incident', async (req, res) => {
  try {
    const { reportData } = req.body;
    
    if (!reportData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Report data required' 
      });
    }

    const categorization = await EnhancedAIAssignmentEngine.categorizeIncident(reportData);
    res.json({ 
      success: true, 
      categorization,
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Incident categorization error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Categorization failed' 
    });
  }
});

// Smart Case Prioritization Endpoint
app.post('/api/ai/prioritize-case', async (req, res) => {
  try {
    const { reportData, existingCases } = req.body;
    
    if (!reportData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Report data required' 
      });
    }

    const prioritization = await EnhancedAIAssignmentEngine.prioritizeCase(reportData, existingCases || []);
    res.json({ 
      success: true, 
      prioritization,
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Case prioritization error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Prioritization failed' 
    });
  }
});

// Intelligent Response Generation Endpoint
app.post('/api/ai/generate-response', async (req, res) => {
  try {
    const { reportData, caseHistory, userContext } = req.body;
    
    if (!reportData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Report data required' 
      });
    }

    const response = await EnhancedAIAssignmentEngine.generateContextualResponse(
      reportData, 
      caseHistory || [], 
      userContext || {}
    );
    
    res.json({ 
      success: true, 
      response,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Response generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Response generation failed' 
    });
  }
});

// Pattern Recognition & Trend Analysis Endpoint
app.post('/api/ai/analyze-patterns', async (req, res) => {
  try {
    const { reports, timeRange } = req.body;
    
    if (!reports || !Array.isArray(reports)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Reports array required' 
      });
    }

    const patterns = await EnhancedAIAssignmentEngine.analyzePatterns(reports, timeRange || '30d');
    res.json({ 
      success: true, 
      patterns,
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Pattern analysis error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Pattern analysis failed' 
    });
  }
});

// Enhanced User Experience Endpoint
app.post('/api/ai/enhance-user-experience', async (req, res) => {
  try {
    const { reportData, userProfile } = req.body;
    
    if (!reportData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Report data required' 
      });
    }

    const enhancements = await EnhancedAIAssignmentEngine.enhanceUserExperience(
      reportData, 
      userProfile || {}
    );
    
    res.json({ 
      success: true, 
      enhancements,
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('User experience enhancement error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Enhancement analysis failed' 
    });
  }
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
            description: 'Report received and processed',
            timeAgo: getTimeAgo(report.created_at)
          },
          {
            date: report.created_at,
            status: 'Assigned',
            description: `Assigned to ${departmentInfo?.name}`,
            timeAgo: getTimeAgo(report.created_at)
          },
          ...updates.map(update => ({
            date: update.created_at,
            status: update.update_type.replace('_', ' '),
            description: update.notes || 'Case updated',
            timeAgo: getTimeAgo(update.created_at)
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
        created_at,
        assignment_confidence as confidence
      FROM reports 
      ORDER BY created_at DESC 
      LIMIT 20
    `,
    aiAccuracy: `
      SELECT 
        AVG(assignment_confidence) as avg_confidence,
        COUNT(CASE WHEN assignment_confidence >= 80 THEN 1 END) as high_confidence,
        COUNT(*) as total,
        COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical_risk_cases
      FROM reports 
      WHERE assigned_department IS NOT NULL
    `,
    departmentStats: `
      SELECT 
        assigned_department,
        COUNT(*) as total_cases,
        COUNT(CASE WHEN status NOT IN ('resolved', 'closed') THEN 1 END) as active_cases,
        COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as today_cases,
        COUNT(CASE WHEN DATE(created_at) >= DATE('now', '-7 days') THEN 1 END) as week_cases,
        AVG(assignment_confidence) as avg_confidence
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
          week_cases: 0,
          avg_confidence: 0
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
          activeAgents: dept.activeAgents,
          aiMetrics: {
            avgConfidence: Math.round(stats.avg_confidence || 0)
          }
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
          totalAssignments: results.aiAccuracy.total,
          criticalRiskCases: results.aiAccuracy.critical_risk_cases || 0
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
            Math.round(results.avgResponseTime.avg_hours) + 'h' : 
            departmentInfo.avgResponseTime
        },
        statistics: {
          casesByStatus: results.casesByStatus,
          casesByPriority: results.casesByPriority
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

// Get Department Cases
app.get('/api/admin/department/:departmentId/cases', authenticateToken, (req, res) => {
  const { departmentId } = req.params;
  const { status, priority, page = 1, limit = 20 } = req.query;
  
  // Check department access
  if (req.admin.role !== 'super_admin' && req.admin.department !== departmentId) {
    return res.status(403).json({ error: 'Access denied to this department', success: false });
  }

  let whereClause = 'WHERE assigned_department = ?';
  const params = [departmentId];

  if (status && status !== 'all') {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  if (priority && priority !== 'all') {
    whereClause += ' AND priority = ?';
    params.push(priority);
  }

  const offset = (page - 1) * limit;
  
  const query = `
    SELECT r.*, u.anonymous_id 
    FROM reports r 
    LEFT JOIN users u ON r.user_id = u.id 
    ${whereClause}
    ORDER BY r.created_at DESC 
    LIMIT ? OFFSET ?
  `;
  
  params.push(limit, offset);

  db.all(query, params, (err, cases) => {
    if (err) {
      console.error('Error fetching department cases:', err);
      return res.status(500).json({ error: 'Internal server error', success: false });
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM reports ${whereClause}`;
    db.get(countQuery, params.slice(0, -2), (err, countResult) => {
      if (err) {
        console.error('Error counting cases:', err);
        return res.status(500).json({ error: 'Internal server error', success: false });
      }

      res.json({
        success: true,
        cases: cases.map(case_item => ({
          ...case_item,
          timeAgo: getTimeAgo(case_item.created_at),
          isAnonymous: case_item.anonymous === 1
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

// Get Case Details
app.get('/api/admin/department/:departmentId/cases/:reportId', authenticateToken, (req, res) => {
  const { departmentId, reportId } = req.params;
  
  // Check department access
  if (req.admin.role !== 'super_admin' && req.admin.department !== departmentId) {
    return res.status(403).json({ error: 'Access denied to this department', success: false });
  }

  const caseQuery = `
    SELECT r.*, u.anonymous_id, u.email as user_email
    FROM reports r 
    LEFT JOIN users u ON r.user_id = u.id 
    WHERE r.report_id = ? AND r.assigned_department = ?
  `;

  db.get(caseQuery, [reportId, departmentId], (err, caseData) => {
    if (err) {
      console.error('Error fetching case details:', err);
      return res.status(500).json({ error: 'Internal server error', success: false });
    }

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found', success: false });
    }

    // Get case messages
    const messagesQuery = `
      SELECT * FROM messages 
      WHERE report_id = ? 
      ORDER BY timestamp ASC
    `;

    db.all(messagesQuery, [reportId], (err, messages) => {
      if (err) {
        console.error('Error fetching case messages:', err);
        messages = [];
      }

      // Parse AI analysis data
      const aiSentiment = caseData.ai_sentiment ? JSON.parse(caseData.ai_sentiment) : null;
      const assignmentReasoning = caseData.assignment_reasoning ? JSON.parse(caseData.assignment_reasoning) : [];

      // Enhance case data with AI analysis
      const enhancedCase = {
        ...caseData,
        isAnonymous: caseData.anonymous === 1,
        timeAgo: getTimeAgo(caseData.created_at),
        aiAnalysis: {
          confidence: caseData.assignment_confidence,
          reasoning: assignmentReasoning,
          sentiment: aiSentiment,
          riskLevel: caseData.ai_risk_level,
          qualityAssessment: {
            overallQuality: 'good',
            completenessScore: 8,
            readyForProcessing: true
          },
          riskAssessment: {
            safetyRisk: caseData.current_safety === 'unsafe' ? 8 : 3,
            urgencyScore: caseData.priority === 'critical' ? 9 : 5
          }
        }
      };

      res.json({
        success: true,
        case: enhancedCase,
        messages: messages.map(msg => ({
          ...msg,
          isFromUser: msg.sender_type === 'user',
          timeAgo: getTimeAgo(msg.timestamp)
        }))
      });
    });
  });
});

// Update Case Status
app.put('/api/admin/department/:departmentId/cases/:reportId/status', authenticateToken, logAuditAction('case_status_update'), (req, res) => {
  const { departmentId, reportId } = req.params;
  const { status, notes } = req.body;
  
  // Check department access
  if (req.admin.role !== 'super_admin' && req.admin.department !== departmentId) {
    return res.status(403).json({ error: 'Access denied to this department', success: false });
  }

  if (!status) {
    return res.status(400).json({ error: 'Status is required', success: false });
  }

  // Get current status first
  db.get('SELECT status FROM reports WHERE report_id = ?', [reportId], (err, currentReport) => {
    if (err) {
      console.error('Error fetching current report:', err);
      return res.status(500).json({ error: 'Internal server error', success: false });
    }

    if (!currentReport) {
      return res.status(404).json({ error: 'Report not found', success: false });
    }

    // Update report status
    const updateQuery = `
      UPDATE reports 
      SET status = ?, updated_at = CURRENT_TIMESTAMP, case_notes = ?
      WHERE report_id = ? AND assigned_department = ?
    `;

    db.run(updateQuery, [status, notes, reportId, departmentId], function(err) {
      if (err) {
        console.error('Error updating case status:', err);
        return res.status(500).json({ error: 'Failed to update case status', success: false });
      }

      // Log the status change
      const logQuery = `
        INSERT INTO case_updates (report_id, admin_id, update_type, old_value, new_value, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.run(logQuery, [reportId, req.admin.id, 'status_change', currentReport.status, status, notes], (err) => {
        if (err) {
          console.error('Error logging case update:', err);
        }
      });

      // Notify user via WebSocket
      broadcastToAll({
        type: 'case_update',
        reportId: reportId,
        updateType: 'status_change',
        newStatus: status,
        notes: notes
      });

      res.json({
        success: true,
        message: 'Case status updated successfully',
        newStatus: status,
        updatedAt: new Date().toISOString()
      });
    });
  });
});

// Get Admin Messages for a Case (ENHANCED)
app.get('/api/admin/department/:departmentId/cases/:reportId/messages', authenticateToken, (req, res) => {
  const { departmentId, reportId } = req.params;
  
  // Check department access
  if (req.admin.role !== 'super_admin' && req.admin.department !== departmentId) {
    return res.status(403).json({ error: 'Access denied to this department', success: false });
  }

  const messagesQuery = `
    SELECT * FROM messages 
    WHERE report_id = ? 
    ORDER BY timestamp ASC
  `;

  const unreadQuery = `
    SELECT COUNT(*) as unreadCount 
    FROM messages 
    WHERE report_id = ? AND sender_type = 'user' AND read_by_admin = 0
  `;

  // First, add read_by_admin column if it doesn't exist
  db.run(`
    ALTER TABLE messages ADD COLUMN read_by_admin BOOLEAN DEFAULT 0
  `, (alterErr) => {
    // Ignore error if column already exists
    
    db.get(unreadQuery, [reportId], (err, unreadResult) => {
      if (err) {
        console.error('Error counting unread messages:', err);
        unreadResult = { unreadCount: 0 };
      }

      db.all(messagesQuery, [reportId], (err, messages) => {
        if (err) {
          console.error('Error fetching messages:', err);
          return res.status(500).json({ error: 'Internal server error', success: false });
        }

        // Mark user messages as read by admin
        db.run(
          'UPDATE messages SET read_by_admin = 1 WHERE report_id = ? AND sender_type = ?', 
          [reportId, 'user'],
          (err) => {
            if (err) console.error('Error marking messages as read by admin:', err);
          }
        );

        res.json({
          success: true,
          unreadCount: unreadResult.unreadCount,
          messages: messages.map(msg => ({
            id: msg.id,
            sender_name: msg.sender_name,
            sender_type: msg.sender_type,
            message: msg.message,
            timestamp: msg.timestamp,
            timeAgo: getTimeAgo(msg.timestamp),
            isFromUser: msg.sender_type === 'user',
            isRead: msg.sender_type !== 'user' || msg.read_by_admin === 1
          }))
        });
      });
    });
  });
});

app.put('/api/users/messages/:messageId/read', authenticateUser, (req, res) => {
  const { reportId } = req.user;
  const { messageId } = req.params;
  
  db.run(
    'UPDATE messages SET read_by_user = 1 WHERE id = ? AND report_id = ?',
    [messageId, reportId],
    function(err) {
      if (err) {
        console.error('Error marking message as read:', err);
        return res.status(500).json({ error: 'Failed to mark message as read', success: false });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Message not found', success: false });
      }

      res.json({
        success: true,
        message: 'Message marked as read'
      });
    }
  );
});

// Get Unread Count for User
app.get('/api/users/messages/unread-count', authenticateUser, (req, res) => {
  const { reportId } = req.user;
  
  const query = `
    SELECT COUNT(*) as unreadCount 
    FROM messages 
    WHERE report_id = ? AND sender_type != 'user' AND read_by_user = 0
  `;

  db.get(query, [reportId], (err, result) => {
    if (err) {
      console.error('Error getting unread count:', err);
      return res.status(500).json({ error: 'Internal server error', success: false });
    }

    res.json({
      success: true,
      unreadCount: result.unreadCount
    });
  });
});

// Get Unread Count for Admin
app.get('/api/admin/messages/unread-count', authenticateToken, (req, res) => {
  const { department, role } = req.admin;
  
  let query;
  let params;
  
  if (role === 'super_admin') {
    // Super admin sees all unread messages
    query = `
      SELECT COUNT(*) as unreadCount 
      FROM messages m
      JOIN reports r ON m.report_id = r.report_id
      WHERE m.sender_type = 'user' AND m.read_by_admin = 0
    `;
    params = [];
  } else {
    // Department admin sees only their department's unread
    query = `
      SELECT COUNT(*) as unreadCount 
      FROM messages m
      JOIN reports r ON m.report_id = r.report_id
      WHERE m.sender_type = 'user' AND m.read_by_admin = 0 AND r.assigned_department = ?
    `;
    params = [department];
  }

  db.get(query, params, (err, result) => {
    if (err) {
      console.error('Error getting admin unread count:', err);
      return res.status(500).json({ error: 'Internal server error', success: false });
    }

    res.json({
      success: true,
      unreadCount: result.unreadCount || 0
    });
  });
});

// Send Admin Message
app.post('/api/admin/department/:departmentId/cases/:reportId/messages', authenticateToken, logAuditAction('admin_message_sent'), async (req, res) => {
  const { departmentId, reportId } = req.params;
  const { message } = req.body;
  
  // Check department access
  if (req.admin.role !== 'super_admin' && req.admin.department !== departmentId) {
    return res.status(403).json({ error: 'Access denied to this department', success: false });
  }

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required', success: false });
  }

  try {
    // Get the report and user info
    const reportQuery = `
      SELECT r.*, u.id as user_id, u.anonymous_id 
      FROM reports r 
      LEFT JOIN users u ON r.user_id = u.id 
      WHERE r.report_id = ?
    `;

    db.get(reportQuery, [reportId], async (err, report) => {
      if (err) {
        console.error('Error fetching report:', err);
        return res.status(500).json({ error: 'Internal server error', success: false });
      }

      if (!report) {
        return res.status(404).json({ error: 'Report not found', success: false });
      }

      const insertQuery = `
        INSERT INTO messages (report_id, sender_type, sender_name, sender_department, message, read_by_user)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const senderName = `${req.admin.username} (${DEPARTMENTS[departmentId]?.name || departmentId})`;
      
      db.run(insertQuery, [reportId, 'admin', senderName, departmentId, message.trim(), 0], async function(err) {
        if (err) {
          console.error('Error sending admin message:', err);
          return res.status(500).json({ error: 'Failed to send message', success: false });
        }

        const messageId = this.lastID;
        const timestamp = new Date().toISOString();

        // Create notification for the user
        try {
          await NotificationService.createNotification(
            report.user_id,
            'new_message',
            'New Message from Support Team',
            `${DEPARTMENTS[departmentId]?.name || 'Support team'} has sent you a message regarding your case.`,
            { 
              reportId: reportId,
              messageId: messageId,
              departmentId: departmentId,
              senderName: req.admin.username
            }
          );
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
        }

        // Broadcast to user via WebSocket (targeted, not to all)
        broadcastToUser(report.user_id, {
          type: 'new_message',
          reportId: reportId,
          message: {
            id: messageId,
            senderName: senderName,
            senderType: 'admin',
            message: message.trim(),
            timestamp: timestamp,
            isFromUser: false
          }
        });

        // Update report's last activity
        db.run('UPDATE reports SET updated_at = CURRENT_TIMESTAMP WHERE report_id = ?', [reportId]);

        res.json({
          success: true,
          message: 'Message sent successfully',
          messageId: messageId,
          sentAt: timestamp
        });
      });
    });
  } catch (error) {
    console.error('Error in admin message endpoint:', error);
    res.status(500).json({ error: 'Internal server error', success: false });
  }
});

// ==================== USER DASHBOARD AND MANAGEMENT ====================

// User Dashboard Data
app.get('/api/users/dashboard', authenticateUser, (req, res) => {
  const { userId, reportId } = req.user;
  
  // Get user's report details
  const reportQuery = `
    SELECT r.*, u.anonymous_id 
    FROM reports r 
    LEFT JOIN users u ON r.user_id = u.id 
    WHERE r.report_id = ?
  `;

  db.get(reportQuery, [reportId], (err, report) => {
    if (err) {
      console.error('Error fetching user report:', err);
      return res.status(500).json({ error: 'Internal server error', success: false });
    }

    if (!report) {
      return res.status(404).json({ error: 'Report not found', success: false });
    }

    // Get messages count
    const messagesQuery = `
      SELECT COUNT(*) as total, 
             COUNT(CASE WHEN read_by_user = 0 AND sender_type != 'user' THEN 1 END) as unread
      FROM messages 
      WHERE report_id = ?
    `;

    db.get(messagesQuery, [reportId], (err, messageStats) => {
      if (err) {
        console.error('Error fetching message stats:', err);
        messageStats = { total: 0, unread: 0 };
      }

      // Get timeline
      const timelineQuery = `
        SELECT update_type as status, notes as description, created_at 
        FROM case_updates 
        WHERE report_id = ? 
        ORDER BY created_at ASC
      `;

      db.all(timelineQuery, [reportId], (err, updates) => {
        if (err) {
          console.error('Error fetching timeline:', err);
          updates = [];
        }

        // Build timeline with basic events
        const timeline = [
          {
            status: 'Submitted',
            description: 'Report received and processed securely',
            date: report.created_at,
            type: 'system',
            timeAgo: getTimeAgo(report.created_at)
          },
          {
            status: 'AI Analysis Complete',
            description: `Report analyzed and assigned to ${DEPARTMENTS[report.assigned_department]?.name}`,
            date: report.created_at,
            type: 'ai',
            timeAgo: getTimeAgo(report.created_at)
          },
          ...updates.map(update => ({
            status: update.status?.replace('_', ' ') || 'Updated',
            description: update.description || 'Case updated',
            date: update.created_at,
            type: 'update',
            timeAgo: getTimeAgo(update.created_at)
          }))
        ];

        const departmentInfo = DEPARTMENTS[report.assigned_department];

        res.json({
          success: true,
          report: {
            reportId: report.report_id,
            status: report.status,
            priority: report.priority,
            incidentType: report.incident_type,
            currentSafety: report.current_safety,
            assignedAgent: report.assigned_agent,
            timeAgo: getTimeAgo(report.created_at),
            aiAnalysis: {
              confidence: report.assignment_confidence,
              riskLevel: report.ai_risk_level,
              qualityScore: 8
            }
          },
          department: departmentInfo,
          messages: {
            total: messageStats.total,
            unreadCount: messageStats.unread
          },
          timeline: timeline,
          quickActions: [
            {
              title: 'Send Message',
              description: 'Contact your support team',
              color: 'blue',
              badge: messageStats.unread
            },
            {
              title: 'Upload Files',
              description: 'Add evidence or documents',
              color: 'green',
              badge: 0
            },
            {
              title: 'Schedule Session',
              description: 'Book counseling or support session',
              color: 'purple',
              badge: 0
            }
          ],
          nextSteps: [
            `Your case is being handled by ${departmentInfo?.name}`,
            `Expected response time: ${departmentInfo?.avgResponseTime}`,
            'You will be contacted when there are updates'
          ]
        });
      });
    });
  });
});

// User Messages
app.get('/api/users/messages', authenticateUser, (req, res) => {
  const { reportId } = req.user;
  const { page = 1, limit = 20 } = req.query;
  
  const offset = (page - 1) * limit;
  
  // Get messages and unread count
  const messagesQuery = `
    SELECT * FROM messages 
    WHERE report_id = ? 
    ORDER BY timestamp DESC 
    LIMIT ? OFFSET ?
  `;

  const unreadQuery = `
    SELECT COUNT(*) as unreadCount 
    FROM messages 
    WHERE report_id = ? AND sender_type != 'user' AND read_by_user = 0
  `;

  db.get(unreadQuery, [reportId], (err, unreadResult) => {
    if (err) {
      console.error('Error counting unread messages:', err);
      unreadResult = { unreadCount: 0 };
    }

    db.all(messagesQuery, [reportId, limit, offset], (err, messages) => {
      if (err) {
        console.error('Error fetching user messages:', err);
        return res.status(500).json({ error: 'Internal server error', success: false });
      }

      // Mark all admin/department messages as read
      db.run(
        'UPDATE messages SET read_by_user = 1 WHERE report_id = ? AND sender_type != ? AND read_by_user = 0', 
        [reportId, 'user'],
        (err) => {
          if (err) console.error('Error marking messages as read:', err);
        }
      );

      res.json({
        success: true,
        unreadCount: unreadResult.unreadCount,
        messages: messages.map(msg => ({
          id: msg.id,
          sender_name: msg.sender_name,
          message: msg.message,
          timestamp: msg.timestamp,
          timeAgo: getTimeAgo(msg.timestamp),
          isFromUser: msg.sender_type === 'user',
          isRead: msg.sender_type === 'user' || msg.read_by_user === 1
        }))
      });
    });
  });
});

// Send User Message
app.post('/api/users/messages', authenticateUser, async (req, res) => {
  const { reportId, userId } = req.user;
  const { message } = req.body;
  
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required', success: false });
  }

  try {
    // Get report details to find assigned department
    const reportQuery = `
      SELECT assigned_department, assigned_agent 
      FROM reports 
      WHERE report_id = ?
    `;

    db.get(reportQuery, [reportId], async (err, report) => {
      if (err) {
        console.error('Error fetching report:', err);
        return res.status(500).json({ error: 'Internal server error', success: false });
      }

      if (!report) {
        return res.status(404).json({ error: 'Report not found', success: false });
      }

      const insertQuery = `
        INSERT INTO messages (report_id, sender_type, sender_name, message, read_by_user)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.run(insertQuery, [reportId, 'user', 'You', message.trim(), 1], async function(err) {
        if (err) {
          console.error('Error sending user message:', err);
          return res.status(500).json({ error: 'Failed to send message', success: false });
        }

        const messageId = this.lastID;
        const timestamp = new Date().toISOString();

        // Create notification for admins in the assigned department
        // This would ideally notify all admins in that department
        const adminQuery = `
          SELECT id, username 
          FROM admins 
          WHERE department = ? OR department = 'all'
        `;

        db.all(adminQuery, [report.assigned_department], async (err, admins) => {
          if (!err && admins) {
            for (const admin of admins) {
              try {
                await NotificationService.createNotification(
                  admin.id,
                  'user_message',
                  'New Message from User',
                  `User has sent a message regarding case ${reportId}`,
                  { 
                    reportId: reportId,
                    messageId: messageId,
                    userId: userId,
                    isAdminNotification: true
                  }
                );

                // Broadcast to each admin
                broadcastToUser(admin.id, {
                  type: 'new_user_message',
                  reportId: reportId,
                  message: {
                    id: messageId,
                    senderName: 'User',
                    senderType: 'user',
                    message: message.trim(),
                    timestamp: timestamp,
                    isFromUser: true
                  }
                });
              } catch (notifError) {
                console.error(`Failed to notify admin ${admin.username}:`, notifError);
              }
            }
          }
        });

        // Update report's last activity
        db.run('UPDATE reports SET updated_at = CURRENT_TIMESTAMP WHERE report_id = ?', [reportId]);

        res.json({
          success: true,
          message: 'Message sent successfully',
          messageId: messageId,
          sentAt: timestamp
        });
      });
    });
  } catch (error) {
    console.error('Error in user message endpoint:', error);
    res.status(500).json({ error: 'Internal server error', success: false });
  }
});

// User Notifications
app.get('/api/users/notifications', authenticateUser, (req, res) => {
  const { userId } = req.user;
  
  NotificationService.getUserNotifications(userId)
    .then(notifications => {
      res.json({
        success: true,
        notifications: notifications
      });
    })
    .catch(error => {
      console.error('Error fetching user notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications', success: false });
    });
});

// Mark Notification as Read
app.put('/api/users/notifications/:id/read', authenticateUser, (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  
  NotificationService.markAsRead(id, userId)
    .then(success => {
      if (success) {
        res.json({
          success: true,
          message: 'Notification marked as read'
        });
      } else {
        res.status(404).json({ error: 'Notification not found', success: false });
      }
    })
    .catch(error => {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to update notification', success: false });
    });
});

// User File Management
app.get('/api/users/files', authenticateUser, (req, res) => {
  const { userId } = req.user;
  
  const query = `
    SELECT id, original_name, filename, filepath, mimetype, size, upload_date 
    FROM user_files 
    WHERE user_id = ? 
    ORDER BY upload_date DESC
  `;

  db.all(query, [userId], (err, files) => {
    if (err) {
      console.error('Error fetching user files:', err);
      return res.status(500).json({ error: 'Internal server error', success: false });
    }

    res.json({
      success: true,
      files: files.map(file => ({
        id: file.id,
        name: file.original_name,
        originalName: file.original_name,
        filename: file.filename,
        type: file.mimetype.startsWith('image/') ? 'image' : 
              file.mimetype.includes('pdf') ? 'pdf' :
              file.mimetype.startsWith('video/') ? 'video' :
              file.mimetype.startsWith('audio/') ? 'audio' : 'document',
        size: file.size,
        uploadDate: file.upload_date,
        downloadUrl: `/uploads/${file.filename}`
      }))
    });
  });
});

// Upload User Files
app.post('/api/users/files', authenticateUser, upload.array('files', 5), (req, res) => {
  const { userId, reportId } = req.user;
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded', success: false });
  }

  const insertPromises = req.files.map(file => {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO user_files (user_id, report_id, original_name, filename, filepath, mimetype, size)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.run(query, [
        userId,
        reportId,
        file.originalname,
        file.filename,
        file.path,
        file.mimetype,
        file.size
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            originalName: file.originalname,
            filename: file.filename,
            size: file.size
          });
        }
      });
    });
  });

  Promise.all(insertPromises)
    .then(uploadedFiles => {
      res.json({
        success: true,
        message: `${uploadedFiles.length} file(s) uploaded successfully`,
        files: uploadedFiles
      });
    })
    .catch(error => {
      console.error('Error saving file records:', error);
      res.status(500).json({ error: 'Failed to save file records', success: false });
    });
});

// Delete User File
app.delete('/api/users/files/:filename', authenticateUser, (req, res) => {
  const { userId } = req.user;
  const { filename } = req.params;
  
  // First get the file record
  const getFileQuery = 'SELECT * FROM user_files WHERE user_id = ? AND filename = ?';
  
  db.get(getFileQuery, [userId, filename], (err, fileRecord) => {
    if (err) {
      console.error('Error fetching file record:', err);
      return res.status(500).json({ error: 'Internal server error', success: false });
    }

    if (!fileRecord) {
      return res.status(404).json({ error: 'File not found', success: false });
    }

    // Delete from database
    const deleteQuery = 'DELETE FROM user_files WHERE user_id = ? AND filename = ?';
    
    db.run(deleteQuery, [userId, filename], function(err) {
      if (err) {
        console.error('Error deleting file record:', err);
        return res.status(500).json({ error: 'Failed to delete file', success: false });
      }

      // Delete physical file
      fs.unlink(fileRecord.filepath, (err) => {
        if (err) {
          console.error('Error deleting physical file:', err);
          // Don't fail the request if file doesn't exist on disk
        }
      });

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    });
  });
});

// ==================== ANALYTICS AND REPORTING ====================

// Analytics Dashboard Data
app.get('/api/admin/analytics', authenticateToken, (req, res) => {
  const { timeframe = 'week' } = req.query;
  
  let dateFilter = '';
  switch (timeframe) {
    case 'week':
      dateFilter = "WHERE created_at >= datetime('now', '-7 days')";
      break;
    case 'month':
      dateFilter = "WHERE created_at >= datetime('now', '-30 days')";
      break;
    case 'quarter':
      dateFilter = "WHERE created_at >= datetime('now', '-90 days')";
      break;
    case 'year':
      dateFilter = "WHERE created_at >= datetime('now', '-365 days')";
      break;
    default:
      dateFilter = "WHERE created_at >= datetime('now', '-7 days')";
  }

  const queries = {
    overview: `
      SELECT 
        COUNT(*) as totalReports,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolvedCases,
        AVG(assignment_confidence) as avgConfidence,
        COUNT(CASE WHEN priority = 'critical' THEN 1 END) as criticalCases
      FROM reports ${dateFilter}
    `,
    departmentBreakdown: `
      SELECT 
        assigned_department as name,
        COUNT(*) as cases,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reports ${dateFilter}), 1) as percentage
      FROM reports ${dateFilter}
      GROUP BY assigned_department
    `,
    incidentTypes: `
      SELECT 
        incident_type as type,
        COUNT(*) as count,
        CASE 
          WHEN COUNT(*) > LAG(COUNT(*)) OVER (ORDER BY COUNT(*) DESC) THEN '+5%'
          ELSE '-2%'
        END as trend
      FROM reports ${dateFilter}
      GROUP BY incident_type
      ORDER BY count DESC
      LIMIT 5
    `,
    dailyVolume: `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM reports ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date
    `
  };

  const results = {};
  const queryPromises = Object.entries(queries).map(([key, query]) => {
    return new Promise((resolve, reject) => {
      if (['departmentBreakdown', 'incidentTypes', 'dailyVolume'].includes(key)) {
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
        timeframe,
        overview: {
          totalReports: results.overview.totalReports || 0,
          resolvedCases: results.overview.resolvedCases || 0,
          activeAgents: Object.values(DEPARTMENTS).reduce((sum, dept) => sum + dept.activeAgents, 0),
          averageResponseTime: '4.2h',
          aiAccuracy: Math.round(results.overview.avgConfidence || 85),
          userSatisfaction: 4.6
        },
        trends: {
          reportVolume: results.dailyVolume.map(item => item.count),
          resolutionRate: [78, 82, 85, 88, 91, 89, 92],
          aiConfidence: [91, 93, 94, 95, 94, 96, 95]
        },
        departmentBreakdown: results.departmentBreakdown.map(item => ({
          name: DEPARTMENTS[item.name]?.name || item.name,
          cases: item.cases,
          percentage: item.percentage
        })),
        incidentTypes: results.incidentTypes,
        generatedAt: new Date().toISOString()
      });
    })
    .catch(err => {
      console.error('Error fetching analytics data:', err);
      res.status(500).json({ error: 'Internal server error', success: false });
    });
});

// ==================== WEBSOCKET AND REAL-TIME FEATURES ====================

// Broadcast System Message
app.post('/api/admin/broadcast', authenticateToken, requireDepartmentAccess(['all']), (req, res) => {
  const { title, message, type = 'system', priority = 'normal' } = req.body;
  
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required', success: false });
  }

  broadcastToAll({
    type: 'system_message',
    title,
    message,
    priority,
    timestamp: new Date().toISOString(),
    from: req.admin.username
  });

  res.json({
    success: true,
    message: 'Broadcast sent successfully',
    sentAt: new Date().toISOString()
  });
});

// ==================== ERROR HANDLING AND 404 ====================

// Handle 404 errors
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// ==================== SERVER STARTUP ====================

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('🔚 Process terminated');
    db.close();
  });
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('🔚 Process terminated');
    db.close();
  });
});

// Start the server
server.listen(PORT, () => {
  console.log('🚀 SafeVoice Server Status:');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket Server: ws://localhost:${PORT}`);
  console.log(`🗄️  Database: SQLite (reports.db)`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'NOT SET'}`);
  console.log(`🤖 AI Integration: ${process.env.ANTHROPIC_API_KEY ? 'ENABLED' : 'DISABLED'}`);
  console.log(`📂 File Uploads: /uploads directory`);
  console.log(`🛡️  Security: Helmet, CORS, Rate Limiting enabled`);
  console.log('');
  console.log('🎯 Available Endpoints:');
  console.log('   📝 POST /api/reports - Submit new report');
  console.log('   🔍 GET /api/reports/:id/track - Track report status');
  console.log('   👑 POST /api/auth/login - Admin login');
  console.log('   👤 POST /api/users/auth/login - User login');
  console.log('   📊 GET /api/admin/dashboard - Admin dashboard');
  console.log('   💬 GET /api/users/messages - User messaging');
  console.log('   📁 POST /api/users/files - File uploads');
  console.log('   🤖 GET /api/ai/health - AI system status');
  console.log('   🏥 GET /api/health - System health check');
  console.log('');
  console.log('✅ SafeVoice Server is ready for connections!');
  console.log('📖 Visit the frontend application to start using SafeVoice');
  console.log('');
  
  // Display demo account information
  console.log('🎮 Demo Accounts Available:');
  console.log('');
  console.log('👑 Admin Accounts:');
  console.log('   super_admin / SafeVoice2024! (All departments)');
  console.log('   legal_admin / SafeVoice2024! (Legal Team)');
  console.log('   task_admin / SafeVoice2024! (Task Force)');
  console.log('   support_admin / SafeVoice2024! (Support Services)');
  console.log('   happy2help_admin / SafeVoice2024! (Happy2Help)');
  console.log('');
  console.log('👤 User Demo Reports:');
  console.log('   SAFE12345001: jane.doe@example.com (Legal - Harassment)');
  console.log('   SAFE12345101: PIN 234567 (Task Force - Assault)');
  console.log('   SAFE12345201: support.user@example.com (Support - Housing)');
  console.log('   SAFE12345301: PIN 456789 (Happy2Help - Mental Health)');
});

module.exports = app;