import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQItem = ({ question, answer, isOpen, onToggle }) => {
  return (
    <div className="rounded-xl bg-white/5 overflow-hidden mb-4">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-white hover:text-white/90 transition-colors duration-200"
      >
        <span className="text-left font-medium">{question}</span>
        <ChevronDown 
          size={20} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-gray-400 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
};

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(0);
  
  const faqs = [
    {
      question: "Who is NayaPlay?",
      answer: "Leading the online gambling industry since 2017, NayaPlay.co offers a wide variety of online casino and sports betting options, operating globally in 15 different languages. With a reputable and secure platform, NayaPlay Casino is home to worldwide local currencies and crypto betting options for online slot games, NayaPlay Originals and live casino games."
    },
    {
      question: "Is NayaPlay licensed?",
      answer: "Nayaplay operates under a valid gaming license and follows strict regulatory requirements to ensure fair and secure gaming operations."
    },
    {
      question: "Is betting on NayaPlay safe?",
      answer: "Yes, NayaPlay employs industry-leading security measures and encryption to protect all user data and transactions."
    },
    {
      question: "What currencies can I bet with?",
      answer: "NayaPlay supports BTC, USDT & Pakistani Rupee at the moment."
    },
    {
      question: "What types of casino games can I play?",
      answer: "NayaPlay offers a wide variety of casino games including slots, table games, live dealer games, and exclusive NayaPlay Originals."
    },
  
    {
      question: "How do I watch live streams?",
      answer: "Live streams are coming soon."
    }
  ];

  return (
    <section className="bg-slate-900 py-16">
      <div className="max-w-3xl mx-auto px-4">
        {/* Top section */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-white mb-8">
            Still have questions?
          </h2>
          <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg 
            hover:bg-blue-700 transition-colors duration-200">
            Read our guides
          </button>
        </div>

        {/* FAQ Items */}
        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={index === openIndex}
              onToggle={() => setOpenIndex(index === openIndex ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;