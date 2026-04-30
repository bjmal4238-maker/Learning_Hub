/**
 * Firebase Configuration — Updated with Google Auth & Phone OTP support
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    signOut 
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    getDoc,
    setDoc,
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    orderBy,
    where
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyC30P-lrF93dLMKpsFOjAwLSs2hs4ElEX0",
    authDomain: "learninghub-2b8ea.firebaseapp.com",
    projectId: "learninghub-2b8ea",
    storageBucket: "learninghub-2b8ea.firebasestorage.app",
    messagingSenderId: "613207882580",
    appId: "1:613207882580:web:47ad6220279979d20de6c1"
};

const ADMIN_EMAIL = "bjmal4238@gmail.com";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

window.firebaseAuth = {
    auth,
    db,
    ADMIN_EMAIL,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    googleProvider,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    signOut,
    collection,
    addDoc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    where
};

console.log('✅ Firebase initialized successfully!');
