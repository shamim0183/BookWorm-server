const express = require("express")
const router = express.Router()
const multer = require("multer")
const admin = require("../config/firebase-admin")
const { protect } = require("../middleware/auth")

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false)
    }
    cb(null, true)
  },
})

// Upload book cover to Firebase Storage
router.post(
  "/book-cover",
  protect,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" })
      }

      // Initialize Firebase Storage bucket
      const bucket = admin.storage().bucket()

      // Create a unique filename
      const timestamp = Date.now()
      const filename = `book-covers/${req.user._id}_${timestamp}_${req.file.originalname}`

      // Create a reference to the file
      const file = bucket.file(filename)

      // Upload the file
      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype,
        },
        public: true, // Make the file publicly accessible
      })

      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`

      res.json({
        success: true,
        url: publicUrl,
        message: "Book cover uploaded successfully",
      })
    } catch (error) {
      console.error("Upload error:", error)
      res.status(500).json({ error: error.message })
    }
  }
)

module.exports = router
