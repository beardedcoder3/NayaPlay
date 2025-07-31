import React, { useState } from 'react';
import { X, Wallet, Building, CreditCard } from 'lucide-react';
import { useBalance } from './BalanceContext';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import easypaisa from "../easypaisa.png"
import jazzcash from "../jazzcash.png"
const USDT_NETWORKS = [
  { name: 'Tron (TRC20)', value: 'TRC20' },
  { name: 'Ethereum (ERC20)', value: 'ERC20' },
  { name: 'BNB Smart Chain (BEP20)', value: 'BEP20' }
];

const PAKISTANI_BANKS = [
  'Allied Bank',
  'Askari Bank',
  'Bank Alfalah',
  'Bank Al-Habib',
  'Faysal Bank',
  'Habib Bank Limited (HBL)',
  'MCB Bank',
  'Meezan Bank',
  'National Bank of Pakistan',
  'United Bank Limited (UBL)'
];

const MOBILE_WALLETS = [
  { name: 'EasyPaisa', value: 'easypaisa', logo: easypaisa },
  { name: 'JazzCash', value: 'jazzcash', logo: jazzcash }
];

const WithdrawalForm = ({ isOpen, onClose }) => {
  const [withdrawMethod, setWithdrawMethod] = useState('crypto');
  const [network, setNetwork] = useState('TRC20');
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [mobileWallet, setMobileWallet] = useState('easypaisa');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [bankName, setBankName] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const { balance, updateBalance } = useBalance();
  const [isProcessing, setIsProcessing] = useState(false);
  const [localWithdrawMethod, setLocalWithdrawMethod] = useState('mobile');
  const auth = getAuth();

  const resetForm = () => {
    setAmount('');
    setWalletAddress('');
    setAccountNumber('');
    setAccountTitle('');
    setBankName('');
    setWithdrawMethod('crypto');
    setLocalWithdrawMethod('mobile');
    setNetwork('TRC20');
    setMobileWallet('easypaisa');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance) {
      return;
    }

    setIsProcessing(true);
    try {
      // Create withdrawal transaction record
      const withdrawalData = {
        userId: auth.currentUser.uid,
        amount: parseFloat(amount),
        type: 'withdrawal',
        status: 'pending',
        createdAt: serverTimestamp(),
        method: withdrawMethod,
        ...(withdrawMethod === 'crypto' 
          ? {
              network,
              walletAddress,
              currency: 'USDT'
            }
          : localWithdrawMethod === 'mobile'
          ? {
              provider: mobileWallet,
              accountNumber,
              accountTitle
            }
          : {
              bankName,
              accountNumber,
              accountTitle
            })
      };

      await addDoc(collection(db, 'transactions'), withdrawalData);
      await updateBalance(-parseFloat(amount));
      
      setShowSuccess(true);
      resetForm();
      
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Withdrawal error:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  const SuccessPopup = () => (
    <div className="fixed inset-0 z-70 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 relative z-10 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-green-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Withdrawal Request Submitted</h3>
          <p className="text-gray-400 mb-6">Your withdrawal request has been successfully submitted and is being processed.</p>
        </div>
      </div>
    </div>
  );
  return (
    <>
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
        
        <div className="relative w-full max-w-lg mx-auto bg-[#0f1520] rounded-2xl shadow-2xl border border-gray-800/50">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-800/50 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Withdraw Funds</h2>
            <button 
              onClick={handleClose}
              className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Method Selection */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setWithdrawMethod('crypto')}
                className={`p-4 rounded-xl border ${
                  withdrawMethod === 'crypto' 
                    ? 'border-indigo-500 bg-indigo-500/10' 
                    : 'border-gray-700 hover:border-gray-600'
                } flex flex-col items-center gap-2 transition-all duration-200`}
              >
                <Wallet size={24} className={withdrawMethod === 'crypto' ? 'text-indigo-400' : 'text-gray-400'} />
                <span className="text-sm font-medium text-gray-200">Crypto</span>
              </button>
              <button
                type="button"
                onClick={() => setWithdrawMethod('local')}
                className={`p-4 rounded-xl border ${
                  withdrawMethod === 'local' 
                    ? 'border-indigo-500 bg-indigo-500/10' 
                    : 'border-gray-700 hover:border-gray-600'
                } flex flex-col items-center gap-2 transition-all duration-200`}
              >
                <Building size={24} className={withdrawMethod === 'local' ? 'text-indigo-400' : 'text-gray-400'} />
                <span className="text-sm font-medium text-gray-200">Local Payment</span>
              </button>
            </div>

            {/* Amount Input with Improved Styling */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Amount (USD)</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  max={balance}
                  step="0.01"
                  required
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="Enter withdrawal amount"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">USD</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Available balance: ${balance.toFixed(2)}</span>
                <button 
                  onClick={() => setAmount(balance.toString())}
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  Max
                </button>
              </div>
            </div>

            {withdrawMethod === 'local' && (
        <>
          <label className="block text-sm font-medium text-gray-400 mb-3">
            Select Payment Method
          </label>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'EasyPaisa', value: 'easypaisa', logo: easypaisa },
              { name: 'JazzCash', value: 'jazzcash', logo: jazzcash }
            ].map((wallet) => (
              <button
                key={wallet.value}
                type="button"
                onClick={() => {
                  setMobileWallet(wallet.value);
                  setLocalWithdrawMethod('mobile');
                }}
                className={`relative p-4 rounded-xl border ${
                  mobileWallet === wallet.value 
                    ? 'border-indigo-500 bg-indigo-500/10' 
                    : 'border-gray-700/50 hover:border-gray-600'
                } flex flex-col items-center gap-3 transition-all duration-200`}
              >
                <img 
                  src={wallet.logo} 
                  alt={wallet.name} 
                  className="h-8 w-auto object-contain"
                />
                <span className="text-sm font-medium text-gray-200">
                  {wallet.name}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

            {/* Dynamic Form Fields Based on Selection */}
            {withdrawMethod === 'crypto' ? (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Select Network (USDT)</label>
                    <select
                      value={network}
                      onChange={(e) => setNetwork(e.target.value)}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      {USDT_NETWORKS.map((net) => (
                        <option key={net.value} value={net.value}>{net.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Wallet Address</label>
                    <input
                      type="text"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="Enter your USDT wallet address"
                    />
                  </div>
                </div>

                <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                  <p className="text-yellow-400/90 text-sm">
                    Important: Please make sure to verify the network selection. Withdrawing USDT on 
                    incorrect networks may result in permanent loss of funds.
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder={`Enter your ${mobileWallet === 'easypaisa' ? 'EasyPaisa' : 'JazzCash'} number`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Account Title</label>
                  <input
                    type="text"
                    value={accountTitle}
                    onChange={(e) => setAccountTitle(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Enter account title"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed 
                text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                'Proceed with Withdrawal'
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-800/50">
            <button 
              onClick={handleClose}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-xl transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Success Popup */}
      {showSuccess && <SuccessPopup />}
    </>
  );
};

export default WithdrawalForm;