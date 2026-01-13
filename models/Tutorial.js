const mongoose = require("mongoose")

const tutorialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    videoUrl: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Getting Started",
        "Reading Tips",
        "Book Management",
        "Community",
        "Advanced Features",
      ],
      default: "Getting Started",
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

// Index for faster queries
tutorialSchema.index({ status: 1, category: 1 })
tutorialSchema.index({ title: "text", content: "text" })

module.exports = mongoose.model("Tutorial", tutorialSchema)
