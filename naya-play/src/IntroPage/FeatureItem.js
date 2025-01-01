import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, Clock, Gift, CloudLightning, DollarSign} from 'lucide-react';

const Icon = ({ children }) => (
  <div className="relative w-12 h-12 flex items-center justify-center rounded-lg" style={{
    background: 'linear-gradient(45deg, rgba(21, 27, 40, 0.8), rgba(21, 27, 40, 0.9))',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
  }}>
    <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10" />
    {children}
  </div>
);

const FeatureItem = ({ icon: IconComponent, title, description, isActive, onClick }) => (
  <div
    onClick={onClick}
    className={`
      relative cursor-pointer p-6 rounded-xl transition-all duration-300 ease-out
      backdrop-blur-sm group
      ${isActive ? 'bg-white/10' : 'bg-white/5 hover:bg-white/8'}
      border border-white/10 hover:border-white/20
      ${isActive ? 'border-l-4 border-l-blue-400' : ''}
    `}
  >
    <div className="flex items-center space-x-4">
      <Icon>
        <IconComponent className="text-blue-400 w-6 h-6" />
      </Icon>
      <div className="flex-1">
        <h3 className={`
          font-medium text-lg transition-colors duration-300
          ${isActive ? 'text-blue-400' : 'text-white/90 group-hover:text-white'}
        `}>
          {title}
        </h3>
        <p className="mt-1 text-sm text-white/50 group-hover:text-white/70">
          {description}
        </p>
      </div>
      <div className={`
        transform transition-all duration-300
        ${isActive ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}
      `}>
        <span className="text-blue-400">→</span>
      </div>
    </div>
  </div>
);

const FeatureShowcase = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const features = [
    {
      title: "High RTP Games",
      description: "With enhanced RTP percentages, you stand a chance to win big every time you play.",
      icon: DollarSign,
      image: "https://img.freepik.com/free-photo/girl-proud-herself-making-successful-effort-clenching-raised-fists-celebration-triumph-smiling-broadly-with-surprised-relieved-expression-winning-achieving-goal-purple-background_1258-81598.jpg?t=st=1735646378~exp=1735649978~hmac=626bc909844692ab7181fb7b3f37f8a8fa5dc8c9fd1dcab1fa9ccb8207227564&w=1060"
    },
    {
      title: "Bonus boosts",
      description: "Weekly boosts and monthly bonuses mean you'll get rewarded the more you play top Casino games.",
      icon: CloudLightning,
      image: "https://img.freepik.com/free-photo/purple-open-gift-box-with-voucher-bonus-surprise-minimal-present-greeting-celebration-promotion-discount-sale-reward-icon-3d-illustration_56104-2100.jpg?t=st=1735643486~exp=1735647086~hmac=fda2476d57cf79a700090b60213f403a00ac1529f3b9c0ac87fafb7271d7a245&w=1060"
    },
   
    {
      title: "Welcome Bonuses",
      description: "Claim Welcome Bonus, once you're IN.",
      icon: Gift,
      image: "https://img.freepik.com/free-photo/young-woman-violet-sweater-with-purple-gift-box_169016-17582.jpg?t=st=1735646003~exp=1735649603~hmac=9a8921b2e831bc6e9713dc95770a409ec8f096bfa15863e4fba5a30387b986de&w=1380"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative bg-gradient-to-b from-[#0e1525] to-[#0f1b31] py-24 overflow-hidden">
      {/* Simple darker overlay for depth */}
      <div className="absolute inset-0 bg-black/20">
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Main content grid */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Feature list */}
          <div className="space-y-3">
            {features.map((feature, index) => (
              <FeatureItem
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                isActive={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>

          {/* Enhanced image showcase */}
          <div className="relative">
            <div className="aspect-[16/9] rounded-xl overflow-hidden shadow-2xl border border-white/10 hover:border-white/20 transition-all duration-300">
              <div className="w-full h-full">
                <img
                  src={features[activeIndex].image}
                  alt={features[activeIndex].title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Enhanced overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
              
              {/* Enhanced feature indicator */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex items-center justify-between">
                  <p className="text-xl font-medium text-white">
                    {features[activeIndex].title}
                  </p>
                  <div className="flex space-x-2">
                    {features.map((_, index) => (
                      <div
                        key={index}
                        className={`
                          h-1 rounded-full transition-all duration-300 ease-out
                          ${index === activeIndex ? 'w-8 bg-blue-400' : 'w-2 bg-white/20'}
                        `}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureShowcase;