import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

const CurrencyShowcase = () => {
  const [activeIndices, setActiveIndices] = useState([0, 1, 2, 3, 4, 5]);

  const cards = [
    { id: 1, label: "Bitcoin" },
    { id: 2, label: "Ethereum" },
    { id: 3, label: "USDT" },
    { id: 4, label: "USD" },
    { id: 5, label: "EUR" },
    { id: 6, label: "GBP" },
    { id: 7, label: "JPY" },
    { id: 8, label: "AUD" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndices(currentIndices => {
        const newIndices = currentIndices.map(index => (index + 1) % cards.length);
        return newIndices;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-gray-900 py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left side - Animated Cards */}
          <div className="relative h-[400px]">
            <div className="grid grid-cols-3 gap-4 relative">
              {activeIndices.map((cardIndex, position) => (
                <div
                  key={position}
                  className={`
                    relative aspect-[3/4] rounded-xl overflow-hidden
                    transition-all duration-700 ease-in-out
                    transform hover:scale-105
                  `}
                >
                  {/* Card Content */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700">
                    <img
                      src={`/api/placeholder/300/400`}
                      alt={cards[cardIndex].label}
                      className="w-full h-full object-cover mix-blend-overlay opacity-50"
                    />
                  </div>
                  
                  {/* Card Label */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-sm font-medium">
                      {cards[cardIndex].label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Content */}
          <div className="flex flex-col justify-center h-full">
            <div className="max-w-lg">
              <h2 className="text-4xl font-bold text-white leading-tight mb-6">
                Peace of mind across multiple crypto and local currencies
              </h2>
              
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                Experience safe deposits and instant withdrawals across 20 cryptocurrencies 
                and 7 local currencies. All with no minimums, flexible payment methods, 
                and a secure online vault.
              </p>

              <button className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 
                rounded-lg font-semibold text-white hover:bg-indigo-700 
                transition-all duration-200 transform hover:scale-105 w-fit">
                <span>Learn More</span>
                <ArrowRight size={20} className="transition-transform duration-200 
                  group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CurrencyShowcase;