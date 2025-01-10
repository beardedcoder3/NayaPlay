import React from 'react';
import { MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../Chat/ChatContext';

const AnimatedHelpWidget = () => {
    const { isChatOpen } = useChat(); // Only used to check if global chat is open

    return (
      <AnimatePresence>
        {!isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-4 right-4 z-40"
          >
            <button
              onClick={() => document.dispatchEvent(new Event('openSupportWidget'))}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 
                text-white px-6 py-4 rounded-full shadow-lg hover:shadow-xl 
                transition-all duration-300"
            >
              <MessageCircle className="w-6 h-6" />
              <span className="font-medium">Need Help?</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    );
};

export default AnimatedHelpWidget;