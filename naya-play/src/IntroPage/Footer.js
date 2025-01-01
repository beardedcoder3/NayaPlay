import React from 'react';
import { Twitter, Facebook, Instagram, Youtube, Square, MessageCircle, Crown, Shirt } from 'lucide-react';

const SocialIcon = ({ icon: Icon }) => (
  <a 
    href="#" 
    className="text-white/70 hover:text-white transition-colors duration-200"
  >
    <Icon size={20} />
  </a>
);

const Footer = () => {
  const socialIcons = [
    { icon: Square },
    { icon: MessageCircle },
    { icon: Facebook },
    { icon: Twitter },
    { icon: Instagram },
    { icon: Youtube },
    { icon: Shirt },
    { icon: Crown }
  ];

  return (
    <footer className="bg-[#0c1622] py-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Copyright */}
          <div className="flex items-center space-x-2">
            <div className="text-white text-2xl font-semibold">
              NayaPlay
            </div>
            <span className="text-white/60 text-sm ml-4">
              © 2024 NayaPlay.com | All Rights Reserved.
            </span>
          </div>

          {/* Right side - Social Icons */}
          <div className="flex items-center space-x-6">
            {socialIcons.map((social, index) => (
              <SocialIcon key={index} icon={social.icon} />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;