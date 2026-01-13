const mongoose = require("mongoose")

const bookSchema = new mongoose.Schema(
  {
    isbn: String,
    olid: String,
    coverId: Number,
    title: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    description: String,
    totalPages: Number,
    coverImage: String, // Custom uploaded cover image URL
    publishYear: Number,
    genres: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Genre",
      },
    ],
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    totalShelved: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
)

bookSchema.index({ title: "text", author: "text" })

module.exports = mongoose.model("Book", bookSchema)
