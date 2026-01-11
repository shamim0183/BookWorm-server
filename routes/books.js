const express = require("express")
const router = express.Router()
const Book = require("../models/Book")
const { protect, adminOnly } = require("../middleware/auth")

// Get all with filters
router.get("/", async (req, res) => {
  try {
    const { search, genre, page = 1, limit = 20 } = req.query
    const query = {}

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ]
    }

    if (genre) query.genres = genre

    const books = await Book.find(query)
      .populate("genres", "name")
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))

    const total = await Book.countDocuments(query)

    res.json({
      success: true,
      books,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single
router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate("genres", "name")
    res.json({ success: true, book })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const book = await Book.create({ ...req.body, createdBy: req.user._id })
    const populated = await Book.findById(book._id).populate("genres", "name")
    res.status(201).json({ success: true, book: populated })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("genres", "name")
    res.json({ success: true, book })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: "Book deleted" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
