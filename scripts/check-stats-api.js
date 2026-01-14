const mongoose = require("mongoose")
const UserLibrary = require("../models/UserLibrary")
const Book = require("../models/Book")
require("dotenv").config()

async function checkStatsAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("Connected to MongoDB")

    // Simulate getting the first user
    const library = await UserLibrary.find({}).populate("book").limit(10)

    if (library.length === 0) {
      console.log("No library entries found")
      process.exit(0)
    }

    const userId = library[0].user
    console.log(`\n📊 Checking stats for user: ${userId}\n`)

    // Get all library entries for this user
    const userLibrary = await UserLibrary.find({ user: userId }).populate(
      "book"
    )

    // Calculate statistics (same logic as stats.js)
    const stats = {
      totalBooks: userLibrary.length,
      byShelf: {
        wantToRead: userLibrary.filter((entry) => entry.shelf === "wantToRead")
          .length,
        currentlyReading: userLibrary.filter(
          (entry) => entry.shelf === "currentlyReading"
        ).length,
        read: userLibrary.filter((entry) => entry.shelf === "read").length,
      },
      totalPagesRead: userLibrary.reduce(
        (sum, entry) => sum + (entry.progress?.pagesRead || 0),
        0
      ),
      booksCompletedThisYear: userLibrary.filter((entry) => {
        if (!entry.dateFinished) return false
        const year = new Date().getFullYear()
        return new Date(entry.dateFinished).getFullYear() === year
      }).length,
      booksCompletedThisMonth: userLibrary.filter((entry) => {
        if (!entry.dateFinished) return false
        const now = new Date()
        const finished = new Date(entry.dateFinished)
        return (
          finished.getMonth() === now.getMonth() &&
          finished.getFullYear() === now.getFullYear()
        )
      }).length,
      averageRating:
        userLibrary.filter((e) => e.personalRating).length > 0
          ? (
              userLibrary.reduce(
                (sum, entry) => sum + (entry.personalRating || 0),
                0
              ) / userLibrary.filter((e) => e.personalRating).length
            ).toFixed(1)
          : 0,
    }

    console.log("📈 STATS RESPONSE:")
    console.log(JSON.stringify(stats, null, 2))

    console.log("\n✅ Field Mappings:")
    console.log(
      `booksRead (for dashboard) = booksCompletedThisYear = ${stats.booksCompletedThisYear}`
    )
    console.log(
      `currentlyReading (for dashboard) = byShelf.currentlyReading = ${stats.byShelf.currentlyReading}`
    )
    console.log(
      `avgRating (for dashboard) = averageRating = ${stats.averageRating}`
    )
    console.log(
      `pagesRead (for dashboard) = totalPagesRead = ${stats.totalPagesRead}`
    )

    process.exit(0)
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

checkStatsAPI()
