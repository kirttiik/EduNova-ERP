/**
 * Firebase Admin SDK Configuration
 * 
 * Initializes Firebase Admin SDK for server-side operations.
 * Uses service account credentials from environment variables.
 * 
 * NOTE: For local development without Firebase, we use an in-memory
 * mock database. Set USE_MOCK_DB=true in .env to use mock mode.
 */

const admin = require('firebase-admin');

let db;
let auth;
let isFirebaseInitialized = false;

try {
  // Initialize Firebase Admin SDK
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PROJECT_ID !== 'your-project-id') {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    db = admin.firestore();
    auth = admin.auth();
    isFirebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
  } else {
    console.log('⚠️  Firebase not configured - Using in-memory mock database');
    console.log('   Set FIREBASE_PROJECT_ID in .env to connect to Firebase');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
  console.log('   Falling back to in-memory mock database');
}

module.exports = { admin, db, auth, isFirebaseInitialized };
