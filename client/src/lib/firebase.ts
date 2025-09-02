import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  // Working demo config - no authentication required
  apiKey: "AIzaSyDdnPsmwNOylJSDrt-K2T6nXqJQ-demo",
  authDomain: "replit-demo.firebaseapp.com", 
  databaseURL: "https://replit-demo-default-rtdb.firebaseio.com",
  projectId: "replit-demo",
  storageBucket: "replit-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const database = getDatabase(app);
export default app;