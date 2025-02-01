import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const IgnoreUserModal = ({ isOpen, onClose, username, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg">
        <div className="bg-[#0B1622] rounded-lg shadow-xl border border-[#1B2838]/50 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#1B2838]/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-medium text-white">Ignore User</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-[#1B2838] rounded-lg transition-colors"
            >
              <X size={20} className="text-[#94A3B8]" />
            </button>
          </div>

          <div className="p-6">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              
              <h3 className="text-xl font-semibold text-white">
                Ignore {username}?
              </h3>
              
              <p className="text-[#94A3B8] max-w-sm mx-auto">
                You won't see messages from this user in the chat. To unignore them later,
                visit the Ignored Users section in your settings.
              </p>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-lg font-medium
                  bg-[#1B2838] text-[#94A3B8] hover:bg-[#1B2838]/80 
                  border border-[#1B2838]/50
                  transition-all duration-200"
              >
                Cancel
              </button>
              
              <button
                onClick={onConfirm}
                className="flex-1 px-6 py-3 rounded-lg font-medium
                  bg-red-500 text-white hover:bg-red-600
                  transition-all duration-200"
              >
                Ignore
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IgnoreUserModal;