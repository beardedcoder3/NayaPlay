import React, { createContext, useContext, useState } from 'react';
import { LoadingSpinner, PageLoader } from './LoadingComponents';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ 
      setIsLoading, 
      setIsPageLoading 
    }}>
      {isLoading && <LoadingSpinner />}
      {isPageLoading && <PageLoader />}
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};