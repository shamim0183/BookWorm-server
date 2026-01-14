const express = require("express")
const router = express.Router()
const Book = require("../models/Book")
const User = require("../models/User")
const Review = require("../models/Review")
const { protect, adminOnly } = require("../middleware/auth")

// GET /api/admin/stats - Get admin dashboard statistics
router.get("/stats", protect, adminOnly, async (req, res) => {
  try {
    // 1. Total Books
    const totalBooks = await Book.countDocuments()

    // 2. Total Users
    const totalUsers = await User.countDocuments()

    // 3. Pending Reviews (reviews that need moderation)
    const pendingReviews = await Review.countDocuments({ status: "pending" })

    // 4. New Users This Month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth },
    })

    res.json({
      success: true,
      stats: {
        totalBooks,
        totalUsers,
        pendingReviews,
        newUsersThisMonth,
      },
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    res.status(500).json({ error: "Failed to fetch admin stats" })
  }
})

module.exports = router
