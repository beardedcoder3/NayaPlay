import React, { useState, useEffect } from 'react';
import { X, Crown, Star, ChevronRight, Shield, Gift, Zap, Trophy } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, onSnapshot, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

// Debugging function
const logUserData = (data) => {
  console.log('Raw Firestore User Data:', data);
};

const VIP_LEVELS = {
  1: {
    name: "Bronze",
    requiredWager: 0,
    bgGradient: "from-amber-900 via-amber-800 to-amber-700",
    cardBg: "bg-gradient-to-br from-amber-900/20 via-amber-800/10 to-transparent",
    activeBar: "from-amber-600 via-amber-500 to-amber-600",
    accent: "text-amber-500",
    border: "border-amber-900/50"
  },
  2: {
    name: "Silver",
    requiredWager: 10000,
    bgGradient: "from-slate-800 via-slate-700 to-slate-600",
    cardBg: "bg-gradient-to-br from-slate-800/20 via-slate-700/10 to-transparent",
    activeBar: "from-slate-400 via-slate-300 to-slate-400",
    accent: "text-slate-400",
    border: "border-slate-700/50"
  },
  3: {
    name: "Gold",
    requiredWager: 50000,
    bgGradient: "from-yellow-800 via-amber-700 to-yellow-600",
    cardBg: "bg-gradient-to-br from-yellow-900/20 via-amber-800/10 to-transparent",
    activeBar: "from-yellow-400 via-yellow-300 to-yellow-400",
    accent: "text-yellow-500",
    border: "border-yellow-800/50"
  },
  4: {
    name: "Platinum",
    requiredWager: 100000,
    bgGradient: "from-cyan-900 via-cyan-800 to-cyan-700",
    cardBg: "bg-gradient-to-br from-cyan-900/20 via-cyan-800/10 to-transparent",
    activeBar: "from-cyan-400 via-cyan-300 to-cyan-400",
    accent: "text-cyan-400",
    border: "border-cyan-800/50"
  },
  5: {
    name: "Diamond",
    requiredWager: 250000,
    bgGradient: "from-violet-900 via-purple-800 to-violet-700",
    cardBg: "bg-gradient-to-br from-violet-900/20 via-purple-800/10 to-transparent",
    activeBar: "from-violet-400 via-violet-300 to-violet-400",
    accent: "text-violet-400",
    border: "border-violet-800/50"
  }
};

const VipModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('progress');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      return;
    }
  
    if (!auth.currentUser) {
      setError('Please login to view VIP status');
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userRef = doc(db, 'users', auth.currentUser.uid);
        
        // Main user data subscription
        const unsubscribeUser = onSnapshot(userRef, async (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            logUserData(data); // Log raw data for debugging

            // Calculate VIP level
            let currentLevel = 1;
            for (let level = 5; level >= 1; level--) {
              if (data.wagered >= VIP_LEVELS[level].requiredWager) {
                currentLevel = level;
                break;
              }
            }

            // Calculate progress
            let progress = 0;
            if (currentLevel < 5) {
              const nextLevelWager = VIP_LEVELS[currentLevel + 1].requiredWager;
              const currentLevelWager = VIP_LEVELS[currentLevel].requiredWager;
              progress = ((data.wagered - currentLevelWager) / (nextLevelWager - currentLevelWager)) * 100;
            }

            // Get last 30 days bets
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const betsRef = collection(db, 'users', auth.currentUser.uid, 'bets');
            const recentBetsQuery = query(
              betsRef,
              where('createdAt', '>=', thirtyDaysAgo),
              orderBy('createdAt', 'desc')
            );
            
            const betsSnapshot = await getDocs(recentBetsQuery);
            const recentBets = betsSnapshot.docs.map(doc => doc.data());

            // Calculate statistics
            const monthlyBetsAmount = recentBets.reduce((sum, bet) => sum + (bet.amount || 0), 0);
            const monthlyWinsAmount = recentBets.reduce((sum, bet) => sum + (bet.payout || 0), 0);

            setUserData({
              ...data,
              currentLevel,
              progress: Math.min(progress, 100),
              username: data.username || 'Player',
              wagered: data.wagered || 0,
              totalBets: data.totalBets || 0,
              wonAmount: data.wonAmount || 0,
              monthlyBetsAmount,
              monthlyWinsAmount,
              lastUpdated: new Date()
            });
          }
          setLoading(false);
        });

        return () => unsubscribeUser();
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isOpen]);

  const currentLevel = userData ? VIP_LEVELS[userData.currentLevel] : VIP_LEVELS[1];
// In your VipModal component, modify the loading state:
if (loading) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></div>
      </div>
    </div>
  );
}

  if (error) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="text-red-500">Error: {error}</div>
    </div>;
  }

  if (!userData) return null;

  const TabButton = ({ name, icon: Icon, tab }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
        activeTab === tab
          ? `${currentLevel.cardBg} ${currentLevel.accent} border ${currentLevel.border}`
          : 'text-gray-400 hover:bg-white/5'
      }`}
    >
      <Icon className="w-4 h-4" />
      {name}
    </button>
  );

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="min-h-screen px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className={`rounded-t-2xl bg-gradient-to-br ${currentLevel.bgGradient} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,0,0,0),_#000_70%)]" />
              
              <div className="relative px-8 py-12">
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-black/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white/80" />
                </button>

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-2xl bg-black/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
                      <Crown className="w-12 h-12 text-white" />
                    </div>
                    <div>
                      <p className={`text-sm ${currentLevel.accent} mb-2`}>VIP Level {userData.currentLevel}</p>
                      <h1 className="text-4xl font-bold text-white mb-2">
                        {userData.username}
                      </h1>
                      <div className="flex items-center gap-2">
                        <Trophy className={`w-4 h-4 ${currentLevel.accent}`} />
                        <p className="text-white/80">{currentLevel.name} Member</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-white/60 mb-1">Total Wagered</p>
                    <p className="text-3xl font-bold text-white">
                      ${userData.wagered.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-[#0A1218] border-b border-white/5 p-2">
              <div className="flex gap-2">
                <TabButton name="Progress" icon={Trophy} tab="progress" />
                <TabButton name="Benefits" icon={Gift} tab="benefits" />
                <TabButton name="Boost" icon={Zap} tab="boost" />
                <TabButton name="History" icon={Shield} tab="history" />
              </div>
            </div>

            {/* Content Area */}
            <div className="bg-[#0A1218] rounded-b-2xl p-8">
              {activeTab === 'progress' && (
                <div className="space-y-8">
                  {/* Progress Bar Section */}
                  <div className={`${currentLevel.cardBg} rounded-xl border ${currentLevel.border} p-6`}>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-white font-medium">Progress to Next Level</h3>
                        <p className="text-white/60 text-sm">
                          {userData.currentLevel < 5 
                            ? `${VIP_LEVELS[userData.currentLevel + 1].name} VIP`
                            : 'Maximum Level Reached'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${currentLevel.accent}`}>
                          {userData.progress.toFixed(2)}%
                        </p>
                        {userData.currentLevel < 5 && (
                          <p className="text-white/60 text-sm">
                            ${(VIP_LEVELS[userData.currentLevel + 1].requiredWager - userData.wagered).toLocaleString()} more to go
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="relative h-3 bg-black/40 rounded-full overflow-hidden">
                      <div 
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${currentLevel.activeBar} transition-all duration-300`}
                        style={{ width: `${userData.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className={`${currentLevel.cardBg} rounded-xl border ${currentLevel.border} p-6`}>
                      <p className="text-white/60 mb-1">Total Bets</p>
                      <p className="text-2xl font-bold text-white">
                        {userData.totalBets.toLocaleString()}
                      </p>
                    </div>
                    <div className={`${currentLevel.cardBg} rounded-xl border ${currentLevel.border} p-6`}>
                      <p className="text-white/60 mb-1">Total Wins</p>
                      <p className="text-2xl font-bold text-white">
                        ${userData.wonAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className={`${currentLevel.cardBg} rounded-xl border ${currentLevel.border} p-6`}>
                      <p className="text-white/60 mb-1">30d Bet Amount</p>
                      <p className="text-2xl font-bold text-white">
                        ${userData.monthlyBetsAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className={`${currentLevel.cardBg} rounded-xl border ${currentLevel.border} p-6`}>
                      <p className="text-white/60 mb-1">30d Win Amount</p>
                      <p className="text-2xl font-bold text-white">
                        ${userData.monthlyWinsAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'benefits' && (
                <div className="space-y-6">
                  {Object.entries(VIP_LEVELS).map(([level, data]) => {
                    const isCurrentLevel = parseInt(level) === userData.currentLevel;
                    const isUnlocked = parseInt(level) <= userData.currentLevel;
            
                    return (
                      <div
                        key={level}
                        className={`${
                          isCurrentLevel ? data.cardBg : 'bg-[#1A2432]/50'
                        } rounded-xl border ${
                          isCurrentLevel ? data.border : 'border-gray-800/50'
                        } p-6 transition-all duration-300`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              isCurrentLevel ? `bg-gradient-to-br ${data.bgGradient}` : 'bg-gray-800'
                            }`}>
                              {isUnlocked ? (
                                <Trophy className={`w-6 h-6 ${isCurrentLevel ? 'text-white' : data.accent}`} />
                              ) : (
                                <Star className="w-6 h-6 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <p className={`font-medium ${isCurrentLevel ? 'text-white' : 'text-gray-300'}`}>
                                {data.name}
                              </p>
                              <p className={isCurrentLevel ? data.accent : 'text-gray-500'}>
                                Level {level}
                              </p>
                            </div>
                          </div>
                    
                          <div className="flex items-center gap-8">
                            <div>
                              <p className="text-gray-400 text-sm">Rakeback</p>
                              <p className={`text-lg font-medium ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>
                                {level * 2}%
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">Weekly Bonus</p>
                              <p className={`text-lg font-medium ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>
                                ${(100 * Math.pow(2, parseInt(level) - 1)).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">Monthly Bonus</p>
                              <p className={`text-lg font-medium ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>
                                ${(500 * Math.pow(2, parseInt(level) - 1)).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                    
                        {!isUnlocked && (
                          <div className="mt-4 pt-4 border-t border-gray-800">
                            <p className="text-sm text-gray-400">
                              Wager ${data.requiredWager.toLocaleString()} to unlock
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                )}
  
                {activeTab === 'boost' && (
                  <div className="space-y-6">
                    <div className={`${currentLevel.cardBg} rounded-xl border ${currentLevel.border} p-6`}>
                      <h3 className="text-lg font-medium text-white mb-4">Available Boosts</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg bg-gradient-to-br ${currentLevel.bgGradient}`}>
                              <Zap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="text-white font-medium">Weekly Bonus</p>
                              <p className="text-sm text-gray-400">Refreshes every Monday</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${currentLevel.accent}`}>
                              ${(100 * Math.pow(2, userData.currentLevel - 1)).toLocaleString()}
                            </p>
                            <button className="mt-2 px-4 py-1.5 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 text-white transition-colors">
                              Claim Now
                            </button>
                          </div>
                        </div>
  
                        <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg bg-gradient-to-br ${currentLevel.bgGradient}`}>
                              <Gift className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="text-white font-medium">Monthly Bonus</p>
                              <p className="text-sm text-gray-400">Refreshes on the 1st</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${currentLevel.accent}`}>
                              ${(500 * Math.pow(2, userData.currentLevel - 1)).toLocaleString()}
                            </p>
                            <button className="mt-2 px-4 py-1.5 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 text-white transition-colors">
                              Available in 3 days
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
  
                {activeTab === 'history' && (
                  <div className="space-y-6">
                    <div className={`${currentLevel.cardBg} rounded-xl border ${currentLevel.border} p-6`}>
                      <h3 className="text-lg font-medium text-white mb-4">Bonus History</h3>
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                            <div>
                              <p className="text-white font-medium">Weekly Bonus Claimed</p>
                              <p className="text-sm text-gray-400">{new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                            </div>
                            <p className={`text-lg font-medium ${currentLevel.accent}`}>
                              +${(100 * Math.pow(2, userData.currentLevel - 1)).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default VipModal;