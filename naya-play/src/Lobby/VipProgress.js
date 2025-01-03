import React, { useState, useEffect } from 'react';
import { Star, Trophy, Crown, Shield, Diamond, Award } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const vipLevels = {
  none: { 
    color: 'from-gray-400 to-gray-500',
    textColor: 'text-gray-400',
    icon: Star,
    next: 'Bronze',
    glowColor: 'shadow-gray-500/20',
    bgGlow: 'from-gray-500/5 to-gray-400/5'
  },
  bronze: { 
    color: 'from-amber-600 to-orange-700',
    textColor: 'text-amber-500',
    icon: Shield,
    next: 'Silver',
    glowColor: 'shadow-amber-500/20',
    bgGlow: 'from-amber-500/10 to-orange-600/5'
  },
  silver: { 
    color: 'from-gray-300 to-gray-400',
    textColor: 'text-gray-300',
    icon: Award,
    next: 'Gold',
    glowColor: 'shadow-gray-400/20',
    bgGlow: 'from-gray-300/10 to-gray-400/5'
  },
  gold: { 
    color: 'from-yellow-400 to-amber-500',
    textColor: 'text-yellow-400',
    icon: Trophy,
    next: 'Platinum',
    glowColor: 'shadow-yellow-500/20',
    bgGlow: 'from-yellow-400/10 to-amber-500/5'
  },
  platinum: { 
    color: 'from-cyan-400 to-blue-500',
    textColor: 'text-cyan-400',
    icon: Crown,
    next: 'Diamond',
    glowColor: 'shadow-cyan-500/20',
    bgGlow: 'from-cyan-400/10 to-blue-500/5'
  },
  diamond: { 
    color: 'from-blue-400 to-indigo-500',
    textColor: 'text-blue-400',
    icon: Diamond,
    next: 'Max Level',
    glowColor: 'shadow-blue-500/20',
    bgGlow: 'from-blue-400/10 to-indigo-500/5'
  }
};

const VIPBanner = () => {
  const [userData, setUserData] = useState({
    username: '',
    vipLevel: 'none',
    progress: 0,
    joinDate: '',
    currentLevelWager: 0,
    nextLevelWager: 1000,
    totalWagered: 0
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const wagered = data.totalWagered || 0;

        let vipLevel = 'none';
        let progress = 0;
        let currentLevelWager = 0;
        let nextLevelWager = 1000;

        if (wagered >= 25000) {
          vipLevel = 'diamond';
          progress = 100;
          currentLevelWager = 25000;
          nextLevelWager = 25000;
        } else if (wagered >= 10000) {
          vipLevel = 'platinum';
          progress = ((wagered - 10000) / 15000) * 100;
          currentLevelWager = 10000;
          nextLevelWager = 25000;
        } else if (wagered >= 5000) {
          vipLevel = 'gold';
          progress = ((wagered - 5000) / 5000) * 100;
          currentLevelWager = 5000;
          nextLevelWager = 10000;
        } else if (wagered >= 1000) {
          vipLevel = 'silver';
          progress = ((wagered - 1000) / 4000) * 100;
          currentLevelWager = 1000;
          nextLevelWager = 5000;
        } else if (wagered > 0) {
          vipLevel = 'bronze';
          progress = (wagered / 1000) * 100;
          currentLevelWager = 0;
          nextLevelWager = 1000;
        }

        // Only change: Updated date formatting
        const formatDate = (dateStr) => {
          if (!dateStr) return 'Unknown';
          
          try {
            // For debugging
            console.log('Received date string:', dateStr);
            
            if (typeof dateStr === 'string') {
              // Handle the exact format from your Firebase
              const match = dateStr.match(/(\w+)\s+\d+,\s+(\d{4})/);
              if (match) {
                const [_, month, year] = match;
                return `${month} ${year}`;
              }
            }
            
            // If it's a timestamp object
            if (dateStr?.seconds) {
              const date = new Date(dateStr.seconds * 1000);
              return date.toLocaleDateString('en-US', { 
                month: 'long',
                year: 'numeric'
              });
            }
            
            // Last resort: try direct Date parsing
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              return date.toLocaleDateString('en-US', { 
                month: 'long',
                year: 'numeric'
              });
            }
            
            return 'Unknown';
          } catch (error) {
            console.error('Date parsing error:', error);
            return 'Unknown';
          }
        };
        setUserData({
          username: data.displayUsername || 'Player',
          vipLevel,
          progress: Math.min(Math.round(progress), 100),
          joinDate: formatDate(data.createdAt),
          currentLevelWager,
          nextLevelWager,
          totalWagered: wagered
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const currentLevel = vipLevels[userData.vipLevel.toLowerCase()];
  const remainingWager = userData.nextLevelWager - userData.totalWagered;
  const LevelIcon = currentLevel.icon;

  return (
    <div className="relative bg-[#0f1923] overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0072ce]/5 via-[#0088ff]/5 to-[#00a6ff]/5" />
      <div className={`absolute inset-0 bg-gradient-to-r ${currentLevel.bgGlow}`} />
      <div className="absolute inset-0 opacity-20 mix-blend-soft-light bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj4NCjxmaWx0ZXIgaWQ9ImEiIHg9IjAiIHk9IjAiPg0KPGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPg0KPC9maWx0ZXI+DQo8cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIwLjA1Ii8+DQo8L3N2Zz4=')]" />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* User Info Section */}
            <div className="flex items-center space-x-6">
              {/* VIP Icon */}
              <div className="relative group">
                <div className={`absolute -inset-1 rounded-full blur-lg bg-gradient-to-r 
                  ${currentLevel.color} opacity-40 group-hover:opacity-60 transition-opacity duration-500`} />
                <div className={`relative w-16 h-16 rounded-full bg-gradient-to-r ${currentLevel.color}
                  flex items-center justify-center border border-white/10 shadow-lg ${currentLevel.glowColor}`}>
                  <LevelIcon size={32} className="text-white/90" />
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white tracking-wide mb-1">
                  {userData.username}
                </span>
                <div className="flex items-center space-x-3">
                  <span className={`text-lg font-semibold ${currentLevel.textColor}`}>
                    {userData.vipLevel} VIP
                  </span>
                  <span className="text-sm text-gray-400">
                    Member since {userData.joinDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Section */}
            <div className="flex-1 max-w-xl w-full space-y-3">
              {/* Level Progress Text */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Progress to {currentLevel.next}</span>
                  {userData.progress < 100 && (
                    <span className="text-sm bg-white/10 px-2 py-0.5 rounded-full text-white/80">
                      ${remainingWager.toLocaleString()} more
                    </span>
                  )}
                </div>
                <span className={`text-sm font-medium ${currentLevel.textColor}`}>
                  {userData.progress}%
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="relative h-4 bg-[#1a2730] rounded-full overflow-hidden
                shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] backdrop-blur-sm border border-white/5">
                {/* Shimmer Effect */}
                <div className="absolute inset-0 w-1/2 -skew-x-12 
                  animate-[shimmer_2s_infinite] pointer-events-none
                  bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
                
                {/* Progress Fill */}
                <div 
                  className={`
                    relative h-full rounded-full
                    transition-all duration-1000 ease-out
                    bg-gradient-to-r ${currentLevel.color}
                    before:absolute before:inset-0 before:bg-gradient-to-t 
                    before:from-black/20 before:to-transparent
                    after:absolute after:inset-0 after:bg-gradient-to-b 
                    after:from-white/10 after:to-transparent
                    shadow-lg ${currentLevel.glowColor}
                  `}
                  style={{ width: `${userData.progress}%` }}
                >
                  {/* Progress Bar Shine */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0
                    animate-shine" />
                </div>
              </div>

              {/* Wager Progress */}
              <div className="flex justify-between items-center px-1 text-sm text-gray-400">
                <span>${userData.currentLevelWager.toLocaleString()}</span>
                <span>${userData.nextLevelWager.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VIPBanner;