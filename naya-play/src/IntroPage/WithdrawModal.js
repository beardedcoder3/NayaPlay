import React, { useState } from 'react';
import { X, Wallet, Building, CreditCard } from 'lucide-react';
import { useBalance } from './BalanceContext';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
  { name: '', value: '' },
  { name: '', value: '' }
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
        className={`fixed inset-0 z-50 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
        
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
          <div className="bg-[#0f1520] rounded-2xl shadow-2xl border border-gray-800/50 overflow-hidden">
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
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Method Selection */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setWithdrawMethod('crypto')}
                  className={`p-4 rounded-xl border ${
                    withdrawMethod === 'crypto' 
                      ? 'border-indigo-500/50 bg-indigo-500/10' 
                      : 'border-gray-700/50 hover:border-gray-600/50'
                  } flex flex-col items-center gap-2 transition-all`}
                >
                  <Wallet size={24} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-200">Crypto</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawMethod('local')}
                  className={`p-4 rounded-xl border ${
                    withdrawMethod === 'local' 
                      ? 'border-indigo-500/50 bg-indigo-500/10' 
                      : 'border-gray-700/50 hover:border-gray-600/50'
                  } flex flex-col items-center gap-2 transition-all`}
                >
                  <Building size={24} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-200">Local Payment</span>
                </button>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Amount (USD)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  max={balance}
                  step="0.01"
                  required
                  className="w-full bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500"
                  placeholder="Enter amount"
                />
                <p className="text-sm text-gray-500">Available balance: ${balance.toFixed(2)}</p>
              </div>

              {withdrawMethod === 'crypto' ? (
                <>
                  {/* Network Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Select Network (USDT)</label>
                    <select
                      value={network}
                      onChange={(e) => setNetwork(e.target.value)}
                      className="w-full bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white"
                    >
                      {USDT_NETWORKS.map((net) => (
                        <option key={net.value} value={net.value} className="bg-gray-900">{net.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Wallet Address */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Wallet Address</label>
                    <input
                      type="text"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      required
                      className="w-full bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500"
                      placeholder="Enter your wallet address"
                    />
                  </div>
                </>
              ) : (

                <>
                  {/* Local Payment Method Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setLocalWithdrawMethod('mobile')}
                      className={`p-4 rounded-xl border ${
                        localWithdrawMethod === 'mobile' 
                          ? 'border-indigo-500/50 bg-indigo-500/10' 
                          : 'border-gray-700/50 hover:border-gray-600/50'
                      } flex flex-col items-center gap-2 transition-all`}
                    >
                      <CreditCard size={24} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-200">Mobile Wallet</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocalWithdrawMethod('bank')}
                      className={`p-4 rounded-xl border ${
                        localWithdrawMethod === 'bank' 
                          ? 'border-indigo-500/50 bg-indigo-500/10' 
                          : 'border-gray-700/50 hover:border-gray-600/50'
                      } flex flex-col items-center gap-2 transition-all`}
                    >
                      <Building size={24} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-200">Bank Transfer</span>
                    </button>
                  </div>

                  {localWithdrawMethod === 'mobile' ? (
                    <>
                      {/* Mobile Wallet Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Select Mobile Wallet</label>
                        <select
                          value={mobileWallet}
                          onChange={(e) => setMobileWallet(e.target.value)}
                          required
                          className="w-full bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white"
                        >
                          {MOBILE_WALLETS.map((wallet) => (
                            <option key={wallet.value} value={wallet.value} className="bg-gray-900">
                              {wallet.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Account Details for Mobile Wallet */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-400">Account Number</label>
                          <input
                            type="text"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            required
                            className="w-full bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500"
                            placeholder="Enter account number"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-400">Account Title</label>
                          <input
                            type="text"
                            value={accountTitle}
                            onChange={(e) => setAccountTitle(e.target.value)}
                            required
                            className="w-full bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500"
                            placeholder="Enter account title"
                          />
                        </div>
                      </div>
                    </>
                  ) : (

                    <>
                      {/* Bank Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Select Bank</label>
                        <select
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          required
                          className="w-full bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white"
                        >
                          <option value="" className="bg-gray-900">Select bank</option>
                          {PAKISTANI_BANKS.map((bank) => (
                            <option key={bank} value={bank} className="bg-gray-900">{bank}</option>
                          ))}
                        </select>
                      </div>

                      {/* Bank Account Details */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-400">Account Number</label>
                          <input
                            type="text"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            required
                            className="w-full bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500"
                            placeholder="Enter account number"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-400">Account Title</label>
                          <input
                            type="text"
                            value={accountTitle}
                            onChange={(e) => setAccountTitle(e.target.value)}
                            required
                            className="w-full bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500"
                            placeholder="Enter account title"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700/50 
                  disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl 
                  transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Proceed with Withdrawal</span>
                )}
              </button>

              {/* Warning Message */}
              {withdrawMethod === 'crypto' && (
                <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                  <p className="text-yellow-400/90 text-sm">
                    Important: Please make sure to verify the network selection. Withdrawing USDT on 
                    incorrect networks may result in permanent loss of funds.
                  </p>
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-800/50">
              <button 
                onClick={handleClose}
                className="w-full bg-gray-800 hover:bg-gray-700/70 text-white font-medium 
                  py-3 rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Popup */}
      {showSuccess && <SuccessPopup />}
    </>
  );
};

export default WithdrawalForm;