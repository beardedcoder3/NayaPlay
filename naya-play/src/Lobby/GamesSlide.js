import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GameCard = ({ game, isCenter }) => {
  const navigate = useNavigate();
  const images = {
    "Cyberpunk 2077": "https://wallpapercat.com/w/full/2/6/4/656-3840x2160-desktop-4k-red-dead-redemption-background.jpg",
    "God of War Ragnarök": "https://gmedia.playstation.com/is/image/SIEPDC/god-of-war-ragnarok-store-art-01-10sep21$ru?$native$",
    "Elden Ring": "https://wallpapercat.com/w/full/8/d/6/110203-1440x2160-samsung-hd-gran-turismo-7-wallpaper-photo.jpg",
    "Spider-Man 2": "https://wallpapercat.com/w/full/f/e/c/2475-1920x1080-desktop-1080p-grand-theft-auto-5-background-image.jpg",
    "Final Fantasy XVI": "https://images.alphacoders.com/563/thumb-1920-563020.jpg",
    "The Last of Us Part II": "https://images2.alphacoders.com/149/thumb-1920-149660.jpg",
    "Ghost of Tsushima": "https://wallpapercat.com/w/full/2/6/4/656-3840x2160-desktop-4k-red-dead-redemption-background.jpg"
  };

  const handleClick = () => {
    const routes = {
      "Cyberpunk 2077": '/mines',
      "God of War Ragnarök": '/limbo',
      "Elden Ring": '/crash',
      "Spider-Man 2": '/wheel',
       "Final Fantasy XVI": '/dice'
    };
    
    if (routes[game.title]) {
      navigate(routes[game.title]);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`relative flex-shrink-0 w-[500px] mx-6 transition-all duration-700 ease-out cursor-pointer
        ${isCenter ? 'scale-100 z-10 hover:scale-[1.02]' : 'scale-[0.9] opacity-40 z-0 pointer-events-none'}
        hover:z-20`}
    >
      <div className="relative overflow-hidden rounded-xl bg-[#0f1923]/40
        transition-all duration-500">
        {/* Image Container */}
        <div className="aspect-[16/9] overflow-hidden">
          <img
            src={images[game.title] || '/api/placeholder/400/225'}
            alt={game.title}
            className="w-full h-full object-cover transform transition-transform duration-1000
              hover:[&>*]:scale-105"
          />
          
          {/* Base gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t 
            from-black/80 via-black/20 to-transparent opacity-80" />
          
          {/* Hover gradient - only applies to hovered card */}
          <div className="absolute inset-0 opacity-0 hover:opacity-100
            bg-gradient-to-t from-[#0072ce]/30 via-[#0072ce]/5 to-transparent
            transition-opacity duration-700" />
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 transition-transform duration-500">
          {/* Genre Tag */}
          <div className="flex items-center space-x-3 mb-2 opacity-70
            transition-transform duration-500">
            <span className="px-3 py-0.5 rounded-full bg-white/10 backdrop-blur-sm
              text-white/90 text-xs font-medium">
              {game.genre}
            </span>
          </div>
          
          {/* Title */}
          <h3 className="text-2xl font-semibold text-white mb-2 tracking-wide
            transition-transform duration-500">
            {game.title}
          </h3>

          {/* Play Button - Only appears on individual hover */}
          <button className="mt-2 px-6 py-2 rounded-lg bg-white/10 backdrop-blur-sm text-white/90 
            text-sm font-medium hover:bg-white/20 transition-all duration-500 
            opacity-0 hover:opacity-100 transform translate-y-4 
            hover:translate-y-0 border border-white/10">
            Play Now
          </button>
        </div>

        {/* Subtle border effect only on hovered card */}
        <div className="absolute inset-0 opacity-0 hover:opacity-100
          transition-opacity duration-500 pointer-events-none
          border border-white/10 rounded-xl" />
      </div>
    </div>
  );
};

const GameCarousel = () => {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [centerIndex, setCenterIndex] = useState(0);

  const games = [
    { id: 1, title: "Cyberpunk 2077", genre: "Action RPG" },
    { id: 2, title: "God of War Ragnarök", genre: "Action-Adventure" },
    { id: 3, title: "Elden Ring", genre: "Action RPG" },
    { id: 5, title: "Spider-Man 2", genre: "Action-Adventure" },
    { id: 6, title: "Final Fantasy XVI", genre: "Action RPG" },
    { id: 7, title: "The Last of Us Part II", genre: "Action-Adventure" },
    { id: 8, title: "Ghost of Tsushima", genre: "Action-Adventure" }
  ];

  const handleScroll = (direction) => {
    const container = scrollRef.current;
    const cardWidth = 512; // card width (500px) + margin (12px)
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
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50" />
      
      <div className="max-w-[1800px] mx-auto relative px-16">
        {/* Section Header */}
        <div className="flex items-center mb-12 pl-4">
          <div>
            <h2 className="text-2xl font-medium text-white/90 tracking-wide mb-1">
              Featured Games
            </h2>
            <p className="text-white/50 text-sm">
              Experience our collection of premium games
            </p>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative group">
          {/* Navigation Arrows */}
          <button
            onClick={() => handleScroll('left')}
            className={`absolute -left-4 top-1/2 -translate-y-1/2 z-30
              w-10 h-10 flex items-center justify-center
              bg-black/20 backdrop-blur-sm text-white/70 rounded-full
              hover:bg-black/40 hover:text-white transition-all duration-300
              ${showLeftArrow ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}
          >
            <ChevronLeft size={20} />
          </button>

          {/* Games Container */}
          <div
            ref={scrollRef}
            className="flex overflow-x-hidden scroll-smooth py-4"
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
              w-10 h-10 flex items-center justify-center
              bg-black/20 backdrop-blur-sm text-white/70 rounded-full
              hover:bg-black/40 hover:text-white transition-all duration-300
              ${showRightArrow ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}
          >
            <ChevronRight size={20} />
          </button>

          {/* Subtle edge gradients */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0f1923] to-transparent pointer-events-none z-20" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#0f1923] to-transparent pointer-events-none z-20" />
        </div>
      </div>
    </div>
  );
};

export default GameCarousel;