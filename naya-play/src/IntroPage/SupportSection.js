import React from 'react';
import { Globe, Clock, MessageCircle, Stars } from 'lucide-react';

const InfoCard = ({ icon: Icon, title, text }) => (
  <div className="bg-white/5 hover:bg-white/10 rounded-xl p-6 border border-white/10 
    hover:border-white/20 transition-all duration-300">
    <div className="p-3 rounded-lg bg-indigo-500/20 w-fit mb-4">
      <Icon size={24} className="text-indigo-400" />
    </div>
    <h3 className="text-white text-lg font-medium mb-2">{title}</h3>
    <p className="text-white/60 leading-relaxed">{text}</p>
  </div>
);

const SupportSection = () => {
  const supportInfo = [
    {
      icon: Globe,
      title: "Multiple Languages",
      text: "Support in English, Spanish, Japanese, and more"
    },
    {
      icon: Clock,
      title: "Always Available",
      text: "24/7 support whenever you need assistance"
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      text: "Get instant responses through our live chat"
    },
    {
      icon: Stars,
      title: "Expert Team",
      text: "Professional and friendly support staff"
    }
  ];

  return (
    <section className="bg-slate-900 py-24">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main content */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-medium text-white mb-4">
            24/7 Support Team
          </h2>
          <p className="text-lg text-white/60">
            Get instant assistance from our dedicated support team, 
            available around the clock in multiple languages.
          </p>
        </div>

        {/* Support info grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {supportInfo.map((info, index) => (
            <InfoCard
              key={index}
              icon={info.icon}
              title={info.title}
              text={info.text}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SupportSection;