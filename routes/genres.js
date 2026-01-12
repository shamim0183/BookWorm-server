const express = require("express")
const router = express.Router()
const Genre = require("../models/Genre")
const { protect, adminOnly } = require("../middleware/auth")

// Get all
router.get("/", async (req, res) => {
  try {
    const genres = await Genre.find().sort({ name: 1 })
    res.json({ success: true, genres })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { name, description } = req.body
    const genre = await Genre.create({
      name,
      description,
      createdBy: req.user._id,
    })
    res.status(201).json({ success: true, genre })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const genre = await Genre.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    })
    res.json({ success: true, genre })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Genre.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: "Genre deleted" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
