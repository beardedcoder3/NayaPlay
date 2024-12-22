// Crash.js
import React, { useState, useEffect } from 'react';
import { DollarSign, Clock } from 'lucide-react';
import { useGameState } from './Crash/hooks/useGameState';
import { GAME_CONFIG } from './Crash/config/gameConfig';
import { formatNumber } from "./Crash/utils/gameUtils";
import { GameStats } from './Crash/components/GameStats';
import { PlayersList } from './Crash/components/PlayerList';
import { RecentCrashes } from './Crash/components/RecentCrashes';
import { PlaneAnimation } from './Crash/components/PlaneAnimation';
import useAuth from '../Auth/useAuth';
import { useBalance } from '../IntroPage/BalanceContext';
import { useLiveBets } from '../IntroPage/LiveBetsContext';
import { serverTimestamp } from 'firebase/firestore';
// At the top of Crash.js
const MemoizedPlaneAnimation = React.memo(PlaneAnimation);
const MemoizedPlayersList = React.memo(PlayersList);
const MemoizedRecentCrashes = React.memo(RecentCrashes);

const LoadingOverlay = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 z-50">
    <div className="space-y-4 text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      <div className="text-white text-lg">Loading Game...</div>
    </div>
  </div>
);

const CashoutAnimation = ({ amount }) => (
  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
    text-4xl font-bold text-green-400 animate-win z-50">
    +${formatNumber(amount)}
  </div>
);

const CrashGame = () => {
  const { user } = useAuth();
  const { balance, updateBalance } = useBalance();
  const [betAmount, setBetAmount] = useState('');
  const [showWinAmount, setShowWinAmount] = useState(null);
  const [isProcessingBet, setIsProcessingBet] = useState(false);
  const { addBet } = useLiveBets();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeGame = async () => {
      setIsInitializing(true);
      try {
        // Wait for a short moment to ensure everything is loaded
        await new Promise(resolve => setTimeout(resolve, 1000));
      } finally {
        setIsInitializing(false);
      }
    };

    initializeGame();
  }, []);

  const {
    gameState,
    currentMultiplier,
    players,
    recentCrashes,
    countdown,
    bettingPhase,
    totalBets,
    totalAmount,
    potentialWin,
    hasBetPlaced,
    setHasBetPlaced,
    currentBetAmount,
    setCurrentBetAmount,
    placeBet: hookPlaceBet,
    handleCashOut: hookHandleCashOut,
    isLoading
  } = useGameState();

  const handlePlaceBet = async () => {
    if (!user || !validateBet() || !bettingPhase || isProcessingBet) return;
    
    try {
      setIsProcessingBet(true);
      const amount = parseFloat(betAmount);
      
      if (amount > balance) {
        alert('Insufficient balance');
        return;
      }

      await hookPlaceBet(
        user.uid,
        user.displayName || user.email?.split('@')[0] || 'Player',
        amount
      );

      await updateBalance(-amount);
      setBetAmount('');
      setCurrentBetAmount(amount);
      setHasBetPlaced(true);
    } catch (error) {
      console.error('Error placing bet:', error);
      alert(error.message || 'Failed to place bet');
    } finally {
      setIsProcessingBet(false);
    }
  };

  const handleCashOut = async () => {
    if (!hasBetPlaced || gameState !== 'playing') return;

    try {
      const winAmount = await hookHandleCashOut();
      if (winAmount) {
        await updateBalance(winAmount);
        setShowWinAmount(winAmount);

        // Add to live bets
        await addBet({
          game: "Crash",
          user: user.email?.split('@')[0] || 'Anonymous',
          betAmount: currentBetAmount,
          multiplier: currentMultiplier,
          payout: winAmount,
          time: "Just now",
          timestamp: serverTimestamp(),
          status: 'won'
        });

        setTimeout(() => setShowWinAmount(null), 2000);
      }
    } catch (error) {
      console.error('Error cashing out:', error);
    }
  };

  const validateBet = () => {
    const bet = parseFloat(betAmount);
    return bet >= GAME_CONFIG.MIN_BET_AMOUNT;
  };
  if (isInitializing) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="space-y-6 text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24">
                <path 
                  fill="currentColor" 
                  d="M12 16L7 11L8.4 9.55L12 13.15L15.6 9.55L17 11L12 16Z"
                />
              </svg>
            </div>
          </div>
          <div>
            <div className="text-xl font-medium text-white mb-2">Loading Game</div>
            <div className="text-sm text-gray-400">Please wait...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen p-8 relative">
      {isLoading && <LoadingOverlay />}
      {showWinAmount && <CashoutAnimation amount={showWinAmount} />}
      
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 
            bg-clip-text text-transparent">
            Crash
          </h1>
          <p className="text-gray-400">
            Cash out before the plane crashes!
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Betting Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
              <h2 className="text-xl font-semibold text-white mb-6">Place Your Bet</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bet Amount (min. ${GAME_CONFIG.MIN_BET_AMOUNT})
                  </label>
                  <div className="relative">
                    <DollarSign size={20} className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="number"
                      step="0.1"
                      min={GAME_CONFIG.MIN_BET_AMOUNT}
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg
                        border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                        disabled:opacity-50"
                      disabled={hasBetPlaced || !user || !bettingPhase || isProcessingBet}
                    />
                  </div>
                </div>

                {gameState === 'playing' && hasBetPlaced && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Potential Win</span>
                      <span className="text-lg font-medium text-gray-200">
                        ${formatNumber(potentialWin)}
                      </span>
                    </div>
                  </div>
                )}

                {hasBetPlaced && gameState === 'playing' ? (
                  <button
                    onClick={handleCashOut}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium
                      hover:bg-green-700 transition-colors"
                  >
                    Cash Out ({formatNumber(currentMultiplier)}x)
                  </button>
                ) : (
                  <button
                    onClick={handlePlaceBet}
                    disabled={!validateBet() || hasBetPlaced || !user || !bettingPhase || isProcessingBet}
                    className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium
                      hover:bg-indigo-700 transition-colors disabled:opacity-50 
                      disabled:hover:bg-indigo-600"
                  >
                    {!user ? 'Login to Play' : 
                     isProcessingBet ? 'Processing...' :
                     bettingPhase ? 'Place Bet' : 'Round in Progress'}
                  </button>
                )}

                {/* Balance Display */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Your Balance</span>
                    <span className="text-lg font-medium text-gray-200">
                      ${formatNumber(balance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* How to Play */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-400 mb-4">How to Play</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start space-x-2">
                  <span className="text-indigo-400">1.</span>
                  <span>Place your bet before the plane takes off</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-indigo-400">2.</span>
                  <span>Watch the multiplier increase as the plane flies higher</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-indigo-400">3.</span>
                  <span>Cash out before the plane crashes to win!</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Game Display */}
          <div className="lg:col-span-3">
            <div className="relative bg-gray-800/30 rounded-xl min-h-[500px] overflow-hidden 
              border border-gray-700/50">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900 via-indigo-900 to-gray-900" />
                <div className="absolute inset-0" 
                  style={{
                    backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px), 
                      linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                  }} 
                />
              </div>
              
              <div className="relative z-10">
                <PlayersList players={players} />
                
                {/* Countdown Timer */}
                {bettingPhase && countdown > 0 && (
                  <div className="absolute top-4 right-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center space-x-2">
                      <Clock size={20} className="text-gray-400" />
                      <span className="text-2xl font-bold text-white">{countdown}s</span>
                    </div>
                    <div className="text-sm text-gray-400">Next round starting...</div>
                  </div>
                )}

                <RecentCrashes crashes={recentCrashes} />

                <div className="flex flex-col items-center justify-center h-full py-8">
                  <PlaneAnimation gameState={gameState} multiplier={currentMultiplier} />
                  
                  <div className="text-5xl font-bold mt-4">
                    <span className={
                      gameState === 'crashed' ? 'text-red-400' :
                      hasBetPlaced ? 'text-green-400' : 'text-white'
                    }>
                      {formatNumber(currentMultiplier)}x
                    </span>
                  </div>

                  {gameState === 'crashed' && (
                    <div className="mt-4 text-lg text-red-400 animate-bounce">
                      Crashed @ {formatNumber(currentMultiplier)}x! Next round in 3s...
                    </div>
                  )}

                  {showWinAmount && (
                    <div className="mt-4 text-lg text-green-400 animate-bounce">
                      Cashed out ${formatNumber(showWinAmount)}!
                    </div>
                  )}
                </div>

                <GameStats totalBets={totalBets} totalAmount={totalAmount} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrashGame;