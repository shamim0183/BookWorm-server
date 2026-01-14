const express = require("express")
const router = express.Router()
const UserLibrary = require("../models/UserLibrary")
const Book = require("../models/Book")
const { protect } = require("../middleware/auth")

// Update shelf
router.put("/:id/shelf", protect, async (req, res) => {
  try {
    const { shelf } = req.body
    const entry = await UserLibrary.findOne({
      _id: req.params.id,
      user: req.user._id,
    })

    if (!entry) {
      return res.status(404).json({ error: "Library entry not found" })
    }

    entry.shelf = shelf

    // Set dateFinished when moving to 'read' shelf
    if (shelf === "read" && !entry.dateFinished) {
      entry.dateFinished = new Date()
    }

    await entry.save()

    const updated = await UserLibrary.findById(entry._id).populate({
      path: "book",
      populate: { path: "genres" },
    })

    res.json({ success: true, library: updated })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get user library
router.get("/", protect, async (req, res) => {
  try {
    const { shelf } = req.query
    const query = { user: req.user._id }
    if (shelf) query.shelf = shelf

    const library = await UserLibrary.find(query)
      .populate({ path: "book", populate: { path: "genres" } })
      .sort({ dateAdded: -1 })

    res.json({ success: true, library })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Add to library
router.post("/", protect, async (req, res) => {
  try {
    const { bookId, shelf, totalPages } = req.body

    const existing = await UserLibrary.findOne({
      user: req.user._id,
      book: bookId,
    })

    if (existing) {
      existing.shelf = shelf
      if (shelf === "currentlyReading" && totalPages) {
        existing.progress.totalPages = totalPages
      }
      await existing.save()
      const updated = await UserLibrary.findById(existing._id).populate({
        path: "book",
        populate: { path: "genres" },
      })
      return res.json({ success: true, library: updated })
    }

    const entry = await UserLibrary.create({
      user: req.user._id,
      book: bookId,
      shelf,
      progress: totalPages ? { totalPages, pagesRead: 0 } : undefined,
    })

    await Book.findByIdAndUpdate(bookId, { $inc: { totalShelved: 1 } })

    const populated = await UserLibrary.findById(entry._id).populate({
      path: "book",
      populate: { path: "genres" },
    })

    res.status(201).json({ success: true, library: populated })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update reading progress
router.put("/:id/progress", protect, async (req, res) => {
  try {
    const { pagesRead, totalPages } = req.body
    const entry = await UserLibrary.findById(req.params.id)

    if (!entry) {
      return res.status(404).json({ error: "Library entry not found" })
    }

    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" })
    }

    const percentage = Math.round((pagesRead / totalPages) * 100)

    entry.progress = {
      pagesRead: parseInt(pagesRead),
      totalPages: parseInt(totalPages),
      percentage,
    }

    // If progress reaches 100%, automatically move to "read" shelf and set dateFinished
    if (percentage >= 100) {
      entry.shelf = "read"
      entry.dateFinished = new Date()
    }

    await entry.save()

    const updatedEntry = await UserLibrary.findById(entry._id).populate("book")

    res.json({ success: true, entry: updatedEntry })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Remove from library
router.delete("/:id", protect, async (req, res) => {
  try {
    const entry = await UserLibrary.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
    await Book.findByIdAndUpdate(entry.book, { $inc: { totalShelved: -1 } })
    await entry.deleteOne()
    res.json({ success: true, message: "Removed from library" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
