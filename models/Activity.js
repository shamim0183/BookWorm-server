const mongoose = require("mongoose")

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "added_book",
        "reviewed_book",
        "updated_progress",
        "followed_user",
      ],
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
)

// Index for efficient feed queries
activitySchema.index({ user: 1, createdAt: -1 })
activitySchema.index({ createdAt: -1 })

module.exports = mongoose.model("Activity", activitySchema)
