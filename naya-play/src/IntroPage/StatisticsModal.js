import React, { useState, useEffect } from 'react';
import { X, LineChart, DollarSign, Trophy, Target } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const StatsCard = ({ icon: Icon, label, value, sublabel }) => (
  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-gray-800 rounded-lg">
        <Icon size={20} className="text-gray-400" />
      </div>
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-lg font-bold text-white">{value}</p>
        {sublabel && (
          <p className="text-xs text-gray-500">{sublabel}</p>
        )}
      </div>
    </div>
  </div>
);

const StatisticsModal = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState({
    totalBets: 0,
    wins: 0,
    losses: 0,
    wagered: 0,
    totalPayout: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && auth.currentUser) {
      fetchUserStats();
    }
  }, [isOpen]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const userBetsRef = collection(db, 'users', auth.currentUser.uid, 'bets');
      const querySnapshot = await getDocs(userBetsRef);
      
      let totalBets = 0;
      let wins = 0;
      let losses = 0;
      let wagered = 0;
      let totalPayout = 0;

      querySnapshot.forEach((doc) => {
        const bet = doc.data();
        totalBets++;
        wagered += parseFloat(bet.betAmount);
        
        if (bet.status === 'won') {
          wins++;
          totalPayout += parseFloat(bet.payout);
        } else {
          losses++;
          totalPayout -= parseFloat(bet.betAmount);
        }
      });

      setStats({
        totalBets,
        wins,
        losses,
        wagered: wagered.toFixed(2),
        totalPayout: totalPayout.toFixed(2)
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl">
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl shadow-xl 
          border border-gray-700/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700/50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <LineChart className="w-6 h-6 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">Statistics</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 
                border border-gray-700/50 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <StatsCard
                    icon={Target}
                    label="Total Bets"
                    value={stats.totalBets.toLocaleString()}
                  />
                  <StatsCard
                    icon={DollarSign}
                    label="Total Wagered"
                    value={`$${parseFloat(stats.wagered).toLocaleString()}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <StatsCard
                    icon={Trophy}
                    label="Wins"
                    value={stats.wins.toLocaleString()}
                    sublabel={`${((stats.wins / stats.totalBets) * 100).toFixed(1)}% win rate`}
                  />
                  <StatsCard
                    icon={Target}
                    label="Losses"
                    value={stats.losses.toLocaleString()}
                    sublabel={`${((stats.losses / stats.totalBets) * 100).toFixed(1)}% loss rate`}
                  />
                </div>

                <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/30">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Profit/Loss</span>
                    <span className={`text-lg font-bold ${parseFloat(stats.totalPayout) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {parseFloat(stats.totalPayout) >= 0 ? '+' : '-'}${Math.abs(parseFloat(stats.totalPayout)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center text-sm text-gray-400">
              Statistics updated in real-time
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsModal;