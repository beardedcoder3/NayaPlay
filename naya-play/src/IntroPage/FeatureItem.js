import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, Clock, Gift, CloudLightning, DollarSign } from 'lucide-react';

// Fix 1: Import images correctly
import winrtp from './winrtp.jpg';
import bonusboost from './bonusboost.jpg';
import welcomebonusimg from './welcomebonusimg.jpg';

const Icon = ({ children }) => (
  <div className="relative w-12 h-12 flex items-center justify-center rounded-lg" style={{
    background: 'linear-gradient(45deg, rgba(21, 27, 40, 0.8), rgba(21, 27, 40, 0.9))',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
  }}>
    <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10" />
    {children}
  </div>
);

const FeatureItem = ({ icon: IconComponent, title, description, isActive, onClick }) => (
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
      <Icon>
        <IconComponent className="text-blue-400 w-6 h-6" />
      </Icon>
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

  // Fix 2: Reference imported images correctly in features array
  const features = [
    {
      title: "High RTP Games",
      description: "With enhanced RTP percentages, you stand a chance to win big every time you play.",
      icon: DollarSign,
      image: winrtp  // Fix: Direct reference to imported image
    },
    {
      title: "Bonus boosts",
      description: "Weekly boosts and monthly bonuses mean you'll get rewarded the more you play top Casino games.",
      icon: CloudLightning,
      image: bonusboost  // Fix: Direct reference to imported image
    },
    {
      title: "Welcome Bonuses",
      description: "Claim Welcome Bonus, once you're IN.",
      icon: Gift,
      image: welcomebonusimg  // Fix: Direct reference to imported image
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative bg-gradient-to-b from-[#0e1525] to-[#0f1b31] py-24 overflow-hidden">
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
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

          <div className="relative">
            <div className="aspect-[16/9] rounded-xl overflow-hidden shadow-2xl border border-white/10 hover:border-white/20 transition-all duration-300">
              <div className="w-full h-full">
                <img
                  src={features[activeIndex].image}  // Fix: Use image property directly
                  alt={features[activeIndex].title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
              
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