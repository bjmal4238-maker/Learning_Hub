/**
 * Firebase Configuration
 * Clean Version - Fixed for LearningHub
 */

// 1. استيراد المكتبات (Import Libraries)
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

// 2. بيانات مشروعك (Config) - من الملف اللي رفعته
const firebaseConfig = {
    apiKey: "AIzaSyC30P-lrF93dLMKpsFOjAwLSs2hs4ElEX0",
    authDomain: "learninghub-2b8ea.firebaseapp.com",
    projectId: "learninghub-2b8ea",
    storageBucket: "learninghub-2b8ea.firebasestorage.app",
    messagingSenderId: "613207882580",
    appId: "1:613207882580:web:47ad6220279979d20de6c1"
};

// 3. إيميل الأدمن
// ⚠️ تنبيه: تأكد إن الإيميل ده هو نفس الإيميل اللي عملته في Firebase Authentication بالظبط
// الملف كان مكتوب فيه "4238" بس أنت قولت في الشات "14238" .. راجع الرقم كويس!
const ADMIN_EMAIL = "bjmal4238@gmail.com"; 

// 4. تشغيل التطبيق (Initialization)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 5. تصدير الأدوات عشان باقي الملفات تشوفها (Global Export)
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

console.log('✅ Firebase initialized successfully (Clean Version)!');
