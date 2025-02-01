import React from 'react';
import AuthFlow from './AuthFlow';
import { Chrome, Facebook } from 'lucide-react';
import bonusboost from "./bonusboost.jpg"
import rouletteimg from "./rouletteimg.jpg"


const HeroSection = () => {
  return (
    <div className="w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Section */}
          <div className="space-y-10">
            {/* Main Text */}
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  An unrivalled online
                </span>
                <br />
                <span className="text-white">Casino</span>
              </h1>
            </div>

            {/* Auth Section */}
            <AuthFlow />
          </div>

          {/* Right Section - Images */}
          <div className="hidden lg:flex gap-4 relative">
            {/* Casino Image */}
            <div className="flex-1 overflow-hidden rounded-3xl shadow-2xl 
              transform hover:scale-105 transition-transform duration-500
              border border-[#1e90ff]/20 aspect-[3/4]">
              <img 
               src="https://mediumrare.imgix.net/unauth-header-casino-en.png?w=640&h=961&fit=min&auto=format" 
                alt="Casino experience" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            </div>

            {/* Sports Image */}
            <div className="flex-1 overflow-hidden rounded-3xl shadow-2xl 
              transform hover:scale-105 transition-transform duration-500
              border border-[#1e90ff]/20 aspect-[3/4]">
              <img 
                  src={rouletteimg}
                alt="Sports experience" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
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
      </div>
    </div>
  );
};

export default HeroSection;