import React, { useState } from 'react';
import { Phone, X, ArrowLeft, User, Lock, Eye, EyeOff } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import debounce from 'lodash/debounce';

const PhoneVerificationSteps = ({ onBack, onComplete }) => {
 const [step, setStep] = useState('phone');
 const [phoneData, setPhoneData] = useState({
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
 
 const [usernameStatus, setUsernameStatus] = useState({
   isChecking: false,
   isAvailable: null,
   message: ''
 });
 const [passwordStrength, setPasswordStrength] = useState({
   score: 0,
   feedback: ''
 });

 const checkUsername = debounce(async (username) => {
   if (!username || username.length < 3) {
     setUsernameStatus({
       isChecking: false,
       isAvailable: null,
       message: username ? 'Username must be at least 3 characters' : ''
     });
     return;
   }

   setUsernameStatus(prev => ({ ...prev, isChecking: true }));

   try {
     const usersRef = collection(db, 'users');
     const q = query(usersRef, where('username', '==', username.toLowerCase()));
     const querySnapshot = await getDocs(q);

     setUsernameStatus({
       isChecking: false,
       isAvailable: querySnapshot.empty,
       message: querySnapshot.empty ? 'Username is available' : 'Username is already taken'
     });
   } catch (error) {
     setUsernameStatus({
       isChecking: false,
       isAvailable: false,
       message: 'Error checking username'
     });
   }
 }, 500);

 const validatePassword = (password) => {
   let score = 0;
   let feedback = [];

   if (password.length >= 8) score++;
   else feedback.push('At least 8 characters');
   if (/[A-Z]/.test(password)) score++;
   else feedback.push('One uppercase letter');
   if (/[a-z]/.test(password)) score++;
   else feedback.push('One lowercase letter');
   if (/[0-9]/.test(password)) score++;
   else feedback.push('One number');
   if (/[^A-Za-z0-9]/.test(password)) score++;
   else feedback.push('One special character');

   return { score, feedback: feedback.join(' • ') };
 };

// In your handleSendOTP function, modify it like this:
const handleSendOTP = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  
  try {
    // Remove everything except digits and ensure it has the + prefix
    const formattedNumber = phoneData.phoneNumber.startsWith('+') ? 
      phoneData.phoneNumber : 
      `+${phoneData.phoneNumber.replace(/\D/g, '')}`;

    console.log('Sending verification to:', formattedNumber); // For debugging

    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/send-phone-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phoneNumber: formattedNumber
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.success) setStep('otp');
    else throw new Error(data.error || 'Failed to send verification code');
  } catch (error) {
    console.error('Error:', error);
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
    // Use the same formatting as when sending
    const formattedNumber = phoneData.phoneNumber.startsWith('+') ? 
      phoneData.phoneNumber : 
      `+${phoneData.phoneNumber.replace(/\D/g, '')}`;

    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/verify-phone-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: formattedNumber,
        code: phoneData.otp
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.verified) {
      throw new Error('Invalid verification code');
    }

    setStep('registration');
  } catch (error) {
    console.error('Error:', error);
    setError(error.message || 'Failed to verify code');
  } finally {
    setLoading(false);
  }
};

 const handleRegistrationSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    if (!usernameStatus.isAvailable) {
      throw new Error('Please choose a different username');
    }

    if (registrationData.password !== registrationData.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (passwordStrength.score < 3) {
      throw new Error('Please choose a stronger password');
    }

    await onComplete({
      phone: phoneData.phoneNumber,
      ...registrationData
    });

    // No need to setLoading(false) here as we're navigating away
    // Phone verification users go directly to /app
    navigate('/app');
  } catch (error) {
    setError(error.message);
    setLoading(false);
  }
};

 const handleUsernameChange = (e) => {
   const username = e.target.value;
   setRegistrationData(prev => ({ ...prev, username }));
   checkUsername(username);
 };

 const handlePasswordChange = (e) => {
   const password = e.target.value;
   setRegistrationData(prev => ({ ...prev, password }));
   setPasswordStrength(validatePassword(password));
 };

 const getPasswordStrengthColor = (score) => {
   if (score <= 2) return 'bg-red-500';
   if (score <= 3) return 'bg-yellow-500';
   if (score <= 4) return 'bg-green-500';
   return 'bg-emerald-500';
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
             <div className="relative">
               <PhoneInput
                 specialLabel=""
                 country="us"
                 value={phoneData.phoneNumber}
                 onChange={phone => setPhoneData(prev => ({
                  ...prev,
                  phoneNumber: `+${phone}`  // Add + prefix
                }))}
                 inputStyle={{
                   background: 'rgba(31, 41, 55, 0.5)',
                   border: '1px solid rgba(75, 85, 99, 1)',
                   color: 'white',
                   width: '100%',
                   height: '48px',
                   borderRadius: '0.75rem'
                 }}
                 dropdownStyle={{
                   background: 'rgb(31, 41, 55)',
                   color: 'white'
                 }}
                 buttonStyle={{
                   background: 'transparent',
                   border: 'none',
                   borderRadius: '0.75rem 0 0 0.75rem'
                 }}
               />
             </div>
           </div>

           <button
             type="submit"
             disabled={loading || !phoneData.phoneNumber}
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
                 onChange={handleUsernameChange}
                 placeholder="Username"
                 required
                 className={`w-full bg-gray-800/50 text-white pl-10 py-3 rounded-xl border 
                   ${registrationData.username ? 
                     usernameStatus.isChecking ? 'border-yellow-500' :
                     usernameStatus.isAvailable ? 'border-green-500' : 'border-red-500'
                     : 'border-gray-700'} 
                   focus:ring-1 focus:ring-indigo-500 transition-all outline-none 
                   placeholder:text-gray-500`}
               />
               {registrationData.username && (
                 <div className={`absolute right-3 top-3.5 text-sm
                   ${usernameStatus.isChecking ? 'text-yellow-500' : 
                     usernameStatus.isAvailable ? 'text-green-500' : 'text-red-500'}`}>
                   {usernameStatus.message}
                 </div>
               )}
             </div>

             <div className="space-y-2">
               <div className="relative">
                 <div className="absolute left-3 top-3 text-gray-400">
                   <Lock size={18} />
                 </div>
                 <input
                   type={showPassword ? "text" : "password"}
                   value={registrationData.password}
                   onChange={handlePasswordChange}
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

               {registrationData.password && (
                 <div className="space-y-2">
                   <div className="flex gap-1">
                     {[1, 2, 3, 4, 5].map((level) => (
                       <div
                         key={level}
                         className={`h-1 w-full rounded-full ${
                           level <= passwordStrength.score
                             ? getPasswordStrengthColor(passwordStrength.score)
                             : 'bg-gray-700'
                         }`}
                       />
                     ))}
                   </div>
                   <p className="text-xs text-gray-400">
                     {passwordStrength.feedback || 'Password strength: Strong'}
                   </p>
                 </div>
               )}

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
           </div>

           <button
             type="submit"
             disabled={loading || !usernameStatus.isAvailable || usernameStatus.isChecking}
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