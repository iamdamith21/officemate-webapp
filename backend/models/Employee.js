const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    // Stored as plain text for the prototype system (no hashing for simplicity)
    type: String,
    required: true,
    default: 'password123'
  },
  department: {
    type: String,
    required: true,
    enum: [
      'Department of Information Technology',
      'Department of Computational Technology',
      'Department of Interdisciplinary Studies',
      'Dean\'s Office'
    ]
  },
  rfidTag: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['Lecturer', 'Admin'],
    default: 'Lecturer'
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Employee', EmployeeSchema);