import React, { useState, useEffect } from 'react';
import { 
  Gift, 
  AlertCircle,
  Check,
  X 
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query,
  where,
  updateDoc,
  doc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { onSnapshot } from 'firebase/firestore';

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
    // Set up real-time listener for bonus codes
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
  
    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchActiveBonuses();
  }, []);

  const fetchActiveBonuses = async () => {
    try {
      const bonusesRef = collection(db, 'bonusCodes');
      const querySnapshot = await getDocs(bonusesRef);
      const bonuses = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        // Convert Timestamp to Date for display
        const expiryDate = data.expiryDate?.toDate();
        bonuses.push({ 
          id: doc.id, 
          ...data,
          expiryDate: expiryDate ? expiryDate.toLocaleString() : 'No expiry'
        });
      });
      setActiveBonuses(bonuses);
    } catch (error) {
      console.error('Error fetching bonuses:', error);
    }
  };

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

      // Validate required fields
      if (!bonusData.code || !bonusData.totalAmount || !bonusData.perUserAmount || !bonusData.minWager || !bonusData.maxRedemptions) {
        alert('Please fill in all required fields');
        return;
      }

      // Convert string inputs to numbers
      const totalAmount = parseFloat(bonusData.totalAmount);
      const perUserAmount = parseFloat(bonusData.perUserAmount);
      const minWager = parseFloat(bonusData.minWager);
      const maxRedemptions = parseInt(bonusData.maxRedemptions);

      // Validate numbers
      if (isNaN(totalAmount) || isNaN(perUserAmount) || isNaN(minWager) || isNaN(maxRedemptions)) {
        alert('Please enter valid numbers');
        return;
      }

      // Create bonus code document
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
      
      // Add expiry date if provided
      if (bonusData.expiryDate) {
        const expiryDate = new Date(bonusData.expiryDate);
        // Check if the date is valid
        if (isNaN(expiryDate.getTime())) {
          alert('Please enter a valid expiry date');
          return;
        }
        bonusDoc.expiryDate = Timestamp.fromDate(expiryDate);
      }
      const bonusRef = await addDoc(collection(db, 'bonusCodes'), bonusDoc);

      alert('Bonus code created successfully!');
      fetchActiveBonuses();
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
      fetchActiveBonuses();
    } catch (error) {
      console.error('Error deactivating bonus:', error);
    }
  };

  // Rest of the component remains the same...
  return (
    <div className="space-y-8">
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-8">
        <h2 className="text-xl font-bold text-white mb-6">Create Bonus Code</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bonus Code
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={bonusData.code}
                onChange={(e) => setBonusData(prev => ({ ...prev, code: e.target.value }))}
                className="flex-1 bg-gray-900/70 text-white px-4 py-3 rounded-lg border border-gray-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Enter code or generate"
              />
              <button
                onClick={generateRandomCode}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
              >
                Generate
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Total Bonus Pool
            </label>
            <input
              type="number"
              value={bonusData.totalAmount}
              onChange={(e) => setBonusData(prev => ({ ...prev, totalAmount: e.target.value }))}
              className="w-full bg-gray-900/70 text-white px-4 py-3 rounded-lg border border-gray-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Total amount available"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount Per User
            </label>
            <input
              type="number"
              value={bonusData.perUserAmount}
              onChange={(e) => setBonusData(prev => ({ ...prev, perUserAmount: e.target.value }))}
              className="w-full bg-gray-900/70 text-white px-4 py-3 rounded-lg border border-gray-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Amount each user receives"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Minimum Wager Required
            </label>
            <input
              type="number"
              value={bonusData.minWager}
              onChange={(e) => setBonusData(prev => ({ ...prev, minWager: e.target.value }))}
              className="w-full bg-gray-900/70 text-white px-4 py-3 rounded-lg border border-gray-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Minimum wagered amount required"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Expiry Date
            </label>
            <input
              type="datetime-local"
              value={bonusData.expiryDate}
              onChange={(e) => setBonusData(prev => ({ ...prev, expiryDate: e.target.value }))}
              className="w-full bg-gray-900/70 text-white px-4 py-3 rounded-lg border border-gray-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Maximum Redemptions
            </label>
            <input
              type="number"
              value={bonusData.maxRedemptions}
              onChange={(e) => setBonusData(prev => ({ ...prev, maxRedemptions: e.target.value }))}
              className="w-full bg-gray-900/70 text-white px-4 py-3 rounded-lg border border-gray-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Maximum number of users"
            />
          </div>
        </div>

        <button
          onClick={createBonusCode}
          disabled={loading}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg font-medium hover:from-indigo-500 hover:to-indigo-400 transition-all duration-200 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Bonus Code'}
        </button>
      </div>

      {/* Active Bonus Codes */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-8">
        <h2 className="text-xl font-bold text-white mb-6">Active Bonus Codes</h2>
        
        <div className="space-y-4">
          {activeBonuses.map(bonus => (
            <div key={bonus.id} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <div>
                <p className="text-white font-medium">{bonus.code}</p>
                <p className="text-sm text-gray-400">
                  ${bonus.perUserAmount} per user • Min. Wager: ${bonus.minWager}
                </p>
                <p className="text-sm text-gray-400">
                  {bonus.currentRedemptions}/{bonus.maxRedemptions} claimed • Expires: {bonus.expiryDate}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  bonus.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {bonus.active ? 'Active' : 'Inactive'}
                </span>
                {bonus.active && (
                  <button
                    onClick={() => deactivateBonus(bonus.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
          {activeBonuses.length === 0 && (
            <p className="text-gray-400 text-center py-4">No active bonus codes</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBonusManager;