import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { getDocs, writeBatch } from 'firebase/firestore';
import { Gamepad2 } from 'lucide-react';

const GameCard = ({ title, players }) => {
  const navigate = useNavigate();
  
  const gameImages = {
    'MINES': 'https://mediumrare.imgix.net/15a51a2ae2895872ae2b600fa6fe8d7f8d32c9814766b66ddea2b288d04ba89c?format=auto&auto=format&q=90&w=334&dpr=2',
    'DICE': 'https://mediumrare.imgix.net/30688668d7d2d48d472edd0f1e2bca0758e7ec51cbab8c04d8b7f157848640e0?format=auto&auto=format&q=90&w=334&dpr=2',
    'LIMBO': 'https://mediumrare.imgix.net/11caec5df20098884ae9071848e1951b8b34e5ec84a7241f2e7c5afd4b323dfd?format=auto&auto=format&q=90&w=334&dpr=2',
    'CRASH': 'https://mediumrare.imgix.net/c830595cbd07b2561ac76a365c2f01869dec9a8fe5e7be30634d78c51b2cc91e?format=auto&auto=format&q=90&w=334&dpr=2',
  };

  const handleClick = () => {
    const routes = {
      'MINES': '/mines',
      'DICE': '/dice',
      'LIMBO': '/limbo',
      'CRASH': '/crash',
    };
    
    if (routes[title]) {
      navigate(routes[title]);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="relative group cursor-pointer w-48"
    >
      <div className="relative h-64 rounded-xl overflow-hidden transition-all duration-300 ease-out
        shadow-md hover:shadow-xl">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            loading="lazy"
            src={gameImages[title]} 
            alt={title}
            width="167"
            height="223"
            draggable="false"
            className="w-full h-full transition-transform duration-300 ease-out
              group-hover:scale-[1.02]"
          />
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent
            opacity-80" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-4">
          {/* NayaPlay Originals Badge */}
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full
              text-white/90 text-xs tracking-wider">
              NayaPlay Originals
            </span>
          </div>

          {/* Bottom Content */}
          <div className="text-center">
            
            {/* Player Count */}
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/90 text-sm">
                {players?.toLocaleString() || '0'} playing
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GameSlidePart2 = () => {
  const [activePlayers, setActivePlayers] = useState({});
  const [games] = useState([
    { id: 'mines', title: 'MINES' },
    { id: 'dice', title: 'DICE' },
    { id: 'limbo', title: 'LIMBO' },
    { id: 'crash', title: 'CRASH' },
  ]);

  useEffect(() => {
    // Get only active users from the last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const activeUsersRef = collection(db, 'activeUsers');
    const q = query(
      activeUsersRef,
      where('lastActive', '>', fiveMinutesAgo)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counts = {};
      
      // Initialize all games with 0 players
      games.forEach(game => {
        counts[game.id] = 0;
      });

      // Count active users per game
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.gameId && counts.hasOwnProperty(data.gameId)) {
          counts[data.gameId]++;
        }
      });

      setActivePlayers(counts);
    });

    // Cleanup function
    const cleanupStalePresence = async () => {
      try {
        const staleRef = collection(db, 'activeUsers');
        const staleQ = query(
          staleRef,
          where('lastActive', '<', Date.now() - 5 * 60 * 1000)
        );
        
        const snapshot = await getDocs(staleQ);
        const batch = writeBatch(db);
        
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
      } catch (error) {
        console.error('Error cleaning up stale presence:', error);
      }
    };

    // Run cleanup every minute
    const cleanupInterval = setInterval(cleanupStalePresence, 60 * 1000);

    // Cleanup subscriptions
    return () => {
      unsubscribe();
      clearInterval(cleanupInterval);
    };
  }, [games]);

  return (
    <div className="w-full bg-[#0f1923] py-24">
      <div className="max-w-7xl mx-auto px-8">
        {/* Section Header */}
        <div className="flex items-center space-x-4 mb-12">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl 
            bg-[#0072ce]/10 border border-[#0072ce]/20">
            <Gamepad2 size={32} className="text-[#0072ce]" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">
              Featured Games
            </h2>
            <p className="text-gray-400">
              Our most popular games
            </p>
          </div>
        </div>

        {/* Games Container */}
        <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide">
          {games.map(game => (
            <GameCard
              key={game.id}
              title={game.title}
              players={activePlayers[game.id] || 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameSlidePart2;