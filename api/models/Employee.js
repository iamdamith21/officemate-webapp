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
  phone: {
    // Recipient's mobile in E.164 format (e.g. +9477XXXXXXX) for SMS delivery alerts.
    // Optional — if absent, the SMS step is skipped gracefully.
    type: String,
    default: '',
    trim: true,
    validate: {
      // Allow empty (optional field) or a valid E.164 number.
      validator: (v) => v === '' || /^\+\d{9,15}$/.test(v),
      message: 'Phone must be in E.164 format, e.g. +94771234567.'
    }
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
  position: {
    type: String,
    required: true,
    enum: [
      'Lecturer',
      'Senior Lecturer',
      'Probationary Lecturer',
      'Temporary Lecturer',
      'Instructor',
      'Other'
    ],
    default: 'Lecturer'
  },
  rfidTag: {
    type: String,
    required: true,
    unique: true,
    match: [/^[0-9A-Fa-f]{2}( [0-9A-Fa-f]{2}){3}$/, 'RFID must be in hexadecimal format (e.g., 38 8B 95 1A)']
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

// Never expose sensitive fields when a document is serialised to JSON
// (res.json, populated sub-documents, etc.). Password comparison uses the
// document field directly, so this transform doesn't affect auth logic.
EmployeeSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    return ret;
  }
});

module.exports = mongoose.model('Employee', EmployeeSchema);