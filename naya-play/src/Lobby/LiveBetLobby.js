import React, { useState, useEffect } from 'react';
import { useLiveBets } from '../IntroPage/LiveBetsContext';
import { TrendingUp, Coins, History } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const LiveBetLobby = () => {
  const [activeTab, setActiveTab] = useState('casual');
  const { allBets } = useLiveBets();
  const [myBets, setMyBets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'mybets' && auth.currentUser) {
      fetchMyBets();
    }
  }, [activeTab]);

  const fetchMyBets = async () => {
    try {
      setLoading(true);
      const userBetsRef = collection(db, 'users', auth.currentUser.uid, 'bets');
      const q = query(
        userBetsRef,
        orderBy('date', 'desc'),
        limit(10)
      );
      
      const snapshot = await getDocs(q);
      const betsList = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        time: new Date(doc.data().date).toLocaleString()
      }));
      
      setMyBets(betsList);
    } catch (error) {
      console.error("Error fetching bets:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayBets = () => {
    if (activeTab === 'mybets') {
      return myBets;
    }
    
    return allBets
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .filter(bet => activeTab === 'casual' 
        ? Math.abs(bet.betAmount) < 1000 
        : Math.abs(bet.betAmount) >= 1000)
      .slice(0, 10);
  };

  const displayBets = getDisplayBets();

  return (
    <div className="bg-gray-900 py-16">
      <div className="max-w-7xl mx-auto px-8">
        {/* Enhanced Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-6 mb-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl 
              bg-gradient-to-br from-indigo-500/10 to-purple-500/10 
              border border-indigo-500/20 group transition-colors duration-300">
              <TrendingUp size={32} className="text-indigo-400 group-hover:text-indigo-300 
                transition-colors duration-300 transform group-hover:scale-110" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 
                bg-clip-text text-transparent mb-2">
                Live Bets
              </h2>
              <p className="text-gray-400">
                Track real-time betting activity
              </p>
            </div>
          </div>

          {/* Enhanced Tab Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('mybets')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300
                flex items-center space-x-2 transform hover:scale-[1.02]
                ${activeTab === 'mybets' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}
            >
              <History size={18} />
              <span>My Bets</span>
            </button>
            <button
              onClick={() => setActiveTab('casual')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300
                flex items-center space-x-2 transform hover:scale-[1.02]
                ${activeTab === 'casual' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}
            >
              <Coins size={18} />
              <span>Casual Bets</span>
            </button>
            <button
              onClick={() => setActiveTab('high')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300
                flex items-center space-x-2 transform hover:scale-[1.02]
                ${activeTab === 'high' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}
            >
              <TrendingUp size={18} />
              <span>High Rollers</span>
            </button>
          </div>
        </div>

        {/* Enhanced Table Container */}
        <div className="relative rounded-2xl overflow-hidden 
          bg-gray-800/20 border border-gray-700/50 backdrop-blur-sm">
          {/* Top Gradient Border */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r 
            from-transparent via-indigo-500 to-transparent opacity-50" />

          <div className="relative overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-gray-300 bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 font-medium">Game</th>
                    <th className="px-6 py-4 font-medium">
                      {activeTab === 'mybets' ? 'Bet ID' : 'User'}
                    </th>
                    <th className="px-6 py-4 font-medium">Time</th>
                    <th className="px-6 py-4 font-medium">Bet Amount</th>
                    <th className="px-6 py-4 font-medium">Multiplier</th>
                    <th className="px-6 py-4 font-medium">Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {displayBets.map((bet, index) => (
                    <tr 
                      key={activeTab === 'mybets' ? bet.id : index}
                      className="hover:bg-gray-800/30 transition-colors duration-200"
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium bg-gradient-to-r from-white to-gray-300 
                          bg-clip-text text-transparent">
                          {bet.game}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {activeTab === 'mybets' ? bet.id : bet.user}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {bet.time}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-200">
                          ${Math.abs(bet.betAmount).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-indigo-400">
                          {bet.multiplier}x
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${
                          (activeTab === 'mybets' ? bet.status !== 'won' : bet.payout < 0)
                            ? 'text-red-400' 
                            : 'text-green-400'
                        }`}>
                          {(activeTab === 'mybets' ? bet.status !== 'won' : bet.payout < 0) ? '-' : '+'}
                          ${Math.abs(activeTab === 'mybets' ? bet.payout : bet.payout).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {displayBets.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-gray-400 text-center">
                        {activeTab === 'mybets' 
                          ? 'No bets found' 
                          : `No ${activeTab === 'casual' ? 'casual' : 'high roller'} bets yet`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Bottom Gradient Border */}
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r 
            from-transparent via-indigo-500 to-transparent opacity-50" />
        </div>
      </div>
    </div>
  );
};

export default LiveBetLobby;