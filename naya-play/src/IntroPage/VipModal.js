import React, { useState, useEffect } from 'react';
import { X, Crown, Star, Gift, Shield, Wallet } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc, onSnapshot, collection, query, where } from 'firebase/firestore';

const VIP_LEVELS = {
  1: {
    name: "Bronze",
    color: "#CD7F32",
    requiredWager: 0,
    rewards: {
      dailyBonus: "1%",
      weeklyBonus: "100",
      monthlyBonus: "500",
      rakeback: "2%",
      reloadBonus: "25%",
      maxDeposit: "1,000",
      maxWithdraw: "5,000",
      withdrawalFee: "1%",
      withdrawalTime: "24h",
      supportPriority: "Normal"
    }
  },
  2: {
    name: "Silver",
    color: "#C0C0C0",
    requiredWager: 10000,
    rewards: {
      dailyBonus: "2%",
      weeklyBonus: "200",
      monthlyBonus: "1,000",
      rakeback: "4%",
      reloadBonus: "35%",
      maxDeposit: "2,000",
      maxWithdraw: "10,000",
      withdrawalFee: "0.5%",
      withdrawalTime: "12h",
      supportPriority: "Priority"
    }
  },
  3: {
    name: "Geeld",
    color: "#FFD700",
    requiredWager: 50000,
    rewards: {
      dailyBonus: "3%",
      weeklyBonus: "500",
      monthlyBonus: "2,500",
      rakeback: "6%",
      reloadBonus: "50%",
      maxDeposit: "5,000",
      maxWithdraw: "25,000",
      withdrawalFee: "0.25%",
      withdrawalTime: "6h",
      supportPriority: "VIP"
    }
  },
  4: {
    name: "Platinum",
    color: "#E5E4E2",
    requiredWager: 100000,
    rewards: {
      dailyBonus: "4%",
      weeklyBonus: "1,000",
      monthlyBonus: "5,000",
      rakeback: "8%",
      reloadBonus: "75%",
      maxDeposit: "10,000",
      maxWithdraw: "50,000",
      withdrawalFee: "0",
      withdrawalTime: "2h",
      supportPriority: "Premium"
    }
  },
  5: {
    name: "Diamond",
    color: "#B9F2FF",
    requiredWager: 250000,
    rewards: {
      dailyBonus: "5%",
      weeklyBonus: "2,500",
      monthlyBonus: "10,000",
      rakeback: "10%",
      reloadBonus: "100%",
      maxDeposit: "25,000",
      maxWithdraw: "100,000",
      withdrawalFee: "0",
      withdrawalTime: "1h",
      supportPriority: "Instant"
    }
  }
};

const VipModal = ({ isOpen, onClose }) => {
  const [userData, setUserData] = useState({
    currentLevel: 1,
    wagered: 0,
    totalBets: 0,
    wonAmount: 0,
    progress: 0
  });

  useEffect(() => {
    if (!auth.currentUser || !isOpen) return;

    // Get user data
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribeUser = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        // Calculate VIP level based on wagered amount
        let currentLevel = 1;
        let progress = 0;

        for (let level = 5; level >= 1; level--) {
          if (data.wagered >= VIP_LEVELS[level].requiredWager) {
            currentLevel = level;
            break;
          }
        }

        // Calculate progress to next level
        if (currentLevel < 5) {
          const nextLevelWager = VIP_LEVELS[currentLevel + 1].requiredWager;
          const currentLevelWager = VIP_LEVELS[currentLevel].requiredWager;
          progress = ((data.wagered - currentLevelWager) / (nextLevelWager - currentLevelWager)) * 100;
        }

        setUserData({
          currentLevel,
          wagered: data.wagered || 0,
          totalBets: data.totalBets || 0,
          wonAmount: data.wonAmount || 0,
          progress: Math.min(progress, 100)
        });
      }
    });

    return () => unsubscribeUser();
  }, [isOpen]);

  const currentLevelData = VIP_LEVELS[userData.currentLevel];
  const nextLevelData = VIP_LEVELS[userData.currentLevel + 1];

  const LevelCard = ({ level, data, isActive }) => (
    <div className={`bg-gray-800/50 rounded-xl border ${
      isActive ? 'border-indigo-600' : 'border-gray-700/50'
    } overflow-hidden transition-all duration-200`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">{data.name}</h3>
            <p className="text-indigo-400">Level {level}</p>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center
            ${isActive ? 'bg-indigo-600/20' : 'bg-gray-700/50'}`}>
            <Star className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-gray-400'}`} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Rakeback</span>
            <span className="text-white">{data.rewards.rakeback}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Weekly Bonus</span>
            <span className="text-white">${data.rewards.weeklyBonus}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Monthly Bonus</span>
            <span className="text-white">${data.rewards.monthlyBonus}</span>
          </div>
        </div>

        {!isActive && data.requiredWager > 0 && (
          <div className="mt-4 p-3 bg-gray-700/30 rounded-lg">
            <p className="text-sm text-gray-300">
              Wager ${data.requiredWager.toLocaleString()} to unlock
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div 
      className={`fixed inset-0 z-[60] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="absolute inset-0 overflow-y-auto">
        <div className="min-h-screen p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                  <Crown className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">VIP Program</h1>
                  <p className="text-gray-400">Level {userData.currentLevel} - {currentLevelData.name}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Progress Card */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6 mb-8">
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div>
                  <p className="text-gray-400 mb-1">Total Wagered</p>
                  <p className="text-2xl font-bold text-white">
                    ${userData.wagered.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Total Bets</p>
                  <p className="text-2xl font-bold text-white">
                    {userData.totalBets.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Won Amount</p>
                  <p className="text-2xl font-bold text-white">
                    ${userData.wonAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              {userData.currentLevel < 5 && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">
                      Progress to {nextLevelData.name}
                    </span>
                    <span className="text-gray-300">{userData.progress.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-300"
                      style={{ width: `${userData.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Level Grid */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              {Object.entries(VIP_LEVELS).map(([level, data]) => (
                <LevelCard
                  key={level}
                  level={level}
                  data={data}
                  isActive={parseInt(level) === userData.currentLevel}
                />
              ))}
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Gift className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-xl font-bold text-white">Current Benefits</h2>
                </div>
                <div className="space-y-4">
                  {Object.entries(currentLevelData.rewards).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-400">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {userData.currentLevel < 5 && (
                <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <Shield className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-xl font-bold text-white">Next Level Benefits</h2>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(nextLevelData.rewards).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-400">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-white">{value}</span>
                      </div>
                    ))}
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