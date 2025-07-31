import React, { useState, useEffect } from 'react';
import { DollarSign, AlertCircle, Trophy } from 'lucide-react';
import { useBalance } from '../IntroPage/BalanceContext';
import { useLiveBets } from '../IntroPage/LiveBetsContext';
import { auth, db } from '../firebase';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useTrackPresence } from '../Lobby/useTrackPresence';

const PAYOUT_MODES = {
  LOW: {
    name: 'Low Risk',
    payouts: [0, 0, 0, 1.4, 2.25, 4.5, 8.0, 17.0, 50.0, 80.0, 100.0]
  },
  MEDIUM: {
    name: 'Medium Risk',
    payouts: [0, 0, 1.1, 1.2, 1.3, 1.8, 3.5, 13.0, 50.0, 250.0, 1000.0]
  },
  HIGH: {
    name: 'High Risk',
    payouts: [0, 0, 0, 0, 3.5, 8.0, 13.0, 63.0, 500.0, 800.0, 1000.0]
  }
};

const NumberSquare = ({ number, selected, onClick, disabled, revealed, winning }) => (
  <button
    onClick={() => onClick(number)}
    disabled={disabled}
    className={`
      aspect-square w-full rounded-lg relative overflow-hidden
      transition-all duration-200 transform
      ${!disabled ? 'hover:scale-105' : ''}
      ${selected ? 'bg-purple-500/50' : 'bg-surface-600/50 hover:bg-surface-500/50'}
      ${revealed && winning ? 'bg-emerald-500/50' : ''}
      ${revealed && !winning ? 'bg-red-500/50' : ''}
      disabled:cursor-not-allowed
      focus:outline-none focus:ring-2 focus:ring-blue-500
    `}
  >
    <span className="text-xl font-bold text-white">{number}</span>
  </button>
);

const GameModal = ({ type, payout, betAmount, onClose }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50
    animate-in fade-in duration-200">
    <div className="bg-gray-900 rounded-xl w-full max-w-md p-8 relative border border-gray-800 shadow-xl
      animate-in slide-in-from-bottom-4 duration-300">
      {type === 'won' ? (
        <div className="text-center">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-bounce" />
          <h3 className="text-2xl font-bold text-white mb-2">Victory!</h3>
          <p className="text-lg text-gray-300 mb-2">
            You won ${(betAmount * payout).toFixed(2)}
          </p>
          <p className="text-sm text-gray-400">
            Multiplier: {payout}x
          </p>
        </div>
      ) : (
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
          <h3 className="text-2xl font-bold text-white mb-2">No Win</h3>
          <p className="text-gray-400">Better luck next time!</p>
        </div>
      )}
      <button 
        onClick={onClose}
        className="mt-6 w-full bg-surface-600 text-white py-2 rounded-lg hover:bg-surface-500 transition-colors"
      >
        Play Again
      </button>
    </div>
  </div>
);

const NumberPickerGame = () => {
  const { balance, updateBalance } = useBalance();
  const { addBet } = useLiveBets();
  const [betAmount, setBetAmount] = useState('');
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [gameState, setGameState] = useState('idle');
  const [riskMode, setRiskMode] = useState('LOW');
  const [winningNumbers, setWinningNumbers] = useState([]);
  const [matchCount, setMatchCount] = useState(0);
  const [currentPayout, setCurrentPayout] = useState(0);

  useTrackPresence('numberpicker');

  const validateBet = () => {
    if (!auth.currentUser?.uid) return false;
    const betValue = parseFloat(betAmount);
    return betValue >= 0.10 && 
           betValue <= balance && 
           selectedNumbers.length === 10;
  };

  const handleNumberClick = (number) => {
    if (gameState !== 'idle') return;
    
    if (selectedNumbers.includes(number)) {
      setSelectedNumbers(prev => prev.filter(n => n !== number));
    } else if (selectedNumbers.length < 10) {
      setSelectedNumbers(prev => [...prev, number]);
    }
  };

  const generateWinningNumbers = () => {
    const numbers = [];
    while (numbers.length < 10) {
      const num = Math.floor(Math.random() * 40) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    return numbers;
  };

  const handleBet = async (e) => {
    e.preventDefault();
    if (!validateBet()) return;

    const betValue = parseFloat(betAmount);
    const userId = auth.currentUser?.uid;
    
    if (!userId) return;

    try {
      await updateBalance(-betValue);
      
      const numbers = generateWinningNumbers();
      setWinningNumbers(numbers);
      setGameState('playing');

      const matches = selectedNumbers.filter(num => numbers.includes(num)).length;
      setMatchCount(matches);

      const payout = PAYOUT_MODES[riskMode].payouts[matches];
      setCurrentPayout(payout);

      if (payout > 0) {
        const winAmount = betValue * payout;
        await Promise.all([
          updateBalance(winAmount),
          addDoc(collection(db, 'liveBets'), {
            game: "NumberPicker",
            userId,
            betAmount: betValue,
            multiplier: payout,
            payout: winAmount,
            time: "Just now",
            timestamp: serverTimestamp(),
            status: 'won'
          }),
          addDoc(collection(db, `users/${userId}/bets`), {
            game: "NumberPicker",
            betAmount: betValue,
            multiplier: payout,
            payout: winAmount,
            date: new Date().toISOString(),
            status: 'won'
          })
        ]);
        setGameState('won');
      } else {
        await Promise.all([
          addDoc(collection(db, 'liveBets'), {
            game: "NumberPicker",
            userId,
            betAmount: betValue,
            multiplier: 0,
            payout: -betValue,
            time: "Just now",
            timestamp: serverTimestamp(),
            status: 'lost'
          }),
          addDoc(collection(db, `users/${userId}/bets`), {
            game: "NumberPicker",
            betAmount: betValue,
            multiplier: 0,
            payout: -betValue,
            date: new Date().toISOString(),
            status: 'lost'
          })
        ]);
        setGameState('lost');
      }
    } catch (error) {
      console.error("Error processing bet:", error);
      setGameState('idle');
    }
  };

  const resetGame = () => {
    setGameState('idle');
    setSelectedNumbers([]);
    setWinningNumbers([]);
    setMatchCount(0);
    setCurrentPayout(0);
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-surface-800">
      <div className="mx-auto max-w-7xl h-full">
        <div className="text-center pt-8 pb-6">
          <h1 className="text-3xl font-bold text-white">Number Picker</h1>
          <p className="text-gray-400">Pick 10 numbers and test your luck!</p>
        </div>

        <div className="flex gap-8 px-8 h-[calc(100%-140px)]">
          <div className="w-[320px] bg-surface-700/50 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Game Settings</h2>
            
            <div className="bg-surface-600/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400">Your Balance</p>
              <p className="text-2xl font-bold text-white">${balance.toFixed(2)}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Risk Mode</label>
              <select
                value={riskMode}
                onChange={(e) => setRiskMode(e.target.value)}
                className="w-full bg-surface-600/50 text-white px-4 py-3 rounded-lg border border-surface-500"
                disabled={gameState === 'playing'}
              >
                {Object.entries(PAYOUT_MODES).map(([key, mode]) => (
                  <option key={key} value={key}>{mode.name}</option>
                ))}
              </select>
            </div>

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
                  disabled={gameState !== 'idle'}
                />
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Selected Numbers</p>
              <p className="text-lg font-medium text-white">
                {selectedNumbers.length}/10
              </p>
            </div>

            <button
              onClick={handleBet}
              disabled={!validateBet()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium
                hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Place Bet
            </button>

            {gameState !== 'idle' && (
              <div className="mt-6 bg-surface-600/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Matches</p>
                <p className="text-2xl font-bold text-white">{matchCount}/10</p>
                {currentPayout > 0 && (
                  <p className="text-sm text-emerald-400 mt-1">
                    Payout: {currentPayout}x
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 bg-surface-700/50 rounded-xl p-6">
            <div className="grid grid-cols-8 gap-3 h-full">
              {Array(40).fill(null).map((_, index) => {
                const number = index + 1;
                const isSelected = selectedNumbers.includes(number);
                const isRevealed = gameState !== 'idle' && winningNumbers.length > 0;
                const isWinning = isRevealed && winningNumbers.includes(number);
                
                return (
                  <NumberSquare
                    key={number}
                    number={number}
                    selected={isSelected}
                    onClick={handleNumberClick}
                    disabled={gameState !== 'idle' || 
                             (selectedNumbers.length >= 10 && !isSelected)}
                    revealed={isRevealed}
                    winning={isWinning}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {(gameState === 'won' || gameState === 'lost') && (
        <GameModal
          type={gameState}
          payout={currentPayout}
          betAmount={betAmount}
          onClose={resetGame}
        />
      )}
    </div>
  );
};

export default NumberPickerGame;