import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBeM_8ldWDc8TKjDNdkQx4tFfJYCxmEk8I",
  authDomain: "twitter-2b855.firebaseapp.com",
  projectId: "twitter-2b855",
  storageBucket: "twitter-2b855.appspot.com",
  messagingSenderId: "761759590132",
  appId: "1:761759590132:web:36e1aa2e227c49330ce0a1",
};

const app = initializeApp(firebaseConfig);

export const storageService = getStorage(app);
export const dbService = getFirestore(app);
export const firebaseInstance = getAuth(app);
export const authService = getAuth(app);
export const messaging = getMessaging(app);
