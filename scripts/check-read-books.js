const mongoose = require("mongoose")
const UserLibrary = require("../models/UserLibrary")
const Book = require("../models/Book")
require("dotenv").config()

async function checkReadBooks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("Connected to MongoDB")

    // Find all books on 'read' shelf
    const readBooks = await UserLibrary.find({ shelf: "read" }).populate("book")

    console.log(`\n📊 Found ${readBooks.length} books on 'read' shelf:\n`)

    readBooks.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.book?.title || "Unknown"}`)
      console.log(`   Shelf: ${entry.shelf}`)
      console.log(`   dateFinished: ${entry.dateFinished || "NOT SET ❌"}`)
      console.log(`   Progress: ${entry.progress?.percentage || 0}%`)
      console.log("")
    })

    // Count books WITH dateFinished
    const withDate = readBooks.filter((b) => b.dateFinished).length
    console.log(`✅ Books with dateFinished: ${withDate}`)
    console.log(`❌ Books without dateFinished: ${readBooks.length - withDate}`)

    process.exit(0)
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

checkReadBooks()
