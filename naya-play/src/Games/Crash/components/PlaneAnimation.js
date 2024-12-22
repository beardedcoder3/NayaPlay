import { Plane } from "lucide-react";
export const PlaneAnimation = ({ gameState, multiplier }) => {
    const progress = Math.min((multiplier - 1) * 100, 100);
    const x = progress;
    const y = Math.min(progress * 3.5, 350);
    const rotation = Math.min(progress * 0.45, 45);
  
    return (
      <div className="relative w-full h-[400px] overflow-hidden">
        {/* Flight path */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="pathGradient" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`M 0,400 Q 50,350 ${x},${400 - y}`}
            fill="none"
            stroke="url(#pathGradient)"
            strokeWidth="3"
            className="transition-all duration-100"
          />
        </svg>
  
        {/* Plane */}
        <div
          className="absolute bottom-0 left-0 transition-all duration-100 ease-linear"
          style={{
            transform: gameState === 'crashed' 
              ? `translate(${x}%, 50px) rotate(90deg)` 
              : `translate(${x}%, -${y}px) rotate(${rotation}deg)`
          }}
        >
          <div className="relative">
            {/* Shadow */}
            <div className="absolute -z-10 blur-lg opacity-30 scale-75 translate-y-6">
              <Plane size={48} className="text-black transform -rotate-12" />
            </div>
            
            {/* Actual plane */}
            <Plane 
              size={48} 
              className={`transition-colors duration-200 drop-shadow-xl
                ${gameState === 'crashed' ? 'text-red-500' : 'text-white'}`}
            />
            
            {/* Engine effects */}
            {gameState === 'playing' && (
              <>
                <div className="absolute -right-2 top-1/2 -translate-y-1/2">
                  <div className="w-8 h-2 bg-gradient-to-r from-orange-500 via-yellow-500 to-transparent 
                    rounded-full animate-pulse opacity-75" />
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 -z-10">
                  <div className="space-y-1">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-1 h-1 bg-gray-400 rounded-full 
                        animate-smoke opacity-30" style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };