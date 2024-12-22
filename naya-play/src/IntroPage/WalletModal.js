import React, { useState } from 'react';
import { X, Bitcoin, Coins } from 'lucide-react';
import { useBalance } from './BalanceContext';
import DepositModal from './DepositModal';
import AgentSelectionModal from "../Agent/AgentSelectionModal";
import WithdrawModal from './WithdrawModal';

const CURRENCIES = [
  {
    name: 'Bitcoin',
    symbol: 'BTC',
    icon: Bitcoin,
    amount: 0.00000010,
    value: 0.01,
  },
  {
    name: 'Binance Coin',
    symbol: 'BNB',
    icon: Coins,
    amount: 0.00001234,
    value: 0.16,
  }
];

const WalletModal = ({ isOpen, onClose }) => {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const { balance } = useBalance();
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const handleOpenAgentModal = () => {
    onClose();
    setIsAgentModalOpen(true);
  };

  const CurrencyItem = ({ currency }) => (
    <div className="flex items-center justify-between p-3 hover:bg-gray-800/50 
      rounded-xl transition-all duration-200 border border-transparent 
      hover:border-gray-700/50 group">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-800/80 rounded-xl flex items-center justify-center
          group-hover:bg-indigo-500/10 transition-colors duration-200">
          <currency.icon 
            size={20} 
            className="text-gray-400 group-hover:text-indigo-400 transition-colors duration-200" 
          />
        </div>
        <div>
          <p className="font-medium text-gray-200 text-sm group-hover:text-white transition-colors">
            {currency.name}
          </p>
          <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
            {currency.symbol}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium text-gray-200 text-sm group-hover:text-white transition-colors">
          {currency.amount.toFixed(8)}
        </p>
        <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
          ${currency.value.toFixed(2)} USD
        </p>
      </div>
    </div>
  );

  return (
    <>
      <div className={`fixed inset-0 z-50 transition-all duration-300
        ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Enhanced Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md
          transition-all duration-300 transform">
          <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800
            backdrop-blur-xl">
            {/* Enhanced Header */}
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 
                bg-clip-text text-transparent">
                Wallet
              </h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400 hover:text-gray-300" />
              </button>
            </div>

            {/* Enhanced Balance Section */}
            <div className="px-6 py-8 border-b border-gray-800 bg-gradient-to-r 
              from-gray-900 to-gray-800/50">
              <p className="text-sm text-gray-400 font-medium">Estimated Balance</p>
              <div className="mt-2 flex items-baseline">
                <span className="text-3xl font-bold text-white">
                  ${balance.toFixed(2)}
                </span>
                <span className="text-lg text-gray-400 ml-2">USD</span>
              </div>
            </div>

            {/* Currencies List */}
            <div className="px-6 py-4 space-y-2 max-h-[240px] overflow-y-auto
              scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
              {CURRENCIES.map((currency) => (
                <CurrencyItem key={currency.symbol} currency={currency} />
              ))}
            </div>

            {/* Enhanced Action Buttons */}
            <div className="p-6 border-t border-gray-800 space-y-3">
              <div className="flex space-x-3">
                <button 
                  onClick={() => setIsDepositModalOpen(true)}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 
                    hover:from-indigo-500 hover:to-purple-500 text-white font-medium 
                    py-3 px-4 rounded-xl transition-all duration-200 transform 
                    hover:scale-[1.02] text-sm"
                >
                  Deposit
                </button>
                
<button 
  onClick={() => setIsWithdrawModalOpen(true)}
  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 
    font-medium py-3 px-4 rounded-xl transition-all duration-200 
    transform hover:scale-[1.02] text-sm border border-gray-700"
>
  Withdraw
</button>
              </div>
              <button 
                onClick={handleOpenAgentModal}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 
                  hover:from-indigo-500 hover:to-purple-500 text-white font-medium 
                  py-3 rounded-xl transition-all duration-200 transform 
                  hover:scale-[1.02] text-sm"
              >
                Purchase via Agent
              </button>
            </div>
          </div>
        </div>
      </div>

      <DepositModal 
        isOpen={isDepositModalOpen} 
        onClose={() => setIsDepositModalOpen(false)} 
      />

      <AgentSelectionModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
      />

      
      <WithdrawModal 
  isOpen={isWithdrawModalOpen}
  onClose={() => setIsWithdrawModalOpen(false)}
/>
    </>
  );
};

export default WalletModal;