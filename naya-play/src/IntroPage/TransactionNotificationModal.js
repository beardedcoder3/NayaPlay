import React from 'react';
import { CheckCircle, X } from 'lucide-react';

const TransactionNotificationModal = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  // Safely format the amount
  const formattedAmount = transaction?.amount ? 
    Number(transaction.amount).toFixed(2) : 
    '0.00';

  // Safely format the transaction ID
  const formattedId = transaction?.id ? 
    transaction.id.slice(0, 8) : 
    'N/A';

  // Safely format the timestamp
  const formattedDate = transaction?.timestamp ? 
    (transaction.timestamp instanceof Date ? 
      transaction.timestamp :
      // Handle Firestore timestamp
      transaction.timestamp.toDate?.()
    )?.toLocaleString() : 
    'N/A';

  // Safely get the agent username
  const agentUsername = transaction?.agentUsername || 'Anonymous';

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}  // Allow clicking backdrop to close
      />

      {/* Modal */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm">
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl shadow-xl 
          border border-gray-700/50 overflow-hidden">
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white 
              transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Success Icon */}
          <div className="flex justify-center pt-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center 
              justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            <h3 className="text-xl font-bold text-white mb-2">
              Payment Received!
            </h3>
            
            {/* Amount Display */}
            <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
              <p className="text-3xl font-bold text-green-400 mb-1">
                ${formattedAmount}
              </p>
              <p className="text-sm text-gray-400">
                has been added to your balance
              </p>
            </div>

            {/* Transaction Details */}
            <div className="space-y-2 mb-6">
              <p className="text-sm text-gray-400">
                Transaction ID: <span className="text-white">{formattedId}</span>
              </p>
              <p className="text-sm text-gray-400">
                From Agent: <span className="text-white">{agentUsername}</span>
              </p>
              <p className="text-sm text-gray-400">
                Date: <span className="text-white">{formattedDate}</span>
              </p>
            </div>

            {/* Confirm Button */}
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 
                hover:from-indigo-700 hover:to-purple-700 text-white font-medium
                py-2.5 rounded-lg transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionNotificationModal;