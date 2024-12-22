export const GAME_CONFIG = {
    COUNTDOWN_TIME: 10,
    MIN_BET_AMOUNT: 0.10,
    MULTIPLIER_SPEED: 0.14, // Multiplier increase per second
    MULTIPLIER_UPDATE_INTERVAL: 50, // Milliseconds between updates
    CRASH_PROBABILITIES: {
      LOW: { chance: 0.60, range: [1,2] },    // 60% chance
      MEDIUM: { chance: 0.25, range: [2, 3] },   // 25% chance
      HIGH: { chance: 0.10, range: [3, 5] },     // 10% chance
      RARE: { chance: 0.05, range: [5, 10] }     // 5% chance
    }
  };