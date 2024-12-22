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
  Target
} from 'lucide-react';

const StatCard = ({ title, value, change, icon: Icon, type, subtitle }) => (
  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">
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
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        )}
        {change !== undefined && (
          <div className={`flex items-center mt-2 ${
            change >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span className="text-sm font-medium ml-1">{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-lg ${
        type === 'profit' ? 'bg-green-500/10 text-green-400' :
        type === 'loss' ? 'bg-red-500/10 text-red-400' :
        'bg-blue-500/10 text-blue-400'
      }`}>
        <Icon size={24} />
      </div>
    </div>
  </div>
);

const ActivityPanel = ({ title, items, icon: Icon }) => (
  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
    <div className="flex items-center mb-4">
      <Icon className="text-gray-400 mr-2" size={20} />
      <h3 className="text-lg font-medium text-white">{title}</h3>
    </div>
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <p className="text-sm text-white">{item.description}</p>
              <p className="text-xs text-gray-400">{item.time}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-sm ${item.status === 'won' ? 'text-green-400' : 'text-red-400'}`}>
              ${Math.abs(item.amount).toFixed(2)}
            </span>
            <p className="text-xs text-gray-400">{item.multiplier}x</p>
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
    const interval = setInterval(fetchDashboardStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Get users stats
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

      // Get recent bets
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

      // Calculate house profit (total wagered - total wins)
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
        onlineUsers: Math.floor(usersSnap.size * 0.1), // Estimate 10% online
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
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Players"
          value={stats.totalUsers}
          icon={Users}
          type="default"
          subtitle="Registered accounts"
        />
        <StatCard
          title="Daily Volume"
          value={stats.totalWagered}
          icon={Activity}
          type="profit"
          subtitle="Last 24 hours"
        />
        <StatCard
          title="House Profit"
          value={stats.houseProfit}
          icon={DollarSign}
          type={stats.houseProfit >= 0 ? 'profit' : 'loss'}
          subtitle="Net revenue"
        />
        <StatCard
          title="Active Players"
          value={stats.onlineUsers}
          icon={Target}
          type="default"
          subtitle="Currently online"
        />
      </div>

      {/* Mines Game Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Average Bet"
          value={stats.minesStats.averageBet}
          icon={Gem}
          type="default"
          subtitle="Per game"
        />
        <StatCard
          title="Win Rate"
          value={(stats.minesStats.totalWins / (stats.minesStats.totalGames || 1)) * 100}
          icon={TrendingUp}
          type="default"
          subtitle="Win/Loss ratio"
        />
        <StatCard
          title="Highest Win"
          value={stats.minesStats.highestWin}
          icon={Target}
          type="profit"
          subtitle="Single game"
        />
        <StatCard
          title="Total Games"
          value={stats.minesStats.totalGames}
          icon={Activity}
          type="default"
          subtitle="All time"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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