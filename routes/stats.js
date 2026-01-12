const express = require("express")
const router = express.Router()
const UserLibrary = require("../models/UserLibrary")
const { protect } = require("../middleware/auth")

// Get user library statistics
router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user._id

    // Get all library entries for the user
    const library = await UserLibrary.find({ user: userId }).populate("book")

    // Calculate statistics
    const stats = {
      totalBooks: library.length,
      byShelf: {
        wantToRead: library.filter((entry) => entry.shelf === "wantToRead")
          .length,
        currentlyReading: library.filter(
          (entry) => entry.shelf === "currentlyReading"
        ).length,
        read: library.filter((entry) => entry.shelf === "read").length,
      },
      totalPagesRead: library.reduce(
        (sum, entry) => sum + (entry.progress?.pagesRead || 0),
        0
      ),
      booksCompletedThisYear: library.filter((entry) => {
        if (!entry.dateFinished) return false
        const year = new Date().getFullYear()
        return new Date(entry.dateFinished).getFullYear() === year
      }).length,
      booksCompletedThisMonth: library.filter((entry) => {
        if (!entry.dateFinished) return false
        const now = new Date()
        const finished = new Date(entry.dateFinished)
        return (
          finished.getMonth() === now.getMonth() &&
          finished.getFullYear() === now.getFullYear()
        )
      }).length,
      averageRating:
        library.filter((e) => e.personalRating).length > 0
          ? (
              library.reduce(
                (sum, entry) => sum + (entry.personalRating || 0),
                0
              ) / library.filter((e) => e.personalRating).length
            ).toFixed(1)
          : 0,
    }

    res.json({ success: true, stats })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
