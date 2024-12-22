import React from 'react';
import { Trophy, User, Star, CircleDollarSign } from 'lucide-react';

const FeatureItem = ({ icon: Icon, title, description }) => (
  <div className="group flex space-x-4 p-6 rounded-xl 
    bg-black/20 hover:bg-black/30 
    border border-purple-900/30 hover:border-purple-800/40
    transition-all duration-300">
    <div className="flex-shrink-0">
      <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-rose-500/20">
        <Icon size={24} className="text-rose-300 group-hover:text-rose-200 transition-colors duration-300" />
      </div>
    </div>
    <div>
      <h3 className="text-lg font-medium text-white/90 mb-2 group-hover:text-white transition-colors duration-300">
        {title}
      </h3>
      <p className="text-white/50 group-hover:text-white/70 leading-relaxed transition-colors duration-300">
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
    <section className="relative bg-gradient-to-br from-zinc-950 via-purple-950 to-zinc-950 py-24 overflow-hidden">
      {/* Ambient lighting effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[30rem] h-[30rem] bg-purple-700/10 rounded-full filter blur-[160px]" />
        <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-rose-700/10 rounded-full filter blur-[160px]" />
      </div>

      {/* Diagonal lines */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute h-px w-full bg-gradient-to-r from-transparent via-purple-800/10 to-transparent"
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
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20">
          {/* Left Column - Main Content */}
          <div className="flex flex-col justify-center">
            <div className="max-w-xl space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                  <span className="text-white">Join Our</span>
                  <br />
                  <span className="bg-gradient-to-r from-rose-300 via-purple-300 to-rose-300 bg-clip-text text-transparent">
                    Elite VIP Club
                  </span>
                </h2>
                <p className="text-lg text-white/70 leading-relaxed">
                  Experience gaming at its finest with exclusive benefits and personalized rewards designed for elite players.
                </p>
              </div>
              
              <button className="group inline-flex items-center px-8 py-4 
                bg-gradient-to-r from-purple-600 to-rose-600 
                hover:from-purple-500 hover:to-rose-500
                rounded-xl font-bold text-lg
                transition-all duration-300 
                transform hover:scale-[1.02] active:scale-[0.98]
                border border-white/10 hover:border-white/20">
                Become a VIP
                <span className="inline-block ml-2 transform group-hover:translate-x-1 transition-transform duration-200">
                  →
                </span>
              </button>
            </div>
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
        </div>
      </div>
    </section>
  );
};

export default VIPSection;