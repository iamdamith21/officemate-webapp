// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import Routes
const employeeRoutes = require('./routes/employeeRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const robotRoutes = require('./routes/robotRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Database Connection
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI environment variable is missing in Vercel!');
}

app.use((req, res, next) => {
  if (!MONGO_URI) {
    return res.status(500).json({ success: false, error: 'Database configuration missing (MONGO_URI). Please add it to Vercel Environment Variables and redeploy.' });
  }
  next();
});

if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('🍃 MongoDB Database Connected Successfully!'))
    .catch((err) => console.error('❌ Database Connection Error:', err));
}

// API Routes Setup
// Depending on Vercel's rewrite mechanism, req.url might have /api stripped.
// So we mount on both with and without /api prefix to be safe.
app.use('/api/employees', employeeRoutes);  // Employee operations
app.use('/employees', employeeRoutes);

app.use('/api/deliveries', deliveryRoutes); // Robot delivery requests
app.use('/deliveries', deliveryRoutes);

app.use('/api/robot', robotRoutes);         // Robot live status updates
app.use('/robot', robotRoutes);

// Health Check Endpoint — useful for debugging Vercel deployments
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'OfficeMate API is healthy.',
    mongoConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString()
  });
});
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'OfficeMate API is healthy.',
    mongoConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString()
  });
});

// Root API Endpoint
app.get('/api', (req, res) => {
  res.send('🚀 OfficeMate Backend Server is running successfully.');
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found on Vercel. Requested path: ${req.url}, Original URL: ${req.originalUrl}`
  });
});
// Vercel Serverless Export
module.exports = app;

// Local Development Server Support
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`📡 Backend Server is live on http://localhost:${PORT}`);
  });
}