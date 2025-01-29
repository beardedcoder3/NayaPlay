import React, { useState, useEffect } from 'react';
import { Send, Users, Mail, Eye } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const BonusEmailManager = () => {
  const [subject, setSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [userEmails, setUserEmails] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchUserEmails();
  }, []);

  const fetchUserEmails = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      // Include all users who haven't explicitly opted out
      const emails = snapshot.docs
        .filter(doc => {
          const userData = doc.data();
          // Include if smsOffers is true or if it's not set at all
          return userData.smsOffers !== false;
        })
        .map(doc => doc.data().email)
        .filter(email => email); // Filter out any undefined/null emails
      
      setUserEmails(emails);
    } catch (error) {
      console.error('Error fetching user emails:', error);
      setStatus({
        type: 'error',
        message: 'Failed to fetch user emails'
      });
    }
  };

  const renderEmailPreview = () => {
    return (
      <div className="bg-gray-800/20 text-white p-6 rounded-lg space-y-4">
        <h1 className="text-2xl font-bold text-blue-400">{subject || 'No Subject'}</h1>
        <div className="whitespace-pre-wrap">{emailContent || 'No content'}</div>
      </div>
    );
  };

  const handleSendEmail = async () => {
    if (!subject || !emailContent) {
      setStatus({
        type: 'error',
        message: 'Please fill in both subject and content'
      });
      return;
    }

    if (userEmails.length === 0) {
      setStatus({
        type: 'error',
        message: 'No recipients available'
      });
      return;
    }

    setLoading(true);
    try {
      const emailData = {
        subject,
        htmlContent: `
          <div style="background-color: #1a1b1e; color: #ffffff; padding: 20px; border-radius: 10px;">
            <h1 style="color: #4f46e5;">${subject}</h1>
            <div style="margin-top: 20px;">
              ${emailContent.replace(/\n/g, '<br>')}
            </div>
          </div>
        `,
        recipients: userEmails,
        emailType: 'bonus' // Add this to differentiate from marketing emails
      };

      const response = await fetch('https://nayaplay-backend.onrender.com/api/send-bonus-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      const result = await response.json();
      
      if (result.success) {
        setStatus({
          type: 'success',
          message: `Bonus email sent successfully to ${userEmails.length} users!`
        });
        setSubject('');
        setEmailContent('');
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Failed to send email'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Bonus Email</h2>
          <p className="text-gray-400">Send bonus offers to opted-in users</p>
        </div>
        <div className="flex items-center space-x-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-lg">
          <Users size={20} />
          <span>{userEmails.length} Recipients</span>
        </div>
      </div>

      <div className="bg-gray-800/20 rounded-xl border border-gray-700/50 p-6 space-y-6">
        {/* Subject Input */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800/40 border border-gray-700/50 rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            placeholder="Enter email subject..."
          />
        </div>

        {/* Content Input */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Email Content
          </label>
          <textarea
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
            rows={8}
            className="w-full px-4 py-2 bg-gray-800/40 border border-gray-700/50 rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-blue-500 text-white resize-none"
            placeholder="Write your bonus email content here..."
          />
        </div>

        {/* Preview Toggle */}
        <button
          onClick={() => setPreview(!preview)}
          className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Eye size={20} />
          <span>{preview ? 'Hide Preview' : 'Show Preview'}</span>
        </button>

        {/* Preview Section */}
        {preview && (
          <div className="border border-gray-700/50 rounded-lg p-4 bg-gray-800/40">
            <h3 className="text-lg font-medium text-white mb-4">Email Preview</h3>
            {renderEmailPreview()}
          </div>
        )}

        {/* Status Message */}
        {status.message && (
          <div className={`p-4 rounded-lg ${
            status.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {status.message}
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSendEmail}
          disabled={loading || !subject || !emailContent}
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 
            bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send size={20} />
              <span>Send Bonus Email</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BonusEmailManager;