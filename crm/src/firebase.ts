import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "gen-lang-client-0451543162",
  appId: "1:159659925905:web:288cb1c055b521f66b7a30",
  apiKey: "AIzaSyDeJnWQrLmCti5OLCfCr27bpC9RzCRqhLQ",
  authDomain: "gen-lang-client-0451543162.firebaseapp.com",
  storageBucket: "gen-lang-client-0451543162.firebasestorage.app",
  messagingSenderId: "159659925905",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
