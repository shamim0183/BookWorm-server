const express = require("express")
const router = express.Router()
const User = require("../models/User")
const { protect, adminOnly } = require("../middleware/auth")

// Get all users (admin only)
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 })

    res.json({
      success: true,
      users,
      count: users.length,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update user role (admin only)
router.put("/:id/role", protect, adminOnly, async (req, res) => {
  try {
    const { role } = req.body

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" })
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password")

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({
      success: true,
      user,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete user (admin only)
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
