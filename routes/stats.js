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

// Enhanced stats for charts and visualizations
router.get("/enhanced", protect, async (req, res) => {
  try {
    const userId = req.user._id
    const currentYear = new Date().getFullYear()

    // Get all library entries
    const library = await UserLibrary.find({ user: userId }).populate({
      path: "book",
      populate: { path: "genres" },
    })

    const readBooks = library.filter((e) => e.shelf === "read")

    // 1. Monthly books read (last 12 months)
    const monthlyBooks = []
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]

    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const month = date.getMonth()
      const year = date.getFullYear()

      const count = readBooks.filter((entry) => {
        if (!entry.dateFinished) return false
        const finished = new Date(entry.dateFinished)
        return finished.getMonth() === month && finished.getFullYear() === year
      }).length

      monthlyBooks.push({
        month: monthNames[month],
        year: year,
        count: count,
      })
    }

    // 2. Genre breakdown
    const genreCounts = {}
    readBooks.forEach((entry) => {
      if (entry.book && entry.book.genres) {
        entry.book.genres.forEach((genre) => {
          const genreName = genre.name || "Unknown"
          genreCounts[genreName] = (genreCounts[genreName] || 0) + 1
        })
      }
    })

    const totalGenreBooks = Object.values(genreCounts).reduce(
      (a, b) => a + b,
      0
    )
    const genreBreakdown = Object.entries(genreCounts)
      .map(([genre, count]) => ({
        genre,
        count,
        percentage:
          totalGenreBooks > 0 ? Math.round((count / totalGenreBooks) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6) // Top 6 genres

    // 3. Reading streak (consecutive days with progress)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let streak = 0
    let checkDate = new Date(today)

    while (true) {
      const hasActivity = library.some((entry) => {
        if (!entry.updatedAt) return false
        const updated = new Date(entry.updatedAt)
        updated.setHours(0, 0, 0, 0)
        return updated.getTime() === checkDate.getTime()
      })

      if (hasActivity) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    // 4. Books read this year
    const booksThisYear = readBooks.filter((entry) => {
      if (!entry.dateFinished) return false
      return new Date(entry.dateFinished).getFullYear() === currentYear
    }).length

    // 5. Total pages read
    const totalPages = library.reduce(
      (sum, entry) => sum + (entry.progress?.pagesRead || 0),
      0
    )

    res.json({
      success: true,
      data: {
        monthlyBooks,
        genreBreakdown,
        readingStreak: streak,
        booksThisYear,
        totalPages,
      },
    })
  } catch (error) {
    console.error("Error fetching enhanced stats:", error)
    res.status(500).json({ error: "Failed to fetch enhanced stats" })
  }
})

module.exports = router
