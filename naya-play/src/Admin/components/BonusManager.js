import React, { useState, useEffect } from 'react';
import { 
  Gift, 
  AlertCircle,
  Check,
  X,
  Sparkles,
  Clock,
  Users,
  DollarSign,
  Repeat,
  Calendar,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query,
  where,
  updateDoc,
  doc,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../firebase';

const InputField = ({ label, type, value, onChange, placeholder, icon: Icon, className = "" }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-400 mb-2">
      {label}
    </label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <Icon size={18} />
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full bg-[#1a1b1e] text-white pl-10 pr-4 py-3 rounded-xl border border-white/5
          focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
        placeholder={placeholder}
      />
    </div>
  </div>
);

const AdminBonusManager = () => {
  const [bonusData, setBonusData] = useState({
    code: '',
    totalAmount: '',
    perUserAmount: '',
    minWager: '',
    expiryDate: '',
    maxRedemptions: ''
  });
  const [activeBonuses, setActiveBonuses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const bonusesRef = collection(db, 'bonusCodes');
    const unsubscribe = onSnapshot(bonusesRef, (snapshot) => {
      const bonuses = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        const expiryDate = data.expiryDate?.toDate();
        bonuses.push({ 
          id: doc.id, 
          ...data,
          expiryDate: expiryDate ? expiryDate.toLocaleString() : 'No expiry'
        });
      });
      setActiveBonuses(bonuses);
    });
  
    return () => unsubscribe();
  }, []);

  const generateRandomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setBonusData(prev => ({ ...prev, code: result }));
  };

  const createBonusCode = async () => {
    try {
      setLoading(true);

      if (!bonusData.code || !bonusData.totalAmount || !bonusData.perUserAmount || 
          !bonusData.minWager || !bonusData.maxRedemptions) {
        alert('Please fill in all required fields');
        return;
      }

      const totalAmount = parseFloat(bonusData.totalAmount);
      const perUserAmount = parseFloat(bonusData.perUserAmount);
      const minWager = parseFloat(bonusData.minWager);
      const maxRedemptions = parseInt(bonusData.maxRedemptions);

      if (isNaN(totalAmount) || isNaN(perUserAmount) || isNaN(minWager) || isNaN(maxRedemptions)) {
        alert('Please enter valid numbers');
        return;
      }

      const bonusDoc = {
        code: bonusData.code,
        totalAmount,
        perUserAmount,
        minWager,
        maxRedemptions,
        currentRedemptions: 0,
        createdAt: Timestamp.now(),
        active: true
      };
      
      if (bonusData.expiryDate) {
        const expiryDate = new Date(bonusData.expiryDate);
        if (isNaN(expiryDate.getTime())) {
          alert('Please enter a valid expiry date');
          return;
        }
        bonusDoc.expiryDate = Timestamp.fromDate(expiryDate);
      }
      
      await addDoc(collection(db, 'bonusCodes'), bonusDoc);

      alert('Bonus code created successfully!');
      setBonusData({
        code: '',
        totalAmount: '',
        perUserAmount: '',
        minWager: '',
        expiryDate: '',
        maxRedemptions: ''
      });
    } catch (error) {
      console.error('Error creating bonus code:', error);
      alert('Error creating bonus code');
    } finally {
      setLoading(false);
    }
  };

  const deactivateBonus = async (bonusId) => {
    try {
      await updateDoc(doc(db, 'bonusCodes', bonusId), {
        active: false
      });
    } catch (error) {
      console.error('Error deactivating bonus:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Bonus Section */}
      <div className="bg-[#1a1b1e] rounded-2xl border border-white/5 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 rounded-xl bg-blue-500/10">
            <Gift className="text-blue-400" size={24} />
          </div>
          <h2 className="text-xl font-bold text-white">Create Bonus Code</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="relative">
              <InputField
                label="Bonus Code"
                type="text"
                value={bonusData.code}
                onChange={(e) => setBonusData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="Enter code or generate"
                icon={Gift}
              />
              <button
                onClick={generateRandomCode}
                className="absolute right-3 top-9 px-4 py-2 bg-blue-500/10 text-blue-400
                  rounded-lg hover:bg-blue-500/20 transition-all duration-300"
              >
                Generate
              </button>
            </div>

            <InputField
              label="Total Bonus Pool"
              type="number"
              value={bonusData.totalAmount}
              onChange={(e) => setBonusData(prev => ({ ...prev, totalAmount: e.target.value }))}
              placeholder="Total amount available"
              icon={DollarSign}
            />

            <InputField
              label="Amount Per User"
              type="number"
              value={bonusData.perUserAmount}
              onChange={(e) => setBonusData(prev => ({ ...prev, perUserAmount: e.target.value }))}
              placeholder="Amount each user receives"
              icon={Users}
            />
          </div>

          <div className="space-y-6">
            <InputField
              label="Minimum Wager Required"
              type="number"
              value={bonusData.minWager}
              onChange={(e) => setBonusData(prev => ({ ...prev, minWager: e.target.value }))}
              placeholder="Minimum wagered amount required"
              icon={Repeat}
            />

            <InputField
              label="Expiry Date"
              type="datetime-local"
              value={bonusData.expiryDate}
              onChange={(e) => setBonusData(prev => ({ ...prev, expiryDate: e.target.value }))}
              placeholder=""
              icon={Calendar}
            />

            <InputField
              label="Maximum Redemptions"
              type="number"
              value={bonusData.maxRedemptions}
              onChange={(e) => setBonusData(prev => ({ ...prev, maxRedemptions: e.target.value }))}
              placeholder="Maximum number of users"
              icon={Users}
            />
          </div>
        </div>

        <button
          onClick={createBonusCode}
          disabled={loading}
          className="mt-6 w-full md:w-auto px-6 py-3 bg-blue-500 hover:bg-blue-600 
            text-white rounded-xl font-medium transition-all duration-300 
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center space-x-2"
        >
          <Sparkles size={18} />
          <span>{loading ? 'Creating...' : 'Create Bonus Code'}</span>
        </button>
      </div>

      {/* Active Bonus Codes */}
      <div className="bg-[#1a1b1e] rounded-2xl border border-white/5 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-green-500/10">
              <Gift className="text-green-400" size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Active Bonus Codes</h2>
          </div>
        </div>
        
        <div className="space-y-4">
          {activeBonuses.map(bonus => (
            <div key={bonus.id} className="group bg-[#101114] rounded-xl border border-white/5 p-4
              hover:border-white/10 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <p className="text-white font-medium">{bonus.code}</p>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center space-x-1
                      ${bonus.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      <span className={`w-1 h-1 rounded-full ${bonus.active ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span>{bonus.active ? 'Active' : 'Inactive'}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1 text-sm text-gray-400">
                      <DollarSign size={14} />
                      <span>${bonus.perUserAmount} per user</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-400">
                      <Repeat size={14} />
                      <span>Min. Wager: ${bonus.minWager}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1 text-sm text-gray-400">
                      <Users size={14} />
                      <span>{bonus.currentRedemptions}/{bonus.maxRedemptions} claimed</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-400">
                      <Clock size={14} />
                      <span>Expires: {bonus.expiryDate}</span>
                    </div>
                  </div>
                </div>
                {bonus.active && (
                  <button
                    onClick={() => deactivateBonus(bonus.id)}
                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 
                      rounded-xl transition-all duration-300 text-red-400"
                  >
                    <ShieldAlert size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {activeBonuses.length === 0 && (
            <div className="text-center py-12">
              <Gift size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">No active bonus codes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBonusManager;