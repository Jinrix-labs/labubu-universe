# Labubu Tracker - Phase 1: Setup & Auth

## 🚀 Quick Start

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Add a Web app to your project
4. Copy the Firebase config object
5. Enable Authentication (Email/Password)
6. Enable Firestore Database
7. Enable Storage

### 2. Update Firebase Config

Replace the placeholder values in `App.js` with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_ACTUAL_AUTH_DOMAIN",
  projectId: "YOUR_ACTUAL_PROJECT_ID",
  storageBucket: "YOUR_ACTUAL_STORAGE_BUCKET",
  messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID"
};
```

### 3. Run the App

```bash
# Start the development server
npx expo start

# Then press:
# - 'i' for iOS simulator
# - 'a' for Android emulator
# - Scan QR code with Expo Go app on your phone
```

## ✅ What's Working Now

- Firebase initialization (single source, no conflicts)
- Authentication (sign up/login/logout)
- Firestore connection ready
- Storage connection ready (for Phase 3 photos)
- Beautiful UI with placeholder cards for future features

## 🧪 Testing Checklist

1. Create an account with test email/password
2. Log out
3. Log back in
4. Verify it works on BOTH iOS and Android

## 🔮 Next Steps

Once you confirm auth works on both platforms, we'll build **Phase 2: Collection + Browse**

## 📱 Features Coming Soon

- **Phase 2**: Collection management and browsing
- **Phase 3**: Photo studio with camera integration
- **Phase 4**: Community features and sharing

---

**Important Notes:**

- Keep your Firebase config secure (don't commit to public repos)
- The Firebase JS SDK works perfectly on iOS (no native module issues!)
- Test on both platforms after each phase
