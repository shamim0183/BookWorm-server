const express = require("express")
const router = express.Router()
const multer = require("multer")
const axios = require("axios")
const FormData = require("form-data")
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

// Upload book cover to ImgBB
router.post(
  "/book-cover",
  protect,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" })
      }

      // Check if API key is configured
      if (!process.env.IMGBB_API_KEY) {
        return res.status(500).json({
          error:
            "ImgBB API key not configured. Please add IMGBB_API_KEY to .env file",
        })
      }

      // Prepare form data for ImgBB
      const formData = new FormData()
      formData.append("image", req.file.buffer.toString("base64"))

      // Upload to ImgBB
      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
        formData,
        {
          headers: formData.getHeaders(),
        }
      )

      // Get the image URL from response
      const imageUrl = response.data.data.display_url

      res.json({
        success: true,
        url: imageUrl,
        message: "Book cover uploaded successfully",
      })
    } catch (error) {
      console.error("Upload error:", error.response?.data || error.message)
      res.status(500).json({
        error: error.response?.data?.error?.message || error.message,
      })
    }
  }
)

module.exports = router
