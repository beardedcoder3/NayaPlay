import { initializeApp } from 'firebase/app';
import { getAuth, sendEmailVerification } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


const firebaseConfig = {
    apiKey: "AIzaSyD5y5Um85Z2PM1AnC77h91KPSFhElQSe60",
    authDomain: "nayaplay-3af8d.firebaseapp.com",
    projectId: "nayaplay-3af8d",
    storageBucket: "nayaplay-3af8d.firebasestorage.app",
    messagingSenderId: "611989604778",
    appId: "1:611989604778:web:186c630d59e9be763503d3",
    measurementId: "G-QLD1CMYWVE"
};


if (window.location.hostname === "nayaplay.co") {
    firebaseConfig.authDomain = "nayaplay.co";
}



// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);



// Add this right after your firebase initialization
if (auth) {
    auth.useDeviceLanguage();
    auth.settings.isAppVerificationDisabledForTesting = false;  // Enable this only in development
    
    // Disable automatic email verification
    auth.settings = {
      ...auth.settings,
      sendEmailVerification: false
    };
  }


  // Custom verification email sender
  export const sendCustomVerificationEmail = async (user, userData) => {
    try {
      // First, use Firebase's built-in email verification
      await sendEmailVerification(user);
  
      // Then send your custom formatted email through your backend
      const response = await fetch('/api/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: user.email,
          username: userData.username,
          verificationLink: `https://nayaplay.co/verify-email?code=${user.uid}`,
          // Add any other custom data you want to include in the email
        })
      });
  
      if (!response.ok) {
        throw new Error('Failed to send custom verification email');
      }
  
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  };




// Admin configuration


const ADMIN_EMAILS = [
    "beardedcoder3@gmail.com"
];

const ALLOWED_ADMIN_EMAILS = [
    "beardedcode.r3@gmail.com",
    "otheradmin@example.com"
];

const ADMIN_PASSWORD = "rafay118";

// Admin verification function
const verifyAdminAccess = async (password) => {
    try {
        if (!auth.currentUser) return false;
        
        if (ALLOWED_ADMIN_EMAILS.includes(auth.currentUser.email) && 
            password === ADMIN_PASSWORD) {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
                isAdmin: true,
                adminRole: "super",
                lastAdminVerification: new Date().toISOString()
            });
            return true;
        }
        return false;
    } catch (error) {
        console.error("Admin verification error:", error);
        return false;
    }
};

// Email verification helper
const isAdminEmail = (email) => ADMIN_EMAILS.includes(email);

// Firebase instance check
const checkFirebaseConnection = () => {
    if (!app || !auth || !db || !storage) {
        console.error('Firebase services not properly initialized');
        return false;
    }
    return true;
};

// Export everything
export { 
    app, 
    auth, 
    db, 
    storage, 
    verifyAdminAccess, 
    isAdminEmail,
    checkFirebaseConnection 
};