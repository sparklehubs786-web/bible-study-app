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

// Enable offline persistence so app works even with connectivity issues
try {
  db.enablePersistence({ synchronizeTabs: true }).catch(err => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence only in one tab.');
    } else if (err.code === 'unimplemented') {
      console.warn('Browser does not support persistence.');
    }
  });
} catch(e) {}

// Set Firestore to not wait forever for server
db.settings({ merge: true });

console.log('✅ Firebase LIVE — bilble project');
