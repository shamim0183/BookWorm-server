const admin = require("firebase-admin")
const path = require("path")

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  try {
    // Try to load service account from JSON file first
    const serviceAccountPath = path.join(
      __dirname,
      "..",
      "zap-shift-7a94e-firebase-adminsdk-fbsvc-9fb4192fd7.json"
    )
    const serviceAccount = require(serviceAccountPath)

    // Get project ID from service account
    const projectId = serviceAccount.project_id
    const storageBucket = `${projectId}.appspot.com`

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: storageBucket,
    })
    console.log("✅ Firebase Admin SDK initialized successfully")
    console.log(`📦 Storage Bucket: ${storageBucket}`)
  } catch (error) {
    // Fallback to environment variable if file doesn't exist
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        })
        console.log(
          "✅ Firebase Admin SDK initialized from environment variable"
        )
      } catch (err) {
        console.error(
          "❌ Failed to initialize Firebase Admin from env:",
          err.message
        )
      }
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // Initialize with minimal config for development
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      })
      console.log("✅ Firebase Admin SDK initialized with project ID")
    } else {
      console.warn(
        "⚠️ Firebase Admin SDK not initialized - Firebase authentication will not work"
      )
    }
  }
}

module.exports = admin
