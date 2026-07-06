const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { initiateCallerIdVerification } = require('../utils/sms');

// ─────────────────────────────────────────────────────────────────
// 1. Register a new Lecturer/Staff Member (POST /api/employees/register)
// ─────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, department, rfidTag, password, role } = req.body;

    const existingEmployee = await Employee.findOne({ email: email.toLowerCase() });
    if (existingEmployee) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const newEmployee = new Employee({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      department,
      rfidTag: rfidTag || Array.from({ length: 4 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()).join(' '),
      password: password || 'password123',
      role: role || 'Lecturer'
    });

    await newEmployee.save();

    // If the user supplied a phone number, automatically start Twilio
    // caller-ID verification so their number can receive SMS delivery
    // alerts. Twilio calls the number; the user enters the code we return.
    // Non-blocking: registration succeeds regardless of the outcome.
    let smsVerification = { started: false };
    if (newEmployee.phone) {
      smsVerification = await initiateCallerIdVerification(newEmployee.phone, newEmployee.name);
    }

    res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      data: newEmployee,
      smsVerification
    });
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

    // Fallback admin seeding for Vercel serverless (startup .then() may not run)
    if (email.toLowerCase() === 'admin@uom.lk') {
      try {
        const adminExists = await Employee.findOne({ email: 'admin@uom.lk' });
        if (!adminExists) {
          await Employee.create({
            name: 'System Admin',
            email: 'admin@uom.lk',
            department: "Dean's Office",
            role: 'Admin',
            password: 'fit@123',
            rfidTag: 'AD 00 00 01'
          });
          console.log('🌱 Admin seeded via login route fallback.');
        }
      } catch (seedErr) {
        console.error('Admin seed fallback error (non-fatal):', seedErr.message);
      }
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
        role: employee.role,
        phone: employee.phone || ''
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
// 4. Change Password (POST /api/employees/change-password)
// ─────────────────────────────────────────────────────────────────
router.post('/change-password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    
    const employee = await Employee.findOne({ email: email.toLowerCase() });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    if (employee.password !== currentPassword) {
      return res.status(401).json({ success: false, message: 'Incorrect current password.' });
    }

    employee.password = newPassword;
    await employee.save();

    res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 5. Update Profile (PUT /api/employees/update-profile)
// ─────────────────────────────────────────────────────────────────
router.put('/update-profile', async (req, res) => {
  try {
    const { email, newEmail, newDepartment, newPhone } = req.body;
    
    // Check if new email is already taken by someone else
    if (newEmail && newEmail.toLowerCase() !== email.toLowerCase()) {
      const existing = await Employee.findOne({ email: newEmail.toLowerCase() });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email is already in use.' });
      }
    }

    const employee = await Employee.findOne({ email: email.toLowerCase() });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    if (newEmail) employee.email = newEmail.toLowerCase();
    if (newDepartment) employee.department = newDepartment;

    // Detect a phone change so we can (re)start SMS verification for the new number.
    let phoneChanged = false;
    if (newPhone !== undefined && newPhone.trim() !== employee.phone) {
      employee.phone = newPhone.trim();
      phoneChanged = true;
    }

    await employee.save();

    // If the phone number was set/changed, auto-start Twilio caller-ID verification.
    let smsVerification = { started: false };
    if (phoneChanged && employee.phone) {
      smsVerification = await initiateCallerIdVerification(employee.phone, employee.name);
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      smsVerification,
      data: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        department: employee.department,
        role: employee.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 6. Get all Employees/Lecturers (GET /api/employees/all)
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
// 6. Find Employee by Email (GET /api/employees/find/:email)
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
// 7. Forgot Password (POST /api/employees/forgot-password)
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

    // Build the reset link from APP_BASE_URL (or the request origin) so it
    // works in dev and production without a hard-coded domain.
    const baseUrl = process.env.APP_BASE_URL || req.headers.origin || 'https://officemate-webapp.vercel.app';
    const resetUrl = `${baseUrl}/reset-password/${token}`;

    // Guard: if SMTP isn't configured, log the link and simulate success instead of failing.
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_USER.includes('your-email')) {
      console.log(`\n========================================`);
      console.log(`[DEV MODE] PASSWORD RESET LINK:`);
      console.log(resetUrl);
      console.log(`========================================\n`);
      return res.status(200).json({
        success: true,
        message: 'Email service is not configured. (Dev Mode: Check server console for reset link)',
        resetUrl: resetUrl
      });
    }



    // Use real SMTP credentials from .env
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });



    let info = await transporter.sendMail({
      from: '"OfficeMate Support" <support@officemate.uom.lk>',
      to: employee.email,
      subject: "OfficeMate Password Reset Request",
      text: `You are receiving this because you (or someone else) requested a password reset.\n\n` +
            `Please click on the following link, or paste it into your browser to complete the process:\n\n` +
            `${resetUrl}\n\n` +
            `If you did not request this, please ignore this email and your password will remain unchanged.\n`
    });

    res.status(200).json({ success: true, message: 'Password reset instructions have been sent to your email.' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ success: false, error: 'Failed to send email. Please check server SMTP configuration.' });
  }
});

// ─────────────────────────────────────────────────────────────────
// 8. Reset Password (POST /api/employees/reset-password)
// ─────────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const employee = await Employee.findOne({ resetPasswordToken: token });

    if (!employee) {
      console.log(`[RESET PWD] Token not found: ${token}`);
      return res.status(400).json({ success: false, message: 'Password reset token is invalid.' });
    }

    if (employee.resetPasswordExpires < Date.now()) {
      console.log(`[RESET PWD] Token expired for user: ${employee.email}`);
      return res.status(400).json({ success: false, message: 'Password reset token has expired. Please request a new one.' });
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