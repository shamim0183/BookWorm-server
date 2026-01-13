require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")

const app = express()

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "BookWorm Server is running",
    timestamp: new Date().toISOString(),
  })
})

// Routes
app.use("/api/auth", require("./routes/auth"))
app.use("/api/books", require("./routes/books"))
app.use("/api/genres", require("./routes/genres"))
app.use("/api/library", require("./routes/library"))
app.use("/api/upload", require("./routes/upload"))
app.use("/api/stats", require("./routes/stats"))
app.use("/api/recommendations", require("./routes/recommendations"))
app.use("/api/users", require("./routes/users"))
app.use("/api/reviews", require("./routes/reviews"))
app.use("/api/tutorials", require("./routes/tutorials"))

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: "Something broke!" })
})

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
