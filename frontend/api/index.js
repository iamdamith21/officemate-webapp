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

if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('🍃 MongoDB Database Connected Successfully!'))
    .catch((err) => console.error('❌ Database Connection Error:', err));
}

// API Routes Setup
app.use('/api/employees', employeeRoutes);  // Employee operations
app.use('/api/deliveries', deliveryRoutes); // Robot delivery requests
app.use('/api/robot', robotRoutes);         // Robot live status updates

// Root API Endpoint
app.get('/', (req, res) => {
  res.send('🚀 OfficeMate Backend Server is running successfully.');
});

module.exports = app;