import React from 'react';
import { Sparkles, Play, Trophy, Clock } from 'lucide-react';

const FeatureItem = ({ icon: Icon, text, count }) => (
  <div className="group cursor-pointer">
    <div className="flex items-center space-x-3 bg-white/5 hover:bg-white/10 
    backdrop-blur-sm rounded-xl p-4 transition-all duration-300
    border border-white/5 hover:border-white/10">
      <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
        <Icon size={22} className="text-blue-400" />
      </div>
      <div>
        <span className="text-sm font-medium text-white/90 block">{text}</span>
        {count && (
          <span className="text-xs text-blue-400/90">{count}+ games</span>
        )}
      </div>
    </div>
  </div>
);

const CasinoBanner = () => {
  return (
    <div className="relative w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Enhanced ambient lighting effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[30rem] h-[30rem] bg-blue-500/10 rounded-full filter blur-[160px]" />
        <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full filter blur-[160px]" />
      </div>

      {/* Refined diagonal line decoration */}
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

      {/* Content container */}
      <div className="max-w-7xl mx-auto px-4 py-20 lg:py-24 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div className="space-y-10 relative z-10">
            {/* Enhanced headline */}
            <div className="space-y-5">
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                <span className="text-white">Elevate Your</span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Gaming Journey
                </span>
              </h2>
              <p className="text-lg text-slate-300 max-w-xl">
                Step into a world of endless possibilities with carefully curated games designed for the ultimate entertainment experience.
              </p>
            </div>

            {/* Refined feature grid */}
            <div className="grid grid-cols-2 gap-4">
              <FeatureItem icon={Sparkles} text="New Releases" count="250" />
              <FeatureItem icon={Play} text="Live Casino" count="100" />
              <FeatureItem icon={Trophy} text="Tournaments" count="50" />
              <FeatureItem icon={Clock} text="24/7 Action" />
            </div>

            {/* Enhanced CTA Button */}
            <button className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 
              rounded-xl font-bold text-lg
              transition-all duration-300 
              hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700
              transform hover:scale-[1.02] active:scale-[0.98]
              shadow-lg shadow-blue-500/20
              border border-white/10 hover:border-white/20">
              Explore Games Library
              <span className="inline-block ml-2 transform group-hover:translate-x-1 transition-transform duration-200">
                →
              </span>
            </button>
          </div>

          {/* Right content - Enhanced image container */}
          <div className="relative lg:h-[600px] flex items-center justify-center">
            <div className="relative w-full h-full">
              {/* Game banner image with enhanced styling */}
              <img
                src="https://c1.wallpaperflare.com/preview/659/106/422/casino-arcade-slot-machines-machines-gambling-risk.jpg"
                alt="Casino Games"
                className="object-cover w-full h-full rounded-2xl shadow-2xl 
                border border-white/10 hover:border-white/20 transition-all duration-300"
              />
              
              {/* Enhanced overlay gradient */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
              
              {/* Enhanced stats overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex justify-between items-center text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <Trophy size={16} className="text-blue-400" />
                    <span className="text-blue-400">2000+ Games</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Sparkles size={16} className="text-green-400" />
                    <span className="text-green-400">97% Payout Rate</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CasinoBanner;