import React, { useState } from 'react';
import { Phone, X, ArrowLeft, User, Lock, Eye, EyeOff } from 'lucide-react';
import Select from 'react-select';
import countryList from 'react-select-country-list';
import { useNavigate } from 'react-router-dom';
import { getCountryCallingCode } from '../utils/countryUtils';
// Phone Verification Steps Component
const PhoneVerificationSteps = ({ onBack, onComplete }) => {
  const [step, setStep] = useState('phone'); // 'phone', 'otp', or 'registration'
  const [phoneData, setPhoneData] = useState({
    countryCode: null,
    phoneNumber: '',
    otp: ''
  });
  const [registrationData, setRegistrationData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  
  const countryOptions = countryList().getData().map(country => ({
    value: country.value,
    label: `${country.label} (+${getCountryCallingCode(country.value)})`,
    callingCode: getCountryCallingCode(country.value)
  }));

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    try {
      if (!phoneData.countryCode || !phoneData.phoneNumber) {
        throw new Error('Please enter a valid phone number');
      }
  
      const fullPhoneNumber = `+${phoneData.countryCode.callingCode}${phoneData.phoneNumber}`;
      console.log('Sending verification to:', fullPhoneNumber); // Add this log
  
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/send-phone-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber
        }),
        credentials: 'include' // Add this line
      });
  
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData); // Add this log
        throw new Error('Failed to send verification code');
      }
  
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to send verification code');
      }
  
      setStep('otp');
    } catch (error) {
      console.error('Verification error:', error);
      setError(error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    try {
      const fullPhoneNumber = `+${phoneData.countryCode.callingCode}${phoneData.phoneNumber}`;
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/verify-phone-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber,
          code: phoneData.otp
        })
      });
  
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }
  
      setStep('registration');
    } catch (error) {
      setError(error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };



  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (registrationData.password !== registrationData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Here we'll add the final registration step
      await onComplete({
        phone: `+${phoneData.countryCode.callingCode}${phoneData.phoneNumber}`,
        ...registrationData
      });

      navigate('/app');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-2xl w-full max-w-md p-8 shadow-2xl border border-gray-800">
      <button 
        onClick={onBack}
        className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-full transition-colors"
      >
        <X size={20} className="text-gray-400 hover:text-gray-300" />
      </button>

      <div className="space-y-6">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-400 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back
        </button>

        {step === 'phone' && (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Enter your phone number</h2>
              <p className="text-gray-400">We'll send you a verification code</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <Select
                options={countryOptions}
                value={phoneData.countryCode}
                onChange={(option) => setPhoneData(prev => ({ ...prev, countryCode: option }))}
                className="country-select"
                classNamePrefix="country-select"
                placeholder="Select country"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: 'rgba(31, 41, 55, 0.5)',
                    borderColor: 'rgba(75, 85, 99, 1)',
                    '&:hover': {
                      borderColor: 'rgba(99, 102, 241, 1)'
                    }
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: 'rgb(17, 24, 39)',
                    border: '1px solid rgba(75, 85, 99, 0.5)'
                  }),
                  option: (base, { isFocused, isSelected }) => ({
                    ...base,
                    backgroundColor: isSelected 
                      ? 'rgba(99, 102, 241, 1)'
                      : isFocused 
                        ? 'rgba(55, 65, 81, 1)'
                        : undefined,
                    ':active': {
                      backgroundColor: 'rgba(99, 102, 241, 0.8)'
                    }
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: 'white'
                  }),
                  input: (base) => ({
                    ...base,
                    color: 'white'
                  })
                }}
              />

              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <Phone size={18} />
                </div>
                <input
                  type="tel"
                  value={phoneData.phoneNumber}
                  onChange={(e) => setPhoneData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="Phone number"
                  required
                  className="w-full bg-gray-800/50 text-white pl-10 py-3 rounded-xl border border-gray-700 
                    focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none 
                    placeholder:text-gray-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !phoneData.countryCode || !phoneData.phoneNumber}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl 
                font-medium hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 
                transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed 
                disabled:transform-none flex items-center justify-center"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Send Code'
              )}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Verify your number</h2>
              <p className="text-gray-400">Enter the code we sent to your phone</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                {error}
              </div>
            )}

            <input
              type="text"
              value={phoneData.otp}
              onChange={(e) => setPhoneData(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
              placeholder="Enter verification code"
              required
              maxLength={6}
              className="w-full bg-gray-800/50 text-white px-4 py-3 rounded-xl border border-gray-700 
                focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none 
                placeholder:text-gray-500 text-center text-lg tracking-wider"
            />

            <button
              type="submit"
              disabled={loading || phoneData.otp.length !== 6}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl 
                font-medium hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 
                transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed 
                disabled:transform-none flex items-center justify-center"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Verify Code'
              )}
            </button>
          </form>
        )}

        {step === 'registration' && (
          <form onSubmit={handleRegistrationSubmit} className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Complete your profile</h2>
              <p className="text-gray-400">Just a few more details to get started</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={registrationData.username}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Username"
                  required
                  className="w-full bg-gray-800/50 text-white pl-10 py-3 rounded-xl border border-gray-700 
                    focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none 
                    placeholder:text-gray-500"
                />
              </div>

              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={registrationData.password}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Password"
                  required
                  className="w-full bg-gray-800/50 text-white pl-10 pr-12 py-3 rounded-xl border border-gray-700 
                    focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none 
                    placeholder:text-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={registrationData.confirmPassword}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm Password"
                  required
                  className="w-full bg-gray-800/50 text-white pl-10 pr-12 py-3 rounded-xl border border-gray-700 
                    focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none 
                    placeholder:text-gray-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl 
                font-medium hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 
                transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed 
                disabled:transform-none flex items-center justify-center"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Complete Registration'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PhoneVerificationSteps;