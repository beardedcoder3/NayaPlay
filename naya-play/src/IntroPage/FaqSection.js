import React, { useState } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-white hover:text-white/90 transition-colors duration-200"
      >
        <span className="text-left font-medium text-lg">{question}</span>
        <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center
          transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown size={18} />
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? 'max-h-48 opacity-100 pb-5' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="text-white/60 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

const FAQSection = () => {
  const faqs = [
    {
      question: "How do I make a deposit?",
      answer: "You can make a deposit through our secure payment methods, including credit card, PayPal, and bank transfer. All transactions are protected with advanced encryption."
    },
    {
      question: "What are the withdrawal options?",
      answer: "We offer multiple withdrawal options including bank transfer, crypto, and e-wallets. Most withdrawals are processed within 24 hours of request."
    },
    {
      question: "How do I verify my account?",
      answer: "Account verification requires a valid government ID and proof of address. Upload these documents in your account settings for quick verification."
    },
    {
      question: "What are the betting limits?",
      answer: "Betting limits vary by game and your account level. VIP members enjoy higher limits. Check individual games for specific limit information."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we use industry-standard encryption and security measures to protect your personal and financial information. Our platform is regularly audited for security."
    }
  ];

  return (
    <section className="bg-slate-900 py-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left Column - Text and Button */}
          <div className="lg:sticky lg:top-24">
            <div className="max-w-md space-y-6">
              <h2 className="text-3xl font-medium text-white">
                Have questions?
              </h2>
              <p className="text-lg text-white/60">
                Find quick answers to common questions, or reach out to our support team for personalized assistance.
              </p>
              <button className="group inline-flex items-center px-6 py-3 
                bg-white/5 hover:bg-white/10 rounded-xl text-white font-medium
                border border-white/10 hover:border-white/20
                transition-all duration-200">
                <span>View full guides</span>
                <ArrowRight 
                  size={18}
                  className="ml-2 transition-transform duration-200 group-hover:translate-x-1" 
                />
              </button>
            </div>
          </div>

          {/* Right Column - FAQs */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="divide-y divide-white/10">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;