import { GAME_CONFIG } from "../config/gameConfig";

export const calculateCrashPoint = () => {
  const random = Math.random();
  const { CRASH_PROBABILITIES } = GAME_CONFIG;
  
  let crashPoint;
  if (random < CRASH_PROBABILITIES.LOW.chance) {
    const [min, max] = CRASH_PROBABILITIES.LOW.range;
    crashPoint = min + (Math.random() * (max - min));
  } else if (random < CRASH_PROBABILITIES.LOW.chance + CRASH_PROBABILITIES.MEDIUM.chance) {
    const [min, max] = CRASH_PROBABILITIES.MEDIUM.range;
    crashPoint = min + (Math.random() * (max - min));
  } else if (random < 1 - CRASH_PROBABILITIES.RARE.chance) {
    const [min, max] = CRASH_PROBABILITIES.HIGH.range;
    crashPoint = min + (Math.random() * (max - min));
  } else {
    const [min, max] = CRASH_PROBABILITIES.RARE.range;
    crashPoint = min + (Math.random() * (max - min));
  }
  
  // Add some randomness to make it less predictable
  return Number((crashPoint + (Math.random() * 0.1 - 0.05)).toFixed(2));
};

export const formatNumber = (num, decimals = 2) => {
  if (typeof num !== 'number' || isNaN(num)) return '0.00';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

export const calculatePotentialWin = (betAmount, multiplier) => {
  return Number((betAmount * multiplier).toFixed(2));
};

export const formatTime = (seconds) => {
  return seconds.toFixed(1) + 's';
};