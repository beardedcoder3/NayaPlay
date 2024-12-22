import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DollarSign, Volume2, VolumeX, History } from 'lucide-react';

// Probability configurations for different risk levels
const PROBABILITY_CONFIGS = {
  low: {
    segments: [
      { value: 0.00, color: '#37474f', weight: 0.30 }, // 30% chance
      { value: 1.50, color: '#4caf50', weight: 0.25 }, // 25% chance
      { value: 1.70, color: '#90a4ae', weight: 0.20 }, // 20% chance
      { value: 2.00, color: '#ffd700', weight: 0.15 }, // 15% chance
      { value: 3.00, color: '#9c27b0', weight: 0.07 }, // 7% chance
      { value: 4.00, color: '#ff9800', weight: 0.03 }  // 3% chance
    ],
    maxMultiplier: 4.00
  },
  medium: {
    segments: [
      { value: 0.00, color: '#37474f', weight: 0.35 },
      { value: 2.00, color: '#4caf50', weight: 0.25 },
      { value: 3.00, color: '#ffd700', weight: 0.20 },
      { value: 4.00, color: '#90a4ae', weight: 0.12 },
      { value: 5.00, color: '#9c27b0', weight: 0.05 },
      { value: 8.00, color: '#ff9800', weight: 0.03 }
    ],
    maxMultiplier: 8.00
  },
  high: {
    segments: [
      { value: 0.00, color: '#37474f', weight: 0.45 },
      { value: 3.00, color: '#4caf50', weight: 0.25 },
      { value: 5.00, color: '#ffd700', weight: 0.15 },
      { value: 10.00, color: '#90a4ae', weight: 0.10 },
      { value: 15.00, color: '#9c27b0', weight: 0.03 },
      { value: 20.00, color: '#ff9800', weight: 0.02 }
    ],
    maxMultiplier: 20.00
  }
};

// Animation constants
const SPIN_CONFIG = {
  duration: 4000, // 4 seconds
  minRotations: 5,
  maxRotations: 8,
  easingPower: 2.5
};

// Wheel component
const Wheel = ({ segments, onSpinComplete, isSpinning, indicator = true }) => {
  const canvasRef = useRef(null);
  const wheelRef = useRef({ rotation: 0 });
  const animationRef = useRef(null);

  // Draw the wheel
  const drawWheel = useCallback((ctx, width, height, rotation) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;
    const segmentAngle = (Math.PI * 2) / segments.length;

    ctx.clearRect(0, 0, width, height);

    // Draw outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    // Draw segments
    segments.forEach((segment, index) => {
      const startAngle = index * segmentAngle + rotation;
      const endAngle = (index + 1) * segmentAngle + rotation;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();

      // Add separator line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(startAngle) * radius,
        centerY + Math.sin(startAngle) * radius
      );
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw multiplier text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 20px Inter';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(
        `${segment.value.toFixed(2)}×`,
        radius * 0.85,
        0
      );
      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    // Draw multiplier display in center
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 24px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const currentIndex = Math.floor(
      (2 * Math.PI - (rotation % (2 * Math.PI))) / segmentAngle
    ) % segments.length;
    ctx.fillText(
      `${segments[currentIndex].value.toFixed(2)}×`,
      centerX,
      centerY
    );
  }, [segments]);

  // Spin animation
  const animate = useCallback((startTime, targetRotation) => {
    return (currentTime) => {
      if (!canvasRef.current) return;

      const ctx = canvasRef.current.getContext('2d');
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / SPIN_CONFIG.duration, 1);

      // Custom easing function for realistic spin
      const easeOut = (t) => 1 - Math.pow(1 - t, SPIN_CONFIG.easingPower);
      wheelRef.current.rotation = targetRotation * easeOut(progress);

      drawWheel(ctx, canvasRef.current.width, canvasRef.current.height, wheelRef.current.rotation);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate(startTime, targetRotation));
      } else {
        // Calculate final segment
        const segmentAngle = (Math.PI * 2) / segments.length;
        const finalRotation = wheelRef.current.rotation % (Math.PI * 2);
        const segmentIndex = Math.floor(
          (2 * Math.PI - finalRotation) / segmentAngle
        ) % segments.length;
        onSpinComplete(segments[segmentIndex].value);
      }
    };
  }, [segments, drawWheel, onSpinComplete]);

  // Handle spin start
  useEffect(() => {
    if (isSpinning) {
      // Calculate weighted random outcome
      const totalWeight = segments.reduce((sum, segment) => sum + segment.weight, 0);
      let random = Math.random() * totalWeight;
      let selectedIndex = 0;
      
      for (let i = 0; i < segments.length; i++) {
        random -= segments[i].weight;
        if (random <= 0) {
          selectedIndex = i;
          break;
        }
      }

      // Calculate target rotation to land on selected segment
      const segmentAngle = (Math.PI * 2) / segments.length;
      const baseRotations = SPIN_CONFIG.minRotations + 
        Math.random() * (SPIN_CONFIG.maxRotations - SPIN_CONFIG.minRotations);
      const targetRotation = baseRotations * Math.PI * 2 +
        (segments.length - selectedIndex) * segmentAngle;

      animationRef.current = requestAnimationFrame(
        animate(performance.now(), targetRotation)
      );
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSpinning, segments, animate]);

  // Initial render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    drawWheel(ctx, canvas.width, canvas.height, wheelRef.current.rotation);
  }, [drawWheel]);

  return (
    <div className="relative">
      {indicator && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
          <div className="w-4 h-8 bg-red-500 rounded-t-full" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="w-full max-w-md mx-auto"
      />
    </div>
  );
};

// Multiplier display component
const MultiplierDisplay = ({ multipliers }) => (
  <div className="flex justify-center space-x-4 mt-6">
    {multipliers.map((multiplier, index) => (
      <div
        key={index}
        className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700"
        style={{ borderBottom: `3px solid ${multiplier.color}` }}
      >
        <span className="text-white font-bold">
          {multiplier.value.toFixed(2)}×
        </span>
      </div>
    ))}
  </div>
);

// Main game component
const WheelGame = () => {
  const [betAmount, setBetAmount] = useState('1.00');
  const [riskLevel, setRiskLevel] = useState('low');
  const [isSpinning, setIsSpinning] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [lastResult, setLastResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleSpin = () => {
    if (!validateBet() || isSpinning) return;
    setIsSpinning(true);
  };

  const handleSpinComplete = (multiplier) => {
    setIsSpinning(false);
    setLastResult(multiplier);
    
    setHistory(prev => [{
      multiplier,
      amount: parseFloat(betAmount) * multiplier,
      timestamp: new Date()
    }, ...prev].slice(0, 10));
  };

  const validateBet = () => {
    const bet = parseFloat(betAmount);
    return bet >= 0.10 && !isNaN(bet);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Wheel Game</h1>
            <p className="text-gray-400">Spin the wheel and multiply your bet</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 
                transition-colors border border-gray-700"
            >
              {isSoundEnabled ? (
                <Volume2 className="w-5 h-5 text-gray-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 
                transition-colors border border-gray-700"
            >
              <History className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left panel - Settings */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-6">Game Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bet Amount (min. $0.10)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="number"
                      step="0.1"
                      min="0.10"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      className="w-full bg-gray-900 text-white pl-10 pr-4 py-3 rounded-lg
                        border border-gray-700 focus:border-blue-500 focus:ring-1"
                      disabled={isSpinning}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Risk Level
                  </label>
                  <select
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value)}
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg
                      border border-gray-700 focus:border-blue-500 focus:ring-1"
                    disabled={isSpinning}
                  >
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                  </select>
                </div>
              </div>
            </div>

            {showHistory && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Spin History</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {history.map((spin, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        {spin.timestamp.toLocaleTimeString()}
                      </span>
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-300">
                          ${spin.amount.toFixed(2)}
                        </span>
                        <span className={`font-semibold ${
                          spin.multiplier > 1 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {spin.multiplier}x
                        </span>
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <p className="text-gray-400 text-center">No spins yet</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right panel - Wheel and Results */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              {/* Wheel component */}
              <Wheel
                segments={PROBABILITY_CONFIGS[riskLevel].segments}
                onSpinComplete={handleSpinComplete}
                isSpinning={isSpinning}
              />

              {/* Multiplier display */}
              <MultiplierDisplay 
                multipliers={PROBABILITY_CONFIGS[riskLevel].segments} 
              />
              
              {/* Results display */}
              {lastResult && !isSpinning && (
                <div className="text-center mt-8 space-y-2">
                  <p className={`text-3xl font-bold ${
                    lastResult > 1 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {lastResult > 1 ? 'You Won!' : 'Try Again!'}
                  </p>
                  <p className="text-2xl font-semibold text-white">
                    {lastResult.toFixed(2)}× multiplier
                  </p>
                  <p className="text-xl text-gray-300">
                    ${(parseFloat(betAmount) * lastResult).toFixed(2)}
                  </p>
                </div>
              )}

              {/* Spin button */}
              <div className="mt-8">
                <button
                  onClick={handleSpin}
                  disabled={!validateBet() || isSpinning}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 
                    text-white px-8 py-4 rounded-lg font-medium text-lg
                    hover:from-blue-500 hover:to-blue-600 
                    transition-all duration-300 disabled:opacity-50
                    disabled:cursor-not-allowed shadow-lg
                    hover:shadow-blue-500/25"
                >
                  {isSpinning ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin mr-2">⟳</span>
                      Spinning...
                    </span>
                  ) : (
                    'Spin Wheel'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WheelGame;