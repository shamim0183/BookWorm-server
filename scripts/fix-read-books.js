const mongoose = require("mongoose")
const UserLibrary = require("../models/UserLibrary")
require("dotenv").config()

async function fixReadBooks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("Connected to MongoDB")

    // Find all books on 'read' shelf without dateFinished
    const result = await UserLibrary.updateMany(
      { shelf: "read", dateFinished: { $exists: false } },
      { $set: { dateFinished: new Date() } }
    )

    console.log(`✅ Updated ${result.modifiedCount} books with dateFinished`)

    process.exit(0)
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

fixReadBooks()
