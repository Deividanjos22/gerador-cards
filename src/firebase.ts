import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyB0FwCNYX05yGIjBbzn6mTCYkAfYGJbiYo',
  authDomain: 'encartes-hb.firebaseapp.com',
  projectId: 'encartes-hb',
  storageBucket: 'encartes-hb.firebasestorage.app',
  messagingSenderId: '967562290085',
  appId: '1:967562290085:web:30834834dd151ed603fe4c',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
