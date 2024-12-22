import React from 'react';
import { Mail, MessageCircle, Github, Apple } from 'lucide-react';

const AuthButton = ({ icon: Icon, text, subText, className }) => (
  <button 
    className={`
      w-full group flex items-center justify-between
      px-4 py-3 rounded-xl
      bg-white/5 hover:bg-white/10
      border border-white/10 hover:border-white/20
      transition-all duration-200
      ${className}
    `}
  >
    <div className="flex items-center gap-3">
      <Icon size={20} className="text-white/70" />
      <div className="text-left">
        <div className="font-medium text-white">{text}</div>
        {subText && <div className="text-sm text-white/50">{subText}</div>}
      </div>
    </div>
    <div className="text-white/30 group-hover:text-white/70 transition-colors duration-200">→</div>
  </button>
);

const HeroSection = () => {
  return (
    <div className="w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center relative">
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
            <div className="max-w-md space-y-4">
              <div className="text-sm font-medium text-white/50 mb-3">Choose how to continue</div>
              
             
              <AuthButton 
                icon={Mail}
                text="Continue with Email"
                subText="Using your email address"
              />
              
              <AuthButton 
                icon={MessageCircle}
                text="Continue with Phone"
                subText="Using your phone number"
              />

            

              <div className="text-sm text-white/40 text-center mt-6">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </div>
            </div>
          </div>

          {/* Right Section - Images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
            <div className="overflow-hidden rounded-2xl shadow-2xl 
              transform hover:scale-105 transition-transform duration-500
              border border-white/10">
              <img 
                src="https://mediumrare.imgix.net/unauth-header-casino-en.png?w=333&h=500&fit=min&auto=format"
                alt="Casino atmosphere" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="overflow-hidden rounded-2xl shadow-2xl 
              transform hover:scale-105 transition-transform duration-500
              border border-white/10
              mt-12 sm:mt-24">
              <img 
                src="https://c1.wallpaperflare.com/preview/6/487/674/various-business-gambling-money.jpg"
                alt="Sports betting" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;