import React, { useState, useEffect } from 'react';
import { X, Users } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
// Import your local images
import easypaisa from '../easypaisa.png'
import jazzcash from '../jazzcash.png';
import bankTransfer from '../banktransfer.png';


const PAYMENT_METHODS = [
    {
      name: 'Easypaisa',
      image: easypaisa
    },
    {
      name: 'JazzCash',
      image: jazzcash
    },
    {
      name: 'Bank Transfer',
      image: bankTransfer
    }
  ];
  
  const AgentSelectionModal = ({ isOpen, onClose }) => {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const agentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'agent'),
        where('verified', '==', true)
      );
  
      const unsubscribe = onSnapshot(agentsQuery, (snapshot) => {
        const agentList = [];
        snapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          agentList.push(data);
        });
        setAgents(agentList);
        setLoading(false);
      });
  
      return () => unsubscribe();
    }, []);
  
    return (
      <div className={`fixed inset-0 z-50 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
  
        {/* Modal */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
          <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl shadow-xl 
            border border-gray-700/50 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-700/50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Purchase via Agent</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
  
            {/* Payment Methods */}
            <div className="px-6 py-4">
              <div className="grid grid-cols-3 gap-3">
                {PAYMENT_METHODS.map((method) => (
                  <div
                    key={method.name}
                    className="relative p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 
                      transition-all duration-200 transform hover:scale-[1.02] group"
                  >
                    <div className="flex items-center justify-center h-16">
                      <img 
                        src={method.image} 
                        alt={method.name}
                        className="h-12 w-auto object-contain filter brightness-90 
                          group-hover:brightness-100 transition-all duration-200"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
  
            {/* Agents List */}
            <div className="px-6 py-4 border-t border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Available Agents</h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {loading ? (
                  <div className="text-center py-4 text-gray-400">Loading agents...</div>
                ) : agents.length > 0 ? (
                  agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-4 bg-gray-800/50 
                        hover:bg-gray-700/50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-800 
                          flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{agent.username}</p>
                          <p className="text-xs text-gray-400">{agent.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                          Available
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-400">No agents available</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default AgentSelectionModal;