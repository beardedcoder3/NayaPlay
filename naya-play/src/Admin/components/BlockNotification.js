import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { auth } from '../firebase';

const formatDuration = (duration) => {
  if (duration === -1) return 'Permanent';
  const hours = duration / (60 * 60 * 1000);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}`;
  const days = hours / 24;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''}`;
  const weeks = days / 7;
  return `${weeks} week${weeks > 1 ? 's' : ''}`;
};

const BlockNotification = ({ blockData, onClose }) => {
  const handleLogout = () => {
    auth.signOut();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl max-w-md w-full p-6 border border-red-500/20">
        <div className="flex flex-col items-center text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Account Blocked</h2>
          
          <div className="space-y-4 w-full">
            <p className="text-gray-300">
              Your account has been temporarily blocked by an administrator.
            </p>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-sm text-gray-400">Block Duration</p>
              <p className="text-lg font-medium text-white">
                {formatDuration(blockData.duration)}
              </p>
              
              {blockData.endTime !== -1 && (
                <p className="text-sm text-gray-400 mt-1">
                  Ends on: {new Date(blockData.endTime).toLocaleString()}
                </p>
              )}
            </div>

            {blockData.reason && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Reason</p>
                <p className="text-white">{blockData.reason}</p>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="w-full bg-red-500/10 text-red-400 py-3 rounded-lg
                hover:bg-red-500/20 transition-colors mt-4"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockNotification;