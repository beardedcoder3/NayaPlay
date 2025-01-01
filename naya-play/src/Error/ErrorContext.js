// src/Error/ErrorContext.jsx
import React, { createContext, useContext, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

const ErrorContext = createContext();

export function ErrorProvider({ children }) {
  const [error, setError] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  const showError = (message, title = 'Error') => {
    setError({
      isOpen: true,
      title,
      message
    });
  };

  const hideError = () => {
    setError({
      isOpen: false,
      title: '',
      message: ''
    });
  };

  return (
    <ErrorContext.Provider value={{ showError, hideError }}>
      {children}
      {error.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md p-8 shadow-2xl border border-gray-800">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-white">{error.title}</h3>
              </div>
              <button
                onClick={hideError}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-300" />
              </button>
            </div>
            
            <p className="text-gray-300 mb-8">{error.message}</p>
            
            <button
              onClick={hideError}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl 
                transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}