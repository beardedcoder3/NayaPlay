import { GAME_CONFIG } from "../config/gameConfig";

export const calculateCrashPoint = () => {
    const random = Math.random();
    const { CRASH_PROBABILITIES } = GAME_CONFIG;
    
    if (random < CRASH_PROBABILITIES.LOW.chance) {
      const [min, max] = CRASH_PROBABILITIES.LOW.range;
      return min + (Math.random() * (max - min));
    } else if (random < CRASH_PROBABILITIES.LOW.chance + CRASH_PROBABILITIES.MEDIUM.chance) {
      const [min, max] = CRASH_PROBABILITIES.MEDIUM.range;
      return min + (Math.random() * (max - min));
    } else if (random < CRASH_PROBABILITIES.LOW.chance + CRASH_PROBABILITIES.MEDIUM.chance + CRASH_PROBABILITIES.HIGH.chance) {
      const [min, max] = CRASH_PROBABILITIES.HIGH.range;
      return min + (Math.random() * (max - min));
    } else {
      const [min, max] = CRASH_PROBABILITIES.RARE.range;
      return min + (Math.random() * (max - min));
    }
  };
  
  export const formatNumber = (num, decimals = 2) => {
    return Number(num).toFixed(decimals);
  };
  