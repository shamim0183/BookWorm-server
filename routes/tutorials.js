const express = require("express")
const router = express.Router()
const Tutorial = require("../models/Tutorial")
const User = require("../models/User")
const jwt = require("jsonwebtoken")
const { protect, adminOnly } = require("../middleware/auth")

// Middleware to check if user is authenticated (optional)
const optionalAuth = async (req, res, next) => {
  try {
    let token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1]
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = await User.findById(decoded.id).select("-password")
      } catch (error) {
        // Token invalid, proceed as guest
      }
    }
    next()
  } catch (error) {
    next()
  }
}

// Get all tutorials (public or admin)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { status, category } = req.query
    const query = {}

    // Admins see ALL tutorials, regular users only see published
    if (req.user?.role !== "admin") {
      query.status = "published"
    } else if (status) {
      query.status = status
    }

    if (category) {
      query.category = category
    }

    const tutorials = await Tutorial.find(query)
      .populate("author", "name photoURL")
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      tutorials,
      count: tutorials.length,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single tutorial
router.get("/:id", async (req, res) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id).populate(
      "author",
      "name photoURL"
    )

    if (!tutorial) {
      return res.status(404).json({ error: "Tutorial not found" })
    }

    // Increment views
    tutorial.views += 1
    await tutorial.save()

    res.json({
      success: true,
      tutorial,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create tutorial (admin only)
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { title, description, content, videoUrl, category, status } = req.body

    if (!title || !description || !content) {
      return res
        .status(400)
        .json({ error: "Title, description, and content are required" })
    }

    const tutorial = await Tutorial.create({
      title,
      description,
      content,
      videoUrl,
      category,
      status: status || "draft",
      author: req.user._id,
    })

    const populatedTutorial = await Tutorial.findById(tutorial._id).populate(
      "author",
      "name photoURL"
    )

    res.status(201).json({
      success: true,
      tutorial: populatedTutorial,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update tutorial (admin only)
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { title, description, content, videoUrl, category, status } = req.body

    const tutorial = await Tutorial.findByIdAndUpdate(
      req.params.id,
      { title, description, content, videoUrl, category, status },
      { new: true, runValidators: true }
    ).populate("author", "name photoURL")

    if (!tutorial) {
      return res.status(404).json({ error: "Tutorial not found" })
    }

    res.json({
      success: true,
      tutorial,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete tutorial (admin only)
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const tutorial = await Tutorial.findByIdAndDelete(req.params.id)

    if (!tutorial) {
      return res.status(404).json({ error: "Tutorial not found" })
    }

    res.json({
      success: true,
      message: "Tutorial deleted successfully",
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
