const express = require("express")
const router = express.Router()
const User = require("../models/User")
const Activity = require("../models/Activity")
const auth = require("../middleware/auth")

// Follow a user
router.post("/follow/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params
    const currentUserId = req.user.userId

    // Prevent self-follow
    if (userId === currentUserId) {
      return res.status(400).json({ message: "Cannot follow yourself" })
    }

    // Check if target user exists
    const targetUser = await User.findById(userId)
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" })
    }

    // Check if already following
    const currentUser = await User.findById(currentUserId)
    if (currentUser.following.includes(userId)) {
      return res.status(400).json({ message: "Already following this user" })
    }

    // Update both users
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { following: userId },
    })

    await User.findByIdAndUpdate(userId, {
      $addToSet: { followers: currentUserId },
    })

    // Create activity
    await Activity.create({
      user: currentUserId,
      type: "followed_user",
      targetUser: userId,
    })

    res.json({ message: "Successfully followed user" })
  } catch (error) {
    console.error("Follow error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Unfollow a user
router.delete("/unfollow/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params
    const currentUserId = req.user.userId

    // Update both users
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: userId },
    })

    await User.findByIdAndUpdate(userId, {
      $pull: { followers: currentUserId },
    })

    res.json({ message: "Successfully unfollowed user" })
  } catch (error) {
    console.error("Unfollow error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get followers list
router.get("/followers/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findById(userId).populate(
      "followers",
      "name email photoURL"
    )

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(user.followers)
  } catch (error) {
    console.error("Get followers error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get following list
router.get("/following/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findById(userId).populate(
      "following",
      "name email photoURL"
    )

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(user.following)
  } catch (error) {
    console.error("Get following error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get activity feed (from users you follow)
router.get("/feed", auth, async (req, res) => {
  try {
    const currentUserId = req.user.userId
    const limit = parseInt(req.query.limit) || 20

    // Get current user's following list
    const currentUser = await User.findById(currentUserId)
    const followingIds = currentUser.following

    // Get activities from followed users
    const activities = await Activity.find({
      user: { $in: followingIds },
    })
      .populate("user", "name photoURL")
      .populate("book", "title coverUrl")
      .populate("targetUser", "name photoURL")
      .sort({ createdAt: -1 })
      .limit(limit)

    res.json(activities)
  } catch (error) {
    console.error("Get feed error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Search users
router.get("/users/search", auth, async (req, res) => {
  try {
    const { q } = req.query

    if (!q || q.trim() === "") {
      return res.status(400).json({ message: "Search query is required" })
    }

    const users = await User.find({
      name: { $regex: q, $options: "i" },
      _id: { $ne: req.user.userId }, // Exclude current user
    })
      .select("name email photoURL followers following")
      .limit(20)

    res.json(users)
  } catch (error) {
    console.error("Search users error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get user profile
router.get("/profile/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findById(userId).select(
      "name email photoURL role createdAt followers following"
    )

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Check if current user is following this user
    const isFollowing = user.followers.includes(req.user.userId)

    res.json({
      ...user.toObject(),
      followerCount: user.followers.length,
      followingCount: user.following.length,
      isFollowing,
    })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
