const express = require("express")
const router = express.Router()
const ReadingGoal = require("../models/ReadingGoal")
const UserLibrary = require("../models/UserLibrary")
const { protect } = require("../middleware/auth")

// GET current year's reading goal
router.get("/", protect, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear()
    let goal = await ReadingGoal.findOne({
      user: req.user._id,
      year: currentYear,
    })

    // Get current progress
    const booksRead = await UserLibrary.countDocuments({
      user: req.user._id,
      shelf: "read",
      dateCompleted: {
        $gte: new Date(currentYear, 0, 1),
        $lt: new Date(currentYear + 1, 0, 1),
      },
    })

    if (goal) {
      return res.json({
        success: true,
        goal: {
          ...goal.toObject(),
          currentBooks: booksRead,
          percentage:
            goal.targetBooks > 0
              ? Math.round((booksRead / goal.targetBooks) * 100)
              : 0,
        },
      })
    }

    // No goal set yet
    res.json({
      success: true,
      goal: null,
      currentBooks: booksRead,
    })
  } catch (error) {
    console.error("Error fetching reading goal:", error)
    res.status(500).json({ error: "Failed to fetch reading goal" })
  }
})

// SET/UPDATE reading goal
router.post("/", protect, async (req, res) => {
  try {
    const { targetBooks, year } = req.body

    if (!targetBooks || targetBooks < 1) {
      return res.status(400).json({ error: "Target must be at least 1 book" })
    }

    const goalYear = year || new Date().getFullYear()

    const goal = await ReadingGoal.findOneAndUpdate(
      { user: req.user._id, year: goalYear },
      { targetBooks },
      { upsert: true, new: true }
    )

    // Get current progress
    const booksRead = await UserLibrary.countDocuments({
      user: req.user._id,
      shelf: "read",
      dateCompleted: {
        $gte: new Date(goalYear, 0, 1),
        $lt: new Date(goalYear + 1, 0, 1),
      },
    })

    res.json({
      success: true,
      goal: {
        ...goal.toObject(),
        currentBooks: booksRead,
        percentage:
          goal.targetBooks > 0
            ? Math.round((booksRead / goal.targetBooks) * 100)
            : 0,
      },
    })
  } catch (error) {
    console.error("Error setting reading goal:", error)
    res.status(500).json({ error: "Failed to set reading goal" })
  }
})

module.exports = router
