import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, MessageSquare, FileText, Clock, 
  CheckCircle, AlertCircle, TrendingUp, Calendar,
  Search, Filter, Plus, Edit, Trash2, Eye, 
  Download, Upload, Bell, Settings, LogOut,
  ChevronRight, ChevronDown, Star, MapPin, Home
} from 'lucide-react';
import { 
  ModernButton, ModernInput, ModernBadge,
  ModernSpinner, ModernEmptyState,
  ModernSearchInput, ModernStatusIndicator
} from './ModernUI';

const EnhancedDashboard = ({ user, onLogout, onBackToHome }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);

  // Mock data - replace with actual API calls
  useEffect(() => {
    // Simulate loading
    setIsLoading(true);
    setTimeout(() => {
      setNotifications([
        { id: 1, type: 'success', message: 'Your report has been submitted successfully', time: '2 hours ago' },
        { id: 2, type: 'info', message: 'New support resources available', time: '1 day ago' },
        { id: 3, type: 'warning', message: 'Upcoming session reminder', time: '2 days ago' }
      ]);
      
      setRecentReports([
        { id: 1, title: 'Incident Report #2024-001', status: 'underReview', date: '2024-01-15', priority: 'high' },
        { id: 2, title: 'Follow-up Report #2024-002', status: 'resolved', date: '2024-01-10', priority: 'medium' },
        { id: 3, title: 'Support Request #2024-003', status: 'acknowledged', date: '2024-01-08', priority: 'low' }
      ]);
      
      setUpcomingSessions([
        { id: 1, title: 'Counseling Session', date: '2024-01-20', time: '10:00 AM', counselor: 'Dr. Sarah Johnson' },
        { id: 2, title: 'Support Group Meeting', date: '2024-01-22', time: '2:00 PM', counselor: 'Community Support' }
      ]);
      
      setIsLoading(false);
    }, 1000);
  }, []);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Shield },
    { key: 'reports', label: 'Reports', icon: FileText },
    { key: 'messages', label: 'Messages', icon: MessageSquare },
    { key: 'sessions', label: 'Sessions', icon: Clock },
    { key: 'resources', label: 'Resources', icon: Users },
    { key: 'settings', label: 'Settings', icon: Settings }
  ];

  const stats = [
    { icon: FileText, title: 'Total Reports', value: '12', change: '+2', changeType: 'positive' },
    { icon: CheckCircle, title: 'Resolved', value: '8', change: '+1', changeType: 'positive' },
    { icon: Clock, title: 'Pending', value: '3', change: '0', changeType: 'neutral' },
    { icon: MessageSquare, title: 'Messages', value: '24', change: '+5', changeType: 'positive' }
  ];

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ModernSpinner size="xl" className="text-blue-600 mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dashboard-container">
      {/* Enhanced Header */}
      <header className="nav-dashboard shadow-soft border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-glow">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient-primary">SafeVoice Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, {user?.name || 'User'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Homepage Button */}
              <button 
                onClick={onBackToHome}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Return to Homepage"
              >
                <Home className="w-5 h-5" />
                <span className="hidden sm:inline">Home</span>
              </button>

              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell className="w-6 h-6 text-gray-600" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="stats-card hover:shadow-large transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  {stat.change !== '0' && (
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {stat.change}
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="dashboard-card p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;
                  
                  return (
                    <button
                      key={tab.key}
                      onClick={() => handleTabChange(tab.key)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-5 h-4 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                      <span className="font-medium">{tab.label}</span>
                      {isActive && (
                        <ChevronRight className="w-4 h-4 ml-auto text-blue-600" />
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    className="btn-dashboard-primary w-full flex items-center justify-center space-x-2"
                    onClick={() => setActiveTab('reports')}
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Report</span>
                  </button>
                  <button
                    className="btn-dashboard-secondary w-full flex items-center justify-center space-x-2"
                    onClick={() => setActiveTab('messages')}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Welcome Section */}
                <div className="dashboard-card p-8 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Welcome to Your SafeVoice Dashboard
                    </h2>
                    <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                      Here you can manage your reports, schedule sessions, and access support resources. 
                      Your safety and privacy are our top priorities.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button
                        className="btn-dashboard-primary flex items-center space-x-2"
                        onClick={() => setActiveTab('reports')}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create New Report</span>
                      </button>
                      <button
                        className="btn-dashboard-secondary flex items-center space-x-2"
                        onClick={() => setActiveTab('sessions')}
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Schedule Session</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="dashboard-card">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                      <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                        View All
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {recentReports.map((report) => (
                        <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{report.title}</p>
                              <p className="text-sm text-gray-500">{report.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <ModernStatusIndicator status={report.status} />
                            <ModernBadge
                              variant={report.priority === 'high' ? 'danger' : report.priority === 'medium' ? 'warning' : 'default'}
                              size="sm"
                            >
                              {report.priority}
                            </ModernBadge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Upcoming Sessions */}
                <div className="dashboard-card">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Upcoming Sessions</h3>
                    <div className="space-y-4">
                      {upcomingSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Clock className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{session.title}</p>
                              <p className="text-sm text-gray-500">
                                {session.date} at {session.time} with {session.counselor}
                              </p>
                            </div>
                          </div>
                          <ModernButton variant="outline" size="sm">
                            Join
                          </ModernButton>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
                    <p className="text-gray-600">Manage and track your incident reports</p>
                  </div>
                  <ModernButton icon={Plus} onClick={() => console.log('Create new report')}>
                    New Report
                  </ModernButton>
                </div>

                {/* Filters and Search */}
                <div className="dashboard-card p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <ModernSearchInput
                      placeholder="Search reports..."
                      className="flex-1"
                    />
                    <ModernButton variant="outline" icon={Filter}>
                      Filters
                    </ModernButton>
                  </div>
                </div>

                {/* Reports List */}
                <div className="dashboard-card">
                  <div className="overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Report
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Priority
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentReports.map((report) => (
                          <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{report.title}</div>
                                <div className="text-sm text-gray-500">#{report.id}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <ModernStatusIndicator status={report.status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <ModernBadge
                                variant={report.priority === 'high' ? 'danger' : report.priority === 'medium' ? 'warning' : 'default'}
                              >
                                {report.priority}
                              </ModernBadge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {report.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <ModernButton variant="ghost" size="sm" icon={Eye}>
                                  View
                                </ModernButton>
                                <ModernButton variant="ghost" size="sm" icon={Edit}>
                                  Edit
                                </ModernButton>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
                    <p className="text-gray-600">Communicate with support staff and counselors</p>
                  </div>
                  <ModernButton icon={Plus} onClick={() => console.log('New message')}>
                    New Message
                  </ModernButton>
                </div>

                <ModernEmptyState
                  icon={MessageSquare}
                  title="No messages yet"
                  description="Start a conversation with our support team or counselors to get the help you need."
                  action={
                    <ModernButton icon={Plus} onClick={() => console.log('New message')}>
                      Send First Message
                    </ModernButton>
                  }
                />
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Sessions</h2>
                    <p className="text-gray-600">Schedule and manage your support sessions</p>
                  </div>
                  <ModernButton icon={Plus} onClick={() => console.log('Schedule session')}>
                    Schedule Session
                  </ModernButton>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="dashboard-card p-6 hover:shadow-large transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Clock className="w-6 h-6 text-green-600" />
                        </div>
                        <ModernBadge variant="success">Upcoming</ModernBadge>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{session.title}</h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {session.date}
                        </p>
                        <p className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          {session.time}
                        </p>
                        <p className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          {session.counselor}
                        </p>
                      </div>
                      <div className="mt-6 flex space-x-3">
                        <ModernButton variant="primary" size="sm" className="flex-1">
                          Join Session
                        </ModernButton>
                        <ModernButton variant="outline" size="sm">
                          Reschedule
                        </ModernButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Resources</h2>
                  <p className="text-gray-600">Access helpful information and support materials</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { title: 'Safety Guidelines', description: 'Learn how to stay safe in various situations', icon: Shield },
                    { title: 'Support Contacts', description: 'Emergency and support contact information', icon: Users },
                    { title: 'Legal Information', description: 'Understanding your rights and legal options', icon: FileText },
                    { title: 'Self-Care Tips', description: 'Mental health and wellness resources', icon: CheckCircle },
                    { title: 'Community Groups', description: 'Connect with others in similar situations', icon: MessageSquare },
                    { title: 'Educational Materials', description: 'Learn about prevention and awareness', icon: TrendingUp }
                  ].map((resource, index) => (
                    <div key={index} className="dashboard-card p-6 hover:shadow-large transition-all duration-300 cursor-pointer">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                        <resource.icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{resource.title}</h3>
                      <p className="text-gray-600 mb-4">{resource.description}</p>
                      <ModernButton variant="outline" size="sm" className="w-full">
                        Learn More
                      </ModernButton>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                  <p className="text-gray-600">Manage your account preferences and privacy settings</p>
                </div>

                <div className="dashboard-card p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
                      <div className="space-y-4">
                        <ModernInput
                          label="Full Name"
                          value={user?.name || ''}
                          placeholder="Enter your full name"
                        />
                        <ModernInput
                          label="Email"
                          value={user?.email || ''}
                          placeholder="Enter your email"
                          type="email"
                        />
                        <ModernInput
                          label="Phone Number"
                          value={user?.phone || ''}
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">Anonymous Reporting</p>
                            <p className="text-sm text-gray-500">Keep your identity hidden in reports</p>
                          </div>
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">Email Notifications</p>
                            <p className="text-sm text-gray-500">Receive updates about your reports</p>
                          </div>
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                      <ModernButton variant="danger" icon={LogOut} onClick={handleLogout}>
                        Sign Out
                      </ModernButton>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;