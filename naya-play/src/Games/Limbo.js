import React, { useState, useEffect } from 'react';
import { DollarSign, Target } from 'lucide-react';
import { useBalance } from '../IntroPage/BalanceContext';
import { useLiveBets } from '../IntroPage/LiveBetsContext';
import { auth, db } from '../firebase';
import { doc, addDoc, collection, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { useTrackPresence } from '../Lobby/useTrackPresence';

// Cryptographically secure random number generation
const generateRandom = () => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / (0xffffffff + 1);
};

const generateGameMultiplier = () => {
  const r = generateRandom();
  
  // Distribution for multipliers
  if (r >= 0.999) {
    // 0.1% chance for 100x-1000x
    return 100 + Math.floor(generateRandom() * 900);
  } else if (r >= 0.99) {
    // 0.9% chance for 10x-100x
    return 10 + Math.floor(generateRandom() * 90);
  } else if (r >= 0.95) {
    // 4% chance for 5x-10x
    return 5 + Math.floor(generateRandom() * 5);
  } else if (r >= 0.85) {
    // 10% chance for 2x-5x
    return 2 + (generateRandom() * 3);
  } else {
    // 85% chance for 1x-2x
    return 1 + (generateRandom());
  }
};

const calculateWinChance = (targetMultiplier) => {
  if (!targetMultiplier || targetMultiplier <= 1) return 0;
  const chance = (1 / targetMultiplier) * 0.97 * 100;
  return chance.toFixed(8);
};

const AnimatedNumber = ({ value, duration = 1000 }) => {
  const [displayValue, setDisplayValue] = useState(1);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min(1, (currentTime - startTime) / duration);

      if (progress < 1) {
        setDisplayValue(1 + (value - 1) * progress);
        animationFrame = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return displayValue.toFixed(2);
};

const ResultPill = ({ multiplier, isWin }) => {
  return (
    <div className={`px-4 py-1 rounded-full text-sm font-medium
      ${isWin ? 'bg-green-500' : 'bg-gray-600'} text-white`}>
      {Number(multiplier).toFixed(2)}x
    </div>
  );
};

const MultiplierGame = () => {
  const { balance, updateBalance } = useBalance();
  const { addBet } = useLiveBets();
  const [betAmount, setBetAmount] = useState('');
  const [targetMultiplier, setTargetMultiplier] = useState('');
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [gameState, setGameState] = useState('idle');
  const [recentResults, setRecentResults] = useState([]);

  useTrackPresence("limbo");

  const calculateExpectedProfit = () => {
    const bet = parseFloat(betAmount) || 0;
    const target = parseFloat(targetMultiplier) || 0;
    return (bet * target).toFixed(2);
  };

  const validateInputs = () => {
    const bet = parseFloat(betAmount);
    const target = parseFloat(targetMultiplier);
    return bet >= 0.10 && bet <= balance && target > 1;
  };

  const processGameResult = async (isWin, finalMultiplier) => {
    const bet = parseFloat(betAmount);
    const winAmount = isWin ? bet * parseFloat(targetMultiplier) : 0;
    
    try {
      // Add to liveBets collection
      await addDoc(collection(db, 'liveBets'), {
        game: "Limbo",
        user: auth.currentUser.email?.split('@')[0] || 'Anonymous',
        betAmount: bet,
        multiplier: finalMultiplier,
        payout: isWin ? winAmount : -bet,
        time: "Just now",
        timestamp: serverTimestamp(),
        status: isWin ? 'won' : 'lost'
      });
  
      // Add to user's bets collection
      await addDoc(collection(db, `users/${auth.currentUser.uid}/bets`), {
        game: "Limbo",
        betAmount: bet,
        multiplier: finalMultiplier,
        payout: isWin ? winAmount : -bet,
        date: new Date().toISOString(),
        status: isWin ? 'won' : 'lost'
      });
  
      // Update user document
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        totalWagered: increment(bet),  // Update totalWagered
        totalBets: increment(1),
        [isWin ? "totalWon" : "totalLost"]: increment(isWin ? winAmount : bet)
      });
  
      if (isWin) {
        updateBalance(winAmount);
      }
    } catch (error) {
      console.error("Error processing game result:", error);
    }
  };
  const handlePlay = async () => {
    if (!validateInputs() || gameState === 'playing') return;

    const bet = parseFloat(betAmount);
    const target = parseFloat(targetMultiplier);

    try {
      // First deduct bet and update totalWagered, just like Mines
      updateBalance(-bet);
      
      // Update totalWagered immediately, just like Mines
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        totalWagered: increment(bet)
      });

      setGameState('playing');
      
      const finalMultiplier = generateGameMultiplier();
      const isWin = finalMultiplier >= target && generateRandom() <= 0.97;
      const winAmount = isWin ? bet * parseFloat(targetMultiplier) : 0;
      
      setCurrentMultiplier(finalMultiplier);
      setRecentResults(prev => [{
        multiplier: finalMultiplier,
        isWin
      }, ...prev].slice(0, 5));

      try {
        // Create bet data
        const betData = {
          betAmount: bet,
          date: new Date().toISOString(),
          game: "Limbo",
          multiplier: finalMultiplier,
          payout: isWin ? winAmount : -bet,
          status: isWin ? 'won' : 'lost'
        };

        // Add to liveBets collection
        await addDoc(collection(db, 'liveBets'), {
          ...betData,
          user: auth.currentUser.email?.split('@')[0] || 'Anonymous',
          time: "Just now",
          timestamp: serverTimestamp()
        });

        // Add to user's bets collection
        await addDoc(collection(db, `users/${auth.currentUser.uid}/bets`), betData);

        if (isWin) {
          // Update balance only on win, just like Mines
          await updateBalance(winAmount);
        }

      } catch (error) {
        console.error("Error recording bet result:", error);
      }

      setGameState(isWin ? 'won' : 'lost');

    } catch (error) {
      console.error("Error processing game:", error);
    }
  };

  
  return (
    <div className="bg-gray-900 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 
            bg-clip-text text-transparent">
            Multiplier
          </h1>
          <p className="text-gray-400">
            Predict the multiplier to win
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
              <h2 className="text-xl font-semibold text-white mb-6">Game Settings</h2>
              
              <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-400">Balance</p>
                <p className="text-2xl font-bold text-white">${balance.toFixed(2)}</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bet Amount (min. $0.10)
                  </label>
                  <div className="relative">
                    <DollarSign size={20} className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="number"
                      step="0.1"
                      min="0.10"
                      max={balance}
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg
                        border border-gray-700 focus:border-indigo-500 focus:ring-1"
                      disabled={gameState === 'playing'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Multiplier (min. 1.00x)
                  </label>
                  <div className="relative">
                    <Target size={20} className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={targetMultiplier}
                      onChange={(e) => setTargetMultiplier(e.target.value)}
                      className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg
                        border border-gray-700 focus:border-indigo-500 focus:ring-1"
                      disabled={gameState === 'playing'}
                    />
                  </div>
                </div>

                {betAmount && targetMultiplier && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Expected Profit</span>
                      <span className="text-lg font-medium text-gray-200">
                        ${calculateExpectedProfit()}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handlePlay}
                  disabled={!validateInputs() || gameState === 'playing'}
                  className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium
                    hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {gameState === 'playing' ? 'Rolling...' : 'Play'}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="relative bg-gray-800/50 rounded-xl min-h-[300px] p-6 
              border border-gray-700/50">
              
              {/* Recent Results */}
              <div className="absolute top-4 right-4 flex space-x-2">
                {recentResults.map((result, index) => (
                  <ResultPill 
                    key={index}
                    multiplier={result.multiplier}
                    isWin={result.isWin}
                  />
                ))}
              </div>

              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl font-bold mb-4">
                    <span className={
                      gameState === 'won' ? 'text-green-400' : 
                      gameState === 'lost' ? 'text-red-400' : 
                      'text-white'
                    }>
                      <AnimatedNumber value={currentMultiplier} />x
                    </span>
                  </div>

                  {(gameState === 'won' || gameState === 'lost') && (
                    <div className={`mt-6 px-6 py-4 rounded-lg ${
                      gameState === 'won' 
                        ? 'bg-green-900/30 border border-green-500/30' 
                        : 'bg-red-900/30 border border-red-500/30'
                    }`}>
                      <div className="flex items-center justify-center">
                        <span className="text-lg font-medium text-white">
                          {gameState === 'won' 
                            ? `You won $${(parseFloat(betAmount) * parseFloat(targetMultiplier)).toFixed(2)}!` 
                            : 'Too high! Try again.'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 bg-gray-800/50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400">Target Multiplier</label>
                        <div className="bg-gray-900/50 rounded p-2 flex justify-between items-center">
                          <span className="text-white">{targetMultiplier || '0.00'}</span>
                          <span className="text-gray-500">X</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400">Win Chance</label>
                        <div className="bg-gray-900/50 rounded p-2 flex justify-between items-center">
                          <span className="text-white">{calculateWinChance(targetMultiplier)}</span>
                          <span className="text-gray-500">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Button */}
      <div className="fixed bottom-6 right-6">
        <button className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-full 
          hover:bg-indigo-700 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Need Help?</span>
        </button>
      </div>
    </div>
  );
};

export default MultiplierGame;