import React, { useEffect, useState } from 'react';
import useAuth from '../../Auth/useAuth';
import { HeadphonesIcon, Users, Clock, CheckCheck } from 'lucide-react';

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
      // Replace this URL with your tawk.to widget URL
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

      // Optional: Listen for chat events
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

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400">Active Chats</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.activeChats}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
              <HeadphonesIcon size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400">Online Agents</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.onlineAgents}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg text-green-400">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400">Avg. Response Time</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.avgResponseTime}</p>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-400">
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400">Resolved Today</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.resolvedToday}</p>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
              <CheckCheck size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Support Interface */}
      <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl shadow-black/20 overflow-hidden h-[600px] relative">
        <div className="absolute inset-0">
          {/* Tawk.to widget will automatically appear here */}
          {/* You can style the widget using their dashboard */}
        </div>
      </div>
    </div>
  );
};

export default AdminSupportDashboard;