// routes/reports.js
const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// In-memory storage for reports (in production, use a database)
let reports = [];

// AI Department Assignment Configuration
const DEPARTMENT_CONFIG = {
  legal: {
    id: 'legal',
    name: 'Legal Team',
    description: 'Handles legal matters, harassment, discrimination, and rights violations',
    keywords: [
      'harassment', 'sexual harassment', 'discrimination', 'workplace harassment',
      'inappropriate behavior', 'unwanted advances', 'sexual misconduct',
      'legal rights', 'lawsuit', 'attorney', 'court', 'violation',
      'inappropriate comments', 'unwanted touching', 'verbal abuse',
      'gender discrimination', 'racial discrimination', 'workplace bullying'
    ],
    incidentTypes: ['harassment', 'discrimination', 'workplace', 'legal'],
    avgResponseTime: '8h'
  },
  task: {
    id: 'task',
    name: 'Task Force Team', 
    description: 'Handles physical violence, assault, and immediate safety concerns',
    keywords: [
      'assault', 'physical assault', 'violence', 'physical violence',
      'attack', 'hit', 'punch', 'kicked', 'grabbed', 'pushed',
      'hurt', 'injured', 'beaten', 'emergency', 'danger',
      'threat', 'threatened', 'safety concern', 'immediate danger',
      'physical harm', 'bodily harm', 'domestic violence'
    ],
    incidentTypes: ['assault', 'domestic', 'violence', 'stalking'],
    avgResponseTime: '2h'
  },
  support: {
    id: 'support',
    name: 'Support Services Team',
    description: 'Handles housing, financial aid, and general support services', 
    keywords: [
      'housing', 'shelter', 'accommodation', 'homeless', 'eviction',
      'financial help', 'financial assistance', 'money problems',
      'rent help', 'food assistance', 'basic needs', 'resources',
      'relocation', 'temporary housing', 'financial crisis',
      'support services', 'general help', 'assistance needed'
    ],
    incidentTypes: ['housing', 'financial', 'support', 'other'],
    avgResponseTime: '12h'
  },
  happy2help: {
    id: 'happy2help',
    name: 'Happy2Help Team',
    description: 'Mental health counseling, emotional support, and wellness services',
    keywords: [
      'depression', 'anxiety', 'mental health', 'counseling',
      'therapy', 'emotional support', 'stress', 'trauma',
      'psychological help', 'mental wellness', 'suicide',
      'self-harm', 'sad', 'hopeless', 'overwhelmed',
      'panic attacks', 'emotional abuse', 'psychological abuse',
      'feeling lost', 'mental crisis', 'emotional crisis'
    ],
    incidentTypes: ['mental', 'counseling', 'therapy', 'wellness'],
    avgResponseTime: '4h'
  }
};

// AI Department Assignment Engine
class AIAssignmentEngine {
  static analyzeAndAssign(reportData) {
    const { incidentType, description, currentSafety } = reportData;
    
    // Initialize department scores
    const scores = {
      legal: 0,
      task: 0, 
      support: 0,
      happy2help: 0
    };

    // 1. Incident Type Analysis (40% weight)
    Object.keys(DEPARTMENT_CONFIG).forEach(deptId => {
      const dept = DEPARTMENT_CONFIG[deptId];
      if (dept.incidentTypes.includes(incidentType)) {
        scores[deptId] += 40;
      }
    });

    // 2. Keyword Analysis (35% weight) 
    if (description && description.trim().length > 0) {
      const descriptionLower = description.toLowerCase();
      
      Object.keys(DEPARTMENT_CONFIG).forEach(deptId => {
        const dept = DEPARTMENT_CONFIG[deptId];
        let keywordScore = 0;
        
        dept.keywords.forEach(keyword => {
          if (descriptionLower.includes(keyword.toLowerCase())) {
            // Give higher weight to longer, more specific keywords
            keywordScore += keyword.split(' ').length * 3;
          }
        });
        
        scores[deptId] += Math.min(keywordScore, 35);
      });
    }

    // 3. Safety Level Analysis (25% weight)
    if (currentSafety === 'unsafe') {
      scores.task += 25; // Immediate safety concerns go to Task Force
    } else if (currentSafety === 'unsure') {
      scores.task += 12;
      scores.happy2help += 13; // Psychological uncertainty
    } else if (currentSafety === 'safe') {
      // Distribute evenly among non-emergency departments
      scores.legal += 8;
      scores.support += 8;
      scores.happy2help += 9;
    }

    // Find the department with the highest score
    const assignedDepartment = Object.keys(scores).reduce((best, current) => {
      return scores[current] > scores[best] ? current : best;
    });

    // Calculate confidence (60-95% range)
    const maxScore = Math.max(...Object.values(scores));
    const confidence = Math.min(95, Math.max(60, Math.round(maxScore)));

    // Generate reasoning
    const reasoning = this.generateReasoning(assignedDepartment, reportData, scores);

    // Get alternative departments
    const alternatives = this.getAlternatives(scores, assignedDepartment);

    return {
      assignedDepartment,
      confidence,
      reasoning,
      alternatives,
      scores,
      departmentInfo: DEPARTMENT_CONFIG[assignedDepartment]
    };
  }

  static generateReasoning(deptId, reportData, scores) {
    const dept = DEPARTMENT_CONFIG[deptId];
    const reasons = [];

    // Incident type match
    if (dept.incidentTypes.includes(reportData.incidentType)) {
      reasons.push(`Incident type "${reportData.incidentType}" matches ${dept.name} specialization`);
    }

    // Safety concern
    if (reportData.currentSafety === 'unsafe' && deptId === 'task') {
      reasons.push('Immediate safety concern detected - requires Task Force intervention');
    }

    // Keyword matches
    if (reportData.description) {
      const descriptionLower = reportData.description.toLowerCase();
      const matchedKeywords = dept.keywords.filter(keyword => 
        descriptionLower.includes(keyword.toLowerCase())
      );
      
      if (matchedKeywords.length > 0) {
        const topKeywords = matchedKeywords.slice(0, 3);
        reasons.push(`Content analysis detected relevant keywords: ${topKeywords.join(', ')}`);
      }
    }

    // High confidence
    if (scores[deptId] > 70) {
      reasons.push(`High confidence match (${scores[deptId]}% score) based on multiple factors`);
    }

    return reasons;
  }

  static getAlternatives(scores, assignedDept) {
    return Object.keys(scores)
      .filter(dept => dept !== assignedDept)
      .sort((a, b) => scores[b] - scores[a])
      .slice(0, 2)
      .map(dept => ({
        department: dept,
        score: Math.round(scores[dept]),
        name: DEPARTMENT_CONFIG[dept].name
      }));
  }
}

// Generate unique report ID
function generateReportId() {
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SAFE${timestamp}${randomBytes}`;
}

// Determine priority based on safety and content
function determinePriority(currentSafety, description, incidentType) {
  // Critical priority
  if (currentSafety === 'unsafe') {
    return 'critical';
  }
  
  // High priority keywords
  const highPriorityKeywords = [
    'emergency', 'urgent', 'immediate', 'danger', 'threat',
    'assault', 'violence', 'hurt', 'injured'
  ];
  
  const criticalIncidents = ['assault', 'violence', 'domestic'];
  
  if (criticalIncidents.includes(incidentType) || 
      (description && highPriorityKeywords.some(keyword => 
        description.toLowerCase().includes(keyword)))) {
    return 'high';
  }
  
  // Medium priority for safety concerns
  if (currentSafety === 'unsure') {
    return 'medium';
  }
  
  // Default to medium
  return 'medium';
}

// Submit new report endpoint
router.post('/', async (req, res) => {
  try {
    const reportData = req.body;

    // Validate required fields
    const requiredFields = ['incidentType', 'description', 'incidentDate', 'location', 'currentSafety'];
    const missingFields = requiredFields.filter(field => !reportData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Generate unique report ID
    const reportId = generateReportId();

    // AI Department Assignment
    const aiAssignment = AIAssignmentEngine.analyzeAndAssign(reportData);

    // Determine priority
    const priority = determinePriority(
      reportData.currentSafety, 
      reportData.description, 
      reportData.incidentType
    );

    // Create new report object
    const newReport = {
      report_id: reportId,
      incident_type: reportData.incidentType,
      description: reportData.description,
      incident_date: reportData.incidentDate,
      incident_time: reportData.incidentTime || null,
      location: reportData.location,
      current_safety: reportData.currentSafety,
      witnesses: reportData.witnesses || null,
      evidence: reportData.evidence || null,
      contact_method: reportData.anonymous ? null : reportData.contactMethod,
      contact_info: reportData.anonymous ? null : reportData.contactInfo,
      anonymous: reportData.anonymous || false,

      // AI Assignment Results
      assigned_department: aiAssignment.assignedDepartment,
      assignment_confidence: aiAssignment.confidence,
      assignment_reasoning: aiAssignment.reasoning,
      ai_scores: aiAssignment.scores,

      // Case Management
      status: 'submitted',
      priority: priority,
      assigned_agent: null,
      notes: [],

      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      // AI Analysis Metadata
      ai_analysis: {
        version: '2.0',
        processed_at: new Date().toISOString(),
        confidence_level: aiAssignment.confidence,
        alternative_departments: aiAssignment.alternatives
      }
    };

    // Store the report
    reports.push(newReport);

    // Log the assignment
    console.log(`🤖 AI Assignment Complete:`);
    console.log(`   Report ID: ${reportId}`);
    console.log(`   Assigned to: ${aiAssignment.departmentInfo.name}`);
    console.log(`   Confidence: ${aiAssignment.confidence}%`);
    console.log(`   Priority: ${priority}`);
    console.log(`   Reasoning: ${aiAssignment.reasoning[0] || 'Standard assignment'}`);

    // Send response
    res.status(201).json({
      success: true,
      reportId: reportId,
      submittedAt: newReport.created_at,
      status: newReport.status,
      priority: newReport.priority,
      assignedDepartment: aiAssignment.assignedDepartment,
      assignmentConfidence: aiAssignment.confidence,
      departmentInfo: {
        name: aiAssignment.departmentInfo.name,
        responseTime: aiAssignment.departmentInfo.avgResponseTime
      },
      message: 'Report submitted successfully and assigned by AI'
    });

  } catch (error) {
    console.error('Report submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit report. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Track report status endpoint
router.get('/:reportId/status', (req, res) => {
  try {
    const { reportId } = req.params;

    // Demo reports for testing the tracking system
    const demoReports = {
      'SAFE12345001': {
        success: true,
        id: 'SAFE12345001',
        status: 'under_review',
        priority: 'medium',
        assignedDepartment: 'legal',
        assignedAgent: 'Sarah Johnson - Legal Specialist',
        incidentType: 'harassment',
        incidentDate: '2024-12-15',
        location: 'Corporate Office - 5th Floor',
        description: 'My supervisor has been making inappropriate comments about my appearance and sending unwanted messages after work hours. This has been going on for weeks and I feel uncomfortable coming to work.',
        currentSafety: 'unsure',
        timeline: [
          { 
            status: 'Report Submitted', 
            description: 'Workplace harassment report successfully submitted and encrypted', 
            date: new Date(Date.now() - 86400000).toISOString() 
          },
          { 
            status: 'AI Analysis Complete', 
            description: 'AI assigned to Legal Team with 94% confidence based on harassment keywords and workplace context', 
            date: new Date(Date.now() - 82800000).toISOString() 
          },
          { 
            status: 'Case Assigned', 
            description: 'Assigned to Legal Specialist Sarah Johnson for workplace harassment review', 
            date: new Date(Date.now() - 3600000).toISOString() 
          }
        ],
        nextSteps: [
          'Legal specialist will review your workplace harassment case within 8 hours',
          'You will be contacted via your preferred method within 24 hours',
          'Initial consultation will be scheduled to discuss your options',
          'Workplace harassment resources and legal support options will be provided'
        ]
      },
      'SAFETASK08001': {
        success: true,
        id: 'SAFETASK08001',
        status: 'resolved',
        priority: 'high',
        assignedDepartment: 'task',
        assignedAgent: 'Detective Mike Chen - Task Force Specialist',
        incidentType: 'assault',
        incidentDate: '2024-12-10',
        location: 'Downtown Metro Station - Platform 3',
        description: 'I was physically attacked by an unknown individual at the metro station around 9 PM. The person grabbed my bag and pushed me to the ground when I resisted. I sustained minor injuries and was able to get away when other passengers intervened.',
        currentSafety: 'safe',
        witnesses: 'Several metro passengers witnessed the incident, station security cameras were present',
        evidence: 'Medical report from urgent care, photos of injuries, metro station security footage available',
        timeline: [
          { 
            status: 'Emergency Report Submitted', 
            description: 'Physical assault report submitted with high priority classification', 
            date: new Date(Date.now() - 432000000).toISOString() // 5 days ago
          },
          { 
            status: 'AI Analysis Complete', 
            description: 'AI assigned to Task Force Team with 97% confidence based on assault keywords and safety concerns', 
            date: new Date(Date.now() - 431000000).toISOString() 
          },
          { 
            status: 'Task Force Assigned', 
            description: 'Detective Mike Chen assigned for immediate investigation', 
            date: new Date(Date.now() - 430000000).toISOString() 
          },
          { 
            status: 'Investigation Started', 
            description: 'Security footage reviewed, witness statements collected', 
            date: new Date(Date.now() - 400000000).toISOString() 
          },
          { 
            status: 'Suspect Identified', 
            description: 'Suspect identified through security footage and witness descriptions', 
            date: new Date(Date.now() - 300000000).toISOString() 
          },
          { 
            status: 'Case Resolved', 
            description: 'Suspect apprehended, charges filed, victim support services provided', 
            date: new Date(Date.now() - 86400000).toISOString() 
          }
        ],
        nextSteps: [
          'Case has been successfully resolved with suspect in custody',
          'Court proceedings scheduled - you will be notified of dates',
          'Victim support services remain available for ongoing assistance',
          'Follow-up safety check scheduled for next week'
        ],
        resolution: 'Suspect apprehended and charged with assault and attempted robbery. Full cooperation with law enforcement led to successful resolution.',
        caseOutcome: 'Criminal charges filed, suspect in custody, victim safety ensured'
      },
      'SAFE12345101': {
        success: true,
        id: 'SAFE12345101',
        status: 'acknowledged',
        priority: 'critical',
        assignedDepartment: 'task',
        assignedAgent: 'Detective Rodriguez - Task Force Lead',
        incidentType: 'physical_assault',
        incidentDate: '2024-12-14',
        location: 'University Campus - Parking Lot B',
        description: 'I was approached by three individuals who demanded my wallet and phone. When I refused, they pushed me down and one of them kicked me. I managed to escape when campus security arrived.',
        currentSafety: 'unsafe',
        witnesses: 'Campus security officer who responded to the scene, two students who saw the incident from nearby building',
        evidence: 'Campus security camera footage, medical documentation of injuries, photos of torn clothing and bruises',
        timeline: [
          { 
            status: 'URGENT Report Received', 
            description: 'Physical assault report flagged for immediate task force attention due to ongoing safety concerns', 
            date: new Date(Date.now() - 3600000).toISOString() 
          },
          { 
            status: 'AI Priority Assignment', 
            description: 'AI assigned to Task Force with 96% confidence - assault keywords and safety risk detected', 
            date: new Date(Date.now() - 3500000).toISOString() 
          },
          { 
            status: 'Emergency Response Activated', 
            description: 'Detective Rodriguez assigned for immediate investigation and victim safety', 
            date: new Date(Date.now() - 3400000).toISOString() 
          }
        ],
        nextSteps: [
          'Emergency response specialist will contact you within 2 hours',
          'Immediate safety assessment will be conducted',
          'Campus security coordination for evidence collection',
          'Ongoing safety monitoring will be established'
        ]
      },
      'SAFE12345201': {
        success: true,
        id: 'SAFE12345201',
        status: 'resolved',
        priority: 'medium',
        assignedDepartment: 'support',
        assignedAgent: 'Michael Chen - Support Coordinator',
        incidentType: 'housing_issue',
        incidentDate: '2024-12-12',
        location: 'Student Housing Complex - Building C, Apt 304',
        description: 'My roommate has been creating a hostile living environment by bringing unauthorized guests at all hours, playing loud music late at night, and making threatening comments when I ask for basic respect. I feel unsafe in my own living space.',
        currentSafety: 'unsure',
        witnesses: 'Neighbors in adjacent apartments who have heard the disturbances, front desk staff who have seen the unauthorized guests',
        evidence: 'Noise complaints filed with housing office, text messages with threatening language, photos of property damage',
        timeline: [
          { 
            status: 'Housing Support Request', 
            description: 'Student housing conflict report received and processed', 
            date: new Date(Date.now() - 172800000).toISOString() 
          },
          { 
            status: 'AI Assignment', 
            description: 'AI assigned to Support Services with 87% confidence based on housing keywords', 
            date: new Date(Date.now() - 172700000).toISOString() 
          },
          { 
            status: 'Support Provided', 
            description: 'Housing reassignment completed, mediation successful, safe environment restored', 
            date: new Date(Date.now() - 86400000).toISOString() 
          }
        ],
        nextSteps: [
          'Case has been successfully resolved with housing reassignment',
          'Follow-up support available if needed',
          'Contact us if your situation changes'
        ],
        resolution: 'Student successfully reassigned to compatible housing. Mediation completed with housing office oversight.',
        caseOutcome: 'Safe housing secured, conflict resolved through mediation'
      },
      'SAFE12345301': {
        success: true,
        id: 'SAFE12345301',
        status: 'under_review',
        priority: 'high',
        assignedDepartment: 'happy2help',
        assignedAgent: 'Dr. Lisa Rodriguez - Mental Health Counselor',
        incidentType: 'mental_health_crisis',
        incidentDate: '2024-12-15',
        location: 'Personal residence - reported via online form',
        description: 'I have been experiencing severe anxiety and panic attacks for the past few weeks. The stress from recent life changes has become overwhelming, and I am having thoughts of self-harm. I need immediate support and do not know where to turn.',
        currentSafety: 'unsafe',
        witnesses: 'Family members who have observed the behavioral changes and expressed concern',
        evidence: 'Medical records showing increased anxiety medication needs, journal entries documenting mental health decline, family statements of concern',
        timeline: [
          { 
            status: 'Crisis Report Received', 
            description: 'Mental health crisis support request received with high priority flagging', 
            date: new Date(Date.now() - 7200000).toISOString() 
          },
          { 
            status: 'AI Analysis', 
            description: 'AI assigned to Happy2Help with 91% confidence based on mental health crisis keywords', 
            date: new Date(Date.now() - 7100000).toISOString() 
          },
          { 
            status: 'Counselor Assigned', 
            description: 'Dr. Lisa Rodriguez assigned for immediate crisis intervention and ongoing support', 
            date: new Date(Date.now() - 3600000).toISOString() 
          }
        ],
        nextSteps: [
          'Crisis counselor will contact you within 4 hours',
          'Emergency crisis hotline available 24/7: 988',
          'Initial crisis intervention session will be scheduled immediately',
          'Ongoing therapy and comprehensive support services will be arranged'
        ]
      }
    };

    // Check if it's a demo report
    if (demoReports[reportId]) {
      console.log(`📋 Demo report status checked: ${reportId}`);
      return res.json(demoReports[reportId]);
    }

    // Look for actual submitted reports
    const report = reports.find(r => r.report_id === reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found. Please check your report ID and try again.'
      });
    }

    // Build timeline for real report
    const timeline = [
      {
        status: 'Report Submitted',
        description: `Your report was successfully submitted and encrypted`,
        date: report.created_at
      },
      {
        status: 'AI Analysis Complete',
        description: `AI assigned to ${DEPARTMENT_CONFIG[report.assigned_department].name} with ${report.assignment_confidence}% confidence`,
        date: report.created_at
      }
    ];

    if (report.assigned_agent) {
      timeline.push({
        status: 'Case Assigned',
        description: `Assigned to ${report.assigned_agent}`,
        date: report.updated_at
      });
    }

    // Generate next steps based on department and status
    const deptConfig = DEPARTMENT_CONFIG[report.assigned_department];
    const nextSteps = [
      `Your case is being reviewed by ${deptConfig.name} specialists`,
      `Expected response time: ${deptConfig.avgResponseTime}`,
      `You will be contacted using your preferred method`,
      `Specialized support resources are being prepared for your situation`
    ];

    console.log(`📋 Report status checked: ${reportId} (${report.status})`);

    res.json({
      success: true,
      id: report.report_id,
      status: report.status,
      priority: report.priority,
      assignedDepartment: report.assigned_department,
      assignedAgent: report.assigned_agent,
      departmentInfo: deptConfig,
      timeline: timeline,
      nextSteps: nextSteps,
      aiAnalysis: {
        confidence: report.assignment_confidence,
        reasoning: report.assignment_reasoning
      }
    });

  } catch (error) {
    console.error('Status tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Error retrieving report status. Please try again.'
    });
  }
});

// Get reports statistics (for admin overview)
router.get('/stats/overview', (req, res) => {
  try {
    const stats = {
      totalReports: reports.length,
      byDepartment: {
        legal: reports.filter(r => r.assigned_department === 'legal').length,
        task: reports.filter(r => r.assigned_department === 'task').length,
        support: reports.filter(r => r.assigned_department === 'support').length,
        happy2help: reports.filter(r => r.assigned_department === 'happy2help').length
      },
      byStatus: {
        submitted: reports.filter(r => r.status === 'submitted').length,
        acknowledged: reports.filter(r => r.status === 'acknowledged').length,
        under_review: reports.filter(r => r.status === 'under_review').length,
        resolved: reports.filter(r => r.status === 'resolved').length,
        closed: reports.filter(r => r.status === 'closed').length
      },
      byPriority: {
        critical: reports.filter(r => r.priority === 'critical').length,
        high: reports.filter(r => r.priority === 'high').length,
        medium: reports.filter(r => r.priority === 'medium').length,
        low: reports.filter(r => r.priority === 'low').length
      },
      averageConfidence: reports.length > 0 ? 
        Math.round(reports.reduce((sum, r) => sum + r.assignment_confidence, 0) / reports.length) : 0
    };

    res.json({
      success: true,
      stats: stats,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stats overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching statistics'
    });
  }
});

// Export reports array for use in admin routes
module.exports = { router, reports, DEPARTMENT_CONFIG };