const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const admin = require("../config/firebase-admin")
const User = require("../models/User")
const { protect } = require("../middleware/auth")

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  })
}

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, photoURL } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields required" })
    }

    const exists = await User.findOne({ email })
    if (exists) {
      return res.status(400).json({ error: "User already exists" })
    }

    const user = await User.create({ name, email, password, photoURL })
    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    console.log("Login attempt for:", email)

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" })
    }

    const user = await User.findOne({ email }).select("+password")

    if (!user) {
      console.log("User not found:", email)
      return res.status(401).json({ error: "Invalid credentials" })
    }

    console.log("User found, comparing password")
    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      console.log("Password mismatch for:", email)
      return res.status(401).json({ error: "Invalid credentials" })
    }

    console.log("Password matched, generating token")
    const token = generateToken(user._id)

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: error.message })
  }
})

// Firebase Authentication (Google Sign-In)
router.post("/firebase", async (req, res) => {
  try {
    const { firebaseToken, email, name, photoURL } = req.body

    if (!firebaseToken || !email) {
      return res
        .status(400)
        .json({ error: "Firebase token and email required" })
    }

    // Verify Firebase ID token
    let decodedToken
    try {
      console.log("Verifying Firebase token...")
      decodedToken = await admin.auth().verifyIdToken(firebaseToken)
      console.log("Firebase token verified successfully")
    } catch (error) {
      console.error("Firebase token verification failed:", error.message)
      return res
        .status(401)
        .json({ error: "Invalid Firebase token: " + error.message })
    }

    // Check if user exists, if not create one
    let user = await User.findOne({ email })

    if (!user) {
      // Create new user from Firebase data
      user = await User.create({
        name: name || decodedToken.name || email.split("@")[0],
        email: email,
        password: Math.random().toString(36).slice(-8), // Random password for Google users
        photoURL: photoURL || decodedToken.picture || "",
        firebaseUid: decodedToken.uid,
      })
    } else if (!user.firebaseUid) {
      // Update existing user with Firebase UID
      user.firebaseUid = decodedToken.uid
      await user.save()
    }

    const token = generateToken(user._id)

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Verify JWT token and return user data
router.get("/verify", protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      photoURL: req.user.photoURL,
      role: req.user.role,
    },
  })
})

// Get current user
router.get("/me", protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      photoURL: req.user.photoURL,
      role: req.user.role,
    },
  })
})

// Update profile
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, email, photoURL } = req.body

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email })
      if (emailExists) {
        return res.status(400).json({ error: "Email already in use" })
      }
    }

    // Update fields
    user.name = name || user.name
    user.email = email || user.email
    user.photoURL = photoURL !== undefined ? photoURL : user.photoURL

    await user.save()

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
