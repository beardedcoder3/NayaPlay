import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';

const GameCard = ({ game, isCenter }) => {
  return (
    <div 
      className={`relative flex-shrink-0 w-[280px] mx-3 transition-all duration-500
        ${isCenter ? 'z-10' : 'z-0'}`}
    >
      <div className={`relative overflow-hidden rounded-2xl 
        transition-all duration-500 transform
        ${isCenter ? 'scale-100' : 'scale-90 opacity-50'}
        hover:z-20`}
      >
        {/* Image Container */}
        <div className="aspect-[3/4] bg-[#1a2730] rounded-2xl overflow-hidden">
          <img
            src="https://img.pikbest.com/element_our/20220405/bg/1c936d8b550cd.png!bw700"
            alt={game.title}
            className="w-full h-full object-contain transform transition-transform duration-700
              hover:scale-105"
          />
          
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1923] via-transparent to-transparent opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1923] to-transparent opacity-0 
            hover:opacity-50 transition-opacity duration-500" />
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {/* Genre Tag */}
          <div className="flex mb-3 opacity-0 transform translate-y-4
            group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
            <span className="px-3 py-1 rounded-full bg-[#0072ce]/20 text-[#0072ce] 
              text-xs font-medium border border-[#0072ce]/20">
              {game.genre}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">
            {game.title}
          </h3>

          {/* Play Button */}
          <button className="w-full py-2 mt-4 rounded-lg bg-white/10 text-white/90 text-sm font-medium
            backdrop-blur-sm border border-white/10 opacity-0 transform translate-y-4
            hover:opacity-100 hover:translate-y-0 transition-all duration-500
            hover:bg-white/20">
            Play Now
          </button>
        </div>
      </div>
    </div>
  );
};

const TrendingGamesCarousel = () => {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [centerIndex, setCenterIndex] = useState(0);

  const games = [
    { id: 1, title: "Call of Duty: Modern Warfare III", genre: "FPS" },
    { id: 2, title: "Baldur's Gate 3", genre: "RPG" },
    { id: 3, title: "Mortal Kombat 1", genre: "Fighting" },
    { id: 4, title: "Starfield", genre: "Action RPG" },
    { id: 5, title: "FC 24", genre: "Sports" },
    { id: 6, title: "Assassin's Creed Mirage", genre: "Action-Adventure" },
    { id: 7, title: "Marvel's Spider-Man 2", genre: "Action" },
    { id: 8, title: "Alan Wake 2", genre: "Horror" }
  ];

  const handleScroll = (direction) => {
    const container = scrollRef.current;
    const cardWidth = 296; // card width (280px) + margin (16px)
    const scrollAmount = cardWidth;

    const newScrollPosition = direction === 'left'
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollPosition,
      behavior: 'smooth'
    });

    const newCenterIndex = direction === 'left'
      ? Math.max(0, centerIndex - 1)
      : Math.min(games.length - 1, centerIndex + 1);
    
    setCenterIndex(newCenterIndex);
    
    setShowLeftArrow(newScrollPosition > 0);
    setShowRightArrow(
      newScrollPosition < container.scrollWidth - container.offsetWidth - 10
    );
  };

  return (
    <div className="relative bg-[#0f1923] py-16">
      <div className="max-w-7xl mx-auto px-8 relative">
        {/* Section Header */}
        <div className="flex items-center space-x-4 mb-12">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl 
            bg-[#0072ce]/10 border border-[#0072ce]/20">
            <Flame size={32} className="text-[#0072ce]" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">
              Trending Games
            </h2>
            <p className="text-gray-400">
              Hot and trending games right now
            </p>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative group">
          {/* Navigation Arrows */}
          <button
            onClick={() => handleScroll('left')}
            className={`absolute -left-4 top-1/2 -translate-y-1/2 z-30
              w-12 h-12 flex items-center justify-center
              bg-[#1a2730]/90 text-white rounded-full shadow-lg backdrop-blur-sm
              border border-white/10 hover:bg-[#1a2730]
              transition-all duration-300
              ${showLeftArrow ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'}`}
          >
            <ChevronLeft size={24} />
          </button>

          {/* Games Container */}
          <div
            ref={scrollRef}
            className="flex overflow-x-hidden scroll-smooth py-8"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {games.map((game, index) => (
              <GameCard 
                key={game.id} 
                game={game} 
                isCenter={index === centerIndex}
              />
            ))}
          </div>

          <button
            onClick={() => handleScroll('right')}
            className={`absolute -right-4 top-1/2 -translate-y-1/2 z-30
              w-12 h-12 flex items-center justify-center
              bg-[#1a2730]/90 text-white rounded-full shadow-lg backdrop-blur-sm
              border border-white/10 hover:bg-[#1a2730]
              transition-all duration-300
              ${showRightArrow ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'}`}
          >
            <ChevronRight size={24} />
          </button>

          {/* Edge Gradients */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0f1923] to-transparent pointer-events-none z-20" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#0f1923] to-transparent pointer-events-none z-20" />
        </div>
      </div>
    </div>
  );
};

export default TrendingGamesCarousel;