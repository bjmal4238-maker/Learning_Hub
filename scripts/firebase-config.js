/**
 * Firebase Configuration (v9 Modular SDK)
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Go to https://firebase.google.com and create a project
 * 2. Go to Project Settings (gear icon) > Service Accounts > Web App
 * 3. Copy your config object values and paste them below:
 *    - apiKey: Find under "Web API key" in Project Settings
 *    - authDomain: your-project.firebaseapp.com
 *    - projectId: your-project-id
 *    - storageBucket: your-project.appspot.com
 *    - messagingSenderId: Your message sender ID
 *    - appId: Your app ID
 * 
 * 4. Create a Firestore database:
 *    - Go to Firestore Database in Firebase Console
 *    - Click "Create Database"
 *    - Start in "Test Mode" (for development)
 *    - Select region closest to you
 * 
 * 5. Set up Admin email protection:
 *    - In ADMIN_EMAIL below, change to your admin email (e.g., "admin@learninghub.com")
 *    - When users register, only this email can access admin.html
 */

// ====================
// PASTE YOUR FIREBASE CONFIG HERE
// ====================
const firebaseConfig = {
    apiKey: "AIzaSyC30P-lrF93dLMKpsFOjAwLSs2hs4ElEX0",
    authDomain: "learninghub-2b8ea.firebaseapp.com",
    projectId: "learninghub-2b8ea",
    storageBucket: "learninghub-2b8ea.firebasestorage.app",
    messagingSenderId: "613207882580",
    appId: "1:613207882580:web:47ad6220279979d20de6c1"
};

// Admin email - change this to your admin email
const ADMIN_EMAIL = "bjmal4238@gmail.com";

// ====================
// Initialize Firebase (v9 Modular SDK)
// ====================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Export services for use in other scripts
window.firebaseAuth = {
    auth,
    db,
    ADMIN_EMAIL,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy
};

console.log('Firebase initialized successfully!');