import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { 
  Shield, User, Settings, MessageCircle, FileText, Calendar, 
  Bell, Upload, Download, Trash2, Eye, EyeOff, Search, Filter,
  AlertTriangle, Clock, CheckCircle, Users, BarChart3, Brain,
  Plus, Send, Phone, Video, MapPin, Camera, Mic, X, Check,
  RefreshCw, ChevronDown, ChevronRight, Edit, Star, Heart,
  Lock, Unlock, Mail, Key, Home, Building, CreditCard, HelpCircle,
  Zap, TrendingUp, Activity, Archive, BookOpen, Monitor, Globe,
  Copy, ExternalLink, Reply, Forward, Archive as ArchiveIcon,
  MoreHorizontal, ChevronLeft, ChevronRight as ChevronRightIcon,
  Loader2, Tag
} from 'lucide-react';

// Import modern UI styles
import './modern-ui.css';

// Import enhanced UI components
import EnhancedLandingPage from './components/EnhancedLandingPage';
import EnhancedDashboard from './components/EnhancedDashboard';
import DemoDashboard from './components/DemoDashboard';

// Import context
import AppContext from './contexts/AppContext';

// API Configuration
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001/api';

// Internationalization Support
const translations = {
  en: {
    // Navigation & General
    home: 'Home',
    dashboard: 'Dashboard',
    messages: 'Messages',
    reports: 'Reports',
    settings: 'Settings',
    logout: 'Logout',
    login: 'Login',
    language: 'Language',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    continue: 'Continue',
    back: 'Back',
    next: 'Next',
    
    // Landing Page
    landingTitle: 'Safe, Secure, AI-Powered Reporting',
    landingSubtitle: 'Submit incidents safely with our advanced AI system that intelligently routes your report to the right specialists for immediate, confidential support.',
    submitReport: 'Submit Anonymous Report',
    trackReport: 'Track Report',
    userPortal: 'User Portal',
    adminLogin: 'Admin Login',
    
    // Department Names
    legalTeam: 'Legal Team',
    taskForceTeam: 'Task Force Team',
    supportServicesTeam: 'Support Services Team',
    happy2helpTeam: 'Happy2Help Team',
    
    // Report Submission
    reportSubmission: 'Report Submission',
    incidentDetails: 'Incident Details',
    additionalInfo: 'Additional Information',
    reviewAnalysis: 'Review & AI Analysis',
    contactPreferences: 'Contact Preferences',
    tellUsWhatHappened: 'Tell Us What Happened',
    incidentType: 'Incident Type',
    incidentDate: 'Date of Incident',
    incidentTime: 'Time (if known)',
    location: 'Location',
    currentSafety: 'Current Safety Status',
    description: 'Description',
    witnesses: 'Witnesses',
    evidence: 'Evidence',
    contactMethod: 'Preferred Contact Method',
    anonymous: 'Submit this report anonymously',
    
    // Safety Status
    safe: 'Safe',
    unsure: 'Unsure',
    unsafe: 'Unsafe',
    
    // Report Status
    submitted: 'Submitted',
    acknowledged: 'Acknowledged',
    underReview: 'Under Review',
    resolved: 'Resolved',
    closed: 'Closed',
    
    // Priority Levels
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
    
    // Messages
    newMessage: 'New Message',
    sendMessage: 'Send Message',
    noMessages: 'No messages yet',
    messagesSentSecurely: 'All messages are encrypted and secure',
    
    // Notifications
    notifications: 'Notifications',
    markAllRead: 'Mark All Read',
    noNotifications: 'No notifications',
    
    // Admin Interface
    caseManagement: 'Case Management',
    departmentDashboard: 'Department Dashboard',
    analytics: 'Analytics',
    totalReports: 'Total Reports',
    activeAgents: 'Active Agents',
    avgResponse: 'Avg Response',
    aiAccuracy: 'AI Accuracy',
    
    // Errors & Success
    error: 'Error',
    success: 'Success',
    reportSubmittedSuccessfully: 'Report submitted successfully',
    loginFailed: 'Login failed',
    messageSent: 'Message sent successfully',
    fileUploaded: 'File uploaded successfully',
    
    // Time Formats
    justNow: 'Just now',
    minutesAgo: 'minutes ago',
    hoursAgo: 'hours ago',
    daysAgo: 'days ago',
    weeksAgo: 'weeks ago'
  },
  fr: {
    // Navigation & General
    home: 'Accueil',
    dashboard: 'Tableau de bord',
    messages: 'Messages',
    reports: 'Rapports',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    login: 'Connexion',
    language: 'Langue',
    loading: 'Chargement...',
    save: 'Enregistrer',
    cancel: 'Annuler',
    submit: 'Soumettre',
    continue: 'Continuer',
    back: 'Retour',
    next: 'Suivant',
    
    // Landing Page
    landingTitle: 'Signalement Sécurisé et Alimenté par IA',
    landingSubtitle: 'Signalez des incidents en toute sécurité avec notre système IA avancé qui achemine intelligemment votre rapport vers les bons spécialistes pour un soutien immédiat et confidentiel.',
    submitReport: 'Soumettre un Rapport Anonyme',
    trackReport: 'Suivre un Rapport',
    userPortal: 'Portail Utilisateur',
    adminLogin: 'Connexion Admin',
    
    // Department Names
    legalTeam: 'Équipe Juridique',
    taskForceTeam: 'Équipe d\'Intervention',
    supportServicesTeam: 'Équipe de Services de Soutien',
    happy2helpTeam: 'Équipe Happy2Help',
    
    // Report Submission
    reportSubmission: 'Soumission de Rapport',
    incidentDetails: 'Détails de l\'Incident',
    additionalInfo: 'Informations Supplémentaires',
    reviewAnalysis: 'Révision et Analyse IA',
    contactPreferences: 'Préférences de Contact',
    tellUsWhatHappened: 'Dites-nous ce qui s\'est passé',
    incidentType: 'Type d\'Incident',
    incidentDate: 'Date de l\'Incident',
    incidentTime: 'Heure (si connue)',
    location: 'Lieu',
    currentSafety: 'État de Sécurité Actuel',
    description: 'Description',
    witnesses: 'Témoins',
    evidence: 'Preuves',
    contactMethod: 'Méthode de Contact Préférée',
    anonymous: 'Soumettre ce rapport de manière anonyme',
    
    // Safety Status
    safe: 'En sécurité',
    unsure: 'Incertain',
    unsafe: 'Pas en sécurité',
    
    // Report Status
    submitted: 'Soumis',
    acknowledged: 'Accusé de réception',
    underReview: 'En cours d\'examen',
    resolved: 'Résolu',
    closed: 'Fermé',
    
    // Priority Levels
    low: 'Faible',
    medium: 'Moyen',
    high: 'Élevé',
    critical: 'Critique',
    
    // Messages
    newMessage: 'Nouveau Message',
    sendMessage: 'Envoyer le Message',
    noMessages: 'Aucun message pour le moment',
    messagesSentSecurely: 'Tous les messages sont cryptés et sécurisés',
    
    // Notifications
    notifications: 'Notifications',
    markAllRead: 'Marquer Tout comme Lu',
    noNotifications: 'Aucune notification',
    
    // Admin Interface
    caseManagement: 'Gestion des Cas',
    departmentDashboard: 'Tableau de Bord du Département',
    analytics: 'Analytiques',
    totalReports: 'Total des Rapports',
    activeAgents: 'Agents Actifs',
    avgResponse: 'Réponse Moyenne',
    aiAccuracy: 'Précision IA',
    
    // Errors & Success
    error: 'Erreur',
    success: 'Succès',
    reportSubmittedSuccessfully: 'Rapport soumis avec succès',
    loginFailed: 'Connexion échouée',
    messageSent: 'Message envoyé avec succès',
    fileUploaded: 'Fichier téléchargé avec succès',
    
    // Time Formats
    justNow: 'À l\'instant',
    minutesAgo: 'il y a quelques minutes',
    hoursAgo: 'il y a quelques heures',
    daysAgo: 'il y a quelques jours',
    weeksAgo: 'il y a quelques semaines'
  }
};

// Language Hook
const useTranslation = () => {
  const { language } = useContext(AppContext);
  return (key) => translations[language]?.[key] || translations.en[key] || key;
};

// Enhanced Notification Service
class NotificationService {
  static instance = null;
  
  constructor() {
    this.subscribers = [];
    this.notifications = [];
  }
  
  static getInstance() {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }
  
  notify(notification) {
    this.notifications.unshift({
      ...notification,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false
    });
    
    this.subscribers.forEach(callback => callback(this.notifications));
    
    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'
      });
    }
  }
  
  markAsRead(id) {
    this.notifications = this.notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    );
    this.subscribers.forEach(callback => callback(this.notifications));
  }
  
  markAllAsRead() {
    this.notifications = this.notifications.map(notif => ({ ...notif, read: true }));
    this.subscribers.forEach(callback => callback(this.notifications));
  }
  
  clearNotification(id) {
    this.notifications = this.notifications.filter(notif => notif.id !== id);
    this.subscribers.forEach(callback => callback(this.notifications));
  }

  setNotifications(notifications) {
    this.notifications = notifications || [];
    this.subscribers.forEach(callback => callback(this.notifications));
  }

  getNotifications() {
    return this.notifications;
  }
}

// WebSocket Configuration
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ws';

// Check if backend is available
const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE}/health`, { timeout: 3000 });
    return response.ok;
  } catch (error) {
    console.warn('Backend health check failed:', error.message);
    return false;
  }
};

// Department Configuration (synced with backend)
const DEPARTMENTS = {
  legal: {
    id: 'legal',
    name: 'Legal Team',
    description: 'Handles legal matters, harassment, discrimination, and rights violations',
    color: 'blue',
    icon: Shield,
    avgResponseTime: '8h',
    activeAgents: 12,
    specialties: ['harassment', 'discrimination', 'workplace violations', 'rights issues', 'legal matters']
  },
  task: {
    id: 'task',
    name: 'Task Force Team',
    description: 'Handles physical violence, assault, and immediate safety concerns',
    color: 'red',
    icon: AlertTriangle,
    avgResponseTime: '2h',
    activeAgents: 8,
    specialties: ['physical violence', 'assault', 'immediate danger', 'safety threats']
  },
  support: {
    id: 'support',
    name: 'Support Services Team',
    description: 'Handles housing, financial aid, and general support services',
    color: 'green',
    icon: Heart,
    avgResponseTime: '12h',
    activeAgents: 15,
    specialties: ['housing', 'financial aid', 'basic needs', 'resources']
  },
  happy2help: {
    id: 'happy2help',
    name: 'Happy2Help Team',
    description: 'Mental health counseling, emotional support, and wellness services',
    color: 'purple',
    icon: Users,
    avgResponseTime: '4h',
    activeAgents: 20,
    specialties: ['mental health', 'counseling', 'emotional support', 'therapy']
  }
};

// AppContext is imported from ./contexts/AppContext

// Custom hooks
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue];
};

// Enhanced WebSocket Hook with better connection management
const useWebSocket = (url, onMessage) => {
  const ws = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 2; // Reduced to minimize connection errors
  const connectionTimeout = useRef(null);
  const reconnectTimeout = useRef(null);
  const isConnecting = useRef(false);

  const cleanup = useCallback(() => {
    if (connectionTimeout.current) {
      clearTimeout(connectionTimeout.current);
      connectionTimeout.current = null;
    }
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    if (ws.current) {
      ws.current.onopen = null;
      ws.current.onmessage = null;
      ws.current.onclose = null;
      ws.current.onerror = null;
      if (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING) {
        ws.current.close();
      }
      ws.current = null;
    }
    isConnecting.current = false;
  }, []);

  const connectWS = useCallback(() => {
    // Don't connect if no URL provided
    if (!url) {
      console.log('🔌 WebSocket URL not provided, skipping connection');
      return;
    }

    // Prevent multiple simultaneous connections
    if (isConnecting.current) {
      console.log('🔌 WebSocket connection already in progress');
      return;
    }

    // Don't attempt if we've exceeded max attempts
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.log('🔌 Max WebSocket reconnection attempts reached');
      return;
    }

    isConnecting.current = true;
    console.log(`🔌 Attempting WebSocket connection (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);

    try {
      // Clean up any existing connection
      cleanup();

      ws.current = new WebSocket(url);
      
      // Set connection timeout
      connectionTimeout.current = setTimeout(() => {
        if (ws.current && ws.current.readyState === WebSocket.CONNECTING) {
          console.log('🔌 WebSocket connection timeout');
          ws.current.close();
        }
      }, 10000); // 10 second timeout

      ws.current.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        setIsConnected(true);
        setReconnectAttempts(0);
        isConnecting.current = false;
        
        if (connectionTimeout.current) {
          clearTimeout(connectionTimeout.current);
          connectionTimeout.current = null;
        }

        // Wait a moment before sending auth to ensure connection is stable
        setTimeout(() => {
          const token = localStorage.getItem('authToken');
          const userType = localStorage.getItem('userType');
          
          if (token && ws.current && ws.current.readyState === WebSocket.OPEN) {
            console.log('🔐 Sending WebSocket authentication');
            ws.current.send(JSON.stringify({
              type: 'auth',
              token: token,
              clientType: userType || 'user'
            }));
          }
        }, 500); // 500ms delay
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data.type);
          if (onMessage) {
            onMessage(data);
          }
        } catch (error) {
          console.error('❌ WebSocket message parse error:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('🔌 WebSocket disconnected', event.code, event.reason);
        setIsConnected(false);
        isConnecting.current = false;
        
        if (connectionTimeout.current) {
          clearTimeout(connectionTimeout.current);
          connectionTimeout.current = null;
        }

        // Only attempt reconnection if it wasn't a normal closure and we haven't exceeded max attempts
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(3000 * Math.pow(2, reconnectAttempts), 15000); // Longer delays
          console.log(`🔄 Scheduling WebSocket reconnection in ${delay}ms`);
          
          reconnectTimeout.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connectWS();
          }, delay);
        } else {
          console.log('🔌 WebSocket reconnection stopped - max attempts reached or normal closure');
          // Reset attempts after stopping to allow future connections
          setTimeout(() => {
            setReconnectAttempts(0);
          }, 30000); // Reset after 30 seconds
        }
      };

      ws.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        isConnecting.current = false;
        
        if (connectionTimeout.current) {
          clearTimeout(connectionTimeout.current);
          connectionTimeout.current = null;
        }
      };

    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
      isConnecting.current = false;
      
      if (reconnectAttempts < maxReconnectAttempts) {
        const delay = Math.min(3000 * Math.pow(2, reconnectAttempts), 15000);
        reconnectTimeout.current = setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connectWS();
        }, delay);
      }
    }
  }, [url, reconnectAttempts, onMessage, cleanup]);

  useEffect(() => {
    connectWS();
    
    return () => {
      cleanup();
    };
  }, [connectWS, cleanup]);

  const sendMessage = useCallback((message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify(message));
        console.log('📤 WebSocket message sent:', message.type);
        return true;
      } catch (error) {
        console.error('❌ Failed to send WebSocket message:', error);
        return false;
      }
    } else {
      console.warn('⚠️ Cannot send WebSocket message - connection not ready');
      return false;
    }
  }, []);

  return { isConnected, sendMessage, reconnectAttempts };
};

// API Service
class APIService {
  static async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const token = localStorage.getItem('authToken');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication
  static async loginUser(credentials) {
    return this.request('/users/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  static async loginAdmin(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  static async logout() {
    const endpoint = localStorage.getItem('userType') === 'admin' ? '/auth/logout' : '/users/auth/logout';
    return this.request(endpoint, { method: 'POST' });
  }

  static async verifyToken() {
    const endpoint = localStorage.getItem('userType') === 'admin' ? '/auth/verify' : '/users/auth/verify';
    return this.request(endpoint);
  }

  // Reports
  static async submitReport(reportData) {
    return this.request('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData)
    });
  }

  static async getReportStatus(reportId) {
    return this.request(`/reports/${reportId}/status`);
  }

  static async trackReport(reportId, credentials) {
    const params = new URLSearchParams();
    if (credentials.email) params.append('email', credentials.email);
    if (credentials.securityPin) params.append('securityPin', credentials.securityPin);
    return this.request(`/reports/${reportId}/track?${params}`);
  }

  // AI Features
  static async getAIPreview(data) {
    return this.request('/ai-preview', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async analyzeSentiment(text) {
    return this.request('/analyze-sentiment', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }

  static async qualityCheck(reportData) {
    return this.request('/ai/quality-check', {
      method: 'POST',
      body: JSON.stringify({ reportData })
    });
  }

  // Enhanced AI Analysis Methods
  static async categorizeIncident(reportData) {
    return this.request('/ai/categorize-incident', {
      method: 'POST',
      body: JSON.stringify({ reportData })
    });
  }

  static async prioritizeCase(reportData, existingCases) {
    return this.request('/ai/prioritize-case', {
      method: 'POST',
      body: JSON.stringify({ reportData, existingCases })
    });
  }

  static async generateContextualResponse(reportData, caseHistory, userContext) {
    return this.request('/ai/generate-response', {
      method: 'POST',
      body: JSON.stringify({ reportData, caseHistory, userContext })
    });
  }

  static async analyzePatterns(reports, timeRange) {
    return this.request('/ai/analyze-patterns', {
      method: 'POST',
      body: JSON.stringify({ reports, timeRange })
    });
  }

  static async enhanceUserExperience(reportData, userProfile) {
    return this.request('/ai/enhance-user-experience', {
      method: 'POST',
      body: JSON.stringify({ reportData, userProfile })
    });
  }

  // User Dashboard
  static async getUserDashboard() {
    return this.request('/users/dashboard');
  }

  static async getUserMessages(page = 1) {
    return this.request(`/users/messages?page=${page}`);
  }

  static async sendUserMessage(message) {
    return this.request('/users/messages', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  static async getUserNotifications() {
    return this.request('/users/notifications');
  }

  static async markNotificationRead(id) {
    return this.request(`/users/notifications/${id}/read`, { method: 'PUT' });
  }

  // Admin Dashboard
  static async getAdminDashboard() {
    return this.request('/admin/dashboard');
  }

  static async getDepartmentDashboard(departmentId) {
    return this.request(`/admin/department/${departmentId}/dashboard`);
  }

  static async getDepartmentCases(departmentId, filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/admin/department/${departmentId}/cases?${params}`);
  }

  static async getCaseDetails(departmentId, reportId) {
    return this.request(`/admin/department/${departmentId}/cases/${reportId}`);
  }

  static async updateCaseStatus(departmentId, reportId, data) {
    return this.request(`/admin/department/${departmentId}/cases/${reportId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async sendAdminMessage(departmentId, reportId, message) {
    return this.request(`/admin/department/${departmentId}/cases/${reportId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  static async getAIResponseSuggestions(reportId) {
    return this.request(`/admin/cases/${reportId}/ai-responses`);
  }

  // File Management
  static async uploadFiles(files) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    return this.request('/users/files', {
      method: 'POST',
      headers: {},
      body: formData
    });
  }

  static async getUserFiles() {
    return this.request('/users/files');
  }

  static async deleteFile(filename) {
    return this.request(`/users/files/${filename}`, { method: 'DELETE' });
  }
}

// Landing Page Component
const LandingPage = () => {
  const { setCurrentView } = useContext(AppContext);

  return (
    <div className="min-h-screen bg-gradient">
      {/* Modern Header */}
      <header className="header">
        <div className="header-content">
          <a href="#" className="logo">
            <Shield className="logo-icon" />
            <div className="logo-text">
              <h1>SafeVoice</h1>
              <p>AI-Powered Incident Reporting</p>
            </div>
          </a>
          <nav className="nav">
            <button 
              onClick={() => setCurrentView('track-report')}
              className="nav-item"
            >
              Track Report
            </button>
            <button 
              onClick={() => setCurrentView('user-login')}
              className="nav-item"
            >
              User Portal
            </button>
            <button 
              onClick={() => {
                console.log('🔍 Admin button clicked!');
                console.log('🎯 Current view before:', currentView);
                setCurrentView('admin-login');
                console.log('🎯 Setting view to admin-login');
              }}
              className="btn btn-primary"
              style={{ position: 'relative', zIndex: 1000 }}
            >
              Admin Login
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="professional-card">
            <div className="professional-header">
              <div className="professional-icon">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="professional-title">Safe, Secure, <span className="text-gradient">AI-Powered</span> Reporting</h1>
                <p className="professional-subtitle">Your trusted partner in workplace safety reporting and incident management.</p>
              </div>
            </div>
            <p className="professional-content">
              Submit incidents safely with our advanced AI system that intelligently routes your report 
              to the right specialists for immediate, confidential support. Our comprehensive platform 
              ensures transparency, accountability, and continuous improvement in workplace safety.
            </p>
            <div className="hero-actions">
              <button 
                onClick={() => setCurrentView('submit-report')}
                className="btn-professional"
              >
                <Shield className="w-5 h-5" />
                Submit Anonymous Report
              </button>
              <button 
                onClick={() => setCurrentView('track-report')}
                className="btn-corporate"
              >
                <Search className="w-5 h-5" />
                Track Existing Report
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="features">
        <div className="features-grid">
          <div className="feature-card feature-card-primary">
            <div className="feature-icon feature-icon-primary">
              <Brain className="w-8 h-8" />
            </div>
            <h3 className="feature-title">Smart AI Assignment</h3>
            <p className="feature-description">
              Advanced AI analyzes your report and assigns it to the most appropriate specialist team 
              with 95%+ accuracy.
            </p>
          </div>
          <div className="feature-card feature-card-success">
            <div className="feature-icon feature-icon-success">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="feature-title">Complete Privacy</h3>
            <p className="feature-description">
              End-to-end encryption ensures your information remains confidential and secure 
              throughout the entire process.
            </p>
          </div>
          <div className="feature-card feature-card-warning">
            <div className="feature-icon feature-icon-warning">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="feature-title">Rapid Response</h3>
            <p className="feature-description">
              AI prioritization ensures urgent cases receive immediate attention with response 
              times as fast as 2 hours.
            </p>
          </div>
        </div>
      </section>

      {/* Department Overview */}
      <section className="departments">
        <div className="text-center mb-16">
          <h2 className="text-gradient">Our Specialist Teams</h2>
          <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
            Expert teams ready to handle your case with specialized knowledge and rapid response times
          </p>
        </div>
        <div className="departments-grid">
          {Object.values(DEPARTMENTS).map((dept, index) => {
            const IconComponent = dept.icon;
            const cardVariants = ['department-card-primary', 'department-card-success', 'department-card-warning', 'department-card-info'];
            const iconVariants = ['department-icon-primary', 'department-icon-success', 'department-icon-warning', 'department-icon-info'];
            const variant = cardVariants[index % cardVariants.length];
            const iconVariant = iconVariants[index % iconVariants.length];
            
            return (
              <div key={dept.id} className={`department-card ${variant}`}>
                <div className={`department-icon ${iconVariant}`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <h4 className="department-name">{dept.name}</h4>
                <p className="department-description">{dept.description}</p>
                <div className="department-stats">
                  Avg. Response: {dept.avgResponseTime} • {dept.activeAgents} Agents
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="trust-section">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <h3 className="text-3xl font-bold text-secondary-900 mb-16">
            Trusted by Organizations Worldwide
          </h3>
          <div className="trust-grid">
            <div className="trust-stat-card">
              <div className="trust-stat-value">10K+</div>
              <div className="trust-stat-label">Reports Handled</div>
            </div>
            <div className="trust-stat-card">
              <div className="trust-stat-value">99.9%</div>
              <div className="trust-stat-label">Uptime</div>
            </div>
            <div className="trust-stat-card">
              <div className="trust-stat-value">2hr</div>
              <div className="trust-stat-label">Avg Response</div>
            </div>
            <div className="trust-stat-card">
              <div className="trust-stat-value">50+</div>
              <div className="trust-stat-label">Countries</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Report Submission Form Component
const ReportSubmissionForm = () => {
  const { setCurrentView } = useContext(AppContext);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    incidentType: '',
    incidentDate: '',
    incidentTime: '',
    location: '',
    description: '',
    currentSafety: '',
    witnesses: '',
    evidence: '',
    contactMethod: '',
    contactInfo: '',
    anonymous: false
  });
  const [aiPreview, setAiPreview] = useState(null);
  const [qualityFeedback, setQualityFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  
  // Enhanced AI Analysis States
  const [incidentCategorization, setIncidentCategorization] = useState(null);
  const [casePrioritization, setCasePrioritization] = useState(null);
  const [userExperienceEnhancements, setUserExperienceEnhancements] = useState(null);
  const [aiAnalysisComplete, setAiAnalysisComplete] = useState(false);

  // AI Preview Effect
  useEffect(() => {
    if (formData.description.length > 20 && formData.incidentType && formData.currentSafety) {
      const debounce = setTimeout(async () => {
        try {
          const preview = await APIService.getAIPreview({
            incidentType: formData.incidentType,
            description: formData.description,
            currentSafety: formData.currentSafety
          });
          if (preview.success) {
            setAiPreview(preview.preview);
          }
        } catch (error) {
          console.error('AI Preview error:', error);
        }
      }, 1000);

      return () => clearTimeout(debounce);
    }
  }, [formData.incidentType, formData.description, formData.currentSafety]);

  // Quality Check Effect
  useEffect(() => {
    if (step === 3 && formData.description.length > 50) {
      const performQualityCheck = async () => {
        try {
          const quality = await APIService.qualityCheck(formData);
          if (quality.success) {
            setQualityFeedback(quality.assessment);
          }
        } catch (error) {
          console.error('Quality check error:', error);
        }
      };
      performQualityCheck();
    }
  }, [step, formData]);

  // Enhanced AI Analysis Effect
  useEffect(() => {
    if (step === 3 && formData.description.length > 50 && !aiAnalysisComplete) {
      const performEnhancedAnalysis = async () => {
        try {
          // Perform incident categorization
          const categorization = await APIService.categorizeIncident(formData);
          if (categorization.success) {
            setIncidentCategorization(categorization.categorization);
          }

          // Perform case prioritization
          const prioritization = await APIService.prioritizeCase(formData, []);
          if (prioritization.success) {
            setCasePrioritization(prioritization.prioritization);
          }

          // Get user experience enhancements
          const enhancements = await APIService.enhanceUserExperience(formData, {});
          if (enhancements.success) {
            setUserExperienceEnhancements(enhancements.enhancements);
          }

          setAiAnalysisComplete(true);
        } catch (error) {
          console.error('Enhanced AI analysis error:', error);
        }
      };
      performEnhancedAnalysis();
    }
  }, [step, formData, aiAnalysisComplete]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await APIService.submitReport(formData);
      setSubmissionResult(result);
      setStep(5);
    } catch (error) {
      console.error('Submission error:', error);
      alert('Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <button 
            onClick={() => setCurrentView('landing')}
            className="btn btn-secondary"
          >
            ← Back to Home
          </button>
          <div className="logo">
            <Shield className="logo-icon" />
            <span className="logo-text">SafeVoice Report</span>
          </div>
        </div>
      </header>

      <div className="container">
        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-bar">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className={`progress-step ${stepNum < 4 ? 'flex-1' : ''}`}>
                <div className={`progress-circle ${
                  step >= stepNum ? 'active' : 'inactive'
                }`}>
                  {step > stepNum ? <Check className="progress-check" /> : stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`progress-line ${
                    step > stepNum ? 'active' : 'inactive'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="progress-text">
            Step {step} of 4 - {
              step === 1 ? 'Incident Details' :
              step === 2 ? 'Additional Information' :
              step === 3 ? 'Review & AI Analysis' :
              'Contact Preferences'
            }
          </div>
        </div>

        {/* Step 1: Basic Incident Information */}
        {step === 1 && (
          <div className="card">
            <h2 className="step-title">Tell Us What Happened</h2>
            
            <div className="form-content">
              <div className="form-group">
                <label className="form-label">Incident Type *</label>
                <select 
                  value={formData.incidentType}
                  onChange={(e) => handleInputChange('incidentType', e.target.value)}
                  className="form-select"
                >
                  <option value="">Select incident type</option>
                  <option value="harassment">Harassment</option>
                  <option value="discrimination">Discrimination</option>
                  <option value="assault">Physical Assault</option>
                  <option value="violence">Violence</option>
                  <option value="stalking">Stalking</option>
                  <option value="domestic">Domestic Violence</option>
                  <option value="workplace">Workplace Issues</option>
                  <option value="housing">Housing Problems</option>
                  <option value="financial">Financial Issues</option>
                  <option value="mental">Mental Health Crisis</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date of Incident *</label>
                  <input 
                    type="date"
                    value={formData.incidentDate}
                    onChange={(e) => handleInputChange('incidentDate', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time (if known)</label>
                  <input 
                    type="time"
                    value={formData.incidentTime}
                    onChange={(e) => handleInputChange('incidentTime', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location *</label>
                <input 
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Where did this incident occur?"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Current Safety Status *</label>
                <div className="safety-options">
                  {[
                    { value: 'safe', label: 'Safe', status: 'success' },
                    { value: 'unsure', label: 'Unsure', status: 'warning' },
                    { value: 'unsafe', label: 'Unsafe', status: 'danger' }
                  ].map(option => (
                    <button 
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange('currentSafety', option.value)}
                      className={`safety-option ${formData.currentSafety === option.value ? 'selected' : ''} ${option.status}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Please describe what happened in as much detail as you feel comfortable sharing..."
                  rows={6}
                  className="form-textarea"
                />
                <p className="form-helper">
                  {formData.description.length}/2000 characters
                </p>
              </div>

              {/* AI Preview */}
              {aiPreview && (
                <div className="ai-preview">
                  <div className="ai-preview-header">
                    <Brain className="ai-preview-icon" />
                    <span className="ai-preview-title">AI Analysis Preview</span>
                  </div>
                  <div className="ai-preview-content">
                    <p>
                      <strong>Suggested Department:</strong> {DEPARTMENTS[aiPreview.assignedDepartment]?.name}
                    </p>
                    <p>
                      <strong>Confidence:</strong> {aiPreview.confidence}%
                    </p>
                    <p>
                      <strong>Estimated Response:</strong> {aiPreview.estimatedResponseTime}
                    </p>
                    {aiPreview.keyIndicators?.length > 0 && (
                      <p>
                        <strong>Key Factors:</strong> {aiPreview.keyIndicators.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button 
                onClick={() => setStep(2)}
                disabled={!formData.incidentType || !formData.incidentDate || !formData.location || !formData.description || !formData.currentSafety}
                className="btn btn-primary"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Additional Information */}
        {step === 2 && (
          <div className="card">
            <h2 className="step-title">Additional Details</h2>
            
            <div className="form-content">
              <div className="form-group">
                <label className="form-label">Witnesses</label>
                <textarea 
                  value={formData.witnesses}
                  onChange={(e) => handleInputChange('witnesses', e.target.value)}
                  placeholder="Were there any witnesses? If so, please provide details..."
                  rows={3}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Evidence</label>
                <textarea 
                  value={formData.evidence}
                  onChange={(e) => handleInputChange('evidence', e.target.value)}
                  placeholder="Do you have any evidence (photos, documents, recordings, etc.)? Please describe..."
                  rows={3}
                  className="form-textarea"
                />
              </div>
            </div>

            <div className="form-actions form-actions-between">
              <button 
                onClick={() => setStep(1)}
                className="btn btn-secondary"
              >
                ← Back
              </button>
              <button 
                onClick={() => setStep(3)}
                className="btn btn-primary"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & AI Analysis */}
        {step === 3 && (
          <div className="card">
            <h2 className="step-title">Review & AI Analysis</h2>
            
            {/* Report Summary */}
            <div className="summary-card">
              <h3 className="summary-title">Report Summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <strong>Type:</strong> {formData.incidentType}
                </div>
                <div className="summary-item">
                  <strong>Date:</strong> {formData.incidentDate} {formData.incidentTime && `at ${formData.incidentTime}`}
                </div>
                <div className="summary-item">
                  <strong>Location:</strong> {formData.location}
                </div>
                <div className="summary-item">
                  <strong>Safety Status:</strong> 
                  <span className={`safety-badge ${formData.currentSafety}`}>
                    {formData.currentSafety}
                  </span>
                </div>
              </div>
            </div>

            {/* Quality Assessment */}
            {qualityFeedback && (
              <div className="quality-assessment">
                <div className="quality-header">
                  <Brain className="quality-icon" />
                  <span className="quality-title">AI Quality Assessment</span>
                </div>
                <div className="quality-content">
                  <div className="quality-item">
                    <span>Report Quality:</span>
                    <span className="quality-value">{qualityFeedback.overallQuality}</span>
                  </div>
                  <div className="quality-item">
                    <span>Completeness Score:</span>
                    <span className="quality-value">{qualityFeedback.completenessScore}/10</span>
                  </div>
                  <div className="quality-item">
                    <span>Ready for Processing:</span>
                    <span className={`quality-value ${qualityFeedback.readyForProcessing ? 'success' : 'warning'}`}>
                      {qualityFeedback.readyForProcessing ? 'Yes' : 'Needs Review'}
                    </span>
                  </div>
                  {qualityFeedback.strengthAreas?.length > 0 && (
                    <div className="quality-detail">
                      <strong>Strengths:</strong> {qualityFeedback.strengthAreas.join(', ')}
                    </div>
                  )}
                  {qualityFeedback.improvementAreas?.length > 0 && (
                    <div className="quality-detail">
                      <strong>Could be improved:</strong> {qualityFeedback.improvementAreas.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced AI Analysis Display */}
            <EnhancedAIAnalysisDisplay
              categorization={incidentCategorization}
              prioritization={casePrioritization}
              userExperience={userExperienceEnhancements}
              qualityFeedback={qualityFeedback}
            />

            <div className="form-actions form-actions-between">
              <button 
                onClick={() => setStep(2)}
                className="btn btn-secondary"
              >
                ← Back
              </button>
              <button 
                onClick={() => setStep(4)}
                className="btn btn-primary"
              >
                Continue to Contact Preferences
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Contact Preferences */}
        {step === 4 && (
          <div className="card">
            <h2 className="step-title">Contact Preferences</h2>
            
            <div className="form-content">
              <div className="info-alert">
                <p className="info-text">
                  <strong>Important:</strong> You can choose to remain completely anonymous or provide 
                  contact information for follow-up. Either option is completely secure and confidential.
                </p>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox"
                    checked={formData.anonymous}
                    onChange={(e) => handleInputChange('anonymous', e.target.checked)}
                    className="form-checkbox"
                  />
                  <span className="checkbox-text">Submit this report anonymously</span>
                </label>
              </div>

              {!formData.anonymous && (
                <div className="contact-fields">
                  <div className="form-group">
                    <label className="form-label">Preferred Contact Method</label>
                    <select 
                      value={formData.contactMethod}
                      onChange={(e) => handleInputChange('contactMethod', e.target.value)}
                      className="form-select"
                    >
                      <option value="">Select contact method</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="text">Text Message</option>
                    </select>
                  </div>

                  {formData.contactMethod && (
                    <div className="form-group">
                      <label className="form-label">
                        Contact Information
                      </label>
                      <input 
                        type={formData.contactMethod === 'email' ? 'email' : 'text'}
                        value={formData.contactInfo}
                        onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                        placeholder={
                          formData.contactMethod === 'email' ? 'your.email@example.com' :
                          formData.contactMethod === 'phone' ? '(555) 123-4567' :
                          '(555) 123-4567'
                        }
                        className="form-input"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="form-actions form-actions-between">
              <button 
                onClick={() => setStep(3)}
                className="btn btn-secondary"
              >
                ← Back
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn btn-success"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="btn-icon" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Shield className="btn-icon" />
                    <span>Submit Secure Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Submission Success */}
        {step === 5 && submissionResult && (
          <div className="card success-card">
            <CheckCircle className="success-icon" />
            <h2 className="success-title">Report Submitted Successfully</h2>
            
            <div className="success-details">
              <h3 className="success-subtitle">Your Report Details</h3>
              <div className="success-info">
                <p><strong>Report ID:</strong> {submissionResult.reportId}</p>
                <p><strong>Status:</strong> {submissionResult.status}</p>
                <p><strong>Priority:</strong> {submissionResult.priority}</p>
                <p><strong>Assigned to:</strong> {submissionResult.departmentInfo?.name}</p>
                <p><strong>Expected Response:</strong> {submissionResult.departmentInfo?.responseTime}</p>
              </div>
            </div>

            {submissionResult.aiAnalysis && (
              <div className="ai-results">
                <h3 className="ai-results-title">AI Analysis Results</h3>
                <div className="ai-results-content">
                  <p><strong>Department:</strong> {submissionResult.aiAnalysis.departmentAssignment.department}</p>
                  <p><strong>Confidence:</strong> {submissionResult.aiAnalysis.departmentAssignment.confidence}%</p>
                  <p><strong>Risk Level:</strong> {submissionResult.aiAnalysis.riskAssessment.overallRiskLevel}</p>
                  <p><strong>Quality Score:</strong> {submissionResult.aiAnalysis.qualityAssessment.completenessScore}/10</p>
                </div>
              </div>
            )}

            <div className="success-message">
              <p className="success-text">
                Please save your Report ID: <strong className="report-id">{submissionResult.reportId}</strong>
              </p>
              <p className="success-description">
                You can use this ID to track your report status and communicate with your assigned team.
              </p>
            </div>

            <div className="success-actions">
              <button 
                onClick={() => setCurrentView('track-report')}
                className="btn btn-primary"
              >
                Track This Report
              </button>
              <button 
                onClick={() => setCurrentView('landing')}
                className="btn btn-secondary"
              >
                Return to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced AI Analysis Display Component
const EnhancedAIAnalysisDisplay = ({ 
  categorization, 
  prioritization, 
  userExperience, 
  qualityFeedback 
}) => {
  if (!categorization && !prioritization && !userExperience && !qualityFeedback) {
    return null;
  }

  return (
    <div className="ai-analysis-card">
      <h3 className="ai-analysis-title">
        <Brain className="ai-analysis-icon" />
        Enhanced AI Analysis
      </h3>
      
      <div className="ai-analysis-grid">
        {/* Incident Categorization */}
        {categorization && (
          <div className="ai-analysis-item categorization">
            <h4 className="ai-analysis-item-title">
              <Tag className="ai-analysis-item-icon" />
              Incident Categorization
            </h4>
            <div className="ai-analysis-item-content">
              <p><strong>Primary:</strong> <span className="capitalize">{categorization.primaryCategory?.replace('_', ' ')}</span></p>
              <p><strong>Sub-categories:</strong> {categorization.subCategories?.join(', ') || 'None'}</p>
              <p><strong>Severity:</strong> {categorization.severityTags?.join(', ') || 'Standard'}</p>
              {categorization.legalImplications?.length > 0 && (
                <p><strong>Legal:</strong> {categorization.legalImplications.join(', ')}</p>
              )}
            </div>
          </div>
        )}

        {/* Case Prioritization */}
        {prioritization && (
          <div className="ai-analysis-item prioritization">
            <h4 className="ai-analysis-item-title">
              <AlertTriangle className="ai-analysis-item-icon" />
              Case Priority
            </h4>
            <div className="ai-analysis-item-content">
              <p><strong>Level:</strong> <span className="capitalize font-semibold">{prioritization.priorityLevel}</span></p>
              <p><strong>Response Time:</strong> {prioritization.estimatedResponseTime}</p>
              <p><strong>Escalation:</strong> {prioritization.escalationRequired ? 'Required' : 'Not needed'}</p>
              {prioritization.riskMitigationSteps?.length > 0 && (
                <p><strong>Risk Mitigation:</strong> {prioritization.riskMitigationSteps.join(', ')}</p>
              )}
            </div>
          </div>
        )}

        {/* User Experience Enhancements */}
        {userExperience && (
          <div className="ai-analysis-item user-experience">
            <h4 className="ai-analysis-item-title">
              <Heart className="ai-analysis-item-icon" />
              User Experience
            </h4>
            <div className="ai-analysis-item-content">
              {userExperience.accessibilityFeatures?.length > 0 && (
                <p><strong>Accessibility:</strong> {userExperience.accessibilityFeatures.join(', ')}</p>
              )}
              {userExperience.communicationPreferences?.length > 0 && (
                <p><strong>Communication:</strong> {userExperience.communicationPreferences.join(', ')}</p>
              )}
              {userExperience.supportResources?.length > 0 && (
                <p><strong>Support:</strong> {userExperience.supportResources.join(', ')}</p>
              )}
            </div>
          </div>
        )}

        {/* Quality Feedback */}
        {qualityFeedback && (
          <div className="ai-analysis-item quality">
            <h4 className="ai-analysis-item-title">
              <CheckCircle className="ai-analysis-item-icon" />
              Quality Assessment
            </h4>
            <div className="ai-analysis-item-content">
              <p><strong>Overall:</strong> <span className="capitalize">{qualityFeedback.overallQuality}</span></p>
              <p><strong>Completeness:</strong> {qualityFeedback.completenessScore}/10</p>
              <p><strong>Ready:</strong> {qualityFeedback.readyForProcessing ? 'Yes' : 'No'}</p>
              {qualityFeedback.strengthAreas?.length > 0 && (
                <p><strong>Strengths:</strong> {qualityFeedback.strengthAreas.join(', ')}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Report Tracking Page Component
const ReportTrackingPage = () => {
  const { setCurrentView } = useContext(AppContext);
  const [reportId, setReportId] = useState('');
  const [email, setEmail] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const [reportStatus, setReportStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async () => {
    if (!reportId.trim()) {
      setError('Please enter your Report ID');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const credentials = {};
      if (email.trim()) credentials.email = email;
      if (securityPin.trim()) credentials.securityPin = securityPin;

      const response = await APIService.trackReport(reportId.trim(), credentials);
      setReportStatus(response);
    } catch (error) {
      setError(error.message || 'Failed to track report');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <button 
            onClick={() => setCurrentView('landing')}
            className="btn btn-secondary"
          >
            ← Back to Home
          </button>
          <div className="flex items-center space-x-2">
            <Search className="w-6 h-6 text-primary-600" />
            <span className="font-semibold">Track Report</span>
          </div>
        </div>
      </header>

      <div className="container">
        {!reportStatus ? (
          /* Tracking Form */
          <div className="card">
            <h2 className="step-title text-center">Track Your Report</h2>
            
            <div className="form-content">
              <div className="form-group">
                <label className="form-label">Report ID *</label>
                <input 
                  type="text"
                  value={reportId}
                  onChange={(e) => setReportId(e.target.value)}
                  placeholder="Enter your report ID (e.g., SAFE12345001)"
                  className="form-input"
                />
              </div>

              <div className="info-alert">
                <p className="info-text">
                  <strong>Optional:</strong> Provide your email or security PIN for detailed information
                </p>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Security PIN</label>
                    <input 
                      type="text"
                      value={securityPin}
                      onChange={(e) => setSecurityPin(e.target.value)}
                      placeholder="6-digit PIN"
                      maxLength={6}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="alert alert-error">
                  <p className="alert-text">{error}</p>
                </div>
              )}

              <button 
                onClick={handleTrack}
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Tracking...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Track Report</span>
                  </>
                )}
              </button>
            </div>

            {/* Demo IDs */}
            <div className="demo-section">
              <h3 className="demo-title">Try with Demo Report IDs:</h3>
              <div className="demo-grid">
                <div className="demo-column">
                  <div className="demo-item">
                    <span className="demo-id">SAFE12345001</span>
                    <span className="demo-department">Legal Team</span>
                  </div>
                  <div className="demo-item">
                    <span className="demo-id">SAFE12345101</span>
                    <span className="demo-department">Task Force</span>
                  </div>
                </div>
                <div className="demo-column">
                  <div className="demo-item">
                    <span className="demo-id">SAFE12345201</span>
                    <span className="demo-department">Support Services</span>
                  </div>
                  <div className="demo-item">
                    <span className="demo-id">SAFE12345301</span>
                    <span className="demo-department">Happy2Help</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Report Status Display */
          <div className="status-display">
            {/* Status Overview */}
            <div className="card">
              <div className="status-header">
                <h2 className="status-title">Report Status</h2>
                <span className={`status-badge ${
                  reportStatus.status === 'resolved' ? 'success' :
                  reportStatus.status === 'under_review' ? 'info' :
                  reportStatus.status === 'acknowledged' ? 'warning' :
                  'default'
                }`}>
                  {reportStatus.status?.replace('_', ' ')}
                </span>
              </div>

              <div className="status-grid">
                <div className="status-column">
                  <div className="status-item">
                    <span className="status-label">Report ID</span>
                    <p className="status-value">{reportStatus.reportId}</p>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Priority Level</span>
                    <p className={`status-value priority-${reportStatus.priority}`}>
                      {reportStatus.priority}
                    </p>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Assigned Department</span>
                    <p className="status-value">{reportStatus.departmentInfo?.name}</p>
                  </div>
                </div>
                <div className="status-column">
                  <div className="status-item">
                    <span className="status-label">Submitted</span>
                    <p className="status-value">{reportStatus.submittedAt}</p>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Last Updated</span>
                    <p className="status-value">{reportStatus.lastUpdated}</p>
                  </div>
                  {reportStatus.assignedAgent && (
                    <div className="status-item">
                      <span className="status-label">Assigned Agent</span>
                      <p className="status-value">{reportStatus.assignedAgent}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Insights */}
              {reportStatus.aiInsights && (
                <div className="ai-insights">
                  <div className="ai-insights-header">
                    <Brain className="w-5 h-5 text-primary-600 mr-2" />
                    <span className="ai-insights-title">AI Analysis Insights</span>
                  </div>
                  <div className="ai-insights-grid">
                    <div className="ai-insight-item">
                      <span className="ai-insight-label">Assignment Confidence</span>
                      <p className="ai-insight-value">{reportStatus.aiInsights.assignmentConfidence}%</p>
                    </div>
                    <div className="ai-insight-item">
                      <span className="ai-insight-label">Risk Level</span>
                      <p className="ai-insight-value">{reportStatus.aiInsights.riskLevel}</p>
                    </div>
                    <div className="ai-insight-item">
                      <span className="ai-insight-label">Quality Score</span>
                      <p className="ai-insight-value">{reportStatus.aiInsights.qualityScore}/10</p>
                    </div>
                  </div>
                  {reportStatus.aiInsights.departmentReasoning?.length > 0 && (
                    <div className="ai-reasoning">
                      <span className="ai-reasoning-label">AI Reasoning:</span>
                      <p className="ai-reasoning-text">
                        {reportStatus.aiInsights.departmentReasoning.join('. ')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Timeline */}
            {reportStatus.timeline && (
              <div className="card">
                <h3 className="timeline-title">Case Timeline</h3>
                <div className="timeline">
                  {reportStatus.timeline.map((event, index) => (
                    <div key={index} className="timeline-item">
                      <div className={`timeline-dot ${
                        event.status === 'AI Analysis Complete' ? 'ai' :
                        event.status.includes('Submitted') ? 'submitted' :
                        event.status.includes('Assigned') ? 'assigned' :
                        'default'
                      }`} />
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <h4 className="timeline-status">{event.status}</h4>
                          <span className="timeline-time">{event.timeAgo}</span>
                        </div>
                        <p className="timeline-description">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps */}
            {reportStatus.nextSteps && (
              <div className="card">
                <h3 className="next-steps-title">Next Steps</h3>
                <ul className="next-steps-list">
                  {reportStatus.nextSteps.map((step, index) => (
                    <li key={index} className="next-step-item">
                      <CheckCircle className="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0" />
                      <span className="next-step-text">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="status-actions">
              <button 
                onClick={() => setCurrentView('user-login')}
                className="btn btn-primary"
              >
                Access Full Portal
              </button>
              <button 
                onClick={() => {
                  setReportStatus(null);
                  setReportId('');
                  setEmail('');
                  setSecurityPin('');
                }}
                className="btn btn-secondary"
              >
                Track Another Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// User Login Page Component
const UserLoginPage = () => {
  const { setCurrentView, setUser, notificationService } = useContext(AppContext);
  const [reportId, setReportId] = useState('');
  const [email, setEmail] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!reportId.trim()) {
      setError('Please enter your Report ID');
      return;
    }

    if (!email.trim() && !securityPin.trim()) {
      setError('Please provide either your email address or security PIN');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const credentials = { reportId: reportId.trim() };
      if (email.trim()) credentials.email = email;
      if (securityPin.trim()) credentials.securityPin = securityPin;

      const response = await APIService.loginUser(credentials);
      
      if (response.success) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userType', 'user');
        setUser(response.user);
        
        // Load user notifications immediately after login
        try {
          if (notificationService && typeof notificationService.setNotifications === 'function') {
            const notifications = await APIService.getUserNotifications();
            notificationService.setNotifications(notifications);
          }
        } catch (error) {
          console.error('Failed to load notifications:', error);
          // Don't prevent login if notifications fail
        }
        
        setCurrentView('user-dashboard');
      }
    } catch (error) {
      setError(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient flex items-center justify-center">
      <div className="container max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="hero-title">User Portal</h1>
          <p className="hero-subtitle">Access your report dashboard and messages</p>
        </div>

        {/* Login Form */}
        <div className="card">
          <div className="form-content">
            <div className="form-group">
              <label className="form-label">Report ID *</label>
              <input 
                type="text"
                value={reportId}
                onChange={(e) => setReportId(e.target.value)}
                placeholder="Enter your report ID"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <p className="form-helper">
                Provide either your email address OR security PIN:
              </p>
              
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="form-input"
                />
              </div>

              <div className="form-divider">OR</div>

              <div className="form-group">
                <label className="form-label">Security PIN</label>
                <input 
                  type="text"
                  value={securityPin}
                  onChange={(e) => setSecurityPin(e.target.value)}
                  placeholder="6-digit PIN"
                  maxLength={6}
                  className="form-input"
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-error">
                <p className="alert-text">{error}</p>
              </div>
            )}

            <button 
              onClick={handleLogin}
              disabled={isLoading}
              className="btn btn-primary w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  <span>Access Portal</span>
                </>
              )}
            </button>
          </div>

          {/* Demo Accounts */}
          <div className="demo-section">
            <h3 className="demo-title">Demo Accounts</h3>
            <div className="demo-accounts">
              <div className="demo-account-item">
                <span className="demo-id">SAFE12345001</span>
                <span>Email: jane.doe@example.com</span>
              </div>
              <div className="demo-account-item">
                <span className="demo-id">SAFE12345101</span>
                <span>PIN: 234567</span>
              </div>
              <div className="demo-account-item">
                <span className="demo-id">SAFE12345201</span>
                <span>Email: support.user@example.com</span>
              </div>
              <div className="demo-account-item">
                <span className="demo-id">SAFE12345301</span>
                <span>PIN: 456789</span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              onClick={() => setCurrentView('landing')}
              className="btn btn-secondary"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Admin Login Page Component
const AdminLoginPage = () => {
  console.log('🎯 AdminLoginPage component rendered!');
  const { setCurrentView, setAdmin, notificationService } = useContext(AppContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Test button to verify React event handling
  const testButtonClick = () => {
    console.log('🎯 TEST BUTTON CLICKED! React event handling is working!');
    alert('✅ React event handling is working! Buttons should be functional.');
  };

  const handleLogin = async () => {
    console.log('Admin login button clicked!', { username, password: '***' }); // Debug log
    
    if (!username.trim() || !password.trim()) {
      console.log('Validation failed: missing username or password');
      setError('Please enter both username and password');
      return;
    }

    console.log('Starting admin login process...');
    setIsLoading(true);
    setError('');

    try {
      console.log('Calling APIService.loginAdmin...');
      const response = await APIService.loginAdmin({ username, password });
      console.log('Admin login response:', response);
      
      if (response && response.success) {
        console.log('Admin login successful!');
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userType', 'admin');
        setAdmin(response.admin);
        
        // Load admin notifications immediately after login
        try {
          if (notificationService && typeof notificationService.setNotifications === 'function') {
            const notifications = await APIService.getUserNotifications();
            notificationService.setNotifications(notifications);
          }
        } catch (error) {
          console.error('Failed to load notifications:', error);
          // Don't prevent login if notifications fail
        }
        
        console.log('Navigating to admin dashboard...');
        setCurrentView('admin-dashboard');
      } else {
        console.log('Admin login failed:', response);
        setError(response?.error || 'Login failed - invalid credentials');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setError(error.message || 'Login failed - server error');
    } finally {
      console.log('Admin login process completed');
      setIsLoading(false);
    }
  };

  // Add click handler for debugging
  const handleButtonClick = (e) => {
    console.log('Button clicked!', e);
    e.preventDefault();
    handleLogin();
  };

  return (
    <div className="min-h-screen bg-gradient flex items-center justify-center">
      <div className="container max-w-md">
        {/* Test Button */}
        <div className="text-center mb-4">
          <button 
            onClick={testButtonClick}
            className="btn btn-warning mb-4"
            style={{ fontSize: '14px', padding: '8px 16px' }}
          >
            🧪 Test Button - Click Me!
          </button>
        </div>

        {/* Admin Header */}
        <div className="text-center mb-8">
          <Settings className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="hero-title">Admin Portal</h1>
          <p className="hero-subtitle">Access case management and analytics</p>
        </div>

        {/* Login Form */}
        <div className="card">
          <form onSubmit={(e) => {
            e.preventDefault();
            console.log('Admin form submitted');
            handleLogin();
          }} className="form-content">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && username.trim() && password.trim()) {
                    handleLogin();
                  }
                }}
                placeholder="Enter your username"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && username.trim() && password.trim()) {
                    handleLogin();
                  }
                }}
                placeholder="Enter your password"
                className="form-input"
              />
            </div>

            {error && (
              <div className="alert alert-error">
                <p className="alert-text">{error}</p>
              </div>
            )}

            <button 
              disabled={isLoading}
              className="btn btn-primary w-full"
              type="submit"
              onClick={handleButtonClick}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-8 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4" />
                  <span>Admin Login</span>
                </>
              )}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="demo-section">
            <h3 className="demo-title">Demo Admin Accounts</h3>
                          <div className="demo-accounts">
                <div className="demo-account-item">
                  <strong>Super Admin:</strong><br />
                  super_admin / SafeVoice2024!
                </div>
                <div className="demo-account-item">
                  <strong>Legal Team:</strong><br />
                  legal_admin / SafeVoice2024!
                </div>
                <div className="demo-account-item">
                  <strong>Task Force:</strong><br />
                  task_admin / SafeVoice2024!
                </div>
                <div className="demo-account-item">
                  <strong>Support:</strong><br />
                  support_admin / SafeVoice2024!
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              onClick={() => setCurrentView('landing')}
              className="btn btn-secondary"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component with Enhanced Features
const SafeVoiceApp = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [language, setLanguage] = useLocalStorage('language', 'en');
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  const notificationService = NotificationService.getInstance();

  // WebSocket for real-time updates with enhanced message handling (optional)
  const { isConnected, sendMessage, reconnectAttempts } = useWebSocket(
    // Only connect if user is authenticated to reduce connection errors
    (user || admin) ? WS_URL : null, 
    (message) => {
      // Only process notifications if user is authenticated
      if (!user && !admin) {
        return;
      }
    
    switch (message.type) {
      case 'new_message':
        notificationService.notify({
          type: 'message',
          title: 'New Message',
          message: `New message from ${message.senderName}`,
          reportId: message.reportId,
          priority: 'normal'
        });
        break;
        
      case 'case_update':
        notificationService.notify({
          type: 'case_update',
          title: 'Case Updated',
          message: `Your case status has been updated: ${message.updateType}`,
          reportId: message.reportId,
          priority: message.updateType === 'status_change' ? 'high' : 'normal'
        });
        break;
        
      case 'new_case':
        if (admin) {
          notificationService.notify({
            type: 'new_case',
            title: 'New Case Assigned',
            message: `New ${message.priority} priority case assigned to ${message.department}`,
            reportId: message.reportId,
            priority: message.priority === 'critical' ? 'urgent' : 'normal'
          });
        }
        break;
        
      case 'system_message':
        notificationService.notify({
          type: 'system',
          title: message.title || 'System Notification',
          message: message.message,
          priority: message.priority || 'normal'
        });
        break;
        
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  });

  // Subscribe to notifications
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notifs) => {
      setNotifications(Array.isArray(notifs) ? notifs : []);
    });
    return unsubscribe;
  }, []);

  // Debug currentView changes
  useEffect(() => {
    console.log('🎯 currentView changed to:', currentView);
  }, [currentView]);

  // Initialize app with enhanced authentication check
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const userType = localStorage.getItem('userType');
        
        if (token && userType) {
          const response = await APIService.verifyToken();
          if (response.success) {
            if (userType === 'admin') {
              setAdmin(response.admin);
              setCurrentView('admin-dashboard');
              
              // Load admin notifications for existing session
              try {
                const notifications = await APIService.getUserNotifications();
                notificationService.setNotifications(notifications);
              } catch (error) {
                console.error('Failed to load notifications:', error);
              }
            } else {
              setUser(response.user);
              setCurrentView('user-dashboard');
              
              // Load user notifications for existing session
              try {
                const notifications = await APIService.getUserNotifications();
                notificationService.setNotifications(notifications);
              } catch (error) {
                console.error('Failed to load notifications:', error);
              }
            }
            
            // Request notification permission only when authenticated
            if (Notification.permission === 'default') {
              Notification.requestPermission();
            }
            
            // Subscribe to WebSocket notifications
            if (sendMessage) {
              sendMessage({
                type: 'subscribe',
                subscriptions: ['case_updates', 'messages', 'system_notifications']
              });
            }
          }
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userType');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [sendMessage, notificationService]);

  // Language switching function
  const switchLanguage = (newLanguage) => {
    setLanguage(newLanguage);
  };

  // Context value with enhanced features
  const contextValue = {
    currentView, setCurrentView,
    user, setUser,
    admin, setAdmin,
    language, switchLanguage,
    notifications, setNotifications,
    selectedDepartment, setSelectedDepartment,
    selectedCase, setSelectedCase,
    selectedReport, setSelectedReport,
    isConnected, sendMessage,
    notificationService
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-neutral-600">Loading SafeVoice Portal...</p>
          {reconnectAttempts > 0 && (
            <p className="text-sm text-warning-600 mt-2">
              Reconnecting... (Attempt {reconnectAttempts}/2)
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gray-50">
        {/* Language Switcher - Always visible */}
        <LanguageSwitcher />
        
        {/* Real-time Connection Status */}
        <ConnectionStatus isConnected={isConnected} reconnectAttempts={reconnectAttempts} />
        
        {/* Notification Toast Container */}
        <NotificationToasts />
        
        {/* Main Content */}
        {currentView === 'landing' && <EnhancedLandingPage 
          onGetStarted={() => setCurrentView('submit-report')}
          onLogin={() => setCurrentView('user-login')}
          onUIDemo={() => setCurrentView('demo-dashboard')}
        />}
        {currentView === 'submit-report' && <ReportSubmissionForm />}
        {currentView === 'track-report' && <ReportTrackingPage />}
        {currentView === 'user-login' && <UserLoginPage />}
        {currentView === 'admin-login' && (
          <div>
            {console.log('🎯 Rendering AdminLoginPage, currentView:', currentView)}
            <AdminLoginPage />
          </div>
        )}
        {currentView === 'user-dashboard' && <UserDashboard />}
        {currentView === 'admin-dashboard' && <AdminDashboard />}
        {currentView === 'department-dashboard' && <DepartmentDashboard />}
        {currentView === 'case-management' && <CaseManagement />}
        {currentView === 'case-details' && <CaseDetailsView />}
        {currentView === 'report-details' && <ReportDetailsView />}
        {currentView === 'messaging' && <MessagingInterface />}
        {currentView === 'enhanced-messaging' && <EnhancedMessagingHub />}
        {currentView === 'file-management' && <FileManagement />}
        {currentView === 'analytics' && <AnalyticsDashboard />}
        {currentView === 'notifications' && <NotificationCenter />}
        {currentView === 'demo-dashboard' && <DemoDashboard />}
      </div>
    </AppContext.Provider>
  );
};

// Language Switcher Component
const LanguageSwitcher = () => {
  const { language, switchLanguage } = useContext(AppContext);
  const t = useTranslation();

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="language-switcher">
        <Globe className="w-4 h-4 text-neutral-600" />
        <button
          onClick={() => switchLanguage('en')}
          className={`language-btn ${language === 'en' ? 'active' : ''}`}
        >
          EN
        </button>
        <button
          onClick={() => switchLanguage('fr')}
          className={`language-btn ${language === 'fr' ? 'active' : ''}`}
        >
          FR
        </button>
      </div>
    </div>
  );
};

// Connection Status Component
const ConnectionStatus = ({ isConnected, reconnectAttempts }) => {
  const t = useTranslation();

  // Only show connection status if we're actively reconnecting
  if (isConnected || reconnectAttempts === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="connection-status">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        <span className="text-sm text-yellow-800">
          Reconnecting... ({reconnectAttempts}/2)
        </span>
      </div>
    </div>
  );
};

// Notification Toasts Component
const NotificationToasts = () => {
  const { notifications, notificationService, user, admin, currentView } = useContext(AppContext);
  
  // Only show notifications when user is logged in and on authenticated pages
  const shouldShowNotifications = (user || admin) && 
    (currentView === 'user-dashboard' || 
     currentView === 'admin-dashboard' || 
     currentView === 'department-dashboard' || 
     currentView === 'case-details' || 
     currentView === 'messaging' || 
     currentView === 'analytics' || 
     currentView === 'notifications' ||
     currentView === 'file-management');
  
  const recentNotifications = (Array.isArray(notifications) ? notifications : []).filter(n => !n.read).slice(0, 3);

  const handleDismiss = (id) => {
    notificationService.markAsRead(id);
  };

  // Don't render anything if notifications shouldn't be shown
  if (!shouldShowNotifications || recentNotifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-toasts">
      {recentNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification-toast ${notification.priority}`}
        >
          <div className="notification-content">
            <div className="notification-text">
              <h4 className="notification-title">{notification.title}</h4>
              <p className="notification-message">{notification.message}</p>
            </div>
            <button
              onClick={() => handleDismiss(notification.id)}
              className="notification-dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {notification.reportId && (
            <div className="notification-report-id">
              <span className="notification-badge">
                {notification.reportId}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Report Details View Component
const ReportDetailsView = () => {
  const { selectedReport, setCurrentView } = useContext(AppContext);
  const t = useTranslation();

  if (!selectedReport) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-danger-600" />
          <p className="text-neutral-600">No report selected</p>
          <button 
            onClick={() => setCurrentView('admin-dashboard')}
            className="btn btn-primary mt-4"
          >
            {t('back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="header">
        <div className="header-content max-w-7xl">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setCurrentView('admin-dashboard')}
                className="btn btn-secondary"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">Report Details</h1>
                <p className="text-sm text-neutral-600">{selectedReport.reportId}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Report Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-600">Report ID</span>
                <p className="font-mono font-semibold">{selectedReport.reportId}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Status</span>
                <p className="font-semibold capitalize">{selectedReport.status}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Priority</span>
                <p className="font-semibold capitalize">{selectedReport.priority}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-600">Submitted</span>
                <p className="font-semibold">{selectedReport.submittedAt}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Department</span>
                <p className="font-semibold">{selectedReport.department}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Incident Type</span>
                <p className="font-semibold capitalize">{selectedReport.incidentType}</p>
              </div>
            </div>
          </div>
          
          {selectedReport.description && (
            <div className="mt-6">
              <span className="text-sm text-gray-600">Description</span>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.description}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced Messaging Hub Component
const EnhancedMessagingHub = () => {
  const { admin, setCurrentView } = useContext(AppContext);
  const [activeConversations, setActiveConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslation();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      // Mock data for demonstration
      setActiveConversations([
        { id: 1, reportId: 'SAFE12345001', lastMessage: 'Thank you for your help', unreadCount: 2, lastActivity: '2 hours ago' },
        { id: 2, reportId: 'SAFE12345002', lastMessage: 'I need more information', unreadCount: 0, lastActivity: '1 day ago' },
        { id: 3, reportId: 'SAFE12345003', lastMessage: 'When can we schedule a call?', unreadCount: 1, lastActivity: '3 hours ago' }
      ]);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      // Mock messages
      setMessages([
        { id: 1, sender: 'User', message: 'I need help with my case', timestamp: '2024-01-15 10:30', isFromUser: true },
        { id: 2, sender: 'Agent', message: 'I\'m here to help. Can you provide more details?', timestamp: '2024-01-15 10:45', isFromUser: false },
        { id: 3, sender: 'User', message: 'Thank you for your help', timestamp: '2024-01-15 11:00', isFromUser: true }
      ]);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      // Add message to local state
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: admin?.username || 'Agent',
        message: newMessage,
        timestamp: new Date().toLocaleString(),
        isFromUser: false
      }]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="header">
        <div className="header-content max-w-7xl">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setCurrentView('admin-dashboard')}
                className="btn btn-secondary"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">Enhanced Messaging Hub</h1>
                <p className="text-sm text-neutral-600">Communicate with users across all departments</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-7xl py-8">
        <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Active Conversations</h3>
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-neutral-600">Loading...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeConversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversation(conv);
                      loadMessages(conv.id);
                    }}
                    className={`conversation-item ${
                      selectedConversation?.id === conv.id ? 'active' : ''
                    }`}
                  >
                    <div className="conversation-header">
                      <span className="conversation-id">{conv.reportId}</span>
                      {conv.unreadCount > 0 && (
                        <span className="unread-badge">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="conversation-message">{conv.lastMessage}</p>
                    <p className="conversation-time">{conv.lastActivity}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Thread */}
          <div className="lg:col-span-2 card flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="message-header">
                  <h4 className="message-title">{selectedConversation.reportId}</h4>
                  <p className="message-subtitle">Last active: {selectedConversation.lastActivity}</p>
                </div>

                {/* Messages */}
                <div className="message-content">
                  <div className="message-list">
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`message-item ${msg.isFromUser ? 'user' : 'agent'}`}
                      >
                        <div className={`message-bubble ${msg.isFromUser ? 'user' : 'agent'}`}>
                          <p className="message-text">{msg.message}</p>
                          <p className="message-timestamp">
                            {msg.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Message Input */}
                <div className="message-input">
                  <div className="input-group">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      rows={2}
                      className="form-input flex-1"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="btn btn-primary"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="message-placeholder">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
                  <p className="text-neutral-600">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Analytics Dashboard Component  
const AnalyticsDashboard = () => {
  const { setCurrentView } = useContext(AppContext);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week');
  const t = useTranslation();

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    try {
      // Mock analytics data
      setAnalyticsData({
        overview: {
          totalReports: 1247,
          resolvedCases: 892,
          activeAgents: 48,
          averageResponseTime: '4.2h',
          aiAccuracy: 94.7,
          userSatisfaction: 4.6
        },
        trends: {
          reportVolume: [45, 52, 48, 61, 55, 67, 59],
          resolutionRate: [78, 82, 85, 88, 91, 89, 92],
          aiConfidence: [91, 93, 94, 95, 94, 96, 95]
        },
        departmentBreakdown: [
          { name: 'Legal Team', cases: 312, percentage: 25 },
          { name: 'Support Services', cases: 298, percentage: 24 },
          { name: 'Happy2Help', cases: 267, percentage: 21 },
          { name: 'Task Force', cases: 189, percentage: 15 },
          { name: 'Other', cases: 181, percentage: 15 }
        ],
        incidentTypes: [
          { type: 'Harassment', count: 356, trend: '+12%' },
          { type: 'Discrimination', count: 289, trend: '+8%' },
          { type: 'Housing Issues', count: 234, trend: '-3%' },
          { type: 'Mental Health', count: 198, trend: '+15%' },
          { type: 'Physical Safety', count: 170, trend: '+5%' }
        ]
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="header">
        <div className="header-content max-w-7xl">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setCurrentView('admin-dashboard')}
                className="btn btn-secondary"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">{t('analytics')}</h1>
                <p className="text-sm text-neutral-600">Comprehensive insights and performance metrics</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="form-select"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-7xl py-8">
        {/* Overview Cards */}
        <div className="analytics-overview">
          <div className="analytics-card">
            <div className="analytics-icon">
              <FileText className="w-8 h-8 text-primary-600" />
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Total Reports</p>
              <p className="analytics-value">{analyticsData.overview.totalReports}</p>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon">
              <CheckCircle className="w-8 h-8 text-success-600" />
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Resolved</p>
              <p className="analytics-value">{analyticsData.overview.resolvedCases}</p>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon">
              <Users className="w-8 h-8 text-secondary-600" />
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Active Agents</p>
              <p className="analytics-value">{analyticsData.overview.activeAgents}</p>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon">
              <Clock className="w-8 h-8 text-warning-600" />
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Avg Response</p>
              <p className="analytics-value">{analyticsData.overview.averageResponseTime}</p>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon">
              <Brain className="w-8 h-8 text-secondary-600" />
            </div>
            <div className="analytics-content">
              <p className="analytics-label">AI Accuracy</p>
              <p className="analytics-value">{analyticsData.overview.aiAccuracy}%</p>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon">
              <Star className="w-8 h-8 text-warning-600" />
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Satisfaction</p>
              <p className="analytics-value">{analyticsData.overview.userSatisfaction}/5</p>
            </div>
          </div>
        </div>

        {/* Charts and Graphs */}
        <div className="analytics-charts">
          <div className="analytics-chart">
            <h3 className="chart-title">Department Breakdown</h3>
            <div className="chart-content">
              {analyticsData.departmentBreakdown.map((dept, index) => (
                <div key={index} className="chart-item">
                  <span className="chart-label">{dept.name}</span>
                  <div className="chart-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill primary" 
                        style={{ width: `${dept.percentage}%` }}
                      />
                    </div>
                    <span className="progress-value">{dept.cases}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="analytics-chart">
            <h3 className="chart-title">Incident Types</h3>
            <div className="chart-content">
              {analyticsData.incidentTypes.map((incident, index) => (
                <div key={index} className="incident-item">
                  <div className="incident-info">
                    <span className="incident-type">{incident.type}</span>
                    <span className={`incident-trend ${
                      incident.trend.startsWith('+') ? 'positive' : 'negative'
                    }`}>
                      {incident.trend}
                    </span>
                  </div>
                  <span className="incident-count">{incident.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trends */}
        <div className="analytics-trends">
          <h3 className="chart-title">Trends Over Time</h3>
          <div className="trends-grid">
            <div className="trend-section">
              <h4 className="trend-title">Report Volume</h4>
              <div className="trend-bars">
                {analyticsData.trends.reportVolume.map((value, index) => (
                  <div key={index} className="trend-bar">
                    <span className="trend-label">Day {index + 1}</span>
                    <div className="trend-progress">
                      <div 
                        className="trend-fill primary" 
                        style={{ width: `${(value / 70) * 100}%` }}
                      />
                    </div>
                    <span className="trend-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="trend-section">
              <h4 className="trend-title">Resolution Rate (%)</h4>
              <div className="trend-bars">
                {analyticsData.trends.resolutionRate.map((value, index) => (
                  <div key={index} className="trend-bar">
                    <span className="trend-label">Day {index + 1}</span>
                    <div className="trend-progress">
                      <div 
                        className="trend-fill success" 
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="trend-value">{value}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="trend-section">
              <h4 className="trend-title">AI Confidence (%)</h4>
              <div className="trend-bars">
                {analyticsData.trends.aiConfidence.map((value, index) => (
                  <div key={index} className="trend-bar">
                    <span className="trend-label">Day {index + 1}</span>
                    <div className="trend-progress">
                      <div 
                        className="trend-fill secondary" 
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="trend-value">{value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notification Center Component
const NotificationCenter = () => {
  const { setCurrentView, notifications, notificationService } = useContext(AppContext);
  const [filter, setFilter] = useState('all');
  const t = useTranslation();

  const filteredNotifications = (Array.isArray(notifications) ? notifications : []).filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.read;
    return notif.type === filter;
  });

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
  };

  const handleClearNotification = (id) => {
    notificationService.clearNotification(id);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message': return MessageCircle;
      case 'case_update': return FileText;
      case 'new_case': return Plus;
      case 'system': return Settings;
      default: return Bell;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="header">
        <div className="header-content max-w-7xl">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => {
                  // Go back to appropriate dashboard based on user type
                  const userType = localStorage.getItem('userType');
                  if (userType === 'admin') {
                    setCurrentView('admin-dashboard');
                  } else {
                    setCurrentView('user-dashboard');
                  }
                }}
                className="btn btn-secondary"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">{t('notifications')}</h1>
                <p className="text-sm text-neutral-600">Manage all your notifications</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleMarkAllRead}
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                {t('markAllRead')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-4xl py-8">
        {/* Filter Tabs */}
        <div className="card mb-6">
          <div className="flex space-x-4">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
              { key: 'message', label: 'Messages' },
              { key: 'case_update', label: 'Case Updates' },
              { key: 'system', label: 'System' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`notification-tab ${
                  filter === tab.key ? 'active' : ''
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="card">
          <h3 className="text-xl font-bold mb-6">
            {t('notifications')} ({filteredNotifications.length})
          </h3>
          
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <Bell className="w-12 h-12 mx-auto mb-4" />
              <p>{t('noNotifications')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={`notification-item ${
                      notification.read ? 'read' : 'unread'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <IconComponent className={`w-5 h-5 mt-1 ${
                          notification.priority === 'urgent' ? 'text-danger-600' :
                          notification.priority === 'high' ? 'text-warning-600' :
                          'text-primary-600'
                        }`} />
                        <div className="flex-1">
                          <h4 className="font-semibold text-neutral-900">
                            {notification.title}
                          </h4>
                          <p className="text-neutral-600 text-sm mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-neutral-500">
                              {new Date(notification.timestamp).toLocaleString()}
                            </span>
                            {notification.reportId && (
                              <span className="notification-badge">
                                {notification.reportId}
                              </span>
                            )}
                            <span className={`notification-priority ${
                              notification.priority === 'urgent' ? 'urgent' :
                              notification.priority === 'high' ? 'high' :
                              'normal'
                            }`}>
                              {notification.priority || 'normal'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!notification.read && (
                          <button
                            onClick={() => notificationService.markAsRead(notification.id)}
                            className="text-primary-600 hover:text-primary-800 text-sm"
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={() => handleClearNotification(notification.id)}
                          className="text-danger-600 hover:text-danger-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ... [Continue with remaining components - UserDashboard, AdminDashboard, and case tab components]

// User Dashboard Component
const UserDashboard = () => {
  const { setCurrentView, user, setUser, sendMessage, notificationService } = useContext(AppContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await APIService.getUserDashboard();
        setDashboardData(data);
        
        // Load user notifications when dashboard loads
        if (user) {
          try {
            const notifications = await APIService.getUserNotifications();
            notificationService.setNotifications(notifications);
          } catch (error) {
            console.error('Failed to load notifications:', error);
          }
        }
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
  }, [user, notificationService]);

  const handleLogout = async () => {
    console.log('User logout button clicked!');
    try {
      console.log('Calling APIService.logout...');
      await APIService.logout();
      console.log('Logout API call successful');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      console.log('Clearing user session data...');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userType');
      setUser(null);
      // Clear notifications on logout
      if (notificationService && typeof notificationService.setNotifications === 'function') {
        notificationService.setNotifications([]);
      }
      console.log('Navigating to landing page...');
      setCurrentView('landing');
      console.log('User logout completed!');
    }
  };

  // Add click handler for debugging
  const handleLogoutClick = (e) => {
    console.log('Logout button clicked!', e);
    e.preventDefault();
    handleLogout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="header">
        <div className="header-content max-w-7xl">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-xl font-bold text-neutral-900">SafeVoice Portal</h1>
                <p className="text-sm text-neutral-600">Report: {user?.reportId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Test Button */}
              <button 
                onClick={() => {
                  console.log('🧪 TEST BUTTON CLICKED! UserDashboard buttons should work!');
                  alert('✅ UserDashboard button event handling is working!');
                }}
                className="btn btn-warning"
                style={{ fontSize: '12px', padding: '6px 12px' }}
                title="Test Button"
              >
                🧪 Test
              </button>

              {/* Home Button */}
              <button 
                onClick={() => {
                  console.log('Home button clicked!');
                  setCurrentView('landing');
                }}
                className="btn btn-secondary flex items-center gap-2"
                title="Back to Home"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </button>
              
              {/* Notifications Button */}
              <button 
                onClick={() => {
                  console.log('Notifications button clicked!');
                  setCurrentView('notifications');
                }}
                className="relative btn btn-secondary"
                title="View Notifications"
              >
                <Bell className="w-4 h-4" />
                {dashboardData?.messages?.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {dashboardData.messages.unreadCount}
                  </span>
                )}
                <span className="hidden sm:inline ml-2">Notifications</span>
              </button>
              
              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="btn btn-primary flex items-center gap-2"
                title="Logout"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-7xl py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Welcome back{user?.anonymous ? ', Anonymous User' : ''}
          </h2>
          <p className="text-neutral-600">
            Your report is being handled by {dashboardData?.department?.name || 'our support team'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-neutral-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: Home },
              { key: 'messages', label: 'Messages', icon: MessageCircle },
              { key: 'timeline', label: 'Timeline', icon: Clock },
              { key: 'files', label: 'Files', icon: FileText },
              { key: 'sessions', label: 'Sessions', icon: Calendar }
            ].map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`dashboard-tab ${
                    activeTab === tab.key ? 'active' : ''
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.key === 'messages' && dashboardData?.messages?.unreadCount > 0 && (
                    <span className="unread-badge">
                      {dashboardData.messages.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <UserDashboardOverview dashboardData={dashboardData} />
        )}
        {activeTab === 'messages' && (
          <UserMessaging reportId={user?.reportId} />
        )}
        {activeTab === 'timeline' && (
          <UserTimeline timeline={dashboardData?.timeline} />
        )}
        {activeTab === 'files' && (
          <UserFileManagement />
        )}
        {activeTab === 'sessions' && (
          <UserSessions />
        )}
      </div>
    </div>
  );
};

// User Dashboard Overview Component
const UserDashboardOverview = ({ dashboardData }) => {
  if (!dashboardData) {
    return <div>Loading dashboard data...</div>;
  }

  const { report, department, timeline, quickActions, statistics, nextSteps } = dashboardData;

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="dashboard-stats">
        <div className="dashboard-stat-card">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-primary-600" />
            <div className="ml-3">
              <p className="text-sm text-neutral-600">Status</p>
              <p className="text-lg font-semibold capitalize">{report?.status?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
        <div className="dashboard-stat-card">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-warning-600" />
            <div className="ml-3">
              <p className="text-sm text-neutral-600">Priority</p>
              <p className="text-lg font-semibold capitalize">{report?.priority}</p>
            </div>
          </div>
        </div>
        <div className="dashboard-stat-card">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-success-600" />
            <div className="ml-3">
              <p className="text-sm text-neutral-600">Submitted</p>
              <p className="text-lg font-semibold">{report?.timeAgo}</p>
            </div>
          </div>
        </div>
        <div className="dashboard-stat-card">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-secondary-600" />
            <div className="ml-3">
              <p className="text-sm text-neutral-600">Department</p>
              <p className="text-lg font-semibold">{department?.name?.split(' ')[0]}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Case Information */}
      <div className="dashboard-info-grid">
        {/* Current Status */}
        <div className="card">
          <h3 className="text-xl font-bold mb-6">Current Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Report ID</span>
              <span className="font-mono font-semibold">{report?.reportId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Incident Type</span>
              <span className="capitalize">{report?.incidentType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Assigned Agent</span>
              <span>{report?.assignedAgent || 'Pending Assignment'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Safety Status</span>
              <span className={`safety-status ${
                report?.currentSafety === 'safe' ? 'safe' :
                report?.currentSafety === 'unsure' ? 'unsure' :
                'unsafe'
              }`}>
                {report?.currentSafety}
              </span>
            </div>
          </div>

          {/* AI Analysis */}
          {report?.aiAnalysis && (
            <div className="ai-analysis">
              <div className="flex items-center mb-3">
                <Brain className="w-5 h-5 text-secondary-600 mr-2" />
                <span className="font-medium text-secondary-800">AI Analysis</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Assignment Confidence</span>
                  <span className="font-semibold">{report.aiAnalysis.confidence}%</span>
                </div>
                {report.aiAnalysis.riskLevel && (
                  <div className="flex justify-between">
                    <span>Risk Level</span>
                    <span className="font-semibold">{report.aiAnalysis.riskLevel}</span>
                  </div>
                )}
                {report.aiAnalysis.qualityScore && (
                  <div className="flex justify-between">
                    <span>Quality Score</span>
                    <span className="font-semibold">{report.aiAnalysis.qualityScore}/10</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Department Information */}
        <div className="card">
          <h3 className="text-xl font-bold mb-6">Your Support Team</h3>
          {department && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg">{department.name}</h4>
                <p className="text-neutral-600 text-sm mt-1">{department.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-600">Response Time</span>
                  <p className="font-semibold">{department.avgResponseTime}</p>
                </div>
                <div>
                  <span className="text-neutral-600">Active Agents</span>
                  <p className="font-semibold">{department.activeAgents}</p>
                </div>
              </div>
              {department.specialties && (
                <div>
                  <span className="text-neutral-600 text-sm">Specialties</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {department.specialties.slice(0, 3).map((specialty, index) => (
                      <span key={index} className="specialty-tag">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {quickActions && (
        <div className="card">
          <h3 className="text-xl font-bold mb-6">Quick Actions</h3>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className={`quick-action-btn ${action.color}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{action.title}</h4>
                  {action.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {action.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{action.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {nextSteps && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-6">What Happens Next</h3>
          <ul className="space-y-3">
            {nextSteps.map((step, index) => (
              <li key={index} className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Timeline */}
      {timeline && timeline.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {timeline.slice(0, 3).map((event, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className={`w-3 h-3 rounded-full mt-2 ${
                  event.type === 'ai' ? 'bg-purple-500' :
                  event.type === 'system' ? 'bg-blue-500' :
                  event.type === 'update' ? 'bg-green-500' :
                  'bg-gray-500'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{event.status}</h4>
                    <span className="text-sm text-gray-500">{event.timeAgo}</span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// User Messaging Component
const UserMessaging = ({ reportId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const response = await APIService.getUserMessages();
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      await APIService.sendUserMessage(newMessage.trim());
      setNewMessage('');
      await loadMessages(); // Reload messages
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="card p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">Messages</h3>
        <span className="text-sm text-neutral-600">
          Secure communication with your support team
        </span>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4" />
            <p>No messages yet. Start a conversation with your support team!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`message-item ${
                message.isFromUser ? 'user-message' : 'support-message'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">
                  {message.isFromUser ? 'You' : message.sender_name}
                </span>
                <span className="text-xs text-neutral-500">{message.timeAgo}</span>
              </div>
              <p className="text-neutral-700">{message.message}</p>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="message-input-section">
        <div className="flex space-x-4">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message to the support team..."
            rows={3}
            className="message-textarea"
            disabled={isSending}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            className="btn btn-primary"
          >
            {isSending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Send</span>
          </button>
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          All messages are encrypted and secure. Your support team will respond within their standard timeframe.
        </p>
      </div>
    </div>
  );
};

// User Timeline Component
const UserTimeline = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500">No timeline events yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold mb-6">Case Timeline</h3>
      <div className="space-y-6">
        {timeline.map((event, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full ${
                event.type === 'ai' ? 'bg-purple-500' :
                event.type === 'system' ? 'bg-blue-500' :
                event.type === 'update' ? 'bg-green-500' :
                event.type === 'assignment' ? 'bg-yellow-500' :
                'bg-gray-500'
              }`} />
              {index < timeline.length - 1 && (
                <div className="w-0.5 h-12 bg-gray-300 mt-2" />
              )}
            </div>
            <div className="flex-1 pb-8">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{event.status}</h4>
                <span className="text-sm text-gray-500">{event.timeAgo}</span>
              </div>
              <p className="text-gray-600 text-sm">{event.description}</p>
              {event.type === 'ai' && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                    <Brain className="w-3 h-3 mr-1" />
                    AI Analysis
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// User File Management Component
const UserFileManagement = () => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await APIService.getUserFiles();
      setFiles(response.files || []);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      await APIService.uploadFiles(selectedFiles);
      await loadFiles(); // Reload files
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files');
    } finally {
      setIsUploading(false);
      event.target.value = ''; // Reset input
    }
  };

  const handleDeleteFile = async (filename) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      await APIService.deleteFile(filename);
      await loadFiles(); // Reload files
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'image': return Camera;
      case 'pdf': return FileText;
      case 'video': return Video;
      case 'audio': return Mic;
      default: return FileText;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p>Loading files...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Upload Evidence & Documents</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-4">
            Drag and drop files here, or click to select files
          </p>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="file-upload"
            accept="image/*,application/pdf,video/*,audio/*,.doc,.docx,.txt"
          />
          <label
            htmlFor="file-upload"
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isUploading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
            }`}
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Select Files
              </>
            )}
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Supported: Images, PDFs, Videos, Audio, Documents (Max 10MB each)
          </p>
        </div>
      </div>

      {/* Files List */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6">Your Files</h3>
        {files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4" />
            <p>No files uploaded yet. Upload evidence or documents to support your case.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {files.map((file, index) => {
              const IconComponent = getFileIcon(file.type);
              return (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <IconComponent className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">{file.originalName || file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • Uploaded {new Date(file.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={`${API_BASE}${file.downloadUrl}`}
                      download
                      className="p-2 text-blue-600 hover:text-blue-800"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-2 text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// User Sessions Component
const UserSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    sessionType: '',
    date: '',
    time: '',
    notes: ''
  });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      // This would call the sessions API
      // For now, showing static data
      setSessions([]);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookSession = async () => {
    try {
      // This would call the book session API
      console.log('Booking session:', bookingData);
      setShowBookingForm(false);
      setBookingData({ sessionType: '', date: '', time: '', notes: '' });
      // await loadSessions();
    } catch (error) {
      console.error('Error booking session:', error);
      alert('Failed to book session');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p>Loading sessions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Book New Session */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Counseling Sessions</h3>
          <button
            onClick={() => setShowBookingForm(!showBookingForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Book Session</span>
          </button>
        </div>

        {showBookingForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h4 className="font-semibold mb-4">Book a New Session</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Session Type</label>
                <select
                  value={bookingData.sessionType}
                  onChange={(e) => setBookingData({...bookingData, sessionType: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select session type</option>
                  <option value="video">Video Call</option>
                  <option value="phone">Phone Call</option>
                  <option value="inperson">In-Person</option>
                  <option value="chat">Chat Session</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Preferred Date</label>
                <input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Preferred Time</label>
                <input
                  type="time"
                  value={bookingData.time}
                  onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                <textarea
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                  placeholder="Any specific topics or concerns you'd like to discuss..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={() => setShowBookingForm(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleBookSession}
                disabled={!bookingData.sessionType || !bookingData.date || !bookingData.time}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                Book Session
              </button>
            </div>
          </div>
        )}

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4" />
            <p>No sessions scheduled yet. Book your first session to get personalized support.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{session.sessionType} Session</h4>
                    <p className="text-sm text-gray-600">
                      {session.date} at {session.time} with {session.counselor}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    session.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {session.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Admin Dashboard Component
const AdminDashboard = () => {
  const { setCurrentView, admin, setAdmin, notificationService } = useContext(AppContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [patternAnalysis, setPatternAnalysis] = useState(null);
  const [isAnalyzingPatterns, setIsAnalyzingPatterns] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await APIService.getAdminDashboard();
      setDashboardData(data);
      
      // Load admin notifications when dashboard loads
      if (admin) {
        try {
          const notifications = await APIService.getUserNotifications();
          notificationService.setNotifications(notifications);
        } catch (error) {
          console.error('Failed to load notifications:', error);
        }
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await APIService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userType');
      setAdmin(null);
      // Clear notifications on logout
      notificationService.setNotifications([]);
      setCurrentView('landing');
    }
  };

  const handleDepartmentClick = (departmentId) => {
    setSelectedDepartment(departmentId);
    setCurrentView('department-dashboard');
  };

  const handlePatternAnalysis = async () => {
    if (!dashboardData?.reports || dashboardData.reports.length === 0) {
      return;
    }

    setIsAnalyzingPatterns(true);
    try {
      const result = await APIService.analyzePatterns(dashboardData.reports, '30d');
      if (result.success) {
        setPatternAnalysis(result.patterns);
      }
    } catch (error) {
      console.error('Pattern analysis error:', error);
    } finally {
      setIsAnalyzingPatterns(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen admin-bg-gradient flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-admin-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen admin-bg-gradient">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-logo">
            <Settings className="admin-logo-icon" />
            <div>
              <div className="admin-logo-text">SafeVoice Admin</div>
              <p className="text-sm text-admin-secondary-600">{admin?.departmentName || 'Administrator'}</p>
            </div>
          </div>
          <div className="admin-nav">
            <span className="text-sm text-admin-secondary-600">Welcome, {admin?.username}</span>
            <button 
              onClick={handleLogout}
              className="admin-btn admin-btn-primary"
            >
              <User className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Stats Overview */}
        <div className="admin-stats-grid">
          <div className="professional-card">
            <div className="professional-header">
              <div className="professional-icon">
                <FileText />
              </div>
              <div>
                <div className="professional-title">{dashboardData?.totalReports || 0}</div>
                <div className="professional-subtitle">Total Reports</div>
              </div>
            </div>
          </div>
          <div className="professional-card">
            <div className="professional-header">
              <div className="professional-icon">
                <Users />
              </div>
              <div>
                <div className="professional-title">{dashboardData?.activeAgents || 0}</div>
                <div className="professional-subtitle">Active Agents</div>
              </div>
            </div>
          </div>
          <div className="professional-card">
            <div className="professional-header">
              <div className="professional-icon">
                <Clock />
              </div>
              <div>
                <div className="professional-title">{dashboardData?.avgResponseTime || 'N/A'}</div>
                <div className="professional-subtitle">Avg Response</div>
              </div>
            </div>
          </div>
          <div className="professional-card">
            <div className="professional-header">
              <div className="professional-icon">
                <Brain />
              </div>
              <div>
                <div className="professional-title">{dashboardData?.aiMetrics?.averageConfidence || 0}%</div>
                <div className="professional-subtitle">AI Accuracy</div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Dashboard Grid */}
        <div className="admin-dashboard-grid">
          <div className="admin-main-content">
            <h2 className="text-xl font-bold text-admin-secondary-900 mb-6">Department Statistics</h2>
            <div className="admin-card">
              <h3 className="text-xl font-bold mb-6">Department Overview</h3>
            <div className="space-y-4">
              {dashboardData?.departmentStats?.map((dept) => (
                <div 
                  key={dept.id}
                  onClick={() => handleDepartmentClick(dept.id)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{dept.name}</h4>
                      <p className="text-sm text-gray-600">{dept.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{dept.activeCases}</p>
                      <p className="text-sm text-gray-600">Active Cases</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Today:</span>
                      <span className="font-semibold ml-1">{dept.todayCases}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">This Week:</span>
                      <span className="font-semibold ml-1">{dept.weekCases}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">AI Confidence:</span>
                      <span className="font-semibold ml-1">{dept.aiMetrics?.avgConfidence || 0}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>

          <div className="admin-sidebar">
            <div className="admin-card">
            <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {dashboardData?.recentActivity?.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-3 h-3 rounded-full mt-2 ${
                    activity.type === 'report_submitted' ? 'bg-blue-500' :
                    activity.type === 'case_assigned' ? 'bg-green-500' :
                    'bg-gray-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.timeAgo}</p>
                    {activity.confidence && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 mt-1">
                        <Brain className="w-3 h-3 mr-1" />
                        {activity.confidence}% confidence
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>

        {/* AI Insights & Pattern Analysis */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Brain className="w-5 h-5 text-purple-600 mr-2" />
            AI Insights & Pattern Analysis
          </h3>
          
          <div className="space-y-4">
            {/* Pattern Analysis Button */}
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-gray-700">Incident Pattern Analysis</h4>
                <p className="text-sm text-gray-500">Analyze recent reports for trends and patterns</p>
              </div>
              <button
                onClick={handlePatternAnalysis}
                disabled={isAnalyzingPatterns}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                {isAnalyzingPatterns ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analyze Patterns
                  </>
                )}
              </button>
            </div>

            {/* Pattern Analysis Results */}
            {patternAnalysis && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h5 className="font-semibold text-purple-800 mb-3">Pattern Analysis Results</h5>
                
                {/* Emerging Patterns */}
                {patternAnalysis.emergingPatterns?.length > 0 && (
                  <div className="mb-4">
                    <h6 className="font-medium text-purple-700 mb-2">Emerging Patterns</h6>
                    <div className="flex flex-wrap gap-2">
                      {patternAnalysis.emergingPatterns.map((pattern, index) => (
                        <span key={index} className="bg-purple-200 text-purple-800 px-2 py-1 rounded-full text-xs">
                          {pattern}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trend Analysis */}
                {patternAnalysis.trendAnalysis && (
                  <div className="mb-4">
                    <h6 className="font-medium text-purple-700 mb-2">Trend Analysis</h6>
                    <div className="grid md:grid-cols-2 gap-4">
                      {patternAnalysis.trendAnalysis.incidentTypes && Object.keys(patternAnalysis.trendAnalysis.incidentTypes).length > 0 && (
                        <div>
                          <h7 className="text-sm font-medium text-purple-600">Incident Types</h7>
                          <div className="text-sm text-purple-700">
                            {Object.entries(patternAnalysis.trendAnalysis.incidentTypes).map(([type, trend]) => (
                              <div key={type} className="flex justify-between">
                                <span className="capitalize">{type.replace('_', ' ')}:</span>
                                <span>{trend}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {patternAnalysis.trendAnalysis.locations && Object.keys(patternAnalysis.trendAnalysis.locations).length > 0 && (
                        <div>
                          <h7 className="text-sm font-medium text-purple-600">Locations</h7>
                          <div className="text-sm text-purple-700">
                            {Object.entries(patternAnalysis.trendAnalysis.locations).map(([location, trend]) => (
                              <div key={location} className="flex justify-between">
                                <span className="capitalize">{location.replace('_', ' ')}:</span>
                                <span>{trend}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Risk Hotspots */}
                {patternAnalysis.riskHotspots?.length > 0 && (
                  <div className="mb-4">
                    <h6 className="font-medium text-purple-700 mb-2">Risk Hotspots</h6>
                    <div className="flex flex-wrap gap-2">
                      {patternAnalysis.riskHotspots.map((hotspot, index) => (
                        <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                          {hotspot}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preventive Measures */}
                {patternAnalysis.preventiveMeasures?.length > 0 && (
                  <div className="mb-4">
                    <h6 className="font-medium text-purple-700 mb-2">Preventive Measures</h6>
                    <ul className="list-disc list-inside text-sm text-purple-700 space-y-1">
                      {patternAnalysis.preventiveMeasures.map((measure, index) => (
                        <li key={index}>{measure}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Policy Recommendations */}
                {patternAnalysis.policyRecommendations?.length > 0 && (
                  <div>
                    <h6 className="font-medium text-purple-700 mb-2">Policy Recommendations</h6>
                    <ul className="list-disc list-inside text-sm text-purple-700 space-y-1">
                      {patternAnalysis.policyRecommendations.map((policy, index) => (
                        <li key={index}>{policy}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* AI-Generated Dashboard Insights */}
            {dashboardData.aiInsights && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-semibold text-blue-800 mb-3">AI-Generated Insights</h5>
                <div className="text-sm text-blue-700">
                  <p className="mb-2">{dashboardData.aiInsights.summary}</p>
                  {dashboardData.aiInsights.recommendations?.length > 0 && (
                    <div>
                      <h6 className="font-medium text-blue-600 mb-2">Recommendations:</h6>
                      <ul className="list-disc list-inside space-y-1">
                        {dashboardData.aiInsights.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Metrics and Charts */}
        {dashboardData?.aiMetrics && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">AI Performance Metrics</h3>
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{dashboardData.aiMetrics.averageConfidence}%</p>
                <p className="text-sm text-gray-600">Average Confidence</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{dashboardData.aiMetrics.highConfidenceRate}%</p>
                <p className="text-sm text-gray-600">High Confidence Rate</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{dashboardData.aiMetrics.criticalRiskCases}</p>
                <p className="text-sm text-gray-600">Critical Risk Cases</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{dashboardData.aiMetrics.totalAssignments}</p>
                <p className="text-sm text-gray-600">Total AI Assignments</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <button 
            onClick={() => setCurrentView('case-management')}
            className="bg-white rounded-xl shadow-lg p-6 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-lg">Case Management</h4>
                <p className="text-gray-600 text-sm">View and manage active cases</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </button>
          
          <button 
            onClick={() => setCurrentView('enhanced-messaging')}
            className="bg-white rounded-xl shadow-lg p-6 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-lg">Messaging Hub</h4>
                <p className="text-gray-600 text-sm">Communicate with users</p>
              </div>
              <MessageCircle className="w-8 h-8 text-green-600" />
            </div>
          </button>
          
          <button 
            onClick={() => setCurrentView('analytics')}
            className="bg-white rounded-xl shadow-lg p-6 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-lg">Analytics</h4>
                <p className="text-gray-600 text-sm">View detailed reports and insights</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

// Department Dashboard Component
const DepartmentDashboard = () => {
  const { admin, selectedDepartment, notificationService } = useContext(AppContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (selectedDepartment) {
      loadDepartmentDashboard();
    }
  }, [selectedDepartment]);

  const loadDepartmentDashboard = async () => {
    try {
      const data = await APIService.getDepartmentDashboard(selectedDepartment);
      setDashboardData(data);
      
      // Load admin notifications when department dashboard loads
      if (admin) {
        try {
          const notifications = await APIService.getUserNotifications();
          notificationService.setNotifications(notifications);
        } catch (error) {
          console.error('Failed to load notifications:', error);
        }
      }
    } catch (error) {
      console.error('Department dashboard load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Department-specific dashboard content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-6">{dashboardData?.department?.name} Dashboard</h2>
        {/* Department-specific metrics and cases */}
      </div>
    </div>
  );
};

// Case Management Component
const CaseManagement = () => {
  const { admin, setSelectedCase, setCurrentView } = useContext(AppContext);
  const [cases, setCases] = useState([]);
  const [filters, setFilters] = useState({ status: 'all', priority: 'all' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, [filters]);

  const loadCases = async () => {
    try {
      const data = await APIService.getDepartmentCases(admin.department, filters);
      setCases(data.cases || []);
    } catch (error) {
      console.error('Cases load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaseClick = (caseItem) => {
    setSelectedCase(caseItem);
    setCurrentView('case-details');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setCurrentView('admin-dashboard')}
                className="text-gray-600 hover:text-blue-600"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Case Management</h1>
                <p className="text-sm text-gray-600">Manage and track all active cases</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({...filters, priority: e.target.value})}
                className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priority</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cases List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-6">Active Cases</h3>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p>Loading cases...</p>
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4" />
              <p>No cases found with current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cases.map((case_item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                     onClick={() => handleCaseClick(case_item)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{case_item.report_id}</h4>
                      <p className="text-sm text-gray-600">
                        {case_item.incident_type} • {case_item.timeAgo}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        case_item.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        case_item.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        case_item.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {case_item.priority}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">{case_item.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Case Details View Component
const CaseDetailsView = () => {
  const { selectedCase, admin, setCurrentView, notificationService } = useContext(AppContext);
  const [caseDetails, setCaseDetails] = useState(null);
  const [caseMessages, setCaseMessages] = useState([]);
  const [aiResponses, setAiResponses] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const t = useTranslation();

  useEffect(() => {
    if (selectedCase && admin) {
      loadCaseDetails();
    }
  }, [selectedCase, admin]);

  const loadCaseDetails = async () => {
    try {
      setIsLoading(true);
      const [detailsResponse, responsesResponse] = await Promise.all([
        APIService.getCaseDetails(admin.department, selectedCase.report_id),
        APIService.getAIResponseSuggestions(selectedCase.report_id)
      ]);
      
      setCaseDetails(detailsResponse.case);
      setCaseMessages(detailsResponse.messages || []);
      setAiResponses(responsesResponse.responseSuggestions);
    } catch (error) {
      console.error('Error loading case details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      await APIService.sendAdminMessage(admin.department, selectedCase.report_id, newMessage);
      setNewMessage('');
      await loadCaseDetails(); // Reload to get new message
      
      notificationService.notify({
        type: 'success',
        title: 'Message Sent',
        message: 'Your message has been sent to the user'
      });
    } catch (error) {
      console.error('Error sending message:', error);
      notificationService.notify({
        type: 'error',
        title: 'Failed to Send',
        message: 'Could not send message. Please try again.'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;

    try {
      await APIService.updateCaseStatus(admin.department, selectedCase.report_id, {
        status: newStatus,
        notes: newNotes
      });
      
      setNewStatus('');
      setNewNotes('');
      await loadCaseDetails(); // Reload to get updated status
      
      notificationService.notify({
        type: 'success',
        title: 'Status Updated',
        message: `Case status changed to ${newStatus}`
      });
    } catch (error) {
      console.error('Error updating status:', error);
      notificationService.notify({
        type: 'error',
        title: 'Update Failed',
        message: 'Could not update case status. Please try again.'
      });
    }
  };

  const useAIResponse = (response) => {
    setNewMessage(response.message);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!caseDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">Failed to load case details</p>
          <button 
            onClick={() => setCurrentView('case-management')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {t('back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setCurrentView('case-management')}
                className="text-gray-600 hover:text-blue-600"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{t('caseManagement')}</h1>
                <p className="text-sm text-gray-600">{caseDetails.report_id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                caseDetails.priority === 'critical' ? 'bg-red-100 text-red-800' :
                caseDetails.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                caseDetails.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {t(caseDetails.priority)} Priority
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                caseDetails.status === 'resolved' ? 'bg-green-100 text-green-800' :
                caseDetails.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {t(caseDetails.status)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: Eye },
              { key: 'messages', label: 'Messages', icon: MessageCircle },
              { key: 'ai-responses', label: 'AI Responses', icon: Brain },
              { key: 'timeline', label: 'Timeline', icon: Clock },
              { key: 'actions', label: 'Actions', icon: Settings }
            ].map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.key === 'messages' && caseMessages.length > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {caseMessages.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <CaseOverviewTab caseDetails={caseDetails} />
        )}
        {activeTab === 'messages' && (
          <CaseMessagesTab 
            messages={caseMessages} 
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            onSendMessage={handleSendMessage}
            isSending={isSending}
          />
        )}
        {activeTab === 'ai-responses' && (
          <AIResponsesTab 
            responses={aiResponses} 
            onUseResponse={useAIResponse}
          />
        )}
        {activeTab === 'timeline' && (
          <CaseTimelineTab caseDetails={caseDetails} />
        )}
        {activeTab === 'actions' && (
          <CaseActionsTab 
            caseDetails={caseDetails}
            newStatus={newStatus}
            setNewStatus={setNewStatus}
            newNotes={newNotes}
            setNewNotes={setNewNotes}
            onStatusUpdate={handleStatusUpdate}
          />
        )}
      </div>
    </div>
  );
};

// Case Overview Tab Component
const CaseOverviewTab = ({ caseDetails }) => {
  const t = useTranslation();

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Case Information */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6">Case Information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Report ID</span>
              <p className="font-mono font-semibold">{caseDetails.report_id}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Incident Type</span>
              <p className="font-semibold capitalize">{caseDetails.incident_type}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Date & Time</span>
              <p className="font-semibold">
                {caseDetails.incident_date} {caseDetails.incident_time && `at ${caseDetails.incident_time}`}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Location</span>
              <p className="font-semibold">{caseDetails.location || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Safety Status</span>
              <span className={`px-2 py-1 rounded text-sm font-semibold ${
                caseDetails.current_safety === 'safe' ? 'bg-green-100 text-green-800' :
                caseDetails.current_safety === 'unsure' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {t(caseDetails.current_safety)}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Anonymous</span>
              <p className="font-semibold">{caseDetails.isAnonymous ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {caseDetails.assigned_agent && (
            <div>
              <span className="text-sm text-gray-600">Assigned Agent</span>
              <p className="font-semibold">{caseDetails.assigned_agent}</p>
            </div>
          )}

          <div>
            <span className="text-sm text-gray-600">Description</span>
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{caseDetails.description}</p>
            </div>
          </div>

          {caseDetails.witnesses && (
            <div>
              <span className="text-sm text-gray-600">Witnesses</span>
              <p className="text-gray-700 mt-1">{caseDetails.witnesses}</p>
            </div>
          )}

          {caseDetails.evidence && (
            <div>
              <span className="text-sm text-gray-600">Evidence</span>
              <p className="text-gray-700 mt-1">{caseDetails.evidence}</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Analysis */}
      {caseDetails.aiAnalysis && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-6">
            <Brain className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-xl font-bold">AI Analysis</h3>
          </div>
          
          <div className="space-y-6">
            {/* Department Assignment */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-800 mb-3">Department Assignment</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Confidence:</span>
                  <span className="font-semibold">{caseDetails.ai_assignment_confidence}%</span>
                </div>
                <div>
                  <span className="text-purple-600">Reasoning:</span>
                  {caseDetails.aiAnalysis.reasoning && (
                    <ul className="mt-1 space-y-1">
                      {caseDetails.aiAnalysis.reasoning.slice(0, 3).map((reason, index) => (
                        <li key={index} className="text-purple-700 text-xs">• {reason}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            {caseDetails.aiAnalysis.riskAssessment && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 mb-3">Risk Assessment</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Risk Level:</span>
                    <span className="font-semibold">{caseDetails.ai_risk_level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Safety Score:</span>
                    <span className="font-semibold">{caseDetails.aiAnalysis.riskAssessment.safetyRisk}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Urgency Score:</span>
                    <span className="font-semibold">{caseDetails.aiAnalysis.riskAssessment.urgencyScore}/10</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quality Assessment */}
            {caseDetails.ai_quality_score && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-3">Quality Assessment</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Quality Score:</span>
                    <span className="font-semibold">{caseDetails.ai_quality_score}/10</span>
                  </div>
                  {caseDetails.aiAnalysis.qualityAssessment && (
                    <>
                      <div className="flex justify-between">
                        <span>Overall Quality:</span>
                        <span className="font-semibold">{caseDetails.aiAnalysis.qualityAssessment.overallQuality}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ready for Processing:</span>
                        <span className={`font-semibold ${
                          caseDetails.aiAnalysis.qualityAssessment.readyForProcessing 
                            ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {caseDetails.aiAnalysis.qualityAssessment.readyForProcessing ? 'Yes' : 'Needs Review'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Case Messages Tab Component
const CaseMessagesTab = ({ messages, newMessage, setNewMessage, onSendMessage, isSending }) => {
  const t = useTranslation();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold mb-6">Case Messages</h3>
      
      {/* Messages List */}
      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4" />
            <p>No messages in this case yet.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                message.isFromUser 
                  ? 'bg-blue-50 ml-8 border-l-4 border-blue-500' 
                  : 'bg-gray-50 mr-8 border-l-4 border-green-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">
                  {message.isFromUser ? 'User' : message.sender_name || 'Agent'}
                </span>
                <span className="text-xs text-gray-500">
                  {message.timeAgo || new Date(message.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-700">{message.message}</p>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="border-t pt-4">
        <div className="flex space-x-4">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your response to the user..."
            rows={3}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSending}
          />
          <button
            onClick={onSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center space-x-2"
          >
            {isSending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{isSending ? 'Sending...' : 'Send'}</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Your response will be sent securely to the user and logged in the case history.
        </p>
      </div>
    </div>
  );
};

// AI Responses Tab Component
const AIResponsesTab = ({ responses, onUseResponse }) => {
  const t = useTranslation();

  if (!responses || responses.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <Brain className="w-12 h-12 mx-auto mb-4 text-purple-400" />
        <p className="text-gray-500">No AI response suggestions available for this case.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Brain className="w-6 h-6 text-purple-600 mr-2" />
          <h3 className="text-xl font-bold">AI Response Suggestions</h3>
        </div>
        
        <div className="space-y-4">
          {responses.map((response, index) => (
            <div key={index} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-800 mb-2">{response.category}</h4>
                  <p className="text-sm text-purple-600 mb-3">{response.context}</p>
                </div>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                  {response.confidence}% confidence
                </span>
              </div>
              
              <div className="bg-white border border-purple-200 rounded p-3 mb-3">
                <p className="text-gray-700">{response.message}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-purple-600">
                  <span>Tone: {response.tone}</span>
                  <span>Length: {response.length}</span>
                  {response.followUpSuggested && (
                    <span className="bg-purple-100 px-2 py-1 rounded">Follow-up suggested</span>
                  )}
                </div>
                <button
                  onClick={() => onUseResponse(response)}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
                >
                  Use This Response
                </button>
              </div>
              
              {response.alternatives && response.alternatives.length > 0 && (
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <p className="text-xs text-purple-600 mb-2">Alternative suggestions:</p>
                  <div className="space-y-2">
                    {response.alternatives.map((alt, altIndex) => (
                      <div key={altIndex} className="text-sm text-gray-600 bg-white p-2 rounded border">
                        {alt}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Case Timeline Tab Component
const CaseTimelineTab = ({ caseDetails }) => {
  const t = useTranslation();
  
  // Mock timeline data - in real app this would come from the case details
  const timeline = caseDetails.timeline || [
    {
      id: 1,
      status: 'Report Submitted',
      description: 'Initial report submitted through SafeVoice portal',
      timestamp: caseDetails.submitted_at,
      timeAgo: '2 hours ago',
      type: 'system',
      actor: 'System'
    },
    {
      id: 2,
      status: 'AI Analysis Complete',
      description: `Report analyzed and assigned to ${caseDetails.department} with ${caseDetails.ai_assignment_confidence}% confidence`,
      timestamp: caseDetails.submitted_at,
      timeAgo: '2 hours ago',
      type: 'ai',
      actor: 'AI System'
    },
    {
      id: 3,
      status: 'Case Assigned',
      description: `Case assigned to ${caseDetails.assigned_agent || 'Available Agent'}`,
      timestamp: caseDetails.submitted_at,
      timeAgo: '1 hour ago',
      type: 'assignment',
      actor: 'System'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold mb-6">Case Timeline</h3>
      
      <div className="space-y-6">
        {timeline.map((event, index) => (
          <div key={event.id} className="flex items-start space-x-4">
            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full ${
                event.type === 'ai' ? 'bg-purple-500' :
                event.type === 'system' ? 'bg-blue-500' :
                event.type === 'assignment' ? 'bg-green-500' :
                event.type === 'message' ? 'bg-yellow-500' :
                event.type === 'status_change' ? 'bg-orange-500' :
                'bg-gray-500'
              }`} />
              {index < timeline.length - 1 && (
                <div className="w-0.5 h-12 bg-gray-300 mt-2" />
              )}
            </div>
            
            <div className="flex-1 pb-8">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{event.status}</h4>
                <span className="text-sm text-gray-500">{event.timeAgo}</span>
              </div>
              
              <p className="text-gray-600 text-sm mb-2">{event.description}</p>
              
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <span>By: {event.actor}</span>
                {event.type === 'ai' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                    <Brain className="w-3 h-3 mr-1" />
                    AI Analysis
                  </span>
                )}
                {event.confidence && (
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {event.confidence}% confidence
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Case Actions Tab Component
const CaseActionsTab = ({ caseDetails, newStatus, setNewStatus, newNotes, setNewNotes, onStatusUpdate }) => {
  const t = useTranslation();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async () => {
    setIsUpdating(true);
    try {
      await onStatusUpdate();
    } finally {
      setIsUpdating(false);
    }
  };

  const statusOptions = [
    { value: 'submitted', label: 'Submitted', color: 'gray' },
    { value: 'acknowledged', label: 'Acknowledged', color: 'blue' },
    { value: 'under_review', label: 'Under Review', color: 'yellow' },
    { value: 'pending_user', label: 'Pending User Response', color: 'orange' },
    { value: 'resolved', label: 'Resolved', color: 'green' },
    { value: 'closed', label: 'Closed', color: 'gray' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'gray' },
    { value: 'medium', label: 'Medium', color: 'blue' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'critical', label: 'Critical', color: 'red' }
  ];

  return (
    <div className="space-y-6">
      {/* Status Update */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6">Update Case Status</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Current Status</label>
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
              caseDetails.status === 'resolved' ? 'bg-green-100 text-green-800' :
              caseDetails.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
              caseDetails.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {t(caseDetails.status?.replace('_', ' '))}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">New Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select new status</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status Update Notes</label>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Add notes about this status change..."
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleStatusUpdate}
            disabled={!newStatus || isUpdating}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center space-x-2"
          >
            {isUpdating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            <span>{isUpdating ? 'Updating...' : 'Update Status'}</span>
          </button>
        </div>
      </div>

      {/* Case Assignment */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6">Case Assignment</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Current Agent</label>
            <p className="text-gray-700">{caseDetails.assigned_agent || 'Not assigned'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Reassign to Agent</label>
            <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">Select agent</option>
              <option value="agent1">Agent Smith</option>
              <option value="agent2">Agent Johnson</option>
              <option value="agent3">Agent Williams</option>
            </select>
          </div>

          <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Reassign Case</span>
          </button>
        </div>
      </div>

      {/* Priority Update */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6">Priority Management</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Current Priority</label>
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
              caseDetails.priority === 'critical' ? 'bg-red-100 text-red-800' :
              caseDetails.priority === 'high' ? 'bg-orange-100 text-orange-800' :
              caseDetails.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {t(caseDetails.priority)} Priority
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Update Priority</label>
            <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">Select priority</option>
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} Priority
                </option>
              ))}
            </select>
          </div>

          <button className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Update Priority</span>
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6">Quick Actions</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <button className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 text-left">
            <div className="flex items-center space-x-3">
              <Phone className="w-6 h-6 text-blue-600" />
              <div>
                <h4 className="font-semibold">Schedule Call</h4>
                <p className="text-sm text-gray-600">Set up a call with the user</p>
              </div>
            </div>
          </button>

          <button className="p-4 border border-green-200 rounded-lg hover:bg-green-50 text-left">
            <div className="flex items-center space-x-3">
              <Calendar className="w-6 h-6 text-green-600" />
              <div>
                <h4 className="font-semibold">Schedule Meeting</h4>
                <p className="text-sm text-gray-600">Arrange in-person meeting</p>
              </div>
            </div>
          </button>

          <button className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 text-left">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-purple-600" />
              <div>
                <h4 className="font-semibold">Generate Report</h4>
                <p className="text-sm text-gray-600">Create case summary report</p>
              </div>
            </div>
          </button>

          <button className="p-4 border border-red-200 rounded-lg hover:bg-red-50 text-left">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <h4 className="font-semibold">Escalate Case</h4>
                <p className="text-sm text-gray-600">Escalate to supervisor</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

// General Messaging Interface Component
const MessagingInterface = () => {
  const { setCurrentView, admin } = useContext(AppContext);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      // Mock data - in real app this would fetch from API
      setConversations([
        { id: 1, reportId: 'SAFE12345001', userName: 'User A', lastMessage: 'Thank you for your help', unreadCount: 0, lastActivity: '2 hours ago' },
        { id: 2, reportId: 'SAFE12345002', userName: 'User B', lastMessage: 'I need more information', unreadCount: 2, lastActivity: '1 day ago' }
      ]);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setCurrentView('admin-dashboard')}
                className="text-gray-600 hover:text-blue-600"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Messaging Interface</h1>
                <p className="text-sm text-gray-600">Communicate with users securely</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-6">Message Center</h3>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p>Loading conversations...</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Conversations List */}
              <div className="space-y-3">
                <h4 className="font-semibold">Active Conversations</h4>
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{conv.reportId}</span>
                      {conv.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate">{conv.lastMessage}</p>
                  </div>
                ))}
              </div>

              {/* Message Area */}
              <div className="lg:col-span-2">
                {selectedConversation ? (
                  <div>
                    <h4 className="font-semibold mb-4">{selectedConversation.reportId}</h4>
                    <div className="border border-gray-200 rounded-lg p-4 h-64 overflow-y-auto mb-4">
                      <p className="text-gray-500 text-center">Select a conversation to view messages</p>
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 p-2 border border-gray-300 rounded-lg"
                      />
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        Send
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// File Management Component
const FileManagement = () => {
  const { setCurrentView } = useContext(AppContext);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      // Mock data - in real app this would fetch from API
      setFiles([
        { id: 1, name: 'evidence_photo.jpg', type: 'image', size: 1024000, uploadDate: '2024-01-15', reportId: 'SAFE12345001' },
        { id: 2, name: 'witness_statement.pdf', type: 'document', size: 2048000, uploadDate: '2024-01-15', reportId: 'SAFE12345002' }
      ]);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setCurrentView('admin-dashboard')}
                className="text-gray-600 hover:text-blue-600"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">File Management</h1>
                <p className="text-sm text-gray-600">Manage evidence and case files</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-6">Case Files</h3>
          
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p>Loading files...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map(file => (
                <div key={file.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-semibold">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • {file.reportId} • {file.uploadDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-blue-600 hover:text-blue-800">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SafeVoiceApp;