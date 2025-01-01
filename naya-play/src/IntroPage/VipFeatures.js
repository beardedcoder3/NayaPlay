import React from 'react';
import { Trophy, User, Star, CircleDollarSign } from 'lucide-react';

const FeatureItem = ({ icon: Icon, title, description }) => (
  <div className="group flex space-x-4 p-6 rounded-xl 
    bg-white/5 hover:bg-white/10 
    border border-[#1e90ff]/10 hover:border-[#1e90ff]/20
    transition-all duration-300">
    <div className="flex-shrink-0">
      <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
        <Icon size={24} className="text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
      </div>
    </div>
    <div>
      <h3 className="text-lg font-medium text-white/90 mb-2 group-hover:text-white transition-colors duration-300">
        {title}
      </h3>
      <p className="text-white/60 group-hover:text-white/80 leading-relaxed transition-colors duration-300">
        {description}
      </p>
    </div>
  </div>
);

const VIPSection = () => {
  const features = [
    {
      icon: Trophy,
      title: "Weekly Rewards",
      description: "Exclusive weekly bonuses based on your gaming activity. Higher play levels unlock premium rewards."
    },
    {
      icon: User,
      title: "Personal VIP Host",
      description: "Get matched with a dedicated VIP manager for personalized support and exclusive opportunities."
    },
    {
      icon: Star,
      title: "Level-Up Benefits",
      description: "Earn special rewards as you progress through VIP tiers. Each new level brings enhanced perks."
    },
    {
      icon: CircleDollarSign,
      title: "Loyalty Bonuses",
      description: "Regular players receive special bonuses and rewards. The more you play, the more you earn."
    }
  ];

  return (
    <section className="relative bg-gradient-to-b from-[#141e30] to-[#243b55] py-24 overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-black/10" />
      
      {/* Diagonal lines */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
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
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Main Content */}
          <div className="space-y-10">
            <div className="space-y-4">
              <h2 className="text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Join Our
                </span>
                <br />
                <span className="text-white">Elite VIP Club</span>
              </h2>
              <p className="text-lg text-white/70 leading-relaxed">
                Experience gaming at its finest with exclusive benefits and personalized rewards designed for elite players.
              </p>
            </div>
              
            <button className="group inline-flex items-center space-x-2 px-6 py-3 
              bg-gradient-to-r from-blue-600 to-blue-700
              rounded-lg font-semibold text-white 
              hover:from-blue-700 hover:to-blue-800
              transition-all duration-200 transform hover:scale-105 
              w-fit border border-white/10">
              <span>Become a VIP</span>
            
            </button>
          </div>

          {/* Right Column - Features */}
          <div className="grid gap-4">
            {features.map((feature, index) => (
              <FeatureItem
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>

          {/* Decorative Elements */}
          <div className="absolute -z-10 w-full h-full">
            {/* Gradient Blob */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
              w-96 h-96 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-full
              blur-3xl opacity-50">
            </div>
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:50px_50px]"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VIPSection;