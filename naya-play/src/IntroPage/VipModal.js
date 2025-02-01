import React, { useState, useEffect } from 'react';
import { Star, Trophy, Crown, Shield, Diamond, X, Timer, ExternalLink } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, onSnapshot, updateDoc, increment, getDoc, serverTimestamp } from 'firebase/firestore';

const vipBenefits = {
  bronze: {
    icon: Shield,
    color: "text-amber-500",
    benefits: [
      "Bonus from Support in currency of your choice",
      "Rakeback enabled",
      "Weekly bonuses",
      "Monthly bonuses",
      "VIP Telegram channel access"
    ]
  },
  silver: {
    icon: Star,
    color: "text-gray-300",
    benefits: [
      "Bonus from Support in currency of your choice",
      "Weekly & monthly bonuses increased"
    ]
  },
  gold: {
    icon: Trophy,
    color: "text-yellow-400",
    benefits: [
      "Bonus from Support in currency of your choice",
      "Weekly & monthly bonuses increased"
    ]
  },
  platinum1: {
    icon: Crown,
    color: "text-cyan-400",
    name: "Platinum I - III",
    benefits: [
      "Bonus from Support in currency of your choice",
      "Weekly & monthly bonuses increased",
      "14 - 42 Day, Daily bonus (Reload)"
    ]
  },
  platinum2: {
    icon: Crown,
    color: "text-cyan-400",
    name: "Platinum IV - VI",
    benefits: [
      "Dedicated VIP host",
      "Bonus from VIP host in currency of your choice",
      "Weekly & monthly bonuses increased",
      "Monthly bonuses"
    ]
  },
  diamond: {
    icon: Diamond,
    color: "text-blue-400",
    benefits: [
      "Bonus from VIP host in currency of your choice",
      "Exclusively customized benefits",
      "Weekly & monthly bonuses increased",
      "Monthly bonuses"
    ]
  }
};

const VipModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('progress');
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [lastClaim, setLastClaim] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [userData, setUserData] = useState({
    username: '',
    currentLevel: 'bronze',
    progress: 0,
    nextLevel: 'silver',
    rakeback: { usdt: 0 }
  });

  const [countdown, setCountdown] = useState({
    days: 1,
    hours: 16,
    minutes: 19,
    seconds: 12
  });

  // Message auto-clear effect
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Modal overflow effect
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Boost countdown effect
  useEffect(() => {
    if (activeTab !== 'boost') return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        let { days, hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours--;
            } else {
              hours = 23;
              if (days > 0) {
                days--;
              }
            }
          }
        }
        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTab]);

  // User data effect
  useEffect(() => {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setLastClaim(data.lastRakebackClaim?.toDate());
        
        const totalWagered = data.totalWagered || 0;
        let currentLevel = 'bronze';
        let progress = 0;
        let nextLevel = 'silver';

        if (totalWagered >= 50000) {
          currentLevel = 'diamond';
          progress = 100;
          nextLevel = 'diamond';
        } else if (totalWagered >= 25000) {
          currentLevel = 'platinum2';
          progress = ((totalWagered - 25000) / (50000 - 25000)) * 100;
          nextLevel = 'diamond';
        } else if (totalWagered >= 10000) {
          currentLevel = 'platinum1';
          progress = ((totalWagered - 10000) / (25000 - 10000)) * 100;
          nextLevel = 'platinum2';
        } else if (totalWagered >= 5000) {
          currentLevel = 'gold';
          progress = ((totalWagered - 5000) / (10000 - 5000)) * 100;
          nextLevel = 'platinum1';
        } else if (totalWagered >= 1000) {
          currentLevel = 'silver';
          progress = ((totalWagered - 1000) / (5000 - 1000)) * 100;
          nextLevel = 'gold';
        } else {
          progress = (totalWagered / 1000) * 100;
        }

        setUserData({
          username: data.displayUsername || 'Player',
          currentLevel,
          nextLevel,
          progress: Math.min(Math.round(progress), 100),
          rakeback: {
            usdt: data.rakeback?.usdt || 0
          }
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Rakeback timer effect
  useEffect(() => {
    if (!lastClaim) return;
    
    const timer = setInterval(() => {
      const now = new Date();
      const timeSinceClaim = now - lastClaim;
      const hourInMs = 3600000;
      
      if (timeSinceClaim < hourInMs) {
        const timeLeftMs = hourInMs - timeSinceClaim;
        const minutes = Math.floor(timeLeftMs / 60000);
        const seconds = Math.floor((timeLeftMs % 60000) / 1000);
        setTimeLeft({ minutes, seconds });
      } else {
        setTimeLeft(null);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [lastClaim]);

  const handleClaimRakeback = async () => {
    if (!auth.currentUser) return;
    
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      if (userData.lastRakebackClaim) {
        const lastClaim = userData.lastRakebackClaim.toDate();
        const now = new Date();
        const timeSinceClaim = now - lastClaim;
        
        if (timeSinceClaim < 3600000) {
          const timeLeft = Math.ceil((3600000 - timeSinceClaim) / 60000);
          setMessage({ 
            text: `Please wait ${timeLeft} minutes before claiming again`, 
            type: 'error' 
          });
          return;
        }
      }
      
      const totalRakeback = userData.rakeback.usdt;
      
      if (totalRakeback === 0) {
        setMessage({ 
          text: 'No rakeback available to claim', 
          type: 'error' 
        });
        return;
      }
      
      await updateDoc(userRef, {
        'rakeback.usdt': 0,
        balance: increment(totalRakeback),
        lastRakebackClaim: serverTimestamp()
      });
      
      setMessage({ 
        text: `Successfully claimed ${totalRakeback.toFixed(2)} USDT rakeback!`, 
        type: 'success' 
      });
      
    } catch (error) {
      console.error('Error claiming rakeback:', error);
      setMessage({ 
        text: 'Failed to claim rakeback', 
        type: 'error' 
      });
    }
  };

  const TabButton = ({ name, isActive }) => (
    <button
      onClick={() => setActiveTab(name.toLowerCase())}
      className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200
        ${isActive ? 'bg-[#1A2632] text-white' : 'text-gray-400 hover:text-white'}`}
    >
      {name}
    </button>
  );

  const renderProgress = () => (
    <div className="space-y-6">
      <div className="p-4 bg-[#1B2630] rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white text-lg">{userData.username}</span>
          <Star className="w-4 h-4 text-gray-400" />
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Your VIP Progress</span>
            <span className="text-white">{userData.progress}%</span>
          </div>
          
          <div className="h-1 bg-[#0A1218] rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500"
              style={{ width: `${userData.progress}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2">
              {React.createElement(vipBenefits[userData.currentLevel].icon, {
                className: `w-4 h-4 ${vipBenefits[userData.currentLevel].color}`
              })}
              <span className="text-gray-400">
                {vipBenefits[userData.currentLevel].name || userData.currentLevel.charAt(0).toUpperCase() + userData.currentLevel.slice(1)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {React.createElement(vipBenefits[userData.nextLevel].icon, {
                className: `w-4 h-4 ${vipBenefits[userData.nextLevel].color}`
              })}
              <span className="text-gray-400">
                {vipBenefits[userData.nextLevel].name || userData.nextLevel.charAt(0).toUpperCase() + userData.nextLevel.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-white">Want to achieve the next level?</h3>
        
        <div className="space-y-2">
          {[
            {
              title: "Wager on Casino",
              description: "Play & wager on any casino games",
              icon: Trophy,
              iconColor: "text-blue-400"
            },
            {
              title: "Place High Roller Bets",
              description: "Make bigger bets to progress faster",
              icon: Diamond,
              iconColor: "text-amber-400"
            },
            {
              title: "Weekly Wager Requirements",
              description: "Meet weekly targets for faster progression",
              icon: Timer,
              iconColor: "text-green-400"
            }
          ].map((item, i) => (
            <div key={i} className="p-4 bg-[#1B2630] rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-[#0F1923]">
                  <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <div>
                  <h4 className="text-white text-sm font-medium">{item.title}</h4>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBenefits = () => (
    <div className="space-y-1">
      {Object.entries(vipBenefits).map(([level, data]) => (
        <div key={level} className="bg-[#1A2632] rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedLevel(expandedLevel === level ? null : level)}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              {React.createElement(data.icon, {
                className: `w-5 h-5 ${data.color}`
              })}
              <span className="text-white font-medium">
                {data.name || level.charAt(0).toUpperCase() + level.slice(1)}
              </span>
            </div>
          </button>
          
          {expandedLevel === level && (
            <div className="px-4 pb-4 space-y-2">
              {data.benefits.map((benefit, index) => (
                <p key={index} className="text-sm text-gray-400 pl-8">{benefit}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderBoost = () => (
    <div className="text-center space-y-6">
      <h3 className="text-white text-lg">Countdown until next Weekly Boost</h3>
      <div className="flex justify-center gap-4">
        {[
          { value: countdown.days, label: 'Day' },
          { value: countdown.hours, label: 'Hour' },
          { value: countdown.minutes, label: 'Min' },
          { value: countdown.seconds, label: 'Sec' }
        ].map((time, i) => (
          <div key={i} className="bg-[#1A2632] w-24 p-4 rounded-xl">
            <div className="text-2xl font-bold text-white">
              {String(time.value).padStart(2, '0')}
            </div>
            <div className="text-sm text-gray-400">{time.label}</div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <p className="text-gray-300">
          Claim your Weekly Boost in the{' '}
          <button className="text-blue-400 hover:underline inline-flex items-center gap-1">
            NayaPlay WhatsApp Channel (Coming soon)
            <ExternalLink className="w-4 h-4" />
          </button>
        </p>
        <p className="text-gray-400 text-sm">
          Your Boost is dependant on your game play throughout the week. The more you play, the bigger the boost.
        </p>
      </div>
    </div>
  );

  const renderRakeback = () => (
    <div className="space-y-6 text-center">
      <h3 className="text-white text-lg">Available Rakeback</h3>
      
      {message.text && (
        <div className={`py-2 px-4 rounded ${
          message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="flex justify-center gap-12">
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-white">
            {userData?.rakeback.usdt.toFixed(8)}
            <span className="text-sm">USDT</span>
          </div>
        </div>
      </div>
      
      <button 
        onClick={handleClaimRakeback}
        disabled={timeLeft || userData?.rakeback.usdt === 0}
        className={`w-full py-3 rounded-xl transition-colors font-medium
          ${timeLeft || userData?.rakeback.usdt === 0
            ? 'bg-gray-500 cursor-not-allowed'
            : 'bg-green-500 hover:bg-green-600'} text-white`}
      >
        {timeLeft 
          ? `Try again in ${timeLeft.minutes}m ${timeLeft.seconds}s`
          : userData?.rakeback.usdt === 0
          ? 'No rakeback available'
          : 'Claim Rakeback'}
      </button>
      
      <p className="text-gray-400 text-sm">
        Rakeback is 1.5% of your bet amount and accumulates each time you place a bet.
        You can claim once every hour.
      </p>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center"
         style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
      <div className="fixed inset-0 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative w-[480px] bg-[#0F1923] rounded-xl overflow-hidden mt-[10vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-white/90" />
            <span className="text-base font-medium text-white">VIP</span>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex gap-1 px-4 py-2">
          {['Progress', 'Benefits', 'Boost', 'Rakeback'].map(tab => (
            <TabButton 
              key={tab} 
              name={tab} 
              isActive={activeTab === tab.toLowerCase()} 
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          {activeTab === 'progress' && renderProgress()}
          {activeTab === 'benefits' && renderBenefits()}
          {activeTab === 'boost' && renderBoost()}
          {activeTab === 'rakeback' && renderRakeback()}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 text-center">
          <button className="text-gray-400 hover:text-white text-sm">
            Learn more about being a NayaPlay VIP
          </button>
        </div>
      </div>
    </div>
  );
};

export default VipModal;