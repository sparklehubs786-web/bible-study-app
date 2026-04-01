// ===== FIREBASE CONFIGURATION =====
// Replace these values with your actual Firebase project config
// Get these from: Firebase Console → Project Settings → Your apps → Web app

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Instructions to set up Firebase:
// 1. Go to firebase.google.com
// 2. Click "Get started" and sign in with Google
// 3. Click "Create a project" — name it "destroying-the-works"
// 4. Go to Project Settings → General → Your apps → Add app → Web
// 5. Copy the config values above and paste them here
// 6. Enable Authentication → Google sign-in method
// 7. Enable Realtime Database → Start in test mode
// 8. Enable Firestore Database → Start in test mode

// NOTE: Do not share your API keys publicly.
// For production, use environment variables or Firebase security rules.
