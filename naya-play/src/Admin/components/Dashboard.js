import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  DollarSign, 
  Users, 
  Activity,
  Gem,
  Bomb,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  ChevronRight
} from 'lucide-react';

const StatCard = ({ title, value, change, icon: Icon, type, subtitle }) => (
  <div className="relative group">
    {/* Gradient backdrop */}
    <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300
      from-blue-500/5 via-transparent to-transparent rounded-2xl" />
    
    <div className="relative bg-[#1a1b1e] border border-white/5 rounded-2xl p-6 
      transition-all duration-300 hover:shadow-lg hover:shadow-black/20">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white tracking-tight">
            {typeof value === 'string' ? value : 
             title.toLowerCase().includes('rate') ? `${value.toFixed(2)}%` :
             title.toLowerCase().includes('average') ? `$${value.toFixed(2)}` :
             value.toLocaleString('en-US', {
               style: title.toLowerCase().includes('balance') || 
                      title.toLowerCase().includes('volume') ? 'currency' : 'decimal',
               currency: 'USD',
               minimumFractionDigits: 2,
               maximumFractionDigits: 2
             })}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          {change !== undefined && (
            <div className={`flex items-center space-x-1.5 ${
              change >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="text-sm font-medium">{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center
          bg-gradient-to-br from-white/5 to-transparent border border-white/5
          ${type === 'profit' ? 'text-green-400' :
            type === 'loss' ? 'text-red-400' :
            'text-blue-400'}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  </div>
);

const ActivityPanel = ({ title, items, icon: Icon }) => (
  <div className="bg-[#1a1b1e] rounded-2xl border border-white/5 overflow-hidden
    transition-all duration-300 hover:shadow-lg hover:shadow-black/20">
    <div className="p-4 border-b border-white/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icon className="text-blue-400" size={20} />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
    
    <div className="divide-y divide-white/5">
      {items.map((item, index) => (
        <div key={index} className="p-4 hover:bg-white/5 transition-colors">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-white text-sm font-medium">{item.description}</p>
              <p className="text-xs text-gray-500">{item.time}</p>
            </div>
            <div className="text-right">
              <span className={`text-sm font-medium ${item.status === 'won' ? 'text-green-400' : 'text-red-400'}`}>
                ${Math.abs(item.amount).toFixed(2)}
              </span>
              <p className="text-xs text-gray-500">{item.multiplier}x</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWagered: 0,
    totalBets: 0,
    minesStats: {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      averageBet: 0,
      highestWin: 0
    },
    onlineUsers: 0,
    recentBets: [],
    houseProfit: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const usersRef = collection(db, 'users');
      const usersSnap = await getDocs(usersRef);
      
      let totalWagered = 0;
      let totalBets = 0;
      let totalWins = 0;
      let totalBalance = 0;

      usersSnap.forEach(doc => {
        const userData = doc.data();
        if (userData.stats) {
          totalWagered += parseFloat(userData.stats.wagered || 0);
          totalBets += parseInt(userData.stats.totalBets || 0);
          totalWins += parseInt(userData.stats.wins || 0);
        }
        totalBalance += parseFloat(userData.balance || 0);
      });

      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const betsQuery = query(
        collection(db, 'liveBets'),
        where('timestamp', '>=', Timestamp.fromDate(twentyFourHoursAgo)),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      
      const betsSnap = await getDocs(betsQuery);
      const recentBets = betsSnap.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));

      const houseProfit = totalWagered - totalBalance;

      setStats({
        totalUsers: usersSnap.size,
        totalWagered,
        totalBets,
        minesStats: {
          totalGames: totalBets,
          totalWins,
          totalLosses: totalBets - totalWins,
          averageBet: totalWagered / (totalBets || 1),
          highestWin: recentBets.reduce((max, bet) => 
            bet.status === 'won' && bet.payout > max ? bet.payout : max, 0)
        },
        onlineUsers: Math.floor(usersSnap.size * 0.1),
        recentBets,
        houseProfit
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-blue-500 animate-spin" />
          <div className="mt-4 text-sm text-gray-400">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Players"
          value={stats.totalUsers}
          icon={Users}
          type="default"
          subtitle="Registered accounts"
          change={8}
        />
        <StatCard
          title="Daily Volume"
          value={stats.totalWagered}
          icon={Activity}
          type="profit"
          subtitle="Last 24 hours"
          change={15}
        />
        <StatCard
          title="House Profit"
          value={stats.houseProfit}
          icon={DollarSign}
          type={stats.houseProfit >= 0 ? 'profit' : 'loss'}
          subtitle="Net revenue"
          change={stats.houseProfit >= 0 ? 12 : -12}
        />
        <StatCard
          title="Active Players"
          value={stats.onlineUsers}
          icon={Target}
          type="default"
          subtitle="Currently online"
          change={5}
        />
      </div>

      {/* Game Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Average Bet"
          value={stats.minesStats.averageBet}
          icon={Gem}
          type="default"
          subtitle="Per game"
          change={3}
        />
        <StatCard
          title="Win Rate"
          value={(stats.minesStats.totalWins / (stats.minesStats.totalGames || 1)) * 100}
          icon={TrendingUp}
          type="default"
          subtitle="Win/Loss ratio"
          change={-2}
        />
        <StatCard
          title="Highest Win"
          value={stats.minesStats.highestWin}
          icon={Target}
          type="profit"
          subtitle="Single game"
          change={20}
        />
        <StatCard
          title="Total Games"
          value={stats.minesStats.totalGames}
          icon={Activity}
          type="default"
          subtitle="All time"
          change={10}
        />
      </div>

      {/* Activity Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActivityPanel
          title="Recent Bets"
          items={stats.recentBets.map(bet => ({
            description: `${bet.user} played Mines`,
            time: new Date(bet.timestamp?.toDate()).toLocaleString(),
            amount: bet.payout,
            status: bet.status,
            multiplier: bet.multiplier || 1
          }))}
          icon={Clock}
        />
        <ActivityPanel
          title="Top Wins Today"
          items={stats.recentBets
            .filter(bet => bet.status === 'won')
            .sort((a, b) => b.payout - a.payout)
            .slice(0, 5)
            .map(bet => ({
              description: `${bet.user} won on Mines`,
              time: new Date(bet.timestamp?.toDate()).toLocaleString(),
              amount: bet.payout,
              status: 'won',
              multiplier: bet.multiplier || 1
            }))}
          icon={Target}
        />
      </div>
    </div>
  );
};

export default DashboardOverview;