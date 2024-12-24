import React from 'react';
import AuthFlow from './AuthFlow';

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
                  Premium Gaming
                </span>
                <br />
                <span className="text-white">Experience</span>
              </h1>
              
              <p className="text-lg text-slate-300 max-w-xl">
                Join the ultimate online gaming destination where entertainment meets excellence.
              </p>
            </div>

            {/* Auth Section */}
            <AuthFlow />
          </div>

          {/* Right Section - Images */}
          <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
            {/* Top Image */}
            <div className="overflow-hidden rounded-2xl shadow-2xl 
              transform hover:scale-105 transition-transform duration-500
              border border-white/10">
              <img 
                src="/assets/hero-1.jpg" 
                alt="Gaming experience" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>

            {/* Bottom Image - Offset */}
            <div className="overflow-hidden rounded-2xl shadow-2xl 
              transform hover:scale-105 transition-transform duration-500
              border border-white/10
              mt-12 sm:mt-24">
              <img 
                src="/assets/hero-2.jpg" 
                alt="Gaming thrills" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
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