import React from 'react';
import { formatNumber } from '../utils/gameUtils';

export const GameStats = ({ totalBets, totalAmount }) => (
  <div className="absolute left-4 bottom-4 flex space-x-4">
    <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg px-4 py-3 border border-gray-700/50">
      <div className="text-xs text-gray-400 mb-1">Total Bets</div>
      <div className="text-lg font-bold text-white">{totalBets}</div>
    </div>
    <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg px-4 py-3 border border-gray-700/50">
      <div className="text-xs text-gray-400 mb-1">Total Amount</div>
      <div className="text-lg font-bold text-white">${formatNumber(totalAmount)}</div>
    </div>
  </div>
);