import React, { useState, useEffect, useRef } from 'react';
import { DollarSign } from 'lucide-react';
import { useBalance } from '../IntroPage/BalanceContext';
import { useLiveBets } from '../IntroPage/LiveBetsContext';
import { auth, db } from '../firebase';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useTrackPresence } from '../Lobby/useTrackPresence';

const RecentBets = ({ bets }) => (
  <div className="flex gap-2 mb-4 overflow-x-auto py-2">
    {bets.map((bet, index) => (
      <div
        key={index}
        className={`
          px-4 py-1 rounded-full text-sm font-medium
          ${parseFloat(bet) === 0 ? 'bg-gray-600 text-white' :
           parseFloat(bet) >= 3 ? 'bg-purple-500 text-white' :
           parseFloat(bet) >= 2 ? 'bg-yellow-400 text-black' :
           parseFloat(bet) >= 1.5 ? 'bg-green-500 text-white' :
           'bg-gray-200 text-black'}
        `}
      >
        {bet}x
      </div>
    ))}
  </div>
);

const MultiplierMap = ({ riskLevel }) => {
  const multipliers = {
    Low: [
      { value: '0.00x', color: 'bg-gray-600' },
      { value: '1.20x', color: 'bg-gray-200' },
      { value: '1.50x', color: 'bg-green-500' }
    ],
    Medium: [
      { value: '0.00x', color: 'bg-gray-600' },
      { value: '1.50x', color: 'bg-green-500' },
      { value: '1.90x', color: 'bg-purple-500' },
      { value: '2.00x', color: 'bg-yellow-400' },
      { value: '3.00x', color: 'bg-blue-500' }
    ],
    High: [
      { value: '0.00x', color: 'bg-gray-600' },
      { value: '9.90x', color: 'bg-red-500' }
    ]
  };

  return (
    <div className="flex gap-2 mt-4">
      {multipliers[riskLevel].map((mult, index) => (
        <div
          key={index}
          className={`flex-1 py-2 rounded-md text-center ${mult.color} 
            ${mult.value === '0.00x' ? 'text-white' : 
             mult.color === 'bg-gray-200' ? 'text-black' : 'text-white'}`}
        >
          {mult.value}
        </div>
      ))}
    </div>
  );
};

const WheelSegments = ({ segments, risk, isSpinning, rotation }) => {
  const generateSegments = () => {
    let segArray = [];
    const totalSegments = segments;
    
    switch (risk) {
      case 'High':
        // 50-50 split between 0x and 9.90x
        for (let i = 0; i < totalSegments; i++) {
          segArray.push(i < totalSegments / 2 ? 
            { value: '0.00x', color: '#4B5563' } : 
            { value: '9.90x', color: '#EF4444' });
        }
        break;
      case 'Medium':
        // Mix of 0x, 1.5x, 1.9x, 2.0x, 3.0x
        for (let i = 0; i < totalSegments; i++) {
          const rand = Math.random();
          if (rand < 0.3) segArray.push({ value: '0.00x', color: '#4B5563' });
          else if (rand < 0.5) segArray.push({ value: '1.50x', color: '#10B981' });
          else if (rand < 0.7) segArray.push({ value: '1.90x', color: '#8B5CF6' });
          else if (rand < 0.9) segArray.push({ value: '2.00x', color: '#FBBF24' });
          else segArray.push({ value: '3.00x', color: '#3B82F6' });
        }
        break;
      default: // Low
        // Mix of 0x, 1.2x, 1.5x
        for (let i = 0; i < totalSegments; i++) {
          const rand = Math.random();
          if (rand < 0.3) segArray.push({ value: '0.00x', color: '#4B5563' });
          else if (rand < 0.7) segArray.push({ value: '1.20x', color: '#E5E7EB' });
          else segArray.push({ value: '1.50x', color: '#10B981' });
        }
    }
    return segArray;
  };

  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const segs = generateSegments();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const segmentAngle = (2 * Math.PI) / segments;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw segments
    segs.forEach((seg, i) => {
      const startAngle = i * segmentAngle + rotation;
      const endAngle = startAngle + segmentAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = '#1F2937';
      ctx.stroke();
    });

    // Draw pointer
    ctx.save();
    ctx.translate(centerX, 20);
    ctx.fillStyle = '#FF4D6A';
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.lineTo(0, 20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

  }, [segments, risk, rotation, isSpinning]);

  return (
    <canvas 
      ref={canvasRef} 
      width={400} 
      height={400}
      className="w-full max-w-[600px] mx-auto"
    />
  );
};

const WheelGame = () => {
  const { balance, updateBalance } = useBalance();
  const [betAmount, setBetAmount] = useState('');
  const [riskLevel, setRiskLevel] = useState('Low');
  const [segments, setSegments] = useState(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [recentBets, setRecentBets] = useState([]);
  const [isAuto, setIsAuto] = useState(false);

  useTrackPresence('wheel');

  const validateBet = () => {
    if (!auth.currentUser?.uid) return false;
    const betValue = parseFloat(betAmount);
    return betValue >= 0.10 && betValue <= balance;
  };

  const handleBet = async () => {
    if (!validateBet() || isSpinning) return;

    const betValue = parseFloat(betAmount);
    
    try {
      await updateBalance(-betValue);
      setIsSpinning(true);

      // Simulate wheel spin
      let startTime = Date.now();
      const duration = 5000; // 5 seconds spin
      const totalRotation = Math.PI * 20; // 10 full rotations
      
      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = elapsed / duration;

        if (progress < 1) {
          // Easing function for smooth deceleration
          const easeOut = 1 - Math.pow(1 - progress, 3);
          setRotation(totalRotation * easeOut);
          requestAnimationFrame(animate);
        } else {
          setIsSpinning(false);
          // Handle result
          const result = Math.random() < 0.5 ? '1.50x' : '0.00x';
          setRecentBets(prev => [result, ...prev].slice(0, 10));
        }
      };

      requestAnimationFrame(animate);

    } catch (error) {
      console.error("Error processing bet:", error);
      setIsSpinning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-8">
          {/* Left Panel */}
          <div className="w-[320px] bg-gray-800 rounded-xl p-6">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setIsAuto(false)}
                className={`flex-1 py-2 px-4 rounded-lg ${
                  !isAuto ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                Manual
              </button>
              <button
                onClick={() => setIsAuto(true)}
                className={`flex-1 py-2 px-4 rounded-lg ${
                  isAuto ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                Auto
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">
                Bet Amount
              </label>
              <div className="relative">
                <DollarSign size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="w-full bg-gray-700 text-white pl-10 pr-4 py-3 rounded-lg"
                  disabled={isSpinning}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Risk Level</label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
                className="w-full bg-gray-700 text-white py-3 px-4 rounded-lg"
                disabled={isSpinning}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Segments</label>
              <select
                value={segments}
                onChange={(e) => setSegments(parseInt(e.target.value))}
                className="w-full bg-gray-700 text-white py-3 px-4 rounded-lg"
                disabled={isSpinning}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
                <option value={50}>50</option>
              </select>
            </div>

            <button
              onClick={handleBet}
              disabled={!validateBet() || isSpinning}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-medium
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSpinning ? 'Spinning...' : 'Bet'}
            </button>
          </div>

          {/* Right Panel */}
          <div className="flex-1 bg-gray-800 rounded-xl p-6">
            <RecentBets bets={recentBets} />
            
            <WheelSegments
              segments={segments}
              risk={riskLevel}
              isSpinning={isSpinning}
              rotation={rotation}
            />
            
            <MultiplierMap riskLevel={riskLevel} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WheelGame;