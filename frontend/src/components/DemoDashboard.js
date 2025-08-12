// frontend/src/components/DemoDashboard.js - Comprehensive Demo Dashboard
import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Play, Square, RotateCcw, Eye, EyeOff,
  CheckCircle, Clock, AlertTriangle, Info,
  Users, FileText, MessageCircle, Bell,
  TrendingUp, Shield, Zap, Target, Brain,
  ArrowLeft
} from 'lucide-react';

// Import AppContext
import AppContext from '../contexts/AppContext';

const DemoDashboard = () => {
  const { setCurrentView } = useContext(AppContext);
  
  const [demoStatus, setDemoStatus] = useState({
    isRunning: false,
    progress: 0,
    steps: [],
    currentStep: null
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [showUserPortal, setShowUserPortal] = useState(false);
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [demoData, setDemoData] = useState(null);
  const [error, setError] = useState(null);
  
  const wsRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const maxReconnectAttempts = 5;

  // API Configuration
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001/api';

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const connectWebSocket = () => {
    try {
      const wsUrl = `ws://localhost:3001`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔌 Demo WebSocket connected');
        setIsConnected(true);
        setConnectionAttempts(0);
        
        // Request initial status
        wsRef.current.send(JSON.stringify({ type: 'demo', action: 'get_status' }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('🔌 Demo WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect
        if (connectionAttempts < maxReconnectAttempts) {
          setTimeout(() => {
            setConnectionAttempts(prev => prev + 1);
            connectWebSocket();
          }, 2000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
    }
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'status':
      case 'status_update':
        setDemoStatus(data.data);
        break;
      case 'demo_completed':
        setDemoData(data.data);
        setDemoStatus(prev => ({ ...prev, isRunning: false, progress: 100 }));
        break;
      case 'demo_error':
        setError(data.error);
        setDemoStatus(prev => ({ ...prev, isRunning: false }));
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  // Start demo workflow
  const startDemo = async () => {
    try {
      setError(null);
      setDemoData(null);
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'demo', action: 'start_demo' }));
      } else {
        // Fallback to HTTP API
        const response = await fetch(`${API_BASE}/demo/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error('Failed to start demo');
        
        // Start progress simulation
        simulateProgress();
      }
    } catch (error) {
      setError(error.message);
      console.error('Failed to start demo:', error);
    }
  };

  // Stop demo
  const stopDemo = async () => {
    try {
      const response = await fetch(`${API_BASE}/demo/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setDemoStatus(prev => ({ ...prev, isRunning: false }));
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }
    } catch (error) {
      console.error('Failed to stop demo:', error);
    }
  };

  // Reset demo data
  const resetDemo = async () => {
    try {
      const response = await fetch(`${API_BASE}/demo/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setDemoStatus({
          isRunning: false,
          progress: 0,
          steps: [],
          currentStep: null
        });
        setDemoData(null);
        setError(null);
      }
    } catch (error) {
      console.error('Failed to reset demo:', error);
    }
  };

  // Simulate progress for demo steps
  const simulateProgress = () => {
    let progress = 0;
    progressIntervalRef.current = setInterval(() => {
      progress += 2;
      if (progress <= 100) {
        setDemoStatus(prev => ({ ...prev, progress }));
      } else {
        clearInterval(progressIntervalRef.current);
      }
    }, 100);
  };

  // Get step status
  const getStepStatus = (stepIndex) => {
    if (demoStatus.progress >= (stepIndex + 1) * 20) return 'completed';
    if (demoStatus.progress >= stepIndex * 20) return 'active';
    return 'pending';
  };

  // Get step icon
  const getStepIcon = (stepIndex, status) => {
    if (status === 'completed') return <CheckCircle className="w-6 h-6 text-green-500" />;
    if (status === 'active') return <Clock className="w-6 h-6 text-blue-500 animate-pulse" />;
    return <Clock className="w-6 h-6 text-gray-400" />;
  };

  const demoSteps = [
    {
      title: 'Case Creation',
      description: 'Creating sample workplace harassment case',
      icon: <FileText className="w-5 h-5" />
    },
    {
      title: 'AI Analysis',
      description: 'AI analyzing and assigning to Legal Team',
      icon: <Brain className="w-5 h-5" />
    },
    {
      title: 'Admin Assignment',
      description: 'Notifying and assigning to Legal Team admin',
      icon: <Users className="w-5 h-5" />
    },
    {
      title: 'Case Updates',
      description: 'Simulating status changes and progress',
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      title: 'Notifications',
      description: 'Demonstrating real-time notification system',
      icon: <Bell className="w-5 h-5" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <button
            onClick={() => setCurrentView('landing')}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Landing</span>
          </button>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎭 SafeVoice Demo Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the complete SafeVoice workflow in real-time. Watch as a sample case is created, 
            analyzed by AI, assigned to specialists, and progresses through the system with live notifications.
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {isConnected ? 'Connected to Demo Service' : 'Disconnected'}
              </span>
            </div>
            {!isConnected && connectionAttempts > 0 && (
              <span className="text-sm text-orange-600">
                Reconnecting... ({connectionAttempts}/{maxReconnectAttempts})
              </span>
            )}
          </div>
        </div>

        {/* Demo Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={startDemo}
              disabled={demoStatus.isRunning}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-5 h-5" />
              <span>Start Demo</span>
            </button>
            
            <button
              onClick={stopDemo}
              disabled={!demoStatus.isRunning}
              className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Square className="w-5 h-5" />
              <span>Stop Demo</span>
            </button>
            
            <button
              onClick={resetDemo}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Reset Demo</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {demoStatus.isRunning && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">Demo Progress</span>
                <span className="text-2xl font-bold text-blue-600">{demoStatus.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${demoStatus.progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Demo Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
          {demoSteps.map((step, index) => {
            const status = getStepStatus(index);
            return (
              <div 
                key={index}
                className={`bg-white rounded-lg shadow-md p-4 text-center transition-all duration-300 ${
                  status === 'active' ? 'ring-2 ring-blue-500 scale-105' : ''
                }`}
              >
                <div className="flex justify-center mb-3">
                  {getStepIcon(index, status)}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
                <div className="mt-3">
                  {status === 'completed' && (
                    <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                  )}
                  {status === 'active' && (
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Portal Views */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* User Portal Preview */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">👤 User Portal</h3>
              <button
                onClick={() => setShowUserPortal(!showUserPortal)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                {showUserPortal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showUserPortal ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            
            {showUserPortal && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Case Status</h4>
                  <p className="text-blue-800">Workplace harassment case assigned to Legal Team</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Recent Updates</h4>
                  <p className="text-green-800">Case acknowledged and under review</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Messages</h4>
                  <p className="text-purple-800">2 new messages from Legal Team</p>
                </div>
              </div>
            )}
          </div>

          {/* Admin Portal Preview */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">👑 Admin Portal</h3>
              <button
                onClick={() => setShowAdminPortal(!showAdminPortal)}
                className="flex items-center space-x-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                {showAdminPortal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showAdminPortal ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            
            {showAdminPortal && (
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-900 mb-2">New Case Assigned</h4>
                  <p className="text-red-800">High-priority workplace harassment case</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">AI Analysis</h4>
                  <p className="text-yellow-800">94% confidence in Legal Team assignment</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Actions Required</h4>
                  <p className="text-blue-800">Initial response due within 4 hours</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Demo Results */}
        {demoData && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">🎉 Demo Completed Successfully!</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Demo Summary</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>✅ Sample case created and submitted</li>
                  <li>✅ AI analysis completed with 94% confidence</li>
                  <li>✅ Case assigned to Legal Team</li>
                  <li>✅ Status updates simulated</li>
                  <li>✅ Notification system demonstrated</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">What You've Seen</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>🔍 Real-time case creation and processing</li>
                  <li>🤖 AI-powered department assignment</li>
                  <li>👥 Admin notification and assignment</li>
                  <li>📊 Case status progression</li>
                  <li>🔔 Multi-channel notification system</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-red-800">Demo Error</span>
            </div>
            <p className="text-red-700 mt-2">{error}</p>
          </div>
        )}

        {/* Live Updates */}
        {demoStatus.steps.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">📝 Live Demo Steps</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {demoStatus.steps.map((step, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{step.step}</h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoDashboard;
