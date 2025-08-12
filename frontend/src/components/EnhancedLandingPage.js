import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, MessageSquare, FileText, Clock, 
  CheckCircle, ArrowRight, Play, Code,
  Lock, Globe, Heart, Star
} from 'lucide-react';
import { 
  ModernButton, ModernCard, FeatureCard, StatsCard,
  ModernInput, ModernSearchInput 
} from './ModernUI';

const EnhancedLandingPage = ({ onGetStarted, onLogin, onAdminLogin, onUIDemo }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');

  const features = [
    {
      icon: Shield,
      title: "Secure Reporting",
      description: "Anonymous and encrypted reporting system to ensure your safety while maintaining confidentiality.",
      gradient: true
    },
    {
      icon: Users,
      title: "Community Support",
      description: "Connect with trained professionals and community members who understand your situation.",
      gradient: false
    },
    {
      icon: MessageSquare,
      title: "AI-Powered Assistance",
      description: "Get instant support and guidance through our intelligent chatbot system.",
      gradient: true
    },
    {
      icon: FileText,
      title: "Document Management",
      description: "Securely store and manage all your reports and supporting documents.",
      gradient: false
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Access support and resources anytime, anywhere with our round-the-clock platform.",
      gradient: true
    },
    {
      icon: CheckCircle,
      title: "Verified Resources",
      description: "Access to verified information and resources from trusted organizations.",
      gradient: false
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: "Sarah M.",
      role: "Student",
      content: "SafeVoice helped me find the courage to report an incident. The anonymous system made me feel safe.",
      rating: 5,
      avatar: "S"
    },
    {
      id: 2,
      name: "Michael R.",
      role: "Parent",
      content: "As a parent, I'm grateful for SafeVoice. It's helped my child access the support they needed.",
      rating: 5,
      avatar: "M"
    },
    {
      id: 3,
      name: "Dr. Emily Chen",
      role: "Counselor",
      content: "SafeVoice provides a crucial bridge between victims and support services. It's making a real difference.",
      rating: 5,
      avatar: "E"
    }
  ];

  const stats = [
    {
      icon: Users,
      title: "Active Users",
      value: "10,000+",
      change: "+15%",
      changeType: "positive"
    },
    {
      icon: Shield,
      title: "Reports Filed",
      value: "5,000+",
      change: "+23%",
      changeType: "positive"
    },
    {
      icon: CheckCircle,
      title: "Cases Resolved",
      value: "4,200+",
      change: "+18%",
      changeType: "positive"
    },
    {
      icon: MessageSquare,
      title: "Support Sessions",
      value: "8,500+",
      change: "+31%",
      changeType: "positive"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email && onGetStarted) {
      onGetStarted(email);
    }
  };



  return (
    <div className="min-h-screen dashboard-container">
      {/* Enhanced Professional Header */}
      <header className="nav-dashboard border-b border-gray-200/50 sticky top-0 z-50 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
                          <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-glow">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gradient-primary">SafeVoice</h1>
                  <p className="text-sm text-gray-500">Your voice matters</p>
                </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="nav-item-dashboard">Features</a>
              <a href="#about" className="nav-item-dashboard">About</a>
              <a href="#testimonials" className="nav-item-dashboard">Testimonials</a>
              <a href="#contact" className="nav-item-dashboard">Contact</a>
            </nav>

            <div className="flex items-center space-x-4">
              <button 
                onClick={onLogin}
                className="btn-dashboard-secondary"
              >
                Sign In
              </button>
              <button 
                onClick={onAdminLogin}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                Admin
              </button>
              <button 
                onClick={onGetStarted}
                className="btn-dashboard-primary"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4 px-4">
              <a href="#features" className="nav-item-dashboard">Features</a>
              <a href="#about" className="nav-item-dashboard">About</a>
              <a href="#testimonials" className="nav-item-dashboard">Testimonials</a>
              <a href="#contact" className="nav-item-dashboard">Contact</a>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-7xl font-bold text-gradient-primary mb-8 leading-tight animate-fade-in">
              Your Voice
              <span className="block text-6xl lg:text-8xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Matters
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mb-12 leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Report incidents safely, access professional support, and get the help you deserve. 
              Your privacy and safety are our top priorities.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <ModernButton size="lg" onClick={onGetStarted} className="group">
                Start Reporting
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </ModernButton>
              <ModernButton variant="outline" size="lg" onClick={onUIDemo} className="group">
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </ModernButton>
              <ModernButton variant="success" size="lg" onClick={onUIDemo} className="group">
                <Code className="mr-2 w-5 h-5" />
                UI Components
              </ModernButton>
            </div>



            {/* Trust Indicators */}
            <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-gray-500 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span className="text-sm">100% Anonymous</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-blue-500" />
                <span className="text-sm">Bank-Level Security</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-500" />
                <span className="text-sm">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '4s' }}></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
                             <div
                 key={stat.title}
                 className="text-center text-white animate-slide-in-up"
                 style={{ animationDelay: `${index * 0.1}s` }}
               >
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <stat.icon className="w-8 h-8" />
                </div>
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-blue-100">{stat.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

            {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gradient-primary mb-6">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform provides all the tools and support you need to report incidents 
              safely and get the help you deserve.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`dashboard-card p-8 hover:shadow-large transition-all duration-300 animate-slide-in-up cursor-pointer group`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                                 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200 ${
                   feature.gradient ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                 }`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-200">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gradient-primary mb-6">
              What People Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from our community members about their experiences with SafeVoice
            </p>
          </div>
          
          <div className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className={`dashboard-card p-8 text-center transition-all duration-300 ${
                    index === currentSlide ? 'scale-105 shadow-large' : 'opacity-75'
                  }`}
                >
                  <div className="flex justify-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Testimonial Navigation */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentSlide ? 'bg-blue-600 w-8' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of users who have found their voice with SafeVoice. 
            Your safety and privacy are our top priorities.
          </p>
          
          <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <ModernInput
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                required
              />
              <button type="submit" className="btn-dashboard-primary px-8 py-3">
                Get Started
              </button>
            </div>
          </form>
          
          <p className="text-sm text-gray-400 mt-4">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">SafeVoice</h3>
                  <p className="text-gray-400">Your voice matters</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Empowering individuals to report incidents safely and access professional support. 
                Your privacy and safety are our top priorities.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <Globe className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <MessageSquare className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <Heart className="w-5 h-5" />
                </a>
              </div>
            </div>

                        <div>
              <h4 className="text-lg font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors duration-200">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Resources</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors duration-200">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Team</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SafeVoice. All rights reserved. Your privacy and safety matter.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EnhancedLandingPage;