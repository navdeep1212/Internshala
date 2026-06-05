// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyArEbh-FMoUc9X1xgnZlmK--g0YGTqrrpA",
  authDomain: "login-page-f9372.firebaseapp.com",
  projectId: "login-page-f9372",
  storageBucket: "login-page-f9372.firebasestorage.app",
  messagingSenderId: "580437252496",
  appId: "1:580437252496:web:593e3fe636e0f9887b7b15",
  measurementId: "G-XW8HL71NRG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Initialize Analytics safely (Next.js SSR guard)
let analytics;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { auth, provider, analytics };
