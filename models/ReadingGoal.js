const mongoose = require("mongoose")

const readingGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    targetBooks: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: true }
)

// Ensure one goal per user per year
readingGoalSchema.index({ user: 1, year: 1 }, { unique: true })

module.exports = mongoose.model("ReadingGoal", readingGoalSchema)
