import React, { useEffect, useState } from 'react';
import useAuth from '../../Auth/useAuth';
import { 
  HeadphonesIcon, 
  Users, 
  Clock, 
  CheckCheck,
  MessageCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
  const colorVariants = {
    blue: 'from-blue-500/20 to-transparent border-blue-500/20',
    green: 'from-green-500/20 to-transparent border-green-500/20',
    yellow: 'from-yellow-500/20 to-transparent border-yellow-500/20',
    purple: 'from-purple-500/20 to-transparent border-purple-500/20'
  };

  const iconColorVariants = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400'
  };

  return (
    <div className={`relative group overflow-hidden rounded-2xl bg-gradient-to-br bg-[#1a1b1e] border 
      ${colorVariants[color]} transition-all duration-300 hover:shadow-lg hover:shadow-black/20`}>
      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className={`absolute inset-0 bg-gradient-to-br ${colorVariants[color]} blur-xl`} />
      </div>
      
      <div className="relative p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
          </div>
          
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center 
            bg-gradient-to-br from-white/5 to-transparent border border-white/5
            ${iconColorVariants[color]}`}>
            <Icon size={24} />
          </div>
        </div>
        
        {trend && (
          <div className="mt-4">
            <div className={`flex items-center space-x-2 text-sm
              ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
              <TrendingUp size={16} className={trend < 0 ? 'rotate-180' : ''} />
              <span>{Math.abs(trend)}% from last period</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatInterface = () => {
  return (
    <div className="bg-gradient-to-br from-[#1a1b1e] to-[#141517] rounded-2xl border border-white/5 
      shadow-xl shadow-black/20 overflow-hidden h-[600px] relative">
      <div className="absolute inset-0">
        {/* Tawk.to widget container */}
      </div>
    </div>
  );
};

const AlertBanner = ({ message, type = 'info' }) => {
  const types = {
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20'
  };

  return (
    <div className={`flex items-center space-x-3 p-4 rounded-xl border ${types[type]}`}>
      <AlertCircle size={20} />
      <p>{message}</p>
    </div>
  );
};

const AdminSupportDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeChats: 0,
    onlineAgents: 1,
    avgResponseTime: '5m',
    resolvedToday: 0
  });

  useEffect(() => {
    // Initialize Tawk.to
    var Tawk_API = window.Tawk_API || {};
    var Tawk_LoadStart = new Date();

    (function(){
      var s1 = document.createElement("script");
      var s0 = document.getElementsByTagName("script")[0];
      s1.async = true;
      s1.src = 'https://nayaplay.io';
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin','*');
      s0.parentNode.insertBefore(s1,s0);
    })();

    // Set visitor information once Tawk_API is ready
    if (window.Tawk_API) {
      window.Tawk_API.onLoad = function(){
        window.Tawk_API.setAttributes({
          name: user?.displayName || 'Admin User',
          email: user?.email,
          role: 'admin'
        }, function(error){});
      };

      // Chat event handlers
      window.Tawk_API.onChatMaximized = function(){
        // Handle chat window maximized
      };

      window.Tawk_API.onChatMinimized = function(){
        // Handle chat window minimized
      };

      window.Tawk_API.onChatStarted = function(){
        setStats(prev => ({
          ...prev,
          activeChats: prev.activeChats + 1
        }));
      };

      window.Tawk_API.onChatEnded = function(){
        setStats(prev => ({
          ...prev,
          activeChats: Math.max(0, prev.activeChats - 1),
          resolvedToday: prev.resolvedToday + 1
        }));
      };
    }

    // Cleanup
    return () => {
      if (window.Tawk_API) {
        window.Tawk_API.endChat();
      }
    };
  }, [user]);

  const statsConfig = [
    {
      title: 'Active Chats',
      value: stats.activeChats.toString(),
      subtitle: 'Live conversations',
      icon: MessageCircle,
      color: 'blue',
      trend: 12
    },
    {
      title: 'Online Agents',
      value: stats.onlineAgents.toString(),
      subtitle: 'Available for support',
      icon: Users,
      color: 'green',
      trend: 0
    },
    {
      title: 'Response Time',
      value: stats.avgResponseTime,
      subtitle: 'Average wait time',
      icon: Clock,
      color: 'yellow',
      trend: -15
    },
    {
      title: 'Resolved Today',
      value: stats.resolvedToday.toString(),
      subtitle: 'Completed tickets',
      icon: CheckCheck,
      color: 'purple',
      trend: 25
    }
  ];

  return (
    <div className="space-y-6">
      {/* Optional Alert Banner */}
      <AlertBanner 
        message="Live chat support is active and running normally" 
        type="info"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsConfig.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Live Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ChatInterface />
        </div>
        
        {/* Quick Actions Panel */}
        <div className="space-y-4">
          <div className="bg-[#1a1b1e] rounded-2xl border border-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-400 
                hover:bg-blue-500/20 transition-all duration-300 flex items-center justify-center space-x-2">
                <HeadphonesIcon size={18} />
                <span>Start New Chat</span>
              </button>
              <button className="w-full px-4 py-2.5 rounded-xl bg-purple-500/10 text-purple-400 
                hover:bg-purple-500/20 transition-all duration-300 flex items-center justify-center space-x-2">
                <Users size={18} />
                <span>View Agent Status</span>
              </button>
              <button className="w-full px-4 py-2.5 rounded-xl bg-green-500/10 text-green-400 
                hover:bg-green-500/20 transition-all duration-300 flex items-center justify-center space-x-2">
                <CheckCheck size={18} />
                <span>View Resolved Tickets</span>
              </button>
            </div>
          </div>
          
          {/* Additional Metrics or Info Cards can go here */}
        </div>
      </div>
    </div>
  );
};

export default AdminSupportDashboard;