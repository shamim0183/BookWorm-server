const express = require("express")
const router = express.Router()
const Review = require("../models/Review")
const Book = require("../models/Book")
const { protect, adminOnly } = require("../middleware/auth")

// Get all reviews (with filters for admin)
router.get("/", protect, async (req, res) => {
  try {
    const { status, bookId } = req.query
    const query = {}

    // Admins can filter by status
    if (req.user.role === "admin" && status) {
      query.status = status
    } else if (req.user.role !== "admin") {
      // Regular users only see approved reviews
      query.status = "approved"
    }

    if (bookId) {
      query.book = bookId
    }

    const reviews = await Review.find(query)
      .populate("user", "name photoURL")
      .populate("book", "title author coverImage")
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      reviews,
      count: reviews.length,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create a review
router.post("/", protect, async (req, res) => {
  try {
    const { bookId, rating, comment } = req.body

    if (!bookId || !rating || !comment) {
      return res.status(400).json({ error: "All fields required" })
    }

    // Check if user already reviewed this book
    const existing = await Review.findOne({
      book: bookId,
      user: req.user._id,
    })

    if (existing) {
      return res.status(400).json({ error: "You already reviewed this book" })
    }

    const review = await Review.create({
      book: bookId,
      user: req.user._id,
      rating,
      comment,
    })

    // Update book rating (optional - simple average)
    const bookReviews = await Review.find({ book: bookId, status: "approved" })
    const avgRating =
      bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length

    await Book.findByIdAndUpdate(bookId, {
      "ratings.average": avgRating,
      "ratings.count": bookReviews.length,
    })

    const populatedReview = await Review.findById(review._id)
      .populate("user", "name photoURL")
      .populate("book", "title author")

    res.status(201).json({
      success: true,
      review: populatedReview,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update a review (user can edit their own review)
router.put("/:id", protect, async (req, res) => {
  try {
    const { rating, comment } = req.body
    const review = await Review.findById(req.params.id)

    if (!review) {
      return res.status(404).json({ error: "Review not found" })
    }

    // Only the review author can update it
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" })
    }

    // Update the review
    review.rating = rating
    review.comment = comment
    await review.save()

    // Recalculate book rating
    const bookReviews = await Review.find({
      book: review.book,
      status: "approved",
    })
    const avgRating =
      bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length

    await Book.findByIdAndUpdate(review.book, {
      "ratings.average": avgRating,
      "ratings.count": bookReviews.length,
    })

    const updatedReview = await Review.findById(review._id)
      .populate("user", "name photoURL")
      .populate("book", "title author")

    res.json({
      success: true,
      review: updatedReview,
      message: "Review updated successfully",
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update review status (admin only)
router.put("/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" })
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      {
        status,
        moderatedBy: req.user._id,
        moderatedAt: new Date(),
      },
      { new: true }
    )
      .populate("user", "name photoURL")
      .populate("book", "title author")

    if (!review) {
      return res.status(404).json({ error: "Review not found" })
    }

    // Recalculate book rating
    const bookReviews = await Review.find({
      book: review.book._id,
      status: "approved",
    })
    const avgRating =
      bookReviews.length > 0
        ? bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length
        : 0

    await Book.findByIdAndUpdate(review.book._id, {
      "ratings.average": avgRating,
      "ratings.count": bookReviews.length,
    })

    res.json({
      success: true,
      review,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete review
router.delete("/:id", protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)

    if (!review) {
      return res.status(404).json({ error: "Review not found" })
    }

    // Only allow users to delete their own reviews, or admins to delete any
    if (
      review.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Not authorized" })
    }

    await review.deleteOne()

    // Recalculate book rating
    const bookReviews = await Review.find({
      book: review.book,
      status: "approved",
    })
    const avgRating =
      bookReviews.length > 0
        ? bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length
        : 0

    await Book.findByIdAndUpdate(review.book, {
      "ratings.average": avgRating,
      "ratings.count": bookReviews.length,
    })

    res.json({
      success: true,
      message: "Review deleted",
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
