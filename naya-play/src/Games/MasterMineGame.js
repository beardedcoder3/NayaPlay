import React, { useState } from 'react';
import { DollarSign, AlertTriangle, Diamond, Bomb, Trophy, X } from 'lucide-react';
import { useBalance } from '../IntroPage/BalanceContext';
import { useLiveBets } from '../IntroPage/LiveBetsContext'; 
import { auth, db } from '../firebase';
import { doc, getDoc, addDoc, collection, increment, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useTrackPresence } from '../Lobby/useTrackPresence';

const getUserData = async () => {
  if (!auth.currentUser) return null;
  const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
  return userDoc.data();
};

const shouldAllowWin = (bet, userStats) => {
  if (
    userStats.recentWins >= 2 ||                    
    userStats.bigWinCount > 2 ||                    
    bet > 50 ||                                     
    (bet > 20 && Math.random() < 0.8)              
  ) {
    return false;
  }

  if (
    bet <= 5 && Math.random() < 0.7 ||             
    userStats.lastResults.filter(r => !r).length >= 3  
  ) {
    return true;
  }

  return Math.random() < 0.3;
};

const GameModal = ({ type, multiplier, betAmount, onClose }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50
    animate-in fade-in duration-200">
    <div className="bg-gray-900 rounded-xl w-full max-w-md p-8 relative border border-gray-800 shadow-xl
      animate-in slide-in-from-bottom-4 duration-300">
      <button 
        onClick={onClose}
        className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-gray-800/50 transition-colors"
      >
        <X size={20} className="text-gray-400" />
      </button>
      
      <div className="text-center">
        {type === 'won' ? (
          <>
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-2xl font-bold text-white mb-2">Victory!</h3>
            <p className="text-lg text-gray-300 mb-2">
              You won ${(betAmount * multiplier).toFixed(2)}
            </p>
            <p className="text-sm text-gray-400">
              Multiplier: {multiplier}x
            </p>
          </>
        ) : (
          <>
            <Bomb className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
            <h3 className="text-2xl font-bold text-white mb-2">Boom!</h3>
            <p className="text-gray-400">Better luck next time!</p>
          </>
        )}
      </div>
    </div>
  </div>
);

const GameSquare = ({ index, isRevealed, isMine, onClick, gameState }) => {
  const showContent = isRevealed || (gameState === 'lost' && isMine);
  
  return (
    <button
      onClick={() => onClick(index)}
      disabled={isRevealed || gameState !== 'playing'}
      className={`
        aspect-square w-full rounded-lg relative overflow-hidden
        transition-all duration-200 transform
        ${!showContent ? 'hover:scale-105 bg-surface-600/50 hover:bg-surface-500/50' : ''}
        disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-blue-500
      `}
    >
      {showContent && (
        <div className={`
          absolute inset-0 flex items-center justify-center
          ${isMine ? 'bg-red-500/20' : 'bg-emerald-500/20'}
          animate-in zoom-in duration-200
        `}>
          {isMine ? (
            <Bomb className="w-8 h-8 text-red-400 animate-bounce" />
          ) : (
            <Diamond className="w-8 h-8 text-emerald-400 animate-pulse" />
          )}
        </div>
      )}
    </button>
  );
};
const MinesGame = () => {
  const { balance, updateBalance } = useBalance();
  const { addBet } = useLiveBets();
  const [mineCount, setMineCount] = useState(5);
  const [betAmount, setBetAmount] = useState('');
  const [gameState, setGameState] = useState('idle');
  const [mines, setMines] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [multiplier, setMultiplier] = useState(1);
  const [userStats, setUserStats] = useState({
    recentWins: 0,
    totalWagered: 0,
    lastResults: [],
    bigWinCount: 0
  });

  const calculateMultiplier = (revealedCount) => {
    if (revealedCount === 0) {
      setMultiplier(1);
      return;
    }
    const multiplier = ((25 - mineCount) / (25 - mineCount - revealedCount)).toFixed(2);
    setMultiplier(multiplier);
  };

  useTrackPresence('mines');

  
  const validateBet = () => {
    const betValue = parseFloat(betAmount);
    return betValue >= 0.10 && 
           betValue <= balance && 
           mineCount > 0 && 
           mineCount < 25;
  };

  const initializeGame = () => {
    const willWin = shouldAllowWin(parseFloat(betAmount), userStats);
    const minePositions = [];
  
    if (!willWin) {
      // Place mines in early positions if the player should lose
      for(let i = 0; i < mineCount; i++) {
        let pos;
        do {
          pos = Math.floor(Math.random() * 5);
        } while(minePositions.includes(pos));
        minePositions.push(pos);
      }
    } else {
      // Place mines in later positions if the player should win
      while (minePositions.length < mineCount) {
        let pos;
        do {
          pos = Math.floor(Math.random() * 25);
        } while(pos < 6 || minePositions.includes(pos));
        minePositions.push(pos);
      }
    }
  
    setMines(minePositions);
    setRevealed([]);
    setGameState('playing');
    calculateMultiplier(0);
  };
  
  const handleBet = async (e) => {
    e.preventDefault();
    if (validateBet()) {
      const bet = parseFloat(betAmount);
      updateBalance(-bet);
  
      // Update user document for wager tracking at the start of the game
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        totalWagered: increment(bet)
      });
  
      initializeGame(); // Now this function is defined
    }
  };

  const handleCashOut = async () => {
    const betValue = parseFloat(betAmount);
    const winAmount = betValue * parseFloat(multiplier);
    const finalMultiplier = (winAmount / betValue).toFixed(2); // Calculate actual multiplier
    
    try {
      // Create bet data with exact structure matching Firestore
      const betData = {
        betAmount: betValue,
        date: new Date().toISOString(),
        game: "Mines",
        multiplier: parseFloat(finalMultiplier), // Use the calculated multiplier
        payout: winAmount,
        status: 'won'
      };

      // Record in user's bets subcollection
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'bets'), betData);

      // Record in liveBets
      await addDoc(collection(db, 'liveBets'), {
        game: "Mines",
        userId: auth.currentUser.uid,  // Add this
        betAmount: betValue,
        multiplier: parseFloat(finalMultiplier),
        payout: winAmount,
        time: "Just now",
        timestamp: serverTimestamp(),
        status: 'won'
      });

      // Update balance
      await updateBalance(winAmount);

      // Update user stats
      setUserStats(prev => ({
        ...prev,
        recentWins: prev.recentWins + 1,
        lastResults: [true, ...prev.lastResults].slice(0, 5),
        bigWinCount: betAmount > 50 ? prev.bigWinCount + 1 : prev.bigWinCount
      }));

    } catch (error) {
      console.error("Error processing cashout:", error);
    }
    
    setGameState('won');
};

// In the handleSquareClick function, update the multiplier for losses:
 const handleSquareClick = async (index) => {
    if (gameState !== 'playing' || revealed.includes(index)) return;
  
    if (mines.includes(index)) {
      const betValue = parseFloat(betAmount);
      
      try {
        // Create bet data with exact structure matching Firestore
        const betData = {
          betAmount: betValue,
          date: new Date().toISOString(),
          game: "Mines",
          multiplier: '0', // Set to 0 for losses// Set to 0.00 for losses
          payout: 0,
          status: 'lost'
        };

        // Record in user's bets subcollection
        await addDoc(collection(db, 'users', auth.currentUser.uid, 'bets'), betData);

        // Record in liveBets
        await addDoc(collection(db, 'liveBets'), {
          game: "Mines",
          userId: auth.currentUser.uid,  // Add this
          betAmount: betValue,
          multiplier: '0',
          payout: -betValue,
          time: "Just now",
          timestamp: serverTimestamp(),
          status: 'lost'
        });
        // Update stats
        setUserStats(prev => ({
          ...prev,
          recentWins: 0,
          lastResults: [false, ...prev.lastResults].slice(0, 5)
        }));
  
      } catch (error) {
        console.error("Error processing bet:", error);
      }
  
      setGameState('lost');
    } else {
      const newRevealed = [...revealed, index];
      setRevealed(newRevealed);
      calculateMultiplier(newRevealed.length);
    }
};


  return (
    <div className="h-[calc(100vh-64px)] bg-surface-800">
      {/* Center container */}
      <div className="mx-auto max-w-7xl h-full">
        {/* Header */}
        <div className="text-center pt-8 pb-6">
          <h1 className="text-3xl font-bold text-white">Mines</h1>
          <p className="text-gray-400">Find the gems, avoid the mines!</p>
        </div>

        {/* Game Layout Container */}
        <div className="flex gap-8 px-8 h-[calc(100%-140px)]">
          {/* Settings Panel */}
          <div className="w-[320px] bg-surface-700/50 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Game Settings</h2>
            
            {/* Your Balance */}
            <div className="bg-surface-600/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400">Your Balance</p>
              <p className="text-2xl font-bold text-white">${balance.toFixed(2)}</p>
            </div>

            {/* Mine Count Input */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">
                Number of Mines
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={mineCount}
                onChange={(e) => setMineCount(Math.min(24, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full bg-surface-600/50 text-white px-4 py-3 rounded-lg border border-surface-500"
                disabled={gameState === 'playing'}
              />
            </div>

            {/* Bet Amount Input */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">
                Bet Amount (min. $0.10)
              </label>
              <div className="relative">
                <DollarSign size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="number"
                  step="0.1"
                  min="0.10"
                  max={balance}
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="w-full bg-surface-600/50 text-white pl-10 pr-4 py-3 rounded-lg border border-surface-500"
                  disabled={gameState === 'playing'}
                />
              </div>
            </div>

            {/* Game Actions */}
            {gameState === 'idle' ? (
              <button
                onClick={handleBet}
                disabled={!validateBet()}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium
                  hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Place Bet
              </button>
            ) : (
              gameState === 'playing' && revealed.length > 0 && (
                <button
                  onClick={handleCashOut}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium
                    hover:bg-green-700 transition-colors"
                >
                  Cash Out (${(betAmount * multiplier).toFixed(2)})
                </button>
              )
            )}

            {/* Current Multiplier */}
            {gameState === 'playing' && revealed.length > 0 && (
              <div className="mt-6 bg-surface-600/50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-400">Current Multiplier</p>
                <p className="text-2xl font-bold text-accent-400">{multiplier}x</p>
              </div>
            )}
          </div>

          {/* Game Board */}
          <div className="flex-1 bg-surface-700/50 rounded-xl p-6">
            <div className="grid grid-cols-5 gap-3 h-full max-w-[800px] mx-auto aspect-square">
              {Array(25).fill(null).map((_, index) => (
                <GameSquare
                  key={index}
                  index={index}
                  isRevealed={revealed.includes(index)}
                  isMine={mines.includes(index)}
                  onClick={handleSquareClick}
                  gameState={gameState}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal remains unchanged */}
      {(gameState === 'won' || gameState === 'lost') && (
        <GameModal
          type={gameState}
          multiplier={multiplier}
          betAmount={betAmount}
          onClose={() => setGameState('idle')}
        />
      )}
    </div>
  );
};
  
  export default MinesGame;