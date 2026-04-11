// ===== REAL FIREBASE CONFIGURATION =====
// Project: bilble project | Status: LIVE

const firebaseConfig = {
  apiKey: "AIzaSyCllNSDG35sXzFVclG0aM1QPbIFqyfJ15w",
  authDomain: "bilble-project.firebaseapp.com",
  projectId: "bilble-project",
  storageBucket: "bilble-project.firebasestorage.app",
  messagingSenderId: "25528990610",
  appId: "1:25528990610:web:7b2bd6f1ed6cb019ab9f4b",
  measurementId: "G-NN2JZ9293T"
};

// Initialize Firebase
if (!firebase.apps || !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db   = firebase.firestore();

console.log('✅ Firebase LIVE — bilble project');
