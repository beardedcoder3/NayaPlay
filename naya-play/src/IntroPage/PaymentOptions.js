import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

const CurrencyShowcase = () => {
  const [activeIndices, setActiveIndices] = useState([0, 1, 2]);

  const cards = [
    { 
      id: 1, 
      label: "Bitcoin",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/800px-Bitcoin.svg.png"
    },
    { 
      id: 2, 
      label: "USDT",
      image: "https://cryptologos.cc/logos/tether-usdt-logo.png" // Replace with actual USDT image
    },
    { 
      id: 3, 
      label: "PKR",
      image: "https://cdn3.iconfinder.com/data/icons/currency-17/24/Pkr-512.png" // Replace with actual PKR image
    }
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
    <section className="relative bg-gradient-to-b from-[#141e30] to-[#243b55] py-16 overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-black/10" />
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left side - Animated Cards */}
          <div className="relative h-[400px]">
            <div className="grid grid-cols-3 gap-4 relative">
              {activeIndices.map((cardIndex, position) => {
                const card = cards[cardIndex];
                return (
                  <div
                    key={position}
                    className={`
                      relative aspect-[3/4] rounded-xl overflow-hidden
                      transition-all duration-700 ease-in-out
                      transform hover:scale-105
                      shadow-lg
                      border border-white/10
                      bg-gradient-to-br from-blue-600/20 to-blue-900/20
                    `}
                  >
                    {/* Background Image with Overlay */}
                    <div className="absolute inset-0">
                      <img
                        src={card.image}
                        alt={card.label}
                        className="w-full h-full object-contain p-4"
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-blue-900/10" />
                    </div>
                    
                    {/* Card Label */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white text-sm font-medium tracking-wide">
                        {card.label}
                      </p>
                    </div>

                    {/* Subtle shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent opacity-10" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right side - Content */}
          <div className="flex flex-col justify-center h-full">
            <div className="max-w-lg">
              <h2 className="text-4xl font-bold text-white leading-tight mb-6">
                Multiple Currency Support
              </h2>
              
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                Experience seamless transactions with support for both cryptocurrencies 
                and local currency. Trade easily with Bitcoin, USDT, and PKR with 
                instant deposits and secure withdrawals.
              </p>

              <button className="group inline-flex items-center space-x-2 px-6 py-3 
                bg-gradient-to-r from-blue-600 to-blue-700
                rounded-lg font-semibold text-white 
                hover:from-blue-700 hover:to-blue-800
                transition-all duration-200 transform hover:scale-105 
                w-fit border border-white/10">
                <span>Learn More </span>
               
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CurrencyShowcase;