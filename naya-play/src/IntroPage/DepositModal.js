import React, { useState } from 'react';
import { X, Bitcoin, ExternalLink } from 'lucide-react';
import { createPayment } from '../services/paymentService';
import { useBalance } from './BalanceContext';
import { getAuth } from 'firebase/auth';

const DEPOSIT_OPTIONS = {
  BTC: {
    name: 'Bitcoin',
    symbol: 'BTC',
    icon: Bitcoin,
    network: 'BTC'
  },
  USDT: {
    name: 'Tether USD',
    symbol: 'USDT',
    icon: Bitcoin,
    network: 'TRC20'
  }
};

const DepositModal = ({ isOpen, onClose, parentModalClose }) => {
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const auth = getAuth();

  const handleStartDeposit = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      const { invoiceUrl } = await createPayment(auth.currentUser.uid, selectedCrypto);
      
      // Open payment page in new window
      window.open(invoiceUrl, '_blank');
    } catch (error) {
      console.error('Error starting deposit:', error);
      setError('Failed to generate payment address. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    onClose();
    if (parentModalClose) {
      parentModalClose();
    }
  };

  const CryptoOption = ({ symbol }) => {
    const crypto = DEPOSIT_OPTIONS[symbol];
    return (
      <button
        onClick={() => setSelectedCrypto(symbol)}
        className={`flex items-center space-x-3 p-4 rounded-lg transition-all w-full
          ${selectedCrypto === symbol 
            ? 'bg-gray-700 text-white' 
            : 'text-gray-400 hover:bg-gray-800'
          }`}
      >
        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
          <crypto.icon size={24} className="text-gray-400" />
        </div>
        <div className="text-left">
          <p className="font-medium">{crypto.name}</p>
          <p className="text-sm text-gray-400">{crypto.network} Network</p>
        </div>
      </button>
    );
  };

  return (
    <div 
      className={`fixed inset-0 z-[60] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl shadow-xl 
          border border-gray-700/50 overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-700/50 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Deposit Crypto</h2>
            <button 
              onClick={handleClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Crypto Selection */}
            <div className="space-y-2">
              {Object.keys(DEPOSIT_OPTIONS).map((symbol) => (
                <CryptoOption key={symbol} symbol={symbol} />
              ))}
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Deposit Button */}
            <button
              onClick={handleStartDeposit}
              disabled={isProcessing}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 
                text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Proceed to Payment</span>
                  <ExternalLink size={18} />
                </>
              )}
            </button>

            {/* Warning Message */}
            <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <p className="text-yellow-400 text-sm">
                Important: Please make sure you're sending {selectedCrypto} on the {DEPOSIT_OPTIONS[selectedCrypto].network} network. 
                Sending assets on incorrect networks may result in permanent loss.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-700/50">
            <button 
              onClick={handleClose}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium 
                py-2.5 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositModal;