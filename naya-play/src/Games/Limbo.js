import React, { useState, useEffect } from 'react';
import { DollarSign, Target, TrendingUp, ChevronDown, Trophy, Coins } from 'lucide-react';
import { useBalance } from '../IntroPage/BalanceContext';
import { useLiveBets } from '../IntroPage/LiveBetsContext';
import { auth, db } from '../firebase';
import { doc, addDoc, collection, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

const determineOutcome = (targetMultiplier, betAmount, userStats) => {
  // Base probability calculation
  let winChance = 1 / targetMultiplier;

  // Adjust for house edge
  winChance *= 0.92; // 8% house edge

  // Increase win chance for small bets to hook players
  if (betAmount <= 5) {
    winChance *= 1.2;
  }

  // Decrease win chance for large bets
  if (betAmount > 20) {
    winChance *= 0.7;
  }

  // Decrease win chance if user is on a winning streak
  if (userStats.recentWins >= 2) {
    winChance *= 0.5;
  }

  // Give "mercy" wins after several losses
  if (userStats.consecutiveLosses >= 4) {
    winChance *= 1.5;
  }

  return Math.random() < winChance;
};

const generateMultiplier = (targetMultiplier, shouldWin) => {
  if (shouldWin) {
    // Generate number slightly above target
    return targetMultiplier + (Math.random() * 0.5);
  } else {
    // Generate number slightly below target
    return Math.max(1, targetMultiplier * (0.5 + Math.random() * 0.4));
  }
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

const RecentNumbers = ({ numbers }) => (
  <div className="absolute top-4 right-4 bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 
    border border-gray-700/50">
    <div className="text-xs font-medium text-gray-400 mb-2 flex items-center space-x-1">
      <ChevronDown size={14} />
      <span>Recent Results</span>
    </div>
    <div className="space-y-1">
      {numbers.map((result, index) => (
        <div key={index} className="flex items-center justify-between space-x-3">
          <span className={`text-sm font-medium
            ${result.isWin ? 'text-green-400' : 'text-red-400'}`}>
            {result.multiplier}x
          </span>
          <span className="text-xs text-gray-500">
            {result.targetMultiplier}x
          </span>
        </div>
      ))}
    </div>
  </div>
);

const ResultBanner = ({ type, amount }) => (
  <div className={`mt-6 px-6 py-4 rounded-lg ${
    type === 'won' 
      ? 'bg-green-900/30 border border-green-500/30' 
      : 'bg-red-900/30 border border-red-500/30'
  }`}>
    <div className="flex items-center justify-center space-x-2">
      {type === 'won' ? (
        <Trophy size={20} className="text-green-400" />
      ) : (
        <Coins size={20} className="text-red-400" />
      )}
      <span className="text-lg font-medium text-white">
        {type === 'won' 
          ? `You won $${amount.toFixed(2)}!` 
          : 'Too high! Try again.'}
      </span>
    </div>
  </div>
);

const MultiplierGame = () => {
  const { balance, updateBalance } = useBalance();
  const { addBet } = useLiveBets();
  const [betAmount, setBetAmount] = useState('');
  const [targetMultiplier, setTargetMultiplier] = useState('');
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [gameState, setGameState] = useState('idle');
  const [recentResults, setRecentResults] = useState([]);
  const [userStats, setUserStats] = useState({
    recentWins: 0,
    consecutiveLosses: 0,
    totalBets: 0,
    totalWagered: 0
  });

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
      // Add to live bets
      await addDoc(collection(db, 'liveBets'), {
        game: "Multiplier",
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
        game: "Multiplier",
        betAmount: bet,
        multiplier: finalMultiplier,
        payout: isWin ? winAmount : -bet,
        date: new Date().toISOString(),
        status: isWin ? 'won' : 'lost'
      });

      // Update user stats
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        "stats.wagered": increment(bet),
        "stats.totalBets": increment(1),
        [isWin ? "stats.wins" : "stats.losses"]: increment(1)
      });

      // Update balance if won
      if (isWin) {
        updateBalance(winAmount);
      }

      // Update user stats for house edge
      setUserStats(prev => ({
        ...prev,
        recentWins: isWin ? prev.recentWins + 1 : 0,
        consecutiveLosses: isWin ? 0 : prev.consecutiveLosses + 1,
        totalBets: prev.totalBets + 1,
        totalWagered: prev.totalWagered + bet
      }));

    } catch (error) {
      console.error("Error processing game result:", error);
    }
  };

  const handlePlay = async () => {
    if (!validateInputs() || gameState === 'playing') return;

    const bet = parseFloat(betAmount);
    updateBalance(-bet);
    setGameState('playing');
    
    const shouldWin = determineOutcome(parseFloat(targetMultiplier), bet, userStats);
    const generatedMultiplier = generateMultiplier(parseFloat(targetMultiplier), shouldWin);
    
    setCurrentMultiplier(generatedMultiplier);
    
    // Add to recent results
    setRecentResults(prev => [{
      multiplier: generatedMultiplier.toFixed(2),
      targetMultiplier: targetMultiplier,
      isWin: shouldWin
    }, ...prev].slice(0, 10));

    // Process result after animation
    setTimeout(async () => {
      await processGameResult(shouldWin, generatedMultiplier);
      setGameState(shouldWin ? 'won' : 'lost');
    }, 1000);
  };

  return (
    <div className="bg-gray-900 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 
            bg-clip-text text-transparent">
            Multiplier
          </h1>
          <p className="text-gray-400">
            Predict the multiplier to win
          </p>
        </div>

        {/* Game Layout */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
              <h2 className="text-xl font-semibold text-white mb-6">Game Settings</h2>
              
              {/* Balance Display */}
              <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-400">Balance</p>
                <p className="text-2xl font-bold text-white">${balance.toFixed(2)}</p>
              </div>

              <div className="space-y-6">
                {/* Bet Amount */}
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

                {/* Target Multiplier */}
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

                {/* Expected Profit */}
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

                {/* Play Button */}
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

          {/* Game Display */}
          <div className="lg:col-span-3">
            <div className="relative bg-gray-800/50 rounded-xl min-h-[300px] p-6 
              border border-gray-700/50">
              
              {/* Recent Results */}
              {recentResults.length > 0 && (
                <RecentNumbers numbers={recentResults} />
              )}

              {/* Current Multiplier */}
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

                  {/* Result Banner */}
                  {(gameState === 'won' || gameState === 'lost') && (
                    <ResultBanner 
                      type={gameState} 
                      amount={parseFloat(betAmount) * parseFloat(targetMultiplier)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiplierGame;