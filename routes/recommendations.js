const express = require("express")
const router = express.Router()
const Book = require("../models/Book")
const UserLibrary = require("../models/UserLibrary")
const { protect } = require("../middleware/auth")

// GET /api/recommendations - Get personalized book recommendations
router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user._id

    // Get user's library entries
    const userLibrary = await UserLibrary.find({ user: userId }).populate(
      "book"
    )

    // Get books user has already read or added
    const userBookIds = userLibrary.map((entry) => entry.book._id)

    // Get user's Read shelf books to analyze preferences
    const readBooks = userLibrary.filter((entry) => entry.shelf === "read")

    let recommendations = []

    if (readBooks.length >= 3) {
      // User has enough reading history - personalized recommendations

      // 1. Calculate favorite genres (most common in Read shelf)
      const genreCounts = {}
      readBooks.forEach((entry) => {
        if (entry.book && entry.book.genres) {
          entry.book.genres.forEach((genreId) => {
            const id = genreId.toString()
            genreCounts[id] = (genreCounts[id] || 0) + 1
          })
        }
      })

      // Get top 3 genres
      const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([genreId]) => genreId)

      // 2. Get user's average rating
      const ratingsGiven = readBooks
        .filter((entry) => entry.rating && entry.rating > 0)
        .map((entry) => entry.rating)

      const avgRating =
        ratingsGiven.length > 0
          ? ratingsGiven.reduce((sum, r) => sum + r, 0) / ratingsGiven.length
          : 4.0

      // 3. Find books matching user's preferences
      recommendations = await Book.find({
        _id: { $nin: userBookIds },
        genres: { $in: topGenres },
        "ratings.average": { $gte: avgRating - 0.5 },
      })
        .populate("genres")
        .sort({ "ratings.average": -1, totalShelved: -1 })
        .limit(18)
    } else {
      // New user or not enough reading history - show popular books
      recommendations = await Book.find({
        _id: { $nin: userBookIds },
      })
        .populate("genres")
        .sort({ "ratings.average": -1, totalShelved: -1 })
        .limit(18)
    }

    // Add recommendation reason for each book
    const recommendationsWithReason = recommendations.map((book) => {
      let reason = "Popular on BookWorm"

      if (readBooks.length >= 3 && book.genres && book.genres.length > 0) {
        const genreName = book.genres[0].name
        const matchedBooksCount = readBooks.filter(
          (entry) =>
            entry.book.genres &&
            entry.book.genres.some(
              (g) => g.toString() === book.genres[0]._id.toString()
            )
        ).length

        if (matchedBooksCount > 0) {
          reason = `You've read ${matchedBooksCount} ${genreName} book${
            matchedBooksCount > 1 ? "s" : ""
          }`
        }
      }

      return {
        ...book.toObject(),
        recommendationReason: reason,
      }
    })

    // Get user stats
    const stats = {
      totalRead: userLibrary.filter((e) => e.shelf === "read").length,
      currentlyReading: userLibrary.filter(
        (e) => e.shelf === "currently-reading"
      ).length,
      wantToRead: userLibrary.filter((e) => e.shelf === "wantToRead").length,
    }

    res.json({
      recommendations: recommendationsWithReason,
      stats,
    })
  } catch (error) {
    console.error("Error getting recommendations:", error)
    res.status(500).json({ error: "Failed to get recommendations" })
  }
})

module.exports = router
