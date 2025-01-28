import React, { useState, useEffect } from 'react';
import { X, LineChart, DollarSign, Trophy, Target } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const StatisticsModal = ({ isOpen, onClose, userId }) => {
  const [stats, setStats] = useState({
    totalBets: 0,
    wins: 0,
    losses: 0,
    totalWagered: 0,
    totalWon: 0
  });
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        // Only fetch stats if user hasn't hidden them
        if (!userDoc.data()?.hideStats) {
          const betsRef = collection(db, 'users', userId, 'bets');
          const betsSnapshot = await getDocs(betsRef);
          
          let totalBets = 0;
          let wins = 0;
          let losses = 0;
          let totalWagered = 0;
          let totalWon = 0;

          betsSnapshot.forEach((doc) => {
            const bet = doc.data();
            totalBets++;
            totalWagered += bet.betAmount || 0;
            
            if (bet.status === 'won') {
              wins++;
              totalWon += bet.payout || 0;
            } else if (bet.status === 'lost') {
              losses++;
            }
          });

          setStats({
            totalBets,
            wins,
            losses,
            totalWagered,
            totalWon
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchUserData();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const profitLoss = stats.totalWon - stats.totalWagered;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl">
        <div className="bg-[#0B1622] rounded-lg shadow-xl border border-[#1B2838]/50 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#1B2838]/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LineChart className="w-5 h-5 text-[#6366F1]" />
              <h2 className="text-lg font-medium text-white">Statistics</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-[#1B2838] rounded-lg transition-colors"
            >
              <X size={20} className="text-[#94A3B8]" />
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6366F1]"></div>
              </div>
            ) : userData?.hideStats ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Target size={48} className="text-[#94A3B8] mb-4" />
                <p className="text-white text-lg mb-2">{userData.username}</p>
                <p className="text-[#94A3B8]">This user has chosen to keep their statistics private</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1B2838]/50 rounded-lg p-4 border border-[#1B2838]/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#1B2838] rounded-lg">
                        <Target size={20} className="text-[#94A3B8]" />
                      </div>
                      <div>
                        <p className="text-sm text-[#94A3B8]">Total Bets</p>
                        <p className="text-lg font-bold text-white">{stats.totalBets.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#1B2838]/50 rounded-lg p-4 border border-[#1B2838]/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#1B2838] rounded-lg">
                        <DollarSign size={20} className="text-[#94A3B8]" />
                      </div>
                      <div>
                        <p className="text-sm text-[#94A3B8]">Total Wagered</p>
                        <p className="text-lg font-bold text-white">
                          ${stats.totalWagered.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1B2838]/50 rounded-lg p-4 border border-[#1B2838]/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#1B2838] rounded-lg">
                        <Trophy size={20} className="text-[#94A3B8]" />
                      </div>
                      <div>
                        <p className="text-sm text-[#94A3B8]">Wins</p>
                        <p className="text-lg font-bold text-white">{stats.wins.toLocaleString()}</p>
                        <p className="text-xs text-[#94A3B8]">
                          {((stats.wins / (stats.totalBets || 1)) * 100).toFixed(1)}% win rate
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1B2838]/50 rounded-lg p-4 border border-[#1B2838]/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#1B2838] rounded-lg">
                        <Target size={20} className="text-[#94A3B8]" />
                      </div>
                      <div>
                        <p className="text-sm text-[#94A3B8]">Losses</p>
                        <p className="text-lg font-bold text-white">{stats.losses.toLocaleString()}</p>
                        <p className="text-xs text-[#94A3B8]">
                          {((stats.losses / (stats.totalBets || 1)) * 100).toFixed(1)}% loss rate
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1B2838]/50 rounded-lg p-4 border border-[#1B2838]/30">
                  <div className="flex justify-between items-center">
                    <span className="text-[#94A3B8]">Total Profit/Loss</span>
                    <span className={`text-lg font-bold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${profitLoss >= 0 ? '+' : ''}{profitLoss.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center text-sm text-[#94A3B8] mt-4">
              Statistics updated in real-time
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
   
export default StatisticsModal;