const mongoose = require("mongoose")

const userLibrarySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    shelf: {
      type: String,
      enum: ["wantToRead", "currentlyReading", "read"],
      required: true,
    },
    progress: {
      pagesRead: { type: Number, default: 0 },
      totalPages: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
    },
    personalRating: Number,
    dateAdded: {
      type: Date,
      default: Date.now,
    },
    dateFinished: Date,
  },
  { timestamps: true }
)

userLibrarySchema.index({ user: 1, book: 1 }, { unique: true })

module.exports = mongoose.model("UserLibrary", userLibrarySchema)
