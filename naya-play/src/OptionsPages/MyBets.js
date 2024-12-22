import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, orderBy, limit, getDocs, startAfter, where } from 'firebase/firestore';

const MyBetsPage = () => {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisible, setLastVisible] = useState(null);
  const [totalBets, setTotalBets] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    if (auth.currentUser) {
      fetchBets();
    }
  }, [currentPage]);

  const fetchBets = async () => {
    try {
      setLoading(true);
      const userBetsRef = collection(db, 'users', auth.currentUser.uid, 'bets');
      
      // Get total count
      const totalSnapshot = await getDocs(userBetsRef);
      setTotalBets(totalSnapshot.size);

      let q;
      if (currentPage === 1) {
        q = query(
          userBetsRef,
          orderBy('date', 'desc'),
          limit(itemsPerPage)
        );
      } else {
        q = query(
          userBetsRef,
          orderBy('date', 'desc'),
          startAfter(lastVisible),
          limit(itemsPerPage)
        );
      }

      const snapshot = await getDocs(q);
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      setLastVisible(lastDoc);

      const betsList = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        date: new Date(doc.data().date).toLocaleString()
      }));

      setBets(betsList);
    } catch (error) {
      console.error("Error fetching bets:", error);
    } finally {
      setLoading(false);
    }
  };


  const totalPages = Math.ceil(totalBets / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 
            bg-clip-text text-transparent">
            My Bets
          </h1>
          <p className="text-gray-400">View your betting history</p>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50">
          <div className="grid grid-cols-6 gap-4 py-4 px-6 border-b border-gray-700/50 bg-gray-800/50">
            <div className="text-sm font-medium text-gray-400">Game</div>
            <div className="text-sm font-medium text-gray-400">Bet ID</div>
            <div className="text-sm font-medium text-gray-400">Date</div>
            <div className="text-sm font-medium text-gray-400">Bet Amount</div>
            <div className="text-sm font-medium text-gray-400">Multiplier</div>
            <div className="text-sm font-medium text-gray-400">Payout</div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {bets.map((bet) => (
                <div 
                  key={bet.id}
                  className="grid grid-cols-6 gap-4 py-4 px-6 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="text-indigo-400 font-medium">{bet.game}</div>
                  <div className="text-gray-300 font-mono">{bet.id}</div>
                  <div className="text-gray-400">{bet.date}</div>
                  <div className="text-gray-300">${bet.betAmount.toFixed(2)}</div>
                  <div className="text-gray-300">{bet.multiplier}×</div>
                  <div className={`font-medium ${bet.status === 'won' ? 'text-green-400' : 'text-red-400'}`}>
                    {bet.status === 'won' ? '+' : '-'}${Math.abs(bet.payout).toFixed(2)}
                  </div>
                </div>
              ))}

              {bets.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No bets found
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700/50">
            <div className="text-sm text-gray-400">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, totalBets)} of {totalBets} bets
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="p-2 rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 
                  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} className="text-gray-400" />
              </button>

              <div className="flex items-center">
                <span className="px-3 py-1 rounded-lg bg-gray-800 text-white font-medium">
                  {currentPage}
                </span>
                <span className="mx-2 text-gray-400">of</span>
                <span className="text-gray-400">{totalPages}</span>
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || loading}
                className="p-2 rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 
                  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyBetsPage;