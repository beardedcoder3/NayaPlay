import React from 'react';

export const LoadingSpinner = () => (
  <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="relative">
      {/* Outer glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 blur-xl animate-pulse" />
      
      {/* Main container */}
      <div className="relative bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 p-8 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center space-y-6">
          {/* Spinner group */}
          <div className="relative flex items-center justify-center">
            {/* Outer rotating ring */}
            <div className="absolute w-16 h-16 border-4 border-indigo-500/20 rounded-full animate-[spin_3s_linear_infinite]" />
            
            {/* Middle rotating ring */}
            <div className="absolute w-12 h-12 border-4 border-indigo-500/40 rounded-full animate-[spin_2s_linear_infinite_reverse]" />
            
            {/* Inner spinner */}
            <div className="w-8 h-8 border-4 border-t-indigo-600 border-r-transparent border-b-indigo-600 border-l-transparent rounded-full animate-spin" />
            
            {/* Center dot */}
            <div className="absolute w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          </div>
          
          {/* Text content */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-medium bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Loading
            </h3>
            <p className="text-sm text-gray-400">
              Setting up your experience...
            </p>
          </div>
          
          {/* Progress bar */}
          <div className="w-48 h-1 bg-gray-700/50 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 animate-progressBar" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px] w-full">
    <div className="relative">
      <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl blur-xl animate-pulse" />
      <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-6 rounded-xl">
        <div className="flex items-center space-x-4">
          {/* Spinner */}
          <div className="relative">
            <div className="w-8 h-8 border-3 border-indigo-500/20 rounded-full animate-[spin_3s_linear_infinite]" />
            <div className="absolute inset-0 w-8 h-8 border-3 border-t-indigo-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
          </div>
          
          {/* Text */}
          <div>
            <div className="text-white font-medium">Loading Content</div>
            <div className="text-sm text-gray-400">Please wait...</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default LoadingSpinner;