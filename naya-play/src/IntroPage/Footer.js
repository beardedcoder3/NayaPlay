import React from 'react';
import { Twitter, Facebook, Instagram, Youtube, MessageCircle } from 'lucide-react';

const FooterLink = ({ href, children }) => (
  <a 
    href={href}
    className="text-white/60 hover:text-white transition-colors duration-200"
  >
    {children}
  </a>
);

const SocialIcon = ({ icon: Icon }) => (
  <a 
    href="#" 
    className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
    transition-all duration-200"
  >
    <Icon size={18} className="text-white/70 hover:text-white transition-colors duration-200" />
  </a>
);

const Footer = () => {
  const navLinks = [
    { name: 'Home', href: '#' },
    { name: 'Casino', href: '#' },
    { name: 'Sports', href: '#' },
    { name: 'VIP', href: '#' },
    { name: 'Contact', href: '#' },
    { name: 'Terms & Conditions', href: '#' }
  ];

  const socialIcons = [
    { icon: Twitter },
    { icon: Facebook },
    { icon: Instagram },
    { icon: Youtube },
    { icon: MessageCircle }
  ];

  return (
    <footer className="bg-slate-900 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Branding */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <span className="font-medium text-indigo-400">NP</span>
              </div>
              <span className="text-white font-medium text-xl">NayaPlay</span>
            </div>
            <p className="text-white/60">
              Experience the thrill of next-generation gaming
            </p>
          </div>

          {/* Navigation Links - Column 1 */}
          <div className="space-y-4">
            <h3 className="text-white font-medium">Quick Links</h3>
            <ul className="space-y-3">
              {navLinks.slice(0, 3).map(link => (
                <li key={link.name}>
                  <FooterLink href={link.href}>{link.name}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation Links - Column 2 */}
          <div className="space-y-4">
            <h3 className="text-white font-medium">Support</h3>
            <ul className="space-y-3">
              {navLinks.slice(3).map(link => (
                <li key={link.name}>
                  <FooterLink href={link.href}>{link.name}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-white font-medium">Connect With Us</h3>
            <div className="flex gap-2">
              {socialIcons.map((social, index) => (
                <SocialIcon key={index} icon={social.icon} />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="py-8 border-t border-white/10 text-center md:flex md:justify-between md:text-left">
          <div className="text-sm text-white/60 mb-4 md:mb-0">
            © 2024 NayaPlay. All rights reserved.
          </div>
          <div className="text-sm">
            <span className="text-white/60">
              Gambling problem? Call{' '}
              <a href="tel:18006624357" className="text-indigo-400 hover:text-white">
                1-800-662-4357
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;