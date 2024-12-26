import React, { useState, useEffect, useRef } from 'react';
import { DollarSign } from 'lucide-react';
import { useBalance } from '../IntroPage/BalanceContext';
import { useLiveBets } from '../IntroPage/LiveBetsContext';
import { auth, db } from '../firebase';
import { doc, addDoc, collection, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

const generateRandom = () => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (array[0] / (0xffffffff + 1)) * 100; // Returns 0-100
};

const calculateWinChance = (targetNumber, isOver) => {
  if (isOver) {
    return (100 - targetNumber).toFixed(4);
  }
  return targetNumber.toFixed(4);
};

const calculateMultiplier = (winChance) => {
  return (99 / winChance).toFixed(4);
};

const ResultPill = ({ number, isWin }) => {
  return (
    <div className={`px-4 py-1 rounded-full text-sm font-medium
      ${isWin ? 'bg-green-500' : 'bg-gray-600'} text-white`}>
      {Number(number).toFixed(2)}
    </div>
  );
};

const AnimatedNumber = ({ value, duration = 1000 }) => {
  const [displayValue, setDisplayValue] = useState(50);
  
  useEffect(() => {
    let startTime;
    let animationFrame;
    
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min(1, (currentTime - startTime) / duration);
      
      if (progress < 1) {
        setDisplayValue(50 + (value - 50) * progress);
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

const DiceGame = () => {
  const { balance, updateBalance } = useBalance();
  const { addBet } = useLiveBets();
  const [betAmount, setBetAmount] = useState('');
  const [targetNumber, setTargetNumber] = useState(50.50);
  const [isOver, setIsOver] = useState(true);
  const [currentNumber, setCurrentNumber] = useState(50);
  const [gameState, setGameState] = useState('idle');
  const [recentResults, setRecentResults] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    updateSliderPosition(e);
  };

  const handleMouseMove = (e) => {
    if (isDragging && gameState !== 'playing') {
      updateSliderPosition(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const updateSliderPosition = (e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.min(Math.max((x / width) * 100, 2), 98);
    setTargetNumber(percentage);
  };

  const winChance = calculateWinChance(targetNumber, isOver);
  const multiplier = calculateMultiplier(winChance);

  const validateInputs = () => {
    const bet = parseFloat(betAmount);
    return bet >= 0.10 && bet <= balance;
  };

  const processGameResult = async (isWin, rollNumber) => {
    const bet = parseFloat(betAmount);
    const winAmount = isWin ? bet * multiplier : 0;
    
    try {
      await addDoc(collection(db, 'liveBets'), {
        game: "Dice",
        user: auth.currentUser.email?.split('@')[0] || 'Anonymous',
        betAmount: bet,
        number: rollNumber,
        payout: isWin ? winAmount : -bet,
        time: "Just now",
        timestamp: serverTimestamp(),
        status: isWin ? 'won' : 'lost'
      });

      await addDoc(collection(db, `users/${auth.currentUser.uid}/bets`), {
        game: "Dice",
        betAmount: bet,
        number: rollNumber,
        payout: isWin ? winAmount : -bet,
        date: new Date().toISOString(),
        status: isWin ? 'won' : 'lost'
      });

      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        "stats.wagered": increment(bet),
        "stats.totalBets": increment(1),
        [isWin ? "stats.wins" : "stats.losses"]: increment(1)
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
    updateBalance(-bet);
    setGameState('playing');
    
    const rollNumber = generateRandom();
    const isWin = isOver ? rollNumber > targetNumber : rollNumber < targetNumber;
    
    setCurrentNumber(rollNumber);
    
    setRecentResults(prev => [{
      number: rollNumber,
      isWin
    }, ...prev].slice(0, 5));

    setTimeout(async () => {
      await processGameResult(isWin, rollNumber);
      setGameState(isWin ? 'won' : 'lost');
    }, 1000);
  };

  const quickSetBet = (multiplier) => {
    const newAmount = parseFloat(betAmount || 0) * multiplier;
    if (newAmount <= balance) {
      setBetAmount(newAmount.toFixed(2));
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 
            bg-clip-text text-transparent">
            Dice
          </h1>
          <p className="text-gray-400">
            Roll over or under the target number
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
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <button 
                      onClick={() => quickSetBet(0.5)}
                      className="bg-gray-700 text-white px-2 py-1 rounded text-sm hover:bg-gray-600"
                    >
                      ½×
                    </button>
                    <button 
                      onClick={() => quickSetBet(2)}
                      className="bg-gray-700 text-white px-2 py-1 rounded text-sm hover:bg-gray-600"
                    >
                      2×
                    </button>
                    <button 
                      onClick={() => setBetAmount(balance.toFixed(2))}
                      className="bg-gray-700 text-white px-2 py-1 rounded text-sm hover:bg-gray-600"
                    >
                      Max
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setIsOver(!isOver)}
                  className="w-full bg-gray-700 text-white px-6 py-3 rounded-lg font-medium
                    hover:bg-gray-600 transition-colors"
                >
                  Roll {isOver ? "Over" : "Under"}
                </button>

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
                    number={result.number}
                    isWin={result.isWin}
                  />
                ))}
              </div>

              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center w-full">
                  <div className="text-6xl font-bold mb-4">
                    <span className={
                      gameState === 'won' ? 'text-green-400' : 
                      gameState === 'lost' ? 'text-red-400' : 
                      'text-white'
                    }>
                      <AnimatedNumber value={currentNumber} />
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
                            ? `You won $${(parseFloat(betAmount) * multiplier).toFixed(2)}!` 
                            : `Too ${isOver ? 'low' : 'high'}! Try again.`}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 w-full px-4">
                    <div 
                      ref={sliderRef}
                      className="relative w-full h-12 bg-gray-700 rounded-full cursor-pointer"
                      onMouseDown={handleMouseDown}
                    >
                      <div 
                        className={`absolute top-0 bottom-0 left-0 rounded-full ${
                          isOver ? 'bg-red-500/50' : 'bg-green-500/50'
                        }`}
                        style={{ 
                          width: `${isOver ? targetNumber : 100-targetNumber}%`,
                          right: isOver ? 0 : 'auto',
                          left: isOver ? 0 : 'auto'
                        }}
                      />
                      <div 
                        className="absolute top-0 bottom-0 w-3 bg-blue-500 rounded transform -translate-x-1/2"
                        style={{ left: `${targetNumber}%` }}
                      />
                      <div className="absolute top-0 w-full flex justify-between px-4 -mt-6 text-gray-400 text-sm">
                        <span>0</span>
                        <span>25</span>
                        <span>50</span>
                        <span>75</span>
                        <span>100</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Target Number</label>
                      <div className="bg-gray-900/50 rounded p-2 flex justify-between items-center">
                        <span className="text-white">{winChance}%</span>
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

export default DiceGame;