import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { useBalance } from '../IntroPage/BalanceContext';
import { useLiveBets } from '../IntroPage/LiveBetsContext';
import { auth, db } from '../firebase';
import { doc, addDoc, collection, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { useTrackPresence } from '../Lobby/useTrackPresence';

const generateRandom = () => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return Math.floor((array[0] / (0xffffffff + 1)) * 100);
};

// Animated pill for recent results
const ResultPill = ({ number, isWin, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    transition={{ duration: 0.2, delay: index * 0.05 }}
    className={`px-4 py-1.5 rounded-full ${
      isWin ? 'bg-[#22c55e]' : 'bg-[#374151]'
    } text-white font-medium text-sm`}
  >
    {number}
  </motion.div>
);

// Result number display
const NumberDisplay = ({ number, isVisible, isOver, targetNumber }) => {
  if (!isVisible || number === null) return null;
  
  const isWin = isOver ? number > targetNumber : number < targetNumber;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute"
      style={{ 
        left: `${number}%`,
        transform: 'translateX(-50%)',
        top: '-45px',
        zIndex: 50
      }}
    >
      <div 
        className={`px-3 py-1 rounded bg-[#1a1f25] shadow-lg`}
        style={{ 
          border: `2px solid ${isWin ? '#22c55e' : '#ef4444'}`,
          color: isWin ? '#22c55e' : '#ef4444',
          fontSize: '16px',
          fontWeight: '500'
        }}
      >
        {number}
      </div>
    </motion.div>
  );
};

// Custom input field component
const CustomInput = ({ value, onChange, label, symbol = '', disabled = false }) => (
  <div className="relative flex-1">
    <div className="text-[#94A3B8] text-sm mb-2">{label}</div>
    <div className="relative">
      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
        <span className="text-[#94A3B8]">{symbol}</span>
      </div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full bg-[#1E2328] border border-[#2A2F36] rounded-lg px-4 py-3 
          text-white font-medium focus:outline-none focus:border-[#3B4451] text-left
          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        style={{ width: '100%', minWidth: '120px' }}
      />
    </div>
  </div>
);

const DiceGame = () => {
  const { balance, updateBalance } = useBalance();
  const { addBet } = useLiveBets();
  const [betAmount, setBetAmount] = useState('0.00000000');
  const [multiplier, setMultiplier] = useState('2.0000');
  const [winChance, setWinChance] = useState('49.5000');
  const [targetNumber, setTargetNumber] = useState(50);
  const [isOver, setIsOver] = useState(true);
  const [rollNumber, setRollNumber] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [recentResults, setRecentResults] = useState([]);
  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);


  useTrackPresence("dice");

  const updateValuesFromMultiplier = (e) => {
    const newMultiplier = e.target.value.replace(/[^\d.]/g, '');
    if (newMultiplier === '' || !isNaN(parseFloat(newMultiplier))) {
      setMultiplier(newMultiplier);
      if (newMultiplier && parseFloat(newMultiplier) >= 1.01) {
        const newWinChance = (99 / parseFloat(newMultiplier)).toFixed(4);
        setWinChance(newWinChance);
        setTargetNumber(Math.round(isOver ? 100 - parseFloat(newWinChance) : parseFloat(newWinChance)));
      }
    }
  };

  const updateValuesFromWinChance = (e) => {
    const newWinChance = e.target.value.replace(/[^\d.]/g, '');
    if (newWinChance === '' || !isNaN(parseFloat(newWinChance))) {
      setWinChance(newWinChance);
      if (newWinChance && parseFloat(newWinChance) > 0 && parseFloat(newWinChance) < 98) {
        const newMultiplier = (99 / parseFloat(newWinChance)).toFixed(4);
        setMultiplier(newMultiplier);
        setTargetNumber(Math.round(isOver ? 100 - parseFloat(newWinChance) : parseFloat(newWinChance)));
      }
    }
  };

  const handleMouseDown = (e) => {
    if (isRolling) return;
    setIsDragging(true);
    updateSliderPosition(e);
  };

  const handleMouseMove = (e) => {
    if (isDragging && !isRolling) {
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
    const percentage = Math.min(Math.max(Math.round((x / width) * 100), 2), 98);
    setTargetNumber(percentage);
    const newWinChance = isOver ? (100 - percentage) : percentage;
    setWinChance(newWinChance.toFixed(4));
    setMultiplier((99 / newWinChance).toFixed(4));
  };

  const toggleRollType = () => {
    setIsOver(!isOver);
    setTargetNumber(100 - targetNumber);
  };

  const handleBetAmountChange = (e) => {
    const value = e.target.value;
    const sanitizedValue = value.replace(/[^0-9.]/g, '');
    const parts = sanitizedValue.split('.');
    
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 8) return;
    
    if (!isNaN(parseFloat(sanitizedValue)) || sanitizedValue === '' || sanitizedValue === '.') {
      setBetAmount(sanitizedValue);
    }
  };

  const quickSetBet = (factor) => {
    const current = parseFloat(betAmount) || 0;
    const newAmount = current * factor;
    if (newAmount <= balance) {
      setBetAmount(newAmount.toFixed(8));
    } else {
      setBetAmount(balance.toFixed(8));
    }
  };

  const calculateProfit = () => {
    const bet = parseFloat(betAmount) || 0;
    const profit = bet * parseFloat(multiplier) - bet;
    return profit.toFixed(8);
  };

  const handlePlay = async () => {
    if (isRolling || !parseFloat(betAmount)) return;
  
    const bet = parseFloat(betAmount);
    if (bet > balance) return;
  
    try {
      // First deduct bet and update totalWagered, just like Mines
      updateBalance(-bet);
      setIsRolling(true);
  
      // Update totalWagered immediately, just like Mines
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        totalWagered: increment(bet)
      });
  
      const number = generateRandom();
      const isWin = isOver ? number > targetNumber : number < targetNumber;
      const winAmount = bet * parseFloat(multiplier);
  
      setRollNumber(number);
      setRecentResults(prev => [{
        number,
        isWin
      }, ...prev].slice(0, 5));
  
      try {
        // Create bet data
        const betData = {
          betAmount: bet,
          date: new Date().toISOString(),
          game: "Dice",
          multiplier: parseFloat(multiplier),
          payout: isWin ? winAmount : -bet,
          status: isWin ? 'won' : 'lost'
        };
  
        // Add to user's personal bets collection
        await addDoc(collection(db, 'users', auth.currentUser.uid, 'bets'), betData);
  
        // Add to liveBets collection
        await addDoc(collection(db, 'liveBets'), {
          ...betData,
          user: auth.currentUser.email?.split('@')[0] || 'Anonymous',
          time: "Just now",
          timestamp: serverTimestamp()
        });
  
        if (isWin) {
          // Update balance only on win, just like Mines
          await updateBalance(winAmount);
        }
  
      } catch (error) {
        console.error("Error recording bet result:", error);
      }
  
    } catch (error) {
      console.error("Error processing bet:", error);
    }
  
    setTimeout(() => {
      setIsRolling(false);
      setRollNumber(null);
    }, 2000);
  };


  return (
    <div className="bg-[#0f1114] min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dice</h1>
          <p className="text-gray-400">Roll over or under the target number</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Left Panel */}
          <div className="lg:col-span-1">
            <div className="bg-[#1E2328] rounded-xl p-6">
              <div className="mb-6 p-4 bg-[#13161A] rounded-lg">
                <p className="text-sm text-gray-400">Balance</p>
                <p className="text-2xl font-bold text-white">${balance.toFixed(2)}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Bet Amount</p>
                  <input
                    type="text"
                    value={betAmount}
                    onChange={handleBetAmountChange}
                    className="w-full bg-[#13161A] text-white px-4 py-3 rounded-lg
                      border border-[#2A2F36] focus:border-[#3B4451] focus:outline-none"
                    disabled={isRolling}
                  />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button 
                      onClick={() => quickSetBet(0.5)}
                      className="bg-[#2A2F36] text-white px-2 py-1.5 rounded text-sm 
                        hover:bg-[#3B4451] transition-colors"
                    >
                      ½×
                    </button>
                    <button 
                      onClick={() => quickSetBet(2)}
                      className="bg-[#2A2F36] text-white px-2 py-1.5 rounded text-sm 
                        hover:bg-[#3B4451] transition-colors"
                    >
                      2×
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-2">Profit on Win</p>
                  <div className="bg-[#13161A] text-white px-4 py-3 rounded-lg border border-[#2A2F36]">
                    {calculateProfit()}
                  </div>
                </div>

                <button
                  onClick={handlePlay}
                  disabled={isRolling || !parseFloat(betAmount) || parseFloat(betAmount) > balance}
                  className="w-full bg-[#3B82F6] text-white px-6 py-3 rounded-lg font-medium
                    hover:bg-[#2563EB] transition-colors disabled:opacity-50"
                >
                  {isRolling ? 'Rolling...' : 'Place Bet'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-3">
            <div className="bg-[#1E2328] rounded-xl p-8 relative">
              {/* Recent Results */}
              <div className="absolute top-4 right-4 flex space-x-2">
                <AnimatePresence>
                  {recentResults.map((result, index) => (
                    <ResultPill 
                      key={`${result.number}-${index}`}
                      number={result.number}
                      isWin={result.isWin}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </div>

              <div className="space-y-12">
                <div className="relative pt-12">
                  <div 
                    ref={sliderRef}
                    className="relative w-full h-12 rounded-full cursor-pointer overflow-visible"
                    style={{
                      background: '#1a1f25',
                    }}
                    onMouseDown={handleMouseDown}
                  >
                    {/* Green area - win side */}
                    <motion.div 
                      className="absolute top-0 bottom-0 bg-[#22c55e]"
                      style={{ 
                        ...(isOver 
                          ? { right: 0, width: `${100 - targetNumber}%` }
                          : { left: 0, width: `${targetNumber}%` })
                      }}
                      initial={false}
                      animate={{ 
                        width: isOver ? `${100 - targetNumber}%` : `${targetNumber}%` 
                      }}
                      transition={{ type: "spring", stiffness: 300 }}
                    />
                    {/* Red area - lose side */}
                    <motion.div 
                      className="absolute top-0 bottom-0 bg-[#ef4444]"
                      style={{ 
                        ...(isOver 
                          ? { left: 0, width: `${targetNumber}%` }
                          : { right: 0, width: `${100 - targetNumber}%` })
                      }}
                      initial={false}
                      animate={{ 
                        width: isOver ? `${targetNumber}%` : `${100 - targetNumber}%` 
                      }}
                      transition={{ type: "spring", stiffness: 300 }}
                    />
                    
                    {/* Blue handle */}
                    <div 
                      className="absolute top-0 bottom-0 w-4 bg-[#3b82f6]"
                      style={{ 
                        left: `${targetNumber}%`,
                        transform: 'translateX(-50%)',
                      }}
                    />
                    
                    {/* Number Display */}
                    <NumberDisplay 
                      number={rollNumber}
                      isVisible={rollNumber !== null}
                      isOver={isOver}
                      targetNumber={targetNumber}
                    />

                    {/* Numbers */}
                    <div className="absolute -top-8 w-full flex justify-between px-4 text-[#94A3B8] text-sm">
                      <span>0</span>
                      <span>25</span>
                      <span>50</span>
                      <span>75</span>
                      <span>100</span>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-3 gap-4">
                  <CustomInput
                    value={multiplier}
                    onChange={updateValuesFromMultiplier}
                    label="Multiplier"
                    symbol="×"
                    disabled={isRolling}
                  />
                  
                  <div className="relative flex-1">
                    <div className="text-[#94A3B8] text-sm mb-2">Roll {isOver ? "Over" : "Under"}</div>
                    <button
                      onClick={toggleRollType}
                      className="w-full bg-[#1E2328] border border-[#2A2F36] rounded-lg px-4 py-3
                        text-white hover:bg-[#272b30] transition-colors flex items-center justify-between
                        group"
                    >
                      <span className="font-medium">{targetNumber}</span>
                      <svg 
                        className="w-5 h-5 text-[#94A3B8] transform transition-transform group-hover:rotate-180" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                        />
                      </svg>
                    </button>
                  </div>
                  
                  <CustomInput
                    value={winChance}
                    onChange={updateValuesFromWinChance}
                    label="Win Chance"
                    symbol="%"
                    disabled={isRolling}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiceGame;