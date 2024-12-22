// hooks/useGameState.js
import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebase';
import { GAME_CONFIG } from '../config/gameConfig';
import { crashGameService } from '../services/crashGameService';

export const useGameState = () => {
  // Game states
  const [gameState, setGameState] = useState('waiting');
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
  const [players, setPlayers] = useState([]);
  const [recentCrashes, setRecentCrashes] = useState([]);
  const [countdown, setCountdown] = useState(GAME_CONFIG.COUNTDOWN_TIME);
  const [bettingPhase, setBettingPhase] = useState(true);
  const [totalBets, setTotalBets] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [potentialWin, setPotentialWin] = useState(0);
  const [currentBetAmount, setCurrentBetAmount] = useState(0);

  // Betting states
  const [currentBet, setCurrentBet] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [hasBetPlaced, setHasBetPlaced] = useState(false);
  const [isProcessingBet, setIsProcessingBet] = useState(false);

  // Refs
  const gameIdRef = useRef(null);
  const playerDocRef = useRef(null);
  const animationFrameRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const unsubscribesRef = useRef([]);
  const isTransitioningRef = useRef(false); // Added to prevent multiple transitions

  // Cleanup function
  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  // Betting functions
  const placeBet = async (userId, username, amount) => {
    if (!gameIdRef.current || !amount || isProcessingBet) return;

    try {
      setIsProcessingBet(true);
      const playerDoc = await crashGameService.placeBet(
        userId,
        username,
        gameIdRef.current,
        amount
      );
      
      setCurrentBet(amount);
      setCurrentBetAmount(amount);
      setHasBetPlaced(true);
      playerDocRef.current = playerDoc.id;
      setBetAmount('');
      
      return playerDoc;
    } catch (error) {
      console.error('Error placing bet:', error);
      throw error;
    } finally {
      setIsProcessingBet(false);
    }
  };

  const handleCashOut = async () => {
    if (!gameIdRef.current || !playerDocRef.current || gameState !== 'playing') return;

    try {
      const winAmount = await crashGameService.cashOut(
        playerDocRef.current,
        gameIdRef.current,
        currentMultiplier,
        currentBetAmount
      );

      // Reset bet states
      setCurrentBetAmount(0);
      setCurrentBet(null);
      setPotentialWin(0);
      setHasBetPlaced(false);
      playerDocRef.current = null;

      return winAmount;
    } catch (error) {
      console.error('Cashout error:', error);
      throw error;
    }
  };

  const resetBet = () => {
    setCurrentBet(null);
    setBetAmount('');
    setHasBetPlaced(false);
    setCurrentBetAmount(0);
    setPotentialWin(0);
    playerDocRef.current = null;
  };

  // Update potential win when multiplier changes
  useEffect(() => {
    if (gameState === 'playing' && currentBetAmount > 0) {
      setPotentialWin(currentBetAmount * currentMultiplier);
    }
  }, [currentMultiplier, currentBetAmount, gameState]);

  // Game state handler
  const handleGameStateUpdate = (gameData) => {
    if (isTransitioningRef.current) return;
    
    cleanup();

    switch (gameData.state) {
      case 'betting':
        console.log('Entering betting phase');
        setGameState('waiting');
        setBettingPhase(true);
        setCurrentMultiplier(1.00);
        
        if (gameData.startedAt?.toMillis) {
          const startTime = gameData.startedAt.toMillis();
          const elapsed = (Date.now() - startTime) / 1000;
          const remaining = Math.max(0, GAME_CONFIG.COUNTDOWN_TIME - elapsed);
          setCountdown(Math.round(remaining));

          if (remaining <= 0) {
            console.log('Countdown finished, transitioning to playing');
            crashGameService.updateGameState(gameIdRef.current, 'playing');
          } else {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
            }
            
            countdownIntervalRef.current = setInterval(() => {
              setCountdown(prev => {
                if (prev <= 1) {
                  cleanup();
                  crashGameService.updateGameState(gameIdRef.current, 'playing');
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          }
        }
        break;

      case 'playing':
        if (gameState !== 'playing') {
          console.log('Entering playing phase');
          setGameState('playing');
          setBettingPhase(false);

          if (gameData.playStartedAt) {
            const startTime = gameData.playStartedAt.toMillis();
            const updateMultiplier = () => {
              const elapsed = (Date.now() - startTime) / 1000;
              const newMultiplier = 1 + (elapsed * GAME_CONFIG.MULTIPLIER_SPEED);

              if (newMultiplier >= gameData.crashPoint) {
                cleanup();
                crashGameService.updateGameState(gameIdRef.current, 'crashed', { multiplier: newMultiplier });
                return;
              }

              setCurrentMultiplier(newMultiplier);
              animationFrameRef.current = requestAnimationFrame(updateMultiplier);
            };

            animationFrameRef.current = requestAnimationFrame(updateMultiplier);
          }
        }
        break;

      case 'crashed':
        console.log('Game crashed');
        setGameState('crashed');
        setBettingPhase(false);
        if (gameData.finalMultiplier) {
          setCurrentMultiplier(gameData.finalMultiplier);
        }
        resetBet();
        isTransitioningRef.current = true;
        
        setTimeout(() => {
          isTransitioningRef.current = false;
          crashGameService.startNewGame();
        }, 3000);
        break;
    }
  };

  // Initial game setup
  useEffect(() => {
    const setupInitialGame = async () => {
      try {
        const game = await crashGameService.getCurrentGame();
        if (!game) {
          await crashGameService.startNewGame();
        }
      } catch (error) {
        console.error('Error in initial setup:', error);
      }
    };

    setupInitialGame();
    return cleanup;
  }, []);

  // Game subscription
  useEffect(() => {
    console.log("Setting up game subscription");
    
    const unsubscribe = onSnapshot(
      query(collection(db, 'crashGames'), where('status', '==', 'active')),
      async (snapshot) => {
        const gameDoc = snapshot.docs[0];
        
        if (gameDoc) {
          const gameData = gameDoc.data();
          console.log('Current game data:', {
            id: gameDoc.id,
            ...gameData,
            startedAt: gameData.startedAt?.toMillis ? gameData.startedAt.toMillis() : null,
            playStartedAt: gameData.playStartedAt?.toMillis ? gameData.playStartedAt.toMillis() : null
          });

          gameIdRef.current = gameDoc.id;
          handleGameStateUpdate(gameData);

          // Players subscription
          if (gameIdRef.current) {
            const playersUnsubscribe = onSnapshot(
              query(collection(db, 'crashPlayers'), where('gameId', '==', gameIdRef.current)),
              (playersSnapshot) => {
                const allPlayers = playersSnapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data(),
                  placedAt: doc.data().placedAt?.toMillis(),
                  cashedAt: doc.data().cashedAt?.toMillis()
                }));

                const activePlayers = allPlayers.filter(player => 
                  player.status === 'playing' || 
                  (player.status === 'cashed_out' && Date.now() - player.cashedAt < 5000)
                );

                setPlayers(activePlayers);

                const totals = allPlayers.reduce((acc, player) => ({
                  bets: acc.bets + 1,
                  amount: acc.amount + (player.betAmount || 0)
                }), { bets: 0, amount: 0 });

                setTotalBets(totals.bets);
                setTotalAmount(totals.amount);
              }
            );
            unsubscribesRef.current.push(playersUnsubscribe);
          }
        } else {
          console.log("No active game, creating new one");
          await crashGameService.startNewGame();
        }
      }
    );
    unsubscribesRef.current.push(unsubscribe);

    // Recent crashes subscription
    const crashesUnsubscribe = onSnapshot(
      query(
        collection(db, 'crashGames'),
        where('status', '==', 'finished'),
        orderBy('endedAt', 'desc'),
        limit(5)
      ),
      (snapshot) => {
        const crashes = snapshot.docs.map(doc => ({
          id: doc.id,
          multiplier: doc.data().finalMultiplier || 1
        }));
        setRecentCrashes(crashes);
      }
    );
    unsubscribesRef.current.push(crashesUnsubscribe);

    return () => {
      unsubscribesRef.current.forEach(unsub => unsub && unsub());
      unsubscribesRef.current = [];
      cleanup();
    };
  }, []);

  return {
    gameState,
    currentMultiplier,
    players,
    recentCrashes,
    countdown,
    bettingPhase,
    totalBets,
    totalAmount,
    gameIdRef,
    playerDocRef,
    currentBet,
    setCurrentBet,
    betAmount,
    setBetAmount,
    hasBetPlaced,
    setHasBetPlaced,
    isProcessingBet,
    setIsProcessingBet,
    potentialWin,
    currentBetAmount,
    setCurrentBetAmount,
    placeBet,
    handleCashOut,
    resetBet
  };
};