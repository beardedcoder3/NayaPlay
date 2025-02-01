import React from 'react';
import { Sparkles, Play, Trophy, Clock } from 'lucide-react';
import cardgirl from "./cardgirl.jpg"


const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="relative group">
    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl 
      blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
    <div className="relative bg-black/40 backdrop-blur-md rounded-2xl p-6 
      border border-white/10 hover:border-white/20 transition-all duration-300">
      <div className="flex items-start space-x-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
          <Icon size={24} className="text-purple-400" />
        </div>
        <div>
          <h3 className="text-white font-medium mb-2">{title}</h3>
          <p className="text-white/60 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  </div>
);

const CasinoBanner = () => {
  return (
    <section className="relative bg-[#0A0118] py-12 lg:py-20 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full 
          blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full 
          blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="max-w-6xl mx-auto px-4 relative">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">
          {/* Left content - Image showcase */}
          <div className="lg:w-1/2 relative w-full">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={cardgirl}
                alt="Casino Experience"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
              
              {/* Stats overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 lg:space-x-6">
                    <div className="flex items-center space-x-2">
                      <Trophy className="text-purple-400 h-5 w-5" />
                      <span className="text-white text-sm font-medium">200+ Winners Daily</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="text-pink-400 h-5 w-5" />
                      <span className="text-white text-sm font-medium">24/7 Live Games</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating card */}
            <div className="absolute -bottom-4 -right-4 lg:-bottom-8 lg:-right-8 bg-black/60 backdrop-blur-xl p-4 rounded-2xl 
              border border-white/10 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <Sparkles className="text-purple-400 h-5 w-5" />
                </div>
                <div className="text-sm">
                  <p className="text-white font-medium">New Games Added</p>
                  <p className="text-white/60">Every week</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right content */}
          <div className="lg:w-1/2 space-y-8">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                <span className="text-white">Experience</span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Next-Gen Betting
                </span>
              </h2>
              <p className="text-lg text-white/60 leading-relaxed">
                Dive into a world of cutting-edge casino games with immersive gameplay 
                and stunning visuals. Join thousands of players winning big every day.
              </p>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureCard
                icon={Play}
                title="Live Dealers"
                description="Experience real-time action with immersive gameplay"
              />
              <FeatureCard
                icon={Trophy}
                title="Daily Tournaments"
                description="Compete for massive prize pools every day"
              />
            </div>

            {/* CTA Button */}
            <button className="group flex items-center space-x-3 px-8 py-4 
              bg-gradient-to-r from-purple-500 to-pink-500
              rounded-2xl text-white font-medium text-lg
              transition-all duration-300 transform hover:scale-105
              shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40">
              <span>Start Playing Now</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CasinoBanner;