const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

// ─────────────────────────────────────────────────────────────────
// 1. Register a new Lecturer/Staff Member (POST /api/employees/register)
// ─────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, department, rfidTag, password, role } = req.body;

    const existingEmployee = await Employee.findOne({ email: email.toLowerCase() });
    if (existingEmployee) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const newEmployee = new Employee({
      name,
      email: email.toLowerCase(),
      department,
      rfidTag: rfidTag || Array.from({ length: 4 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()).join(' '),
      password: password || 'password123',
      role: role || 'Lecturer'
    });

    await newEmployee.save();
    res.status(201).json({ success: true, message: 'Account registered successfully!', data: newEmployee });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Registration failed.', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 2. Login (POST /api/employees/login)
// ─────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Hardcoded Admin Login Check
    if (email.toLowerCase() === 'admin@uom.lk' && password === 'fit@123') {
      return res.status(200).json({
        success: true,
        message: 'Admin Login successful.',
        data: {
          _id: '60c72b2f9b1d8b3a4c8e1a12', // dummy ObjectId format for frontend
          name: 'System Admin',
          email: 'admin@uom.lk',
          department: "Dean's Office",
          role: 'Admin'
        }
      });
    }

    const employee = await Employee.findOne({ email: email.toLowerCase() });
    if (!employee) {
      return res.status(401).json({ success: false, message: 'No account found with this email address.' });
    }

    if (employee.password !== password) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        role: employee.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 3. RFID Verification (POST /api/employees/verify-rfid)
//    Called by the physical robot to authenticate locker access.
// ─────────────────────────────────────────────────────────────────
router.post('/verify-rfid', async (req, res) => {
  try {
    const { rfidTag } = req.body;
    const employee = await Employee.findOne({ rfidTag });

    if (employee) {
      res.status(200).json({
        authenticated: true,
        message: `Access granted. Welcome, ${employee.name}!`,
        employee
      });
    } else {
      res.status(404).json({
        authenticated: false,
        message: 'Access denied. Unrecognised RFID card.'
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 4. Get all Employees/Lecturers (GET /api/employees/all)
// ─────────────────────────────────────────────────────────────────
router.get('/all', async (req, res) => {
  try {
    const employees = await Employee.find().select('-password');
    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 5. Find Employee by Email (GET /api/employees/find/:email)
//    Used by CreateDelivery to resolve recipient email to a name.
// ─────────────────────────────────────────────────────────────────
router.get('/find/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const employee = await Employee.findOne({ email }).select('-password');
    if (!employee) {
      return res.status(404).json({ success: false, message: 'No staff member found with this email.' });
    }
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// ─────────────────────────────────────────────────────────────────
// 6. Forgot Password (POST /api/employees/forgot-password)
// ─────────────────────────────────────────────────────────────────
const crypto = require('crypto');
const nodemailer = require('nodemailer');

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const employee = await Employee.findOne({ email: email.toLowerCase() });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'No account with that email address exists.' });
    }

    // Create token
    const token = crypto.randomBytes(20).toString('hex');
    employee.resetPasswordToken = token;
    employee.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await employee.save();

    // Use real SMTP credentials from .env
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const resetUrl = `https://officemate-webapp.vercel.app/reset-password/${token}`;
    
    let info = await transporter.sendMail({
      from: '"OfficeMate Support" <support@officemate.uom.lk>',
      to: employee.email,
      subject: "OfficeMate Password Reset Request",
      text: `You are receiving this because you (or someone else) requested a password reset.\n\n` +
            `Please click on the following link, or paste it into your browser to complete the process:\n\n` +
            `${resetUrl}\n\n` +
            `If you did not request this, please ignore this email and your password will remain unchanged.\n`
    });

    res.status(200).json({ success: true, message: 'Password reset link has been sent to your real email inbox.' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ success: false, error: 'Failed to send email. Please check server SMTP configuration.' });
  }
});

// ─────────────────────────────────────────────────────────────────
// 7. Reset Password (POST /api/employees/reset-password)
// ─────────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const employee = await Employee.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!employee) {
      return res.status(400).json({ success: false, message: 'Password reset token is invalid or has expired.' });
    }

    employee.password = newPassword;
    employee.resetPasswordToken = undefined;
    employee.resetPasswordExpires = undefined;
    await employee.save();

    res.status(200).json({ success: true, message: 'Your password has been successfully reset.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;