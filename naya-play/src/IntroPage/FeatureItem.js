import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, Clock } from 'lucide-react';

const FeatureItem = ({ icon: Icon, title, description, isActive, onClick }) => (
  <div
    onClick={onClick}
    className={`
      relative cursor-pointer p-6 rounded-xl transition-all duration-300 ease-out
      backdrop-blur-sm group
      ${isActive ? 'bg-white/10' : 'bg-white/5 hover:bg-white/8'}
      border border-white/10 hover:border-white/20
      ${isActive ? 'border-l-4 border-l-blue-400' : ''}
    `}
  >
    <div className="flex items-center space-x-4">
      <div className={`
        p-3 rounded-lg transition-all duration-300
        ${isActive ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20' : 'bg-white/5'}
      `}>
        <Icon size={24} className={`
          transition-colors duration-300
          ${isActive ? 'text-blue-400' : 'text-white/70 group-hover:text-white/90'}
        `} />
      </div>
      <div className="flex-1">
        <h3 className={`
          font-medium text-lg transition-colors duration-300
          ${isActive ? 'text-blue-400' : 'text-white/90 group-hover:text-white'}
        `}>
          {title}
        </h3>
        <p className="mt-1 text-sm text-white/50 group-hover:text-white/70">
          {description}
        </p>
      </div>
      <div className={`
        transform transition-all duration-300
        ${isActive ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}
      `}>
        <span className="text-blue-400">→</span>
      </div>
    </div>
  </div>
);

const FeatureShowcase = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const features = [
    {
      title: "24/7 Live Gaming",
      description: "Non-stop action with real-time multiplayer games",
      icon: Clock,
    },
    {
      title: "Elite Rewards",
      description: "Exclusive bonuses and premium perks for players",
      icon: Sparkles,
    },
    {
      title: "Weekly Tournaments",
      description: "Compete in high-stakes events with massive prizes",
      icon: Trophy,
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24 overflow-hidden">
      {/* Enhanced ambient lighting effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[30rem] h-[30rem] bg-blue-500/10 rounded-full filter blur-[160px]" />
        <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full filter blur-[160px]" />
      </div>

      {/* Refined diagonal lines */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute h-px w-full bg-gradient-to-r from-transparent via-blue-500/10 to-transparent"
            style={{
              top: `${i * 33}%`,
              transform: 'rotate(-35deg)',
              left: '-50%',
              width: '200%'
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Enhanced headline */}
        <div className="space-y-4 mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
            <span className="text-white">Discover Our</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Premium Features
            </span>
          </h2>
          <p className="text-lg text-white/70 max-w-xl">
            Experience next-level gaming with our exclusive features and rewards.
          </p>
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Feature list */}
          <div className="space-y-3">
            {features.map((feature, index) => (
              <FeatureItem
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                isActive={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>

          {/* Enhanced image showcase */}
          <div className="relative">
            <div className="aspect-video rounded-xl overflow-hidden 
              shadow-2xl
              border border-white/10 hover:border-white/20 transition-all duration-300">
              <img
                src="https://wallpapers.com/images/featured/bitcoin-wnjw4r5olqgfwh9r.jpg"
                alt="Gaming Features"
                className="w-full h-full object-cover"
              />
              
              {/* Enhanced overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
              
              {/* Enhanced feature indicator */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex items-center justify-between">
                  <p className="text-xl font-medium text-white">
                    {features[activeIndex].title}
                  </p>
                  <div className="flex space-x-2">
                    {features.map((_, index) => (
                      <div
                        key={index}
                        className={`
                          h-1 rounded-full transition-all duration-300 ease-out
                          ${index === activeIndex ? 'w-8 bg-blue-400' : 'w-2 bg-white/20'}
                        `}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureShowcase;