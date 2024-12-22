import React, { useEffect } from 'react';
import { useLiveBets } from './LiveBetsContext';
import { TrendingUp, Zap, Users, Clock, DollarSign, Target } from 'lucide-react';

const BetTable = ({ title, bets, icon: Icon, isHighRoller }) => {
  // Add console log to verify data updates
  useEffect(() => {
    console.log(`${title} Bets updated:`, bets);
  }, [bets, title]);

  return (
    <div className="relative bg-[#1a2730] p-6 rounded-2xl border border-white/10">
      {/* Title with real-time indicator */}
      <div className="flex items-center space-x-4 mb-8">
        <div className={`p-4 rounded-xl ${
          isHighRoller 
            ? 'bg-gradient-to-br from-amber-400 to-amber-600' 
            : 'bg-gradient-to-br from-[#0072ce] to-[#2998ff]'
        } flex items-center justify-center shadow-lg`}>
          <Icon size={24} className="text-white" strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">{title}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">
              {isHighRoller ? 'Big stakes, bigger rewards' : 'Regular players activity'}
            </span>
            {/* Add a live indicator */}
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-green-500">LIVE</span>
            </span>
          </div>
        </div>
      </div>

      {/* Table with more interactive elements */}
      <div className="overflow-hidden rounded-xl bg-[#0f1923] border border-white/10">
        <table className="w-full">
          <thead>
            <tr className="bg-white/5">
              {[
                { icon: Target, label: 'Game' },
                { icon: Users, label: 'User' },
                { icon: Clock, label: 'Time' },
                { icon: DollarSign, label: 'Bet Amount' },
                { icon: TrendingUp, label: 'Multiplier' },
                { icon: Zap, label: 'Payout' }
              ].map(({ icon: HeaderIcon, label }) => (
                <th key={label} className="px-6 py-4 text-left">
                  <div className="flex items-center space-x-2 group">
                    <HeaderIcon size={16} 
                      className={`text-gray-400 group-hover:${
                        isHighRoller ? 'text-amber-400' : 'text-[#0072ce]'
                      } transition-colors`} 
                    />
                    <span className="text-gray-400 font-medium group-hover:text-white transition-colors">
                      {label}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bets.map((bet, index) => (
              <tr key={`${bet.game}-${bet.time}-${index}`} 
                className="transition-all duration-200 hover:bg-white/5 border-t border-white/5">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      isHighRoller ? 'bg-amber-400' : 'bg-[#0072ce]'
                    }`} />
                    <span className="font-medium text-white">{bet.game}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-300">{bet.user}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-400">{bet.time}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-white bg-white/5 px-2 py-1 rounded">
                    {bet.betAmount}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`font-medium ${
                    isHighRoller ? 'text-amber-400' : 'text-[#0072ce]'
                  }`}>
                    {bet.multiplier}x
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`font-medium px-3 py-1 rounded-full ${
                    parseFloat(bet.payout) >= 0 
                      ? 'bg-green-500/10 text-green-400' 
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    {bet.payout}
                  </span>
                </td>
              </tr>
            ))}
            {(!bets || bets.length === 0) && (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center bg-[#0f1923]">
                  <p className="text-gray-400">Waiting for bets...</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const LiveBetsSection = () => {
  const { bets } = useLiveBets();

  useEffect(() => {
    console.log('All bets updated:', bets);
  }, [bets]);

  const casualBets = bets
    .filter(bet => parseFloat(bet.betAmount.replace('$', '')) < 1000)
    .slice(0, 5);
  
  const highRollerBets = bets
    .filter(bet => parseFloat(bet.betAmount.replace('$', '')) >= 1000)
    .slice(0, 5);

  return (
    <section className="bg-[#0f1923] py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-block p-2 bg-white/5 rounded-full mb-4">
            <Zap size={24} className="text-[#0072ce]" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Live Betting Action
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Watch real-time bets and wins happening across the platform
          </p>
        </div>

        <div className="space-y-8">
          <BetTable 
            title="High Rollers" 
            bets={highRollerBets} 
            icon={Zap}
            isHighRoller={true}
          />
          
          <BetTable 
            title="Casual Bets" 
            bets={casualBets} 
            icon={Users}
            isHighRoller={false}
          />
        </div>
      </div>
    </section>
  );
};

export default LiveBetsSection;