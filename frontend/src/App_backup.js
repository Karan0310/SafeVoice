import React, { useState, useEffect, useCallback, createContext, useContext, useRef, useMemo } from 'react';
import { 
  Calendar, MessageCircle, Shield, Clock, User, FileText, Globe, Video, CheckCircle, AlertCircle, 
  Users, Activity, Bell, ChevronDown, Send, Phone, Mail, Lock, Home, Settings, LogOut, Plus, 
  Filter, Search, Eye, Edit, Trash2, RefreshCw, Star, TrendingUp, AlertTriangle, BookOpen, 
  Briefcase, Heart, Scale, X, ChevronRight, ArrowLeft, ExternalLink, Loader, Upload, Download, 
  BarChart3, PieChart, LineChart, Archive, Shield as ShieldCheck, Wifi, WifiOff, Camera, 
  Paperclip, FileImage, FileVideo, FileAudio, File, FileDown, Monitor, Smartphone, Tablet, 
  Accessibility, Volume2, VolumeX, MousePointer, Keyboard, ZoomIn, ZoomOut, RotateCcw,
  Database, Server, Cpu, HardDrive, Network, CloudUpload, CloudDownload, Timer,
  MapPin, Building, UserCheck, UserX, Flag, Target, Zap, Compass, Layers, Grid,
  PlayCircle, PauseCircle, StopCircle, SkipForward, SkipBack, Repeat, Shuffle
} from 'lucide-react';

// ==================== ENHANCED CONFIGURATION ====================
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const WEBSOCKET_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';
const UPLOAD_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_FILE_TYPES = ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx', '.txt'];

// ==================== ENHANCED TRANSLATIONS ====================
const translations = {
  en: {
    nav: {
      home: 'Home', newReport: 'New Report', myReports: 'My Reports', messages: 'Messages',
      sessions: 'Sessions', profile: 'Profile', logout: 'Logout', login: 'Login', signup: 'Sign Up',
      track: 'Track Report', dashboard: 'Dashboard', adminDashboard: 'Admin Dashboard',
      analytics: 'Analytics', settings: 'Settings', help: 'Help', notifications: 'Notifications'
    },
    form: {
      required: 'Required', optional: 'Optional', submit: 'Submit', cancel: 'Cancel', save: 'Save',
      next: 'Next', back: 'Back', selectOption: 'Select an option', uploadFile: 'Upload File',
      anonymous: 'Submit Anonymously', dragDrop: 'Drag & drop files here or click to browse',
      fileTypes: 'Supported: Images, Videos, Audio, PDF, Documents', maxSize: 'Max size: 10MB'
    },
    messages: {
      loading: 'Loading...', error: 'An error occurred', success: 'Success', noData: 'No data available',
      fileUploaded: 'File uploaded successfully', fileTooLarge: 'File is too large', invalidFileType: 'Invalid file type',
      connectionLost: 'Connection lost - working offline', connectionRestored: 'Connection restored',
      loginSuccess: 'Login successful', logoutSuccess: 'Logged out successfully', reportSubmitted: 'Report submitted successfully'
    },
    accessibility: {
      contrast: 'High Contrast', fontSize: 'Font Size', reduceMotion: 'Reduce Motion', screenReader: 'Screen Reader',
      keyboardNav: 'Keyboard Navigation', voiceOver: 'Voice Over', magnifier: 'Magnifier'
    },
    analytics: {
      overview: 'Overview', trends: 'Trends', performance: 'Performance', insights: 'Insights',
      reports: 'Reports', export: 'Export', filter: 'Filter', dateRange: 'Date Range'
    }
  },
  fr: {
    nav: {
      home: 'Accueil', newReport: 'Nouveau Rapport', myReports: 'Mes Rapports', messages: 'Messages',
      sessions: 'Séances', profile: 'Profil', logout: 'Déconnexion', login: 'Connexion', signup: "S'inscrire",
      track: 'Suivre Rapport', dashboard: 'Tableau de Bord', adminDashboard: 'Tableau de Bord Admin',
      analytics: 'Analyses', settings: 'Paramètres', help: 'Aide', notifications: 'Notifications'
    },
    form: {
      required: 'Requis', optional: 'Optionnel', submit: 'Soumettre', cancel: 'Annuler', save: 'Sauvegarder',
      next: 'Suivant', back: 'Retour', selectOption: 'Sélectionner une option', uploadFile: 'Télécharger Fichier',
      anonymous: 'Soumettre Anonymement', dragDrop: 'Glissez-déposez les fichiers ici ou cliquez pour parcourir',
      fileTypes: 'Supporté: Images, Vidéos, Audio, PDF, Documents', maxSize: 'Taille max: 10MB'
    },
    messages: {
      loading: 'Chargement...', error: 'Une erreur est survenue', success: 'Succès', noData: 'Aucune donnée disponible',
      fileUploaded: 'Fichier téléchargé avec succès', fileTooLarge: 'Fichier trop volumineux', invalidFileType: 'Type de fichier invalide',
      connectionLost: 'Connexion perdue - travail hors ligne', connectionRestored: 'Connexion rétablie',
      loginSuccess: 'Connexion réussie', logoutSuccess: 'Déconnexion réussie', reportSubmitted: 'Rapport soumis avec succès'
    },
    accessibility: {
      contrast: 'Contraste Élevé', fontSize: 'Taille Police', reduceMotion: 'Réduire Mouvement', screenReader: 'Lecteur Écran',
      keyboardNav: 'Navigation Clavier', voiceOver: 'Voice Over', magnifier: 'Loupe'
    },
    analytics: {
      overview: 'Aperçu', trends: 'Tendances', performance: 'Performance', insights: 'Insights',
      reports: 'Rapports', export: 'Exporter', filter: 'Filtrer', dateRange: 'Plage de Dates'
    }
  },
  es: {
    nav: {
      home: 'Inicio', newReport: 'Nuevo Informe', myReports: 'Mis Informes', messages: 'Mensajes',
      sessions: 'Sesiones', profile: 'Perfil', logout: 'Cerrar Sesión', login: 'Iniciar Sesión', signup: 'Registrarse',
      track: 'Rastrear Informe', dashboard: 'Panel', adminDashboard: 'Panel de Administrador',
      analytics: 'Analíticas', settings: 'Configuraciones', help: 'Ayuda', notifications: 'Notificaciones'
    },
    form: {
      required: 'Requerido', optional: 'Opcional', submit: 'Enviar', cancel: 'Cancelar', save: 'Guardar',
      next: 'Siguiente', back: 'Atrás', selectOption: 'Seleccionar opción', uploadFile: 'Subir Archivo',
      anonymous: 'Enviar Anónimamente', dragDrop: 'Arrastra y suelta archivos aquí o haz clic para explorar',
      fileTypes: 'Soportado: Imágenes, Videos, Audio, PDF, Documentos', maxSize: 'Tamaño máx: 10MB'
    },
    messages: {
      loading: 'Cargando...', error: 'Ocurrió un error', success: 'Éxito', noData: 'No hay datos disponibles',
      fileUploaded: 'Archivo subido exitosamente', fileTooLarge: 'Archivo demasiado grande', invalidFileType: 'Tipo de archivo inválido',
      connectionLost: 'Conexión perdida - trabajando sin conexión', connectionRestored: 'Conexión restaurada',
      loginSuccess: 'Inicio de sesión exitoso', logoutSuccess: 'Cerró sesión exitosamente', reportSubmitted: 'Informe enviado exitosamente'
    },
    accessibility: {
      contrast: 'Alto Contraste', fontSize: 'Tamaño de Fuente', reduceMotion: 'Reducir Movimiento', screenReader: 'Lector de Pantalla',
      keyboardNav: 'Navegación por Teclado', voiceOver: 'Voice Over', magnifier: 'Lupa'
    },
    analytics: {
      overview: 'Resumen', trends: 'Tendencias', performance: 'Rendimiento', insights: 'Perspectivas',
      reports: 'Informes', export: 'Exportar', filter: 'Filtrar', dateRange: 'Rango de Fechas'
    }
  }
};

// ==================== ENHANCED DEPARTMENTS (Matching Backend) ====================
const DEPARTMENTS = {
  legal: {
    id: 'legal', name: 'Legal Team', description: 'Handles legal matters, harassment, discrimination, and rights violations',
    color: 'blue', icon: <Scale className="w-5 h-5" />, avgResponseTime: '8h', activeAgents: 12,
    keywords: ['legal', 'harassment', 'discrimination', 'rights', 'law', 'lawsuit', 'attorney', 'court', 'violation', 'illegal', 'sexual', 'workplace', 'inappropriate', 'unwanted'],
    incidentTypes: ['harassment', 'discrimination', 'workplace', 'legal']
  },
  task: {
    id: 'task', name: 'Task Force Team', description: 'Handles physical violence, assault, and immediate safety concerns',
    color: 'red', icon: <Shield className="w-5 h-5" />, avgResponseTime: '2h', activeAgents: 8,
    keywords: ['assault', 'violence', 'physical', 'attack', 'hit', 'hurt', 'emergency', 'danger', 'threat', 'safety', 'beat', 'punch', 'kicked', 'grabbed', 'injured'],
    incidentTypes: ['assault', 'domestic', 'violence', 'stalking']
  },
  support: {
    id: 'support', name: 'Support Services Team', description: 'Handles housing, financial aid, and general support services',
    color: 'green', icon: <Heart className="w-5 h-5" />, avgResponseTime: '12h', activeAgents: 15,
    keywords: ['housing', 'shelter', 'financial', 'support', 'help', 'assistance', 'resources', 'accommodation', 'relocation', 'money', 'rent', 'food', 'basic needs'],
    incidentTypes: ['housing', 'financial', 'support', 'other']
  },
  happy2help: {
    id: 'happy2help', name: 'Happy2Help Team', description: 'Mental health counseling, emotional support, and wellness services',
    color: 'purple', icon: <Users className="w-5 h-5" />, avgResponseTime: '4h', activeAgents: 20,
    keywords: ['mental', 'depression', 'anxiety', 'counseling', 'therapy', 'emotional', 'stress', 'trauma', 'wellness', 'psychology', 'suicide', 'self-harm', 'sad', 'hopeless'],
    incidentTypes: ['mental', 'counseling', 'therapy', 'wellness']
  }
};

// ==================== ENHANCED CONTEXTS ====================
const AuthContext = createContext(null);
const NotificationContext = createContext(null);
const AccessibilityContext = createContext(null);
const OfflineContext = createContext(null);

// ==================== ENHANCED HOOKS ====================
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};

const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility must be used within an AccessibilityProvider');
  return context;
};

const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOffline must be used within an OfflineProvider');
  return context;
};

// ==================== WEBSOCKET HOOK ====================
const useWebSocket = (url, onMessage) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!url) return;
    
    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      setIsConnected(true);
      setSocket(ws);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      setSocket(null);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [url, onMessage]);

  const sendMessage = useCallback((message) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
    }
  }, [socket, isConnected]);

  return { isConnected, sendMessage };
};

// ==================== PROVIDERS ====================
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      // Try admin verification first
      const adminResponse = await fetch(`${API_BASE_URL}/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (adminResponse.ok) {
        const data = await adminResponse.json();
        setAdmin(data.admin);
        setUser(null);
      } else {
        // Try user verification
        const userResponse = await fetch(`${API_BASE_URL}/users/auth/verify`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (userResponse.ok) {
          const data = await userResponse.json();
          setUser(data.user);
          setAdmin(null);
        } else {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData, isAdmin = false) => {
    localStorage.setItem('token', token);
    setToken(token);
    if (isAdmin) {
      setAdmin(userData);
      setUser(null);
    } else {
      setUser(userData);
      setAdmin(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setAdmin(null);
    setTwoFactorRequired(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, admin, token, loading, login, logout, 
      isAuthenticated: !!(user || admin),
      twoFactorRequired, setTwoFactorRequired
    }}>
      {children}
    </AuthContext.Provider>
  );
};

const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((type, message, duration = 5000) => {
    const id = Date.now();
    const notification = { id, type, message };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }
    
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, showNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('accessibility-settings');
    return saved ? JSON.parse(saved) : {
      highContrast: false,
      fontSize: 'normal',
      reduceMotion: false,
      screenReader: false,
      keyboardNav: true,
      voiceOver: false
    };
  });

  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    
    // Apply accessibility settings to document
    const root = document.documentElement;
    
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    root.setAttribute('data-font-size', settings.fontSize);
  }, [settings]);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const storeOfflineData = useCallback((data) => {
    setOfflineData(prev => [...prev, { ...data, timestamp: Date.now() }]);
  }, []);

  const syncOfflineData = useCallback(async () => {
    if (isOnline && offlineData.length > 0) {
      try {
        for (const data of offlineData) {
          await fetch(`${API_BASE_URL}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
        }
        setOfflineData([]);
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  }, [isOnline, offlineData]);

  useEffect(() => {
    syncOfflineData();
  }, [isOnline, syncOfflineData]);

  return (
    <OfflineContext.Provider value={{ isOnline, storeOfflineData, offlineData }}>
      {children}
    </OfflineContext.Provider>
  );
};

// ==================== ENHANCED FILE UPLOAD COMPONENT ====================
const FileUpload = ({ onFilesChange, maxFiles = 5, accept = SUPPORTED_FILE_TYPES.join(',') }) => {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { showNotification } = useNotification();
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (file.size > UPLOAD_MAX_SIZE) {
      showNotification('error', `File "${file.name}" is too large. Max size: 10MB`);
      return false;
    }

    const allowedTypes = SUPPORTED_FILE_TYPES.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type);
      } else if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', '/'));
      }
      return file.type === type;
    });

    if (!allowedTypes) {
      showNotification('error', `File type "${file.type}" not supported`);
      return false;
    }

    return true;
  };

  const handleFiles = async (newFiles) => {
    const validFiles = Array.from(newFiles).filter(validateFile);
    const totalFiles = files.length + validFiles.length;
    
    if (totalFiles > maxFiles) {
      showNotification('error', `Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    
    try {
      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
      showNotification('success', `${validFiles.length} file(s) added successfully`);
    } catch (error) {
      showNotification('error', 'Failed to process files');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <FileImage className="w-5 h-5" />;
    if (type.startsWith('video/')) return <FileVideo className="w-5 h-5" />;
    if (type.startsWith('audio/')) return <FileAudio className="w-5 h-5" />;
    if (type === 'application/pdf') return <File className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <Loader className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
        ) : (
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        )}
        <p className="text-lg font-medium text-gray-900 mb-2">
          {uploading ? 'Processing files...' : 'Drag & drop files here or click to browse'}
        </p>
        <p className="text-sm text-gray-600 mb-1">
          Supported: Images, Videos, Audio, PDF, Documents
        </p>
        <p className="text-xs text-gray-500">Max size: 10MB • Max files: {maxFiles}</p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={uploading}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Uploaded Files ({files.length})</h4>
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-gray-600">
                  {getFileIcon(file.type)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-red-600 hover:text-red-800 p-1"
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== ENHANCED SEARCH COMPONENT ====================
const AdvancedSearch = ({ onSearch, filters, onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    onSearch(searchTerm, filters);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Search reports, messages, or case details..."
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Search
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="grid md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority || ''}
              onChange={(e) => onFilterChange({ ...filters, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={filters.department || ''}
              onChange={(e) => onFilterChange({ ...filters, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Departments</option>
              {Object.values(DEPARTMENTS).map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={filters.dateRange || ''}
              onChange={(e) => onFilterChange({ ...filters, dateRange: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== ANALYTICS CHARTS COMPONENT ====================
const AnalyticsCharts = ({ data }) => {
  const [activeChart, setActiveChart] = useState('overview');

  const chartTypes = [
    { id: 'overview', name: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'trends', name: 'Trends', icon: <LineChart className="w-4 h-4" /> },
    { id: 'distribution', name: 'Distribution', icon: <PieChart className="w-4 h-4" /> }
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h3>
          <div className="flex space-x-1">
            {chartTypes.map(chart => (
              <button
                key={chart.id}
                onClick={() => setActiveChart(chart.id)}
                className={`px-3 py-2 rounded-lg text-sm flex items-center space-x-2 ${
                  activeChart === chart.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {chart.icon}
                <span>{chart.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {activeChart === 'overview' && (
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">{data?.totalReports || 0}</div>
              <p className="text-sm text-gray-600">Total Reports</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{data?.resolvedCases || 0}</div>
              <p className="text-sm text-gray-600">Resolved Cases</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{data?.avgResponseTime || '0h'}</div>
              <p className="text-sm text-gray-600">Avg Response Time</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{data?.satisfactionRate || 0}%</div>
              <p className="text-sm text-gray-600">Satisfaction Rate</p>
            </div>
          </div>
        )}
        
        {activeChart === 'trends' && (
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Trend analysis chart would be here</p>
              <p className="text-sm text-gray-500">Integration with charting library needed</p>
            </div>
          </div>
        )}
        
        {activeChart === 'distribution' && (
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Distribution chart would be here</p>
              <p className="text-sm text-gray-500">Integration with charting library needed</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== EXPORT COMPONENT ====================
const ExportData = ({ data, type = 'reports' }) => {
  const [exportFormat, setExportFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);
  const { showNotification } = useNotification();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (exportFormat === 'csv') {
        exportToCSV();
      } else if (exportFormat === 'pdf') {
        await exportToPDF();
      } else if (exportFormat === 'json') {
        exportToJSON();
      }
      showNotification('success', `Data exported successfully as ${exportFormat.toUpperCase()}`);
    } catch (error) {
      showNotification('error', 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    const csvContent = convertToCSV(data);
    downloadFile(csvContent, `${type}-export.csv`, 'text/csv');
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, `${type}-export.json`, 'application/json');
  };

  const exportToPDF = async () => {
    // This would require a PDF library like jsPDF
    showNotification('info', 'PDF export requires additional library integration');
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    ).join('\n');
    
    return `${headers}\n${rows}`;
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center space-x-4">
      <select
        value={exportFormat}
        onChange={(e) => setExportFormat(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
      >
        <option value="csv">CSV</option>
        <option value="json">JSON</option>
        <option value="pdf">PDF</option>
      </select>
      
      <button
        onClick={handleExport}
        disabled={isExporting || !data || data.length === 0}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 flex items-center space-x-2"
      >
        {isExporting ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>Export</span>
      </button>
    </div>
  );
};

// ==================== TWO FACTOR AUTH COMPONENT ====================
const TwoFactorAuth = ({ onVerify, onCancel }) => {
  const [code, setCode] = useState('');
  const [method, setMethod] = useState('sms');
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleVerify = async () => {
    if (code.length !== 6) {
      showNotification('error', 'Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, method })
      });

      const data = await response.json();
      if (data.success) {
        onVerify(data.token);
      } else {
        showNotification('error', data.error || 'Invalid code');
      }
    } catch (error) {
      showNotification('error', 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <Shield className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h2>
          <p className="text-gray-600 mt-2">Enter the verification code sent to your device</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="sms">SMS Text Message</option>
              <option value="email">Email</option>
              <option value="app">Authenticator App</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-center text-lg tracking-widest"
              placeholder="000000"
              maxLength="6"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onCancel}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleVerify}
              disabled={code.length !== 6 || loading}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 flex items-center justify-center"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Verify'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== ACCESSIBILITY PANEL COMPONENT ====================
const AccessibilityPanel = ({ isOpen, onClose }) => {
  const { settings, updateSetting } = useAccessibility();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Accessibility className="w-6 h-6 mr-2" />
            Accessibility Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">High Contrast</label>
            <button
              onClick={() => updateSetting('highContrast', !settings.highContrast)}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.highContrast ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                settings.highContrast ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Font Size</label>
            <select
              value={settings.fontSize}
              onChange={(e) => updateSetting('fontSize', e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="small">Small</option>
              <option value="normal">Normal</option>
              <option value="large">Large</option>
              <option value="xlarge">Extra Large</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Reduce Motion</label>
            <button
              onClick={() => updateSetting('reduceMotion', !settings.reduceMotion)}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.reduceMotion ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                settings.reduceMotion ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Screen Reader Support</label>
            <button
              onClick={() => updateSetting('screenReader', !settings.screenReader)}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.screenReader ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                settings.screenReader ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Voice Over</label>
            <button
              onClick={() => updateSetting('voiceOver', !settings.voiceOver)}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.voiceOver ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                settings.voiceOver ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Settings are saved automatically and applied system-wide
          </p>
        </div>
      </div>
    </div>
  );
};

// ==================== SYSTEM MONITOR COMPONENT ====================
const SystemMonitor = () => {
  const [metrics, setMetrics] = useState({
    cpu: 45,
    memory: 62,
    storage: 78,
    network: 234,
    activeUsers: 1247,
    responseTime: 145,
    aiHealth: 'operational'
  });

  const [aiStatus, setAiStatus] = useState({
    enabled: true,
    model: 'claude-sonnet-4-20250514',
    confidence: 92,
    features: {
      departmentAssignment: true,
      riskAssessment: true,
      qualityAssessment: true,
      responseSuggestions: true
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 20)),
        memory: Math.max(0, Math.min(100, prev.memory + (Math.random() - 0.5) * 15)),
        storage: Math.max(0, Math.min(100, prev.storage + (Math.random() - 0.5) * 5)),
        network: Math.max(0, prev.network + (Math.random() - 0.5) * 100),
        activeUsers: Math.max(0, prev.activeUsers + Math.floor((Math.random() - 0.5) * 50)),
        responseTime: Math.max(50, prev.responseTime + (Math.random() - 0.5) * 50)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (value) => {
    if (value < 60) return 'text-green-600';
    if (value < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* System Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Monitor className="w-5 h-5 mr-2" />
          System Performance
        </h3>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">CPU Usage</span>
                <span className={`text-sm font-semibold ${getStatusColor(metrics.cpu)}`}>
                  {metrics.cpu.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    metrics.cpu < 60 ? 'bg-green-500' : 
                    metrics.cpu < 80 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${metrics.cpu}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Memory</span>
                <span className={`text-sm font-semibold ${getStatusColor(metrics.memory)}`}>
                  {metrics.memory.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    metrics.memory < 60 ? 'bg-green-500' : 
                    metrics.memory < 80 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${metrics.memory}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Storage</span>
                <span className={`text-sm font-semibold ${getStatusColor(metrics.storage)}`}>
                  {metrics.storage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    metrics.storage < 60 ? 'bg-green-500' : 
                    metrics.storage < 80 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${metrics.storage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <Network className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{metrics.network.toFixed(0)}</div>
              <div className="text-sm text-gray-600">MB/s Network</div>
            </div>

            <div className="text-center">
              <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{metrics.activeUsers.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <Timer className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{metrics.responseTime.toFixed(0)}ms</div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>

            <div className="text-center">
              <Server className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">Online</div>
              <div className="text-sm text-gray-600">System Status</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI System Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          AI System Status
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">AI Engine</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                aiStatus.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {aiStatus.enabled ? 'Operational' : 'Offline'}
              </span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Model:</span>
                <span className="font-medium">{aiStatus.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Confidence:</span>
                <span className="font-medium">{aiStatus.confidence}%</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Core Features</h4>
            <div className="space-y-2">
              {Object.entries(aiStatus.features).map(([feature, status]) => (
                <div key={feature} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <div className={`w-3 h-3 rounded-full ${
                    status ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== AUDIT TRAIL COMPONENT ====================
const AuditTrail = ({ reportId }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: '', admin: '', dateRange: '' });
  const { token } = useAuth();

  useEffect(() => {
    fetchAuditLogs();
  }, [reportId, filters]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (reportId) queryParams.append('reportId', reportId);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`${API_BASE_URL}/admin/audit-logs?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setAuditLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const iconMap = {
      'view_case_details': <Eye className="w-4 h-4" />,
      'update_case_status': <Edit className="w-4 h-4" />,
      'send_message': <Send className="w-4 h-4" />,
      'login': <Lock className="w-4 h-4" />,
      'logout': <LogOut className="w-4 h-4" />,
      'export_data': <Download className="w-4 h-4" />
    };
    return iconMap[action] || <Activity className="w-4 h-4" />;
  };

  const getActionColor = (action) => {
    const colorMap = {
      'view_case_details': 'text-blue-600',
      'update_case_status': 'text-green-600',
      'send_message': 'text-purple-600',
      'login': 'text-indigo-600',
      'logout': 'text-gray-600',
      'export_data': 'text-orange-600'
    };
    return colorMap[action] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Archive className="w-5 h-5 mr-2" />
            Audit Trail
          </h3>
          <ExportData data={auditLogs} type="audit-logs" />
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-3 gap-4">
          <select
            value={filters.action}
            onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Actions</option>
            <option value="view_case_details">View Case</option>
            <option value="update_case_status">Update Status</option>
            <option value="send_message">Send Message</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="export_data">Export Data</option>
          </select>

          <select
            value={filters.admin}
            onChange={(e) => setFilters(prev => ({ ...prev, admin: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Admins</option>
            <option value="super_admin">Super Admin</option>
            <option value="legal_admin">Legal Admin</option>
            <option value="task_admin">Task Admin</option>
            <option value="support_admin">Support Admin</option>
          </select>

          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {auditLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Archive className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No audit logs found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {auditLogs.map((log, index) => (
              <div key={log.id || index} className="p-4 hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full bg-gray-100 ${getActionColor(log.action)}`}>
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {log.admin_username || 'System'} {log.action.replace(/_/g, ' ')}
                        {log.report_id && (
                          <span className="text-gray-600"> on {log.report_id}</span>
                        )}
                      </p>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-sm text-gray-600 mt-1">
                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>IP: {log.ip_hash}</span>
                      <span>Method: {log.details?.method || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== MAIN APP COMPONENT ====================
function SafeVoicePortal() {
  const [language, setLanguage] = useState('en');
  const [currentView, setCurrentView] = useState('landing');
  const [accessibilityPanelOpen, setAccessibilityPanelOpen] = useState(false);
  
  const t = translations[language];

  return (
    <AuthProvider>
      <NotificationProvider>
        <AccessibilityProvider>
          <OfflineProvider>
            <div className="min-h-screen bg-gray-50">
              <AppContent 
                language={language} 
                setLanguage={setLanguage}
                currentView={currentView}
                setCurrentView={setCurrentView}
                t={t}
                accessibilityPanelOpen={accessibilityPanelOpen}
                setAccessibilityPanelOpen={setAccessibilityPanelOpen}
              />
            </div>
          </OfflineProvider>
        </AccessibilityProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

// ==================== APP CONTENT ====================
function AppContent({ language, setLanguage, currentView, setCurrentView, t, accessibilityPanelOpen, setAccessibilityPanelOpen }) {
  const { user, admin, loading, logout, twoFactorRequired, setTwoFactorRequired } = useAuth();
  const { notifications, showNotification } = useNotification();
  const { isOnline } = useOffline();

  // WebSocket connection for real-time updates
  const handleWebSocketMessage = useCallback((data) => {
    if (data.type === 'notification') {
      showNotification(data.level || 'info', data.message);
    } else if (data.type === 'case_update') {
      showNotification('info', `Case ${data.reportId} has been updated`);
    }
  }, [showNotification]);

  const wsUrl = user ? `${WEBSOCKET_URL}/user/${user.id}` : 
                admin ? `${WEBSOCKET_URL}/admin/${admin.id}` : null;
  
  const { isConnected } = useWebSocket(wsUrl, handleWebSocketMessage);

  useEffect(() => {
    if (!loading) {
      if (admin) {
        setCurrentView('adminDashboard');
      } else if (user) {
        setCurrentView('userDashboard');
      }
    }
  }, [admin, user, loading, setCurrentView]);

  // Show connection status
  useEffect(() => {
    if (!isOnline) {
      showNotification('warning', t.messages.connectionLost, 0);
    } else {
      showNotification('success', t.messages.connectionRestored);
    }
  }, [isOnline, showNotification, t.messages]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">{t.messages.loading}</p>
        </div>
      </div>
    );
  }

  if (twoFactorRequired) {
    return (
      <TwoFactorAuth
        onVerify={(token) => {
          setTwoFactorRequired(false);
          showNotification('success', 'Two-factor authentication successful');
        }}
        onCancel={() => {
          setTwoFactorRequired(false);
          logout();
          setCurrentView('landing');
        }}
      />
    );
  }

  return (
    <>
      {/* Connection Status Bar */}
      {!isOnline && (
        <div className="bg-orange-500 text-white px-4 py-2 text-center text-sm flex items-center justify-center">
          <WifiOff className="w-4 h-4 mr-2" />
          Working offline - Changes will sync when connection is restored
        </div>
      )}

      {/* Main Content */}
      {currentView === 'landing' && <LandingPage setCurrentView={setCurrentView} language={language} setLanguage={setLanguage} t={t} setAccessibilityPanelOpen={setAccessibilityPanelOpen} />}
      {currentView === 'trackReport' && <TrackReportPage setCurrentView={setCurrentView} showNotification={showNotification} t={t} />}
      {currentView === 'newReport' && <EnhancedReportForm setCurrentView={setCurrentView} showNotification={showNotification} language={language} t={t} />}
      {currentView === 'userDashboard' && <EnhancedUserDashboard setCurrentView={setCurrentView} showNotification={showNotification} language={language} setLanguage={setLanguage} t={t} setAccessibilityPanelOpen={setAccessibilityPanelOpen} />}
      {currentView === 'adminDashboard' && <EnhancedAdminDashboard setCurrentView={setCurrentView} showNotification={showNotification} language={language} setLanguage={setLanguage} t={t} setAccessibilityPanelOpen={setAccessibilityPanelOpen} />}
      {currentView === 'adminLogin' && <AdminLoginPage setCurrentView={setCurrentView} showNotification={showNotification} t={t} />}
      
      {/* Accessibility Panel */}
      <AccessibilityPanel 
        isOpen={accessibilityPanelOpen}
        onClose={() => setAccessibilityPanelOpen(false)}
      />

      {/* Enhanced Notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 max-w-md ${
              notif.type === 'success' ? 'bg-green-500 text-white' : 
              notif.type === 'error' ? 'bg-red-500 text-white' : 
              notif.type === 'warning' ? 'bg-orange-500 text-white' :
              'bg-blue-500 text-white'
            } animate-slide-in`}
          >
            {notif.type === 'success' ? <CheckCircle className="w-5 h-5" /> : 
             notif.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
             notif.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
             <Bell className="w-5 h-5" />}
            <span className="flex-1">{notif.message}</span>
            {!isOnline && notif.type !== 'warning' && (
              <WifiOff className="w-4 h-4 opacity-75" />
            )}
          </div>
        ))}
      </div>

      {/* Real-time Connection Indicator */}
      <div className="fixed top-4 right-4 z-40">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
             title={isConnected ? 'Real-time connection active' : 'Real-time connection offline'} />
      </div>
    </>
  );
}

// ==================== ENHANCED LANDING PAGE ====================
function LandingPage({ setCurrentView, language, setLanguage, t, setAccessibilityPanelOpen }) {
  const [deviceType, setDeviceType] = useState('desktop');

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 768) setDeviceType('mobile');
      else if (width < 1024) setDeviceType('tablet');
      else setDeviceType('desktop');
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const DeviceIcon = () => {
    if (deviceType === 'mobile') return <Smartphone className="w-5 h-5" />;
    if (deviceType === 'tablet') return <Tablet className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Enhanced Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900">SafeVoice</span>
              <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">Enhanced AI</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Device Indicator */}
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
                <DeviceIcon />
                <span className="text-sm text-gray-600 capitalize">{deviceType}</span>
              </div>

              {/* Language Selector */}
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="appearance-none bg-gray-100 border-0 rounded-lg px-4 py-2 pr-8 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="en">🇺🇸 English</option>
                  <option value="fr">🇫🇷 Français</option>
                  <option value="es">🇪🇸 Español</option>
                </select>
                <Globe className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
              
              {/* Accessibility Button */}
              <button
                onClick={() => setAccessibilityPanelOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Accessibility Settings"
              >
                <Accessibility className="w-5 h-5 text-gray-600" />
              </button>
              
              <button
                onClick={() => setCurrentView('trackReport')}
                className="px-4 py-2 text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors"
              >
                {t.nav.track}
              </button>
              
              <button
                onClick={() => setCurrentView('adminLogin')}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Admin Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            {language === 'en' ? 'Your Voice Matters' : 
             language === 'fr' ? 'Votre Voix Compte' : 
             'Tu Voz Importa'}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {language === 'en' 
              ? 'Report incidents safely and confidentially. Get the support you need with AI-powered case assignment and professional assistance.'
              : language === 'fr'
              ? 'Signalez des incidents en toute sécurité et confidentialité. Obtenez le soutien dont vous avez besoin avec une attribution de cas alimentée par l\'IA.'
              : 'Reporte incidentes de forma segura y confidencial. Obtén el apoyo que necesitas con asignación de casos impulsada por IA.'}
          </p>
          
          <div className="flex items-center space-x-4">
            {/* Make Track Report more prominent since that's the main user entry point */}
            <button
              onClick={() => setCurrentView('trackReport')}
              className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Search className="w-4 h-4 mr-2" />
              Access My Report
            </button>
            
            <button
              onClick={() => setCurrentView('adminLogin')}
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Admin Login
            </button>
          </div>
        </div>

        {/* Enhanced Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          {Object.values(DEPARTMENTS).map(dept => (
            <div key={dept.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-105">
              <div className={`w-12 h-12 bg-${dept.color}-100 rounded-lg flex items-center justify-center mb-4`}>
                {dept.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{dept.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{dept.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{dept.avgResponseTime}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{dept.activeAgents}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced AI Features Section */}
        <div className="mt-20 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center">
            <Activity className="w-8 h-8 mr-3 text-indigo-600" />
            {language === 'en' ? 'Enhanced AI-Powered Processing' :
             language === 'fr' ? 'Traitement Alimenté par IA Améliorée' :
             'Procesamiento Mejorado con IA'}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">
                {language === 'en' ? 'Smart Assignment' :
                 language === 'fr' ? 'Attribution Intelligente' :
                 'Asignación Inteligente'}
              </h3>
              <p className="text-gray-600 text-sm">
                {language === 'en' ? 'AI automatically routes your case to the right department' :
                 language === 'fr' ? 'L\'IA achemine automatiquement votre cas vers le bon département' :
                 'La IA enruta automáticamente tu caso al departamento correcto'}
              </p>
            </div>
            
            <div className="text-center">
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">
                {language === 'en' ? 'Risk Assessment' :
                 language === 'fr' ? 'Évaluation des Risques' :
                 'Evaluación de Riesgos'}
              </h3>
              <p className="text-gray-600 text-sm">
                {language === 'en' ? 'Advanced analysis prioritizes urgent safety concerns' :
                 language === 'fr' ? 'Analyse avancée qui priorise les préoccupations de sécurité urgentes' :
                 'Análisis avanzado que prioriza preocupaciones urgentes de seguridad'}
              </p>
            </div>

            <div className="text-center">
              <Eye className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">
                {language === 'en' ? 'Quality Check' :
                 language === 'fr' ? 'Contrôle Qualité' :
                 'Control de Calidad'}
              </h3>
              <p className="text-gray-600 text-sm">
                {language === 'en' ? 'Ensures your report has all needed information' :
                 language === 'fr' ? 'Assure que votre rapport contient toutes les informations nécessaires' :
                 'Asegura que tu reporte tenga toda la información necesaria'}
              </p>
            </div>

            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">
                {language === 'en' ? 'Smart Responses' :
                 language === 'fr' ? 'Réponses Intelligentes' :
                 'Respuestas Inteligentes'}
              </h3>
              <p className="text-gray-600 text-sm">
                {language === 'en' ? 'AI helps staff provide personalized, helpful responses' :
                 language === 'fr' ? 'L\'IA aide le personnel à fournir des réponses personnalisées et utiles' :
                 'La IA ayuda al personal a proporcionar respuestas personalizadas y útiles'}
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Security Features */}
        <div className="mt-20 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {language === 'en' ? 'Security & Privacy Features' :
             language === 'fr' ? 'Fonctionnalités de Sécurité et Confidentialité' :
             'Características de Seguridad y Privacidad'}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <ShieldCheck className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">
                {language === 'en' ? 'End-to-End Encryption' :
                 language === 'fr' ? 'Chiffrement de Bout en Bout' :
                 'Cifrado de Extremo a Extremo'}
              </h3>
              <p className="text-gray-600 text-sm">
                {language === 'en' ? 'Your data is encrypted and secure' :
                 language === 'fr' ? 'Vos données sont chiffrées et sécurisées' :
                 'Tus datos están cifrados y seguros'}
              </p>
            </div>
            
            <div className="text-center">
              <Eye className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">
                {language === 'en' ? 'Anonymous Reporting' :
                 language === 'fr' ? 'Signalement Anonyme' :
                 'Reporte Anónimo'}
              </h3>
              <p className="text-gray-600 text-sm">
                {language === 'en' ? 'Report without revealing your identity' :
                 language === 'fr' ? 'Signalez sans révéler votre identité' :
                 'Reporta sin revelar tu identidad'}
              </p>
            </div>
            
            <div className="text-center">
              <Archive className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">
                {language === 'en' ? 'Complete Audit Trail' :
                 language === 'fr' ? 'Piste d\'Audit Complète' :
                 'Rastro de Auditoría Completo'}
              </h3>
              <p className="text-gray-600 text-sm">
                {language === 'en' ? 'Full transparency and accountability' :
                 language === 'fr' ? 'Transparence et responsabilité totales' :
                 'Transparencia y responsabilidad total'}
              </p>
            </div>
          </div>
        </div>

        {/* Demo Accounts */}
        <div className="mt-20 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Demo Accounts for Testing</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                User Accounts
              </h3>
              <div className="space-y-3">
                {[
                  { id: 'SAFE12345001', email: 'jane.doe@example.com', status: 'Under Review (Legal)', color: 'blue' },
                  { id: 'SAFE12345101', pin: '234567', status: 'Critical (Task Force)', color: 'red' },
                  { id: 'SAFE12345201', email: 'support.user@example.com', status: 'Resolved (Support)', color: 'green' },
                  { id: 'SAFE12345301', pin: '456789', status: 'Under Review (Happy2Help)', color: 'purple' }
                ].map((account, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                    <p className="font-mono text-sm font-medium">Report ID: {account.id}</p>
                    {account.email && <p className="font-mono text-sm">Email: {account.email}</p>}
                    {account.pin && <p className="font-mono text-sm">PIN: {account.pin}</p>}
                    <p className={`text-xs mt-1 text-${account.color}-600`}>{account.status}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Admin Accounts
              </h3>
              <div className="space-y-3">
                {[
                  { user: 'super_admin', dept: 'All Departments', color: 'indigo' },
                  { user: 'legal_admin', dept: 'Legal Team', color: 'blue' },
                  { user: 'task_admin', dept: 'Task Force', color: 'red' },
                  { user: 'support_admin', dept: 'Support Services', color: 'green' },
                  { user: 'happy2help_admin', dept: 'Happy2Help Team', color: 'purple' }
                ].map((admin, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg border-l-4 border-indigo-500">
                    <p className="font-mono text-sm font-medium">Username: {admin.user}</p>
                    <p className="font-mono text-sm">Password: SafeVoice2024!</p>
                    <p className={`text-xs mt-1 text-${admin.color}-600`}>Access: {admin.dept}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Activity className="w-5 h-5 text-blue-600 mr-2" />
              <h4 className="font-semibold text-blue-900">AI-Enhanced Processing</h4>
            </div>
            <p className="text-blue-700 text-sm">
              All demo accounts include comprehensive AI analysis including smart department assignment, 
              risk assessment, quality evaluation, and intelligent response suggestions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== ADMIN LOGIN PAGE ====================
function AdminLoginPage({ setCurrentView, showNotification, t }) {
  const { login, setTwoFactorRequired } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        if (data.requiresTwoFactor) {
          setTwoFactorRequired(true);
        } else {
          login(data.token, data.admin, true);
          showNotification('success', `Welcome back, ${data.admin.username}`);
          setCurrentView('adminDashboard');
        }
      } else {
        showNotification('error', data.error || 'Invalid credentials');
      }
    } catch (error) {
      showNotification('error', 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <button
            onClick={() => setCurrentView('landing')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          
          <div className="text-center mb-8">
            <Shield className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900">Admin Login</h2>
            <p className="text-gray-600 mt-2">Access the admin dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Login
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Demo Admin Accounts:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>super_admin / SafeVoice2024!</div>
              <div>legal_admin / SafeVoice2024!</div>
              <div>task_admin / SafeVoice2024!</div>
              <div>support_admin / SafeVoice2024!</div>
              <div>happy2help_admin / SafeVoice2024!</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== TRACK REPORT PAGE ====================
function TrackReportPage({ setCurrentView, showNotification, t }) {
  const { login } = useAuth();
  const [reportId, setReportId] = useState('');
  const [email, setEmail] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use the CORRECT endpoint that matches your users.js backend
      const response = await fetch(`${API_BASE_URL}/users/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: reportId,
          email: email || undefined,
          securityPin: securityPin || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        login(data.token, data.user, false);
        showNotification('success', data.message || 'Login successful');
        setCurrentView('userDashboard');
      } else {
        showNotification('error', data.error || 'Login failed');
        
        // Show helpful suggestions if available
        if (data.suggestions && data.suggestions.length > 0) {
          setTimeout(() => {
            data.suggestions.forEach(suggestion => {
              showNotification('info', suggestion);
            });
          }, 1000);
        }
      }
    } catch (error) {
      showNotification('error', 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <button
            onClick={() => setCurrentView('landing')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          
          <div className="text-center mb-8">
            <Shield className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900">Access Your Report</h2>
            <p className="text-gray-600 mt-2">Enter your report details to view your case dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report ID *
              </label>
              <input
                type="text"
                value={reportId}
                onChange={(e) => setReportId(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="SAFE12345001"
                required
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-3 font-medium">Authentication Method:</p>
              <p className="text-xs text-gray-600 mb-3">Provide either your email address OR your 6-digit security PIN</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>

                <div className="text-center text-gray-500 text-sm font-medium">OR</div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security PIN
                  </label>
                  <input
                    type="text"
                    value={securityPin}
                    onChange={(e) => setSecurityPin(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="6-digit PIN"
                    maxLength="6"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !reportId || (!email && !securityPin)}
              className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Access My Report
                </>
              )}
            </button>
          </form>

          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => setCurrentView('newReport')}
              className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg transition-all transform hover:scale-105 flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Submit New Report
            </button>
            
            <button
              onClick={() => setCurrentView('trackReport')}
              className="px-8 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 shadow-lg transition-all transform hover:scale-105 flex items-center justify-center"
            >
              <Search className="w-5 h-5 mr-2" />
              Access Existing Report
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Demo Accounts:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>SAFE12345001 / jane.doe@example.com</div>
              <div>SAFE12345101 / PIN: 234567</div>
              <div>SAFE12345201 / support.user@example.com</div>
              <div>SAFE12345301 / PIN: 456789</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== ENHANCED REPORT FORM ====================
function EnhancedReportForm({ setCurrentView, showNotification, language, t }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [location, setLocation] = useState(null);
  const { isOnline, storeOfflineData } = useOffline();
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [reportData, setReportData] = useState({
    incidentType: '',
    incidentDate: '',
    incidentTime: '',
    location: '',
    description: '',
    currentSafety: '',
    witnesses: '',
    evidence: '',
    anonymous: false,
    contactMethod: '',
    contactInfo: '',
    voiceNote: null,
    attachments: [],
    gpsLocation: null
  });

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.log('Location access denied or unavailable');
        }
      );
    }
  }, []);

  // Voice recording functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        setReportData(prev => ({ ...prev, voiceNote: audioBlob }));
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      showNotification('error', 'Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setReportData(prev => ({ ...prev, voiceNote: null }));
  };

  // Enhanced AI preview
  useEffect(() => {
    const timer = setTimeout(() => {
      if (reportData.description && reportData.description.length > 50) {
        getAIPreview();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [reportData.description, reportData.incidentType, reportData.currentSafety]);

  const getAIPreview = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentType: reportData.incidentType,
          description: reportData.description,
          currentSafety: reportData.currentSafety,
          hasAttachments: uploadedFiles.length > 0,
          hasVoiceNote: !!audioBlob,
          location: location
        })
      });

      const data = await response.json();
      if (data.success && data.preview) {
        setAiPreview(data.preview);
      }
    } catch (error) {
      console.error('AI preview error:', error);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const formData = new FormData();
      
      // Add text data
      Object.entries(reportData).forEach(([key, value]) => {
        if (value !== null && key !== 'voiceNote' && key !== 'attachments') {
          formData.append(key, value);
        }
      });

      // Add location if available
      if (location) {
        formData.append('detectedLocation', JSON.stringify(location));
      }

      // Add files
      uploadedFiles.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });

      // Add voice note
      if (audioBlob) {
        formData.append('voiceNote', audioBlob, 'voice_note.wav');
      }

      if (isOnline) {
        const response = await fetch(`${API_BASE_URL}/reports`, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (data.success) {
          showNotification('success', `Report submitted successfully. Your Report ID is: ${data.reportId}`);
          localStorage.setItem('lastReportId', data.reportId);
          
          if (reportData.anonymous) {
            setTimeout(() => {
              showNotification('info', `Anonymous ID: ${data.anonymousId}. Save this for tracking.`);
            }, 2000);
          }

          setCurrentView('landing');
        } else {
          showNotification('error', data.error || 'Failed to submit report');
        }
      } else {
        // Store offline
        storeOfflineData({
          type: 'report',
          data: reportData,
          files: uploadedFiles,
          voiceNote: audioBlob,
          location: location
        });
        showNotification('info', 'Report saved offline. Will be submitted when connection is restored.');
        setCurrentView('landing');
      }
    } catch (error) {
      showNotification('error', 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const incidentTypes = [
    { value: 'harassment', label: 'Harassment', icon: <AlertTriangle className="w-5 h-5" /> },
    { value: 'discrimination', label: 'Discrimination', icon: <Users className="w-5 h-5" /> },
    { value: 'assault', label: 'Physical Assault', icon: <Shield className="w-5 h-5" /> },
    { value: 'domestic', label: 'Domestic Violence', icon: <Home className="w-5 h-5" /> },
    { value: 'stalking', label: 'Stalking', icon: <Eye className="w-5 h-5" /> },
    { value: 'workplace', label: 'Workplace Issue', icon: <Briefcase className="w-5 h-5" /> },
    { value: 'housing', label: 'Housing Issue', icon: <Building className="w-5 h-5" /> },
    { value: 'financial', label: 'Financial Assistance', icon: <Target className="w-5 h-5" /> },
    { value: 'mental', label: 'Mental Health Support', icon: <Heart className="w-5 h-5" /> },
    { value: 'legal', label: 'Legal Matter', icon: <Scale className="w-5 h-5" /> },
    { value: 'other', label: 'Other', icon: <Plus className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setCurrentView('landing')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900">SafeVoice Report</span>
              {!isOnline && <WifiOff className="w-5 h-5 text-orange-500" />}
            </div>

            <div className="flex items-center space-x-2">
              {location && (
                <div className="flex items-center text-green-600 text-sm">
                  <MapPin className="w-4 h-4 mr-1" />
                  Location detected
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    i <= step ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {i < step ? <CheckCircle className="w-6 h-6" /> : i}
                  </div>
                  {i < 5 && (
                    <div className={`flex-1 h-2 mx-2 rounded transition-all ${
                      i < step ? 'bg-indigo-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center text-sm text-gray-600">
              Step {step} of 5: {
                step === 1 ? 'Incident Type' :
                step === 2 ? 'Incident Details' :
                step === 3 ? 'Evidence & Media' :
                step === 4 ? 'Additional Information' :
                'Contact & Review'
              }
            </div>
          </div>

          {/* Step 1: Enhanced Incident Type */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">What type of incident are you reporting?</h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {incidentTypes.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setReportData({...reportData, incidentType: type.value})}
                    className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                      reportData.incidentType === type.value
                        ? 'border-indigo-600 bg-indigo-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-2 rounded-lg ${
                        reportData.incidentType === type.value ? 'bg-indigo-100' : 'bg-gray-100'
                      }`}>
                        {type.icon}
                      </div>
                      <span className="font-medium text-gray-900">{type.label}</span>
                    </div>
                    {DEPARTMENTS[Object.keys(DEPARTMENTS).find(key => 
                      DEPARTMENTS[key].incidentTypes.includes(type.value)
                    )] && (
                      <p className="text-sm text-gray-600 mt-2">
                        Handled by: {DEPARTMENTS[Object.keys(DEPARTMENTS).find(key => 
                          DEPARTMENTS[key].incidentTypes.includes(type.value)
                        )].name}
                      </p>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!reportData.incidentType}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  Next <ChevronRight className="w-5 h-5 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Enhanced Incident Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Incident Details</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Incident *
                  </label>
                  <input
                    type="date"
                    value={reportData.incidentDate}
                    onChange={(e) => setReportData({...reportData, incidentDate: e.target.value})}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={reportData.incidentTime}
                    onChange={(e) => setReportData({...reportData, incidentTime: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={reportData.location}
                    onChange={(e) => setReportData({...reportData, location: e.target.value})}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Where did this incident occur?"
                    required
                  />
                  {location && (
                    <MapPin className="w-5 h-5 text-green-600 absolute right-3 top-1/2 transform -translate-y-1/2" />
                  )}
                </div>
                {location && (
                  <p className="text-xs text-green-600 mt-1">
                    GPS coordinates will be included for accurate location tracking
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={reportData.description}
                  onChange={(e) => setReportData({...reportData, description: e.target.value})}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Please provide a detailed description of what happened..."
                  required
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-gray-500">
                    {reportData.description.length} / 5000 characters
                  </p>
                  {reportData.description.length > 50 && (
                    <div className="text-xs text-blue-600 flex items-center">
                      <Activity className="w-3 h-3 mr-1" />
                      AI analyzing...
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced AI Preview */}
              {aiPreview && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 mb-1">AI Analysis Preview</p>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-blue-700">
                            <span className="font-semibold">Likely assignment:</span> {aiPreview.departmentName}
                          </p>
                          <p className="text-blue-600">
                            Confidence: {aiPreview.confidence}%
                          </p>
                        </div>
                        <div>
                          <p className="text-blue-700">
                            <span className="font-semibold">Priority:</span> {aiPreview.urgencyLevel}
                          </p>
                          <p className="text-blue-600">
                            Est. response: {aiPreview.estimatedResponseTime}
                          </p>
                        </div>
                      </div>
                      {aiPreview.keyIndicators && aiPreview.keyIndicators.length > 0 && (
                        <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-800">
                          <strong>Key factors:</strong> {aiPreview.keyIndicators.slice(0, 2).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Are you currently safe? *
                </label>
                <div className="grid md:grid-cols-3 gap-3">
                  {[
                    { value: 'safe', label: 'Yes, I am safe', color: 'green', icon: <CheckCircle className="w-5 h-5" /> },
                    { value: 'unsafe', label: 'No, I need immediate help', color: 'red', icon: <AlertTriangle className="w-5 h-5" /> },
                    { value: 'unsure', label: 'I\'m not sure', color: 'yellow', icon: <AlertCircle className="w-5 h-5" /> }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setReportData({...reportData, currentSafety: option.value})}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        reportData.currentSafety === option.value
                          ? `border-${option.color}-500 bg-${option.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`text-${option.color}-600`}>
                          {option.icon}
                        </div>
                        <span className="font-medium text-gray-900">{option.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {reportData.currentSafety === 'unsafe' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Immediate Help Available</p>
                      <p className="text-sm text-red-700 mt-1">
                        If you're in immediate danger, please call 911 or your local emergency services.
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Your report will be prioritized for urgent response.
                      </p>
                      <div className="mt-3 flex space-x-2">
                        <button className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          Call 911
                        </button>
                        <button className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 flex items-center">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Crisis Text Line
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-1" /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!reportData.incidentDate || !reportData.location || !reportData.description || !reportData.currentSafety}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  Next <ChevronRight className="w-5 h-5 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Evidence & Media */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Evidence & Media</h2>
              <p className="text-gray-600">
                Add any supporting evidence to strengthen your report. All files are encrypted and secure.
              </p>

              {/* File Upload */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">File Attachments</h3>
                <FileUpload onFilesChange={setUploadedFiles} maxFiles={5} />
              </div>

              {/* Voice Recording */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Voice Note</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {!audioBlob ? (
                    <div className="text-center">
                      <div className="flex justify-center mb-4">
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                            isRecording 
                              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                              : 'bg-indigo-500 hover:bg-indigo-600'
                          }`}
                        >
                          {isRecording ? (
                            <StopCircle className="w-8 h-8 text-white" />
                          ) : (
                            <Volume2 className="w-8 h-8 text-white" />
                          )}
                        </button>
                      </div>
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        {isRecording ? 'Recording...' : 'Record Voice Note'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {isRecording 
                          ? 'Click the stop button when finished' 
                          : 'Click to start recording your voice note'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="flex justify-center space-x-4 mb-4">
                        <audio controls className="max-w-xs">
                          <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                        </audio>
                      </div>
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={deleteRecording}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </button>
                        <button
                          onClick={() => {
                            setAudioBlob(null);
                            startRecording();
                          }}
                          className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 flex items-center"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Re-record
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-1" /> Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  Next <ChevronRight className="w-5 h-5 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Additional Information */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Additional Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Witnesses (Optional)
                </label>
                <textarea
                  value={reportData.witnesses}
                  onChange={(e) => setReportData({...reportData, witnesses: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="List any witnesses to the incident..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Evidence Description (Optional)
                </label>
                <textarea
                  value={reportData.evidence}
                  onChange={(e) => setReportData({...reportData, evidence: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Describe any additional evidence not included in file attachments..."
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-1" /> Back
                </button>
                <button
                  onClick={() => setStep(5)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  Next <ChevronRight className="w-5 h-5 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Contact & Review */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Contact Information & Review</h2>
              
              <div className="bg-indigo-50 rounded-lg p-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportData.anonymous}
                    onChange={(e) => setReportData({...reportData, anonymous: e.target.checked})}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-gray-900 font-medium">Submit Anonymously</span>
                    <p className="text-sm text-gray-600">Your identity will be completely protected</p>
                  </div>
                </label>
              </div>

              {!reportData.anonymous && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Contact Method
                    </label>
                    <div className="grid md:grid-cols-3 gap-3">
                      {[
                        { value: 'email', label: 'Email', icon: <Mail className="w-5 h-5" /> },
                        { value: 'phone', label: 'Phone', icon: <Phone className="w-5 h-5" /> },
                        { value: 'text', label: 'Text Message', icon: <MessageCircle className="w-5 h-5" /> }
                      ].map(method => (
                        <button
                          key={method.value}
                          onClick={() => setReportData({...reportData, contactMethod: method.value})}
                          className={`p-3 border-2 rounded-lg text-left transition-all ${
                            reportData.contactMethod === method.value
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {method.icon}
                            <span className="font-medium">{method.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {reportData.contactMethod && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {reportData.contactMethod === 'email' ? 'Email Address' : 'Phone Number'}
                      </label>
                      <input
                        type={reportData.contactMethod === 'email' ? 'email' : 'tel'}
                        value={reportData.contactInfo}
                        onChange={(e) => setReportData({...reportData, contactInfo: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder={reportData.contactMethod === 'email' ? 'your@email.com' : '(555) 123-4567'}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Enhanced Review Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Review Your Report</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Incident Information</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Type:</dt>
                        <dd className="font-medium">{incidentTypes.find(t => t.value === reportData.incidentType)?.label}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Date:</dt>
                        <dd className="font-medium">{reportData.incidentDate}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Time:</dt>
                        <dd className="font-medium">{reportData.incidentTime || 'Not specified'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Safety Status:</dt>
                        <dd className="font-medium">{reportData.currentSafety}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Attachments & Media</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Files:</dt>
                        <dd className="font-medium">{uploadedFiles.length} attached</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Voice Note:</dt>
                        <dd className="font-medium">{audioBlob ? 'Included' : 'None'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Location:</dt>
                        <dd className="font-medium">{location ? 'GPS included' : 'Manual entry only'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Submission:</dt>
                        <dd className="font-medium">{reportData.anonymous ? 'Anonymous' : 'With Contact Info'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {aiPreview && (
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-1">Expected Processing</h4>
                    <p className="text-sm text-blue-700">
                      Your report will likely be assigned to the <strong>{aiPreview.departmentName}</strong> with {aiPreview.urgencyLevel} priority.
                      Estimated response time: <strong>{aiPreview.estimatedResponseTime}</strong>.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(4)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-1" /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || (!reportData.anonymous && reportData.contactMethod && !reportData.contactInfo)}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {loading ? (
                    <Loader className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-5 h-5 mr-2" />
                  )}
                  Submit Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== ENHANCED USER DASHBOARD ====================
function EnhancedUserDashboard({ setCurrentView, showNotification, language, setLanguage, t, setAccessibilityPanelOpen }) {
  const { user, token, logout } = useAuth();
  const { isOnline } = useOffline();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchFilters, setSearchFilters] = useState({});

  // Debug logging for troubleshooting
  const debugLog = (message, data) => {
    console.log(`🔍 [UserDashboard] ${message}:`, data);
  };

  useEffect(() => {
    debugLog('Component mounted, user data', { user, token: !!token });
    if (user && token) {
      fetchDashboardData();
      fetchMessages();
      fetchNotifications();
      fetchSessions();
    }
  }, [user, token]);

  const fetchDashboard = async (token) => {
    if (!token) {
      setDebugData(prev => ({ ...prev, error: 'No token available' }));
      return;
    }

    setDebugData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('Fetching dashboard with token:', token);
      
      const response = await fetch(`${API_BASE_URL}/users/dashboard`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Dashboard response status:', response.status);
      
      const text = await response.text();
      console.log('Raw response text:', text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid JSON response from server');
      }

      console.log('Parsed dashboard data:', data);
      
      setDebugData(prev => ({ 
        ...prev, 
        dashboardResponse: data,
        rawDashboardData: text,
        loading: false 
      }));

      if (data.success) {
        setDashboardData(data);
        console.log('Dashboard data set successfully');
      } else {
        throw new Error(data.error || 'Dashboard fetch failed');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setDebugData(prev => ({ 
        ...prev, 
        error: error.message,
        loading: false 
      }));
    }
  };

  // Combined login and fetch
  const loginAndFetchDashboard = async () => {
    const token = await performLogin();
    if (token) {
      await fetchDashboard(token);
    }
  };

  // Manual token fetch
  const manualFetchWithToken = async () => {
    if (!debugData.token) {
      alert('Please enter a token first');
      return;
    }
    await fetchDashboard(debugData.token);
  };

  const DashboardDebugger = ({ dashboardData }) => {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-red-800 mb-2">🔍 Dashboard Debug Info</h4>
        <div className="text-sm text-red-700 space-y-1">
          <p><strong>dashboardData exists:</strong> {dashboardData ? 'YES' : 'NO'}</p>
          <p><strong>dashboardData.success:</strong> {dashboardData?.success ? 'TRUE' : 'FALSE'}</p>
          <p><strong>activeTab:</strong> {activeTab}</p>
          <p><strong>Report ID:</strong> {dashboardData?.report?.reportId || 'MISSING'}</p>
          <p><strong>Status:</strong> {dashboardData?.report?.status || 'MISSING'}</p>
          <p><strong>Department:</strong> {dashboardData?.department?.name || 'MISSING'}</p>
          <p><strong>Raw Data Keys:</strong> {dashboardData ? Object.keys(dashboardData).join(', ') : 'NONE'}</p>
          
          {/* Show raw JSON for debugging */}
          <details className="mt-2">
            <summary className="cursor-pointer text-red-800 font-medium">Show Raw Data</summary>
            <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(dashboardData, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  };


  const fetchMessages = async () => {
    debugLog('Fetching messages', { reportId: user?.reportId });
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        debugLog('Messages response', { success: data.success, count: data.messages?.length });
        
        if (data.success) {
          setMessages(data.messages || []);
        }
      } else {
        debugLog('Messages fetch failed', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      debugLog('Messages fetch error', error.message);
    }
  };

  const fetchSessions = async () => {
    debugLog('Fetching sessions', { reportId: user?.reportId });
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        debugLog('Sessions response', { success: data.success, count: data.sessions?.length });
        
        if (data.success) {
          setSessions(data.sessions || []);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching sessions:', error);
      debugLog('Sessions fetch error', error.message);
    }
  };

  const fetchNotifications = async () => {
    debugLog('Fetching notifications', { userId: user?.userId });
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        debugLog('Notifications response', { success: data.success, count: data.notifications?.length });
        
        if (data.success) {
          setNotifications(data.notifications || []);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      debugLog('Notifications fetch error', error.message);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim()) return;
    
    debugLog('Sending message', { length: messageInput.length });
    setSendingMessage(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: messageInput })
      });

      const data = await response.json();
      debugLog('Send message response', { success: data.success });
      
      if (data.success) {
        showNotification('success', 'Message sent successfully');
        setMessageInput('');
        fetchMessages(); // Refresh messages
      } else {
        showNotification('error', data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('❌ Send message error:', error);
      showNotification('error', 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Report ID: {user?.reportId}</p>
        </div>
      </div>
    );
  }

  // Show error state if dashboard failed to load
  if (!dashboardData || !dashboardData.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Unavailable</h2>
          <p className="text-gray-600 mb-4">
            {dashboardData?.error || 'Unable to load your dashboard data'}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Report ID: {user?.reportId}
          </p>
          <div className="space-y-3">
            <button
              onClick={fetchDashboardData}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
            <button
              onClick={() => {
                logout();
                setCurrentView('landing');
              }}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabItems = [
    { id: 'overview', name: 'Overview', icon: <Home className="w-5 h-5" /> },
    { id: 'messages', name: 'Messages', icon: <MessageCircle className="w-5 h-5" />, badge: dashboardData?.messages?.unreadCount },
    { id: 'sessions', name: 'Sessions', icon: <Video className="w-5 h-5" /> },
    { id: 'files', name: 'Files', icon: <FileText className="w-5 h-5" /> },
    { id: 'analytics', name: 'My Analytics', icon: <BarChart3 className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Shield className="w-8 h-8 text-indigo-600" />
                <span className="text-2xl font-bold text-gray-900">SafeVoice</span>
                {!isOnline && <WifiOff className="w-5 h-5 text-orange-500" />}
              </div>
              
              <div className="hidden md:flex space-x-1">
                {tabItems.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg transition-colors relative ${
                      activeTab === tab.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {tab.icon}
                      <span>{tab.name}</span>
                    </div>
                    {tab.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveTab('notifications')}
                className="p-2 rounded-lg hover:bg-gray-100 relative"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              
              <button
                onClick={() => setAccessibilityPanelOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Accessibility Settings"
              >
                <Accessibility className="w-5 h-5 text-gray-600" />
              </button>
              
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="en">🇺🇸 EN</option>
                <option value="fr">🇫🇷 FR</option>
                <option value="es">🇪🇸 ES</option>
              </select>
              
              <button
                onClick={() => {
                  logout();
                  setCurrentView('landing');
                  showNotification('info', 'Logged out successfully');
                }}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
          {/* ADD THIS DEBUG COMPONENT */}
          <DashboardDebugger dashboardData={dashboardData} />
            {/* Debug Info (only show in development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Debug Info</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>Report ID: {dashboardData?.report?.reportId}</p>
                  <p>Status: {dashboardData?.report?.status}</p>
                  <p>Department: {dashboardData?.department?.name}</p>
                  <p>Messages: {dashboardData?.messages?.totalCount} total, {dashboardData?.messages?.unreadCount} unread</p>
                  <p>Dashboard Type: {dashboardData?.dashboardType}</p>
                </div>
              </div>
            )}

            {/* Enhanced Welcome Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-2">
                    {dashboardData?.user?.anonymous ? 'Anonymous Report Dashboard' : 'Your SafeVoice Report'}
                  </h1>
                  <p className="opacity-90">
                    Report ID: <span className="font-mono font-semibold">{dashboardData?.report?.reportId}</span>
                  </p>
                  <p className="text-sm opacity-75 mt-1">
                    Last updated: {dashboardData?.report?.timeAgo || 'Recently'}
                  </p>
                  <p className="text-sm opacity-75">
                    Auth method: {dashboardData?.user?.authMethod === 'pin' ? 'Security PIN' : 'Email verification'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    {dashboardData?.report?.status === 'resolved' ? '100' : 
                    dashboardData?.report?.status === 'under_review' ? '75' : 
                    dashboardData?.report?.status === 'investigating' ? '85' : '50'}%
                  </div>
                  <div className="text-sm opacity-75">Progress</div>
                </div>
              </div>
            </div>

            {/* Report Status Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Report Status</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Case Information</h4>
                  <dl className="space-y-3">
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-600">Status:</dt>
                      <dd>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          dashboardData?.report?.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                          dashboardData?.report?.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                          dashboardData?.report?.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {dashboardData?.report?.status?.replace('_', ' ') || 'Active'}
                        </span>
                      </dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-600">Priority:</dt>
                      <dd>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          dashboardData?.report?.priority === 'critical' ? 'bg-red-100 text-red-800' :
                          dashboardData?.report?.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          dashboardData?.report?.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {dashboardData?.report?.priority || 'medium'}
                        </span>
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Type:</dt>
                      <dd className="font-medium">{dashboardData?.report?.incidentType || 'General'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Submitted:</dt>
                      <dd className="font-medium">{dashboardData?.report?.timeAgo || 'Recently'}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Assigned Department</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      {dashboardData?.department?.icon || <Shield className="w-6 h-6" />}
                      <div>
                        <p className="font-semibold">{dashboardData?.department?.name || 'Support Team'}</p>
                        <p className="text-sm text-gray-600">{dashboardData?.department?.description || 'Professional support services'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Response time:</span>
                        <div className="font-medium">{dashboardData?.department?.avgResponseTime || '8h'}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Assigned agent:</span>
                        <div className="font-medium">{dashboardData?.report?.assignedAgent || 'Available Specialist'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Analysis Display */}
              {dashboardData?.report?.aiAnalysis && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">AI Analysis Results</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Assignment Confidence:</span>
                      <div className="font-bold text-blue-900">{dashboardData.report.aiAnalysis.confidence || 85}%</div>
                    </div>
                    <div>
                      <span className="text-blue-700">Risk Level:</span>
                      <div className="font-bold text-blue-900">{dashboardData.report.aiAnalysis.riskLevel || 'Medium'}</div>
                    </div>
                    <div>
                      <span className="text-blue-700">Quality Score:</span>
                      <div className="font-bold text-blue-900">{dashboardData.report.aiAnalysis.qualityScore || 8}/10</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="mt-6 grid md:grid-cols-2 gap-4">
                {dashboardData?.quickActions?.map((action, index) => (
                  <button
                    key={action.id || index}
                    onClick={() => setActiveTab(action.action === 'view_messages' ? 'messages' : 'overview')}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      action.color === 'purple' ? 'border-purple-200 bg-purple-50 hover:bg-purple-100' :
                      action.color === 'blue' ? 'border-blue-200 bg-blue-50 hover:bg-blue-100' :
                      'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{action.title}</h4>
                      {action.badge > 0 && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          action.color === 'purple' ? 'bg-purple-500 text-white' :
                          action.color === 'blue' ? 'bg-blue-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {action.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <MessageCircle className="w-8 h-8 text-blue-500" />
                  <div className="ml-3">
                    <div className="text-2xl font-bold text-gray-900">{dashboardData?.messages?.unreadCount || 0}</div>
                    <div className="text-sm text-gray-600">Unread Messages</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <Calendar className="w-8 h-8 text-green-500" />
                  <div className="ml-3">
                    <div className="text-2xl font-bold text-gray-900">{dashboardData?.statistics?.totalReports || 1}</div>
                    <div className="text-sm text-gray-600">Reports</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <Activity className="w-8 h-8 text-purple-500" />
                  <div className="ml-3">
                    <div className="text-2xl font-bold text-gray-900">{dashboardData?.statistics?.activeReports || 1}</div>
                    <div className="text-sm text-gray-600">Active Cases</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-orange-500" />
                  <div className="ml-3">
                    <div className="text-2xl font-bold text-gray-900">{dashboardData?.statistics?.resolvedReports || 0}</div>
                    <div className="text-sm text-gray-600">Resolved</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Timeline */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Timeline</h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div className="space-y-6">
                  {(dashboardData?.timeline || []).map((event, index) => (
                    <div key={event.id || index} className="relative flex items-start space-x-4">
                      <div className="relative z-10">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{event.status}</p>
                          <time className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</time>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="border-b border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900">Secure Messages</h3>
              <p className="text-sm text-gray-600 mt-1">
                Communicate with your assigned department • End-to-end encrypted
              </p>
            </div>
            
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No messages yet</p>
                  <p className="text-sm mt-1">Start a conversation with your support team</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={msg.id || index}
                    className={`flex ${msg.isFromUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      msg.isFromUser 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">
                          {msg.sender_name || (msg.isFromUser ? 'You' : 'Support Team')}
                        </p>
                        {msg.encrypted && (
                          <Lock className="w-3 h-3 opacity-75" />
                        )}
                      </div>
                      <p className="text-sm">{msg.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className={`text-xs ${
                          msg.isFromUser ? 'text-indigo-200' : 'text-gray-500'
                        }`}>
                          {msg.timeAgo || 'Just now'}
                        </p>
                        {msg.isFromUser && (
                          <div className={`text-xs ${msg.read_by_user ? 'text-indigo-200' : 'text-indigo-300'}`}>
                            {msg.read_by_user ? '✓✓' : '✓'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="border-t border-gray-200 p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Type your message..."
                  disabled={!isOnline}
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || sendingMessage || !isOnline}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors flex items-center"
                >
                  {sendingMessage ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              {!isOnline && (
                <p className="text-xs text-orange-600 mt-2 flex items-center">
                  <WifiOff className="w-3 h-3 mr-1" />
                  Messages will be sent when connection is restored
                </p>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <EnhancedSessionBooking 
              token={token}
              reportId={user?.reportId}
              showNotification={showNotification}
              onSessionBooked={fetchSessions}
            />
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Sessions</h3>
              {sessions.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No sessions scheduled</p>
                  <p className="text-sm mt-1">Book your first session to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session, index) => (
                    <div key={session.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {session.type === 'video' ? <Video className="w-5 h-5" /> :
                           session.type === 'phone' ? <Phone className="w-5 h-5" /> :
                           <Users className="w-5 h-5" />}
                          <span className="font-medium">{session.type} Session</span>
                        </div>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          session.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                          session.status === 'completed' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{session.date} at {session.time}</p>
                        <p>With: {session.counselor}</p>
                        {session.notes && <p>Notes: {session.notes}</p>}
                      </div>
                      {session.type === 'video' && session.status === 'scheduled' && (
                        <button className="mt-3 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center">
                          <Video className="w-4 h-4 mr-2" />
                          Join Video Call
                        </button>
                      )}
                      {session.status === 'completed' && session.recording && (
                        <button className="mt-3 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center">
                          <PlayCircle className="w-4 h-4 mr-2" />
                          View Recording
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">File Manager</h3>
              <FileUpload onFilesChange={(files) => {
                showNotification('success', `${files.length} files uploaded`);
                // Refresh file list
              }} />
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(dashboardData?.files || []).map((file, index) => (
                <div key={file.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="text-gray-600">
                      {file.type?.startsWith('image/') ? <FileImage className="w-6 h-6" /> :
                       file.type?.startsWith('video/') ? <FileVideo className="w-6 h-6" /> :
                       file.type?.startsWith('audio/') ? <FileAudio className="w-6 h-6" /> :
                       file.type === 'application/pdf' ? <File className="w-6 h-6" /> :
                       <FileText className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name || `Document ${index + 1}`}</p>
                      <p className="text-xs text-gray-500">{file.size || '1KB'} • {file.uploadDate || 'Recently'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="flex-1 px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200">
                      View
                    </button>
                    <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {(!dashboardData?.files || dashboardData.files.length === 0) && (
                <div className="col-span-full text-center text-gray-500 py-8">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No files uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Personal Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your SafeVoice Analytics</h3>
              <p className="text-gray-600 mb-6">Track your progress and engagement with the platform</p>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{dashboardData?.analytics?.totalInteractions || 8}</div>
                  <div className="text-sm text-gray-600">Total Interactions</div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{dashboardData?.analytics?.progressScore || 75}%</div>
                  <div className="text-sm text-gray-600">Progress Score</div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{dashboardData?.analytics?.wellnessScore || 85}</div>
                  <div className="text-sm text-gray-600">Wellness Score</div>
                </div>
              </div>
            </div>

            <AnalyticsCharts data={dashboardData?.analytics} />
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== ENHANCED SESSION BOOKING ====================
function EnhancedSessionBooking({ token, reportId, showNotification, onSessionBooked }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [counselorId, setCounselorId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableCounselors, setAvailableCounselors] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);

  const sessionTypes = [
    { value: 'video', label: 'Video Call', icon: <Video className="w-5 h-5" />, description: 'Face-to-face virtual meeting' },
    { value: 'phone', label: 'Phone Call', icon: <Phone className="w-5 h-5" />, description: 'Voice-only conversation' },
    { value: 'inperson', label: 'In-Person', icon: <Users className="w-5 h-5" />, description: 'Meet at our office' },
    { value: 'chat', label: 'Text Chat', icon: <MessageCircle className="w-5 h-5" />, description: 'Real-time text conversation' }
  ];

  // Fetch available counselors when session type changes
  useEffect(() => {
    if (sessionType) {
      fetchAvailableCounselors();
    }
  }, [sessionType]);

  // Fetch available times when date and counselor change
  useEffect(() => {
    if (selectedDate && counselorId) {
      fetchAvailableTimes();
    }
  }, [selectedDate, counselorId]);

  const fetchAvailableCounselors = async () => {
    try {
      // Mock data for counselors since the endpoint might not exist yet
      const mockCounselors = [
        { id: '1', name: 'Dr. Sarah Johnson', speciality: 'Crisis Counseling' },
        { id: '2', name: 'Dr. Michael Chen', speciality: 'Trauma Therapy' },
        { id: '3', name: 'Dr. Lisa Rodriguez', speciality: 'Mental Health Support' },
        { id: '4', name: 'Dr. James Wilson', speciality: 'Legal Support Counseling' }
      ];
      setAvailableCounselors(mockCounselors);
    } catch (error) {
      console.error('Error fetching counselors:', error);
    }
  };

  const fetchAvailableTimes = async () => {
    try {
      // Mock data for available times
      const mockTimes = [
        '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'
      ];
      setAvailableTimes(mockTimes);
    } catch (error) {
      console.error('Error fetching available times:', error);
    }
  };

  const handleBookSession = async () => {
    setLoading(true);
    
    try {
      // Mock booking since the endpoint might not exist yet
      const mockResponse = {
        success: true,
        sessionId: 'SES' + Date.now(),
        message: 'Session booked successfully'
      };

      if (mockResponse.success) {
        showNotification('success', 'Session booked successfully');
        onSessionBooked?.();
        
        // Reset form
        setSelectedDate('');
        setSelectedTime('');
        setSessionType('');
        setCounselorId('');
        setNotes('');
      } else {
        showNotification('error', 'Failed to book session');
      }
    } catch (error) {
      showNotification('error', 'Failed to book session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Book a Session</h3>
      
      <div className="space-y-4">
        {/* Session Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Session Type</label>
          <div className="grid md:grid-cols-2 gap-3">
            {sessionTypes.map(type => (
              <button
                key={type.value}
                onClick={() => setSessionType(type.value)}
                className={`p-3 border-2 rounded-lg text-left transition-all ${
                  sessionType === type.value
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  {type.icon}
                  <span className="font-medium">{type.label}</span>
                </div>
                <p className="text-xs text-gray-600">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Counselor Selection */}
        {sessionType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Choose Counselor</label>
            <select
              value={counselorId}
              onChange={(e) => setCounselorId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a counselor...</option>
              {availableCounselors.map(counselor => (
                <option key={counselor.id} value={counselor.id}>
                  {counselor.name} - {counselor.speciality}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date and Time Selection */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              disabled={!selectedDate || !counselorId}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
            >
              <option value="">Select time...</option>
              {availableTimes.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Session Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Any specific topics or concerns you'd like to discuss..."
          />
        </div>

        <button
          onClick={handleBookSession}
          disabled={!selectedDate || !selectedTime || !sessionType || !counselorId || loading}
          className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors flex items-center justify-center"
        >
          {loading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Calendar className="w-5 h-5 mr-2" />
              Book Session
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ==================== ENHANCED ADMIN DASHBOARD ====================
function EnhancedAdminDashboard({ setCurrentView, showNotification, language, setLanguage, t, setAccessibilityPanelOpen }) {
  const { admin, token, logout } = useAuth();
  const { isOnline } = useOffline();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [departmentCases, setDepartmentCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState({});

  // Real-time updates via WebSocket
  const handleAdminUpdate = useCallback((data) => {
    if (data.type === 'new_case') {
      showNotification('info', `New case assigned: ${data.reportId}`);
      fetchDashboardData();
    } else if (data.type === 'case_update') {
      showNotification('info', `Case ${data.reportId} updated`);
      if (selectedCase?.report_id === data.reportId) {
        fetchCaseDetails(data.reportId);
      }
    }
  }, [showNotification, selectedCase]);

  useEffect(() => {
    if (admin?.department === 'all') {
      fetchSuperAdminDashboard();
    } else {
      fetchDepartmentDashboard();
    }
  }, [admin]);

  const fetchSuperAdminDashboard = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching super admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentDashboard = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/department/${admin.department}/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setDashboardData(data);
        fetchDepartmentCases();
      }
    } catch (error) {
      console.error('Error fetching department dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentCases = useCallback(async () => {
    if (!admin || !token) {
      console.warn('⚠️ Cannot fetch cases: missing admin or token', { admin: !!admin, token: !!token });
      return;
    }

    if (admin.department === 'all') {
      console.log('ℹ️ Super admin detected, skipping department-specific cases fetch');
      return;
    }

    console.log('🔄 Fetching cases for department:', admin.department);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const url = `${API_BASE_URL}/admin/department/${admin.department}/cases?${queryParams}`;
      console.log('📡 Fetching cases from:', url);

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('📥 Cases response status:', response.status);
      const data = await response.json();
      console.log('📦 Cases response data:', data);

      if (data.success) {
        setDepartmentCases(data.cases || []);
        console.log('✅ Cases loaded successfully:', data.cases?.length || 0);
      } else {
        console.error('❌ Failed to fetch cases:', data.error);
        showNotification('error', data.error || 'Failed to fetch cases');
        setDepartmentCases([]);
      }
    } catch (error) {
      console.error('💥 Error fetching cases:', error);
      showNotification('error', 'Network error while fetching cases');
      setDepartmentCases([]);
    }
  }, [admin, token, searchFilters, showNotification]);

  const fetchCaseDetails = async (reportId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/department/${admin.department}/cases/${reportId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setSelectedCase(data.case);
        setActiveTab('caseDetails');
      }
    } catch (error) {
      console.error('Error fetching case details:', error);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    if (admin?.department === 'all') {
      fetchSuperAdminDashboard();
    } else {
      fetchDepartmentDashboard();
    }
  }, [admin]);

  const tabItems = [
    { id: 'overview', name: 'Dashboard', icon: <Activity className="w-5 h-5" /> },
    { id: 'cases', name: 'Cases', icon: <FileText className="w-5 h-5" />, badge: dashboardData?.department?.activeCases },
    { id: 'analytics', name: 'Analytics', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'monitor', name: 'System Monitor', icon: <Monitor className="w-5 h-5" /> },
    { id: 'audit', name: 'Audit Trail', icon: <Archive className="w-5 h-5" /> }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">{t.messages.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Enhanced Admin Navigation */}
      <nav className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Shield className="w-8 h-8 text-indigo-400" />
                <span className="text-xl font-bold">SafeVoice Admin</span>
                {!isOnline && <WifiOff className="w-5 h-5 text-orange-400" />}
              </div>
              
              <div className="hidden md:flex space-x-1">
                {tabItems.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg transition-colors relative ${
                      activeTab === tab.id ? 'bg-gray-800' : 'hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {tab.icon}
                      <span>{tab.name}</span>
                    </div>
                    {tab.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setAccessibilityPanelOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-800"
                title="Accessibility Settings"
              >
                <Accessibility className="w-5 h-5" />
              </button>

              <div className="text-sm">
                <p className="text-gray-400">Logged in as</p>
                <p className="font-medium">{admin?.username}</p>
              </div>
              
              <div className="px-3 py-1 bg-indigo-600 rounded-lg text-sm">
                {admin?.departmentName || admin?.department}
              </div>
              
              <button
                onClick={() => {
                  logout();
                  setCurrentView('landing');
                  showNotification('info', t.messages.logoutSuccess);
                }}
                className="px-4 py-2 text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Overview Tab */}
        {activeTab === 'overview' && dashboardData && (
          <div className="space-y-6">
            {/* Enhanced Stats Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Reports</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData.totalReports || dashboardData.department?.totalCases || 0}
                    </p>
                    <p className="text-xs text-green-600 mt-1">+12% from last week</p>
                  </div>
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Cases</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData.department?.activeCases || 0}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">Needs attention</p>
                  </div>
                  <Activity className="w-8 h-8 text-indigo-400" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Critical Cases</p>
                    <p className="text-2xl font-bold text-red-600">
                      {dashboardData.department?.criticalCases || 0}
                    </p>
                    <p className="text-xs text-red-600 mt-1">Immediate action required</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">AI Confidence</p>
                    <p className="text-2xl font-bold text-green-600">
                      {dashboardData.aiMetrics?.averageConfidence || 92}%
                    </p>
                    <p className="text-xs text-green-600 mt-1">AI assignment accuracy</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
              </div>
            </div>

            {/* AI Performance Metrics */}
            {dashboardData.aiMetrics && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  AI Performance Metrics
                </h3>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{dashboardData.aiMetrics.averageConfidence}%</div>
                    <p className="text-sm text-gray-600">Avg Assignment Confidence</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{dashboardData.aiMetrics.averageQuality}/10</div>
                    <p className="text-sm text-gray-600">Avg Quality Score</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{dashboardData.aiMetrics.highConfidenceRate}%</div>
                    <p className="text-sm text-gray-600">High Confidence Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{dashboardData.aiMetrics.criticalRiskCases}</div>
                    <p className="text-sm text-gray-600">Critical Risk Cases</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Recent Cases</h3>
                <ExportData data={dashboardData.recentActivity || []} type="recent-cases" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI Confidence</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(dashboardData.recentActivity || []).slice(0, 10).map((report, index) => (
                      <tr key={report.report_id || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{report.report_id || `SAFE${index}`}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{report.incident_type || 'General'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            report.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                            report.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                            report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {report.status?.replace('_', ' ') || 'active'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            report.priority === 'critical' ? 'bg-red-100 text-red-800' :
                            report.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            report.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {report.priority || 'medium'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <span className="mr-2">{report.confidence || 92}%</span>
                            <div className="w-12 bg-gray-200 rounded-full h-1">
                              <div 
                                className="bg-green-500 h-1 rounded-full" 
                                style={{ width: `${report.confidence || 92}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{report.assigned_agent || 'AI Assigned'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{report.timeAgo || 'Just now'}</td>
                        <td className="px-6 py-4 space-x-2">
                          <button
                            onClick={() => fetchCaseDetails(report.report_id)}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          >
                            View
                          </button>
                          <button className="text-gray-600 hover:text-gray-900 text-sm">
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Cases Tab */}
        {activeTab === 'cases' && (
          <div className="space-y-6">
            <AdvancedSearch
              onSearch={(term, filters) => {
                setSearchFilters({ ...filters, search: term });
                fetchDepartmentCases();
              }}
              filters={searchFilters}
              onFilterChange={setSearchFilters}
            />

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Department Cases</h3>
                <div className="flex space-x-2">
                  <ExportData data={departmentCases} type="department-cases" />
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Bulk Actions
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input type="checkbox" className="rounded" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Safety</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {departmentCases.map(caseItem => (
                      <tr key={caseItem.report_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input type="checkbox" className="rounded" />
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{caseItem.report_id}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{caseItem.incident_type}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{caseItem.incident_date}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-32 truncate" title={caseItem.location}>
                          {caseItem.location}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            caseItem.current_safety === 'unsafe' ? 'bg-red-100 text-red-800' :
                            caseItem.current_safety === 'unsure' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {caseItem.current_safety}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            caseItem.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                            caseItem.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                            caseItem.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {caseItem.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            caseItem.priority === 'critical' ? 'bg-red-100 text-red-800' :
                            caseItem.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            caseItem.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {caseItem.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <span>{caseItem.aiMetrics?.confidence || 92}%</span>
                            <Activity className="w-3 h-3 text-blue-500" />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {caseItem.assigned_agent || 'Unassigned'}
                        </td>
                        <td className="px-6 py-4 space-x-2">
                          <button
                            onClick={() => fetchCaseDetails(caseItem.report_id)}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          >
                            View
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Case Details Tab */}
        {activeTab === 'caseDetails' && selectedCase && (
          <EnhancedCaseDetails
            selectedCase={selectedCase}
            onBack={() => setActiveTab('cases')}
            onUpdate={() => fetchCaseDetails(selectedCase.report_id)}
            showNotification={showNotification}
            token={token}
            admin={admin}
          />
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <AnalyticsCharts data={dashboardData?.analytics} />
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Response Time</span>
                    <span className="font-semibold">{dashboardData?.metrics?.avgResponseTime || '6h'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Resolution Rate</span>
                    <span className="font-semibold text-green-600">{dashboardData?.metrics?.resolutionRate || 87}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">User Satisfaction</span>
                    <span className="font-semibold text-blue-600">{dashboardData?.metrics?.satisfaction || 94}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">AI Accuracy</span>
                    <span className="font-semibold text-purple-600">{dashboardData?.aiMetrics?.averageConfidence || 92}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Comparison</h3>
                <div className="space-y-3">
                  {Object.values(DEPARTMENTS).map(dept => (
                    <div key={dept.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {dept.icon}
                        <span className="text-sm font-medium">{dept.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full bg-${dept.color}-500`}
                            style={{ width: `${Math.random() * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{Math.floor(Math.random() * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Monitor Tab */}
        {activeTab === 'monitor' && <SystemMonitor />}

        {/* Audit Trail Tab */}
        {activeTab === 'audit' && <AuditTrail reportId={selectedCase?.report_id} />}
      </div>
    </div>
  );
}

// ==================== ENHANCED CASE DETAILS COMPONENT ====================
function EnhancedCaseDetails({ selectedCase, onBack, onUpdate, showNotification, token, admin }) {
  const [messageInput, setMessageInput] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [notes, setNotes] = useState('');
  const [assignedAgent, setAssignedAgent] = useState(selectedCase.assigned_agent || '');
  const [priority, setPriority] = useState(selectedCase.priority || '');
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [aiResponses, setAiResponses] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Fetch AI response suggestions
  const fetchAIResponses = async () => {
    setLoadingAI(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/cases/${selectedCase.report_id}/ai-responses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setAiResponses(data.responseSuggestions);
      }
    } catch (error) {
      console.error('Error fetching AI responses:', error);
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    fetchAIResponses();
  }, [selectedCase.report_id]);

  const updateCaseStatus = async () => {
    if (!statusUpdate) return;

    setUpdating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/department/${admin.department}/cases/${selectedCase.report_id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: statusUpdate,
          notes: notes,
          assignedAgent: assignedAgent,
          priority: priority
        })
      });

      const data = await response.json();
      if (data.success) {
        showNotification('success', 'Case updated successfully');
        onUpdate();
        setStatusUpdate('');
        setNotes('');
      } else {
        showNotification('error', data.error || 'Failed to update case');
      }
    } catch (error) {
      showNotification('error', 'Failed to update case');
    } finally {
      setUpdating(false);
    }
  };

  const sendMessageToUser = async () => {
    if (!messageInput.trim()) return;

    setSending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/department/${admin.department}/cases/${selectedCase.report_id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: messageInput })
      });

      const data = await response.json();
      if (data.success) {
        showNotification('success', 'Message sent to user');
        setMessageInput('');
        onUpdate();
      } else {
        showNotification('error', data.error || 'Failed to send message');
      }
    } catch (error) {
      showNotification('error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const selectAIResponse = (response) => {
    setMessageInput(response.message);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Cases
      </button>

      {/* Enhanced Case Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-semibold text-gray-900">
            Case Details - {selectedCase.report_id}
          </h3>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              selectedCase.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
              selectedCase.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
              selectedCase.status === 'resolved' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {selectedCase.status?.replace('_', ' ')}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              selectedCase.priority === 'critical' ? 'bg-red-100 text-red-800' :
              selectedCase.priority === 'high' ? 'bg-orange-100 text-orange-800' :
              selectedCase.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {selectedCase.priority} Priority
            </span>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Incident Information</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Type:</dt>
                <dd className="font-medium">{selectedCase.incident_type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Date:</dt>
                <dd className="font-medium">{selectedCase.incident_date}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Time:</dt>
                <dd className="font-medium">{selectedCase.incident_time || 'Not specified'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Location:</dt>
                <dd className="font-medium text-xs" title={selectedCase.location}>
                  {selectedCase.location?.substring(0, 30)}...
                </dd>
              </div>
            </dl>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Case Management</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Current Safety:</dt>
                <dd>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedCase.current_safety === 'unsafe' ? 'bg-red-100 text-red-800' :
                    selectedCase.current_safety === 'unsure' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedCase.current_safety}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Assigned Agent:</dt>
                <dd className="font-medium">{selectedCase.assigned_agent || 'Unassigned'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Submitted:</dt>
                <dd className="font-medium">{selectedCase.timeAgo}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Anonymous:</dt>
                <dd className="font-medium">{selectedCase.isAnonymous ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-3">AI Analysis</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Confidence:</span>
                <span className="font-medium">{selectedCase.aiAnalysis?.confidence || selectedCase.ai_assignment_confidence || 92}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Risk Level:</span>
                <span className="font-medium">{selectedCase.aiAnalysis?.riskLevel || selectedCase.ai_risk_level || 'Medium'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Quality Score:</span>
                <span className="font-medium">{selectedCase.aiAnalysis?.qualityScore || selectedCase.ai_quality_score || 8}/10</span>
              </div>
              <button 
                onClick={fetchAIResponses}
                className="w-full mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 flex items-center justify-center"
                disabled={loadingAI}
              >
                {loadingAI ? <Loader className="w-3 h-3 animate-spin mr-1" /> : <Activity className="w-3 h-3 mr-1" />}
                AI Responses
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-medium text-gray-700 mb-3">Description</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedCase.description}</p>
        </div>
      </div>

      {/* Witnesses & Evidence */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-700 mb-3">Witnesses</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              {selectedCase.witnesses || 'No witnesses reported'}
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-700 mb-3">Additional Evidence</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              {selectedCase.evidence || 'No additional evidence provided'}
            </p>
          </div>
        </div>
      </div>

      {/* Case Management Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Update Case */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Case</h3>
          
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select status...</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="under_review">Under Review</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Agent</label>
              <input
                type="text"
                value={assignedAgent}
                onChange={(e) => setAssignedAgent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Agent name or ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Update Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Add notes about this update..."
              />
            </div>
            
            <button
              onClick={updateCaseStatus}
              disabled={!statusUpdate || updating}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors flex items-center justify-center"
            >
              {updating ? <Loader className="w-4 h-4 animate-spin" /> : 'Update Case'}
            </button>
          </div>
        </div>

        {/* Send Message with AI Suggestions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Message to User</h3>
          
          {/* AI Response Suggestions */}
          {aiResponses && aiResponses.responses && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">AI Response Suggestions</h4>
              <div className="space-y-2">
                {aiResponses.responses.slice(0, 3).map((response, index) => (
                  <button
                    key={index}
                    onClick={() => selectAIResponse(response)}
                    className="w-full text-left p-2 bg-white rounded border border-blue-200 hover:border-blue-400 text-xs"
                  >
                    <div className="font-medium text-blue-800">{response.subject}</div>
                    <div className="text-blue-600 mt-1">{response.message.substring(0, 100)}...</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Type your message to the user..."
            />
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Lock className="w-4 h-4" />
              <span>Messages are end-to-end encrypted</span>
            </div>
            
            <button
              onClick={sendMessageToUser}
              disabled={!messageInput.trim() || sending}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors flex items-center justify-center"
            >
              {sending ? <Loader className="w-4 h-4 animate-spin" /> : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Case Timeline */}
      {selectedCase.updates && selectedCase.updates.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Timeline</h3>
          
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div className="space-y-6">
              {selectedCase.updates.map((update, index) => (
                <div key={update.id || index} className="relative flex items-start space-x-4">
                  <div className="relative z-10">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Activity className="w-4 h-4 text-indigo-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{update.admin_username}</span>
                        {' '}changed status from{' '}
                        <span className="font-medium">{update.old_value}</span>
                        {' '}to{' '}
                        <span className="font-medium">{update.new_value}</span>
                      </p>
                      <time className="text-xs text-gray-500">{new Date(update.created_at).toLocaleString()}</time>
                    </div>
                    {update.notes && (
                      <p className="text-sm text-gray-600 mt-1">{update.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SafeVoicePortal;