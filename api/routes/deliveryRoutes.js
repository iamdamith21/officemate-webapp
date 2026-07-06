const express = require('express');
const router = express.Router();
const DeliveryRequest = require('../models/DeliveryRequest');
const nodemailer = require('nodemailer');

// ─────────────────────────────────────────────────────────────────
// 1. Create a Delivery Request (POST /api/deliveries/request)
//    Called by a lecturer to initiate a new delivery.
// ─────────────────────────────────────────────────────────────────
router.post('/request', async (req, res) => {
  try {
    const {
      employeeId,
      senderEmail,
      recipientEmail,
      recipientName,
      pickupLocation,
      deliveryDestination,
      description
    } = req.body;

    const newRequest = new DeliveryRequest({
      employeeId,
      senderEmail: senderEmail || '',
      recipientEmail,
      recipientName,
      pickupLocation,
      deliveryDestination,
      description,
      status: 'Requested'
    });

    await newRequest.save();
    const populated = await newRequest.populate('employeeId');

    // Send email alert to recipient
    try {
      let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: '"OfficeMate Support" <support@officemate.uom.lk>',
        to: recipientEmail,
        subject: "New OfficeMate Delivery Request",
        text: `Hello ${recipientName},\n\nYou have a new delivery request from ${senderEmail} waiting for your confirmation.\n\nDescription: ${description}\nPickup: ${pickupLocation}\nDestination: ${deliveryDestination}\n\nPlease login to your OfficeMate Dashboard to accept or decline the request.\n\nThank you,\nOfficeMate Delivery System`
      });
      console.log(`Email notification sent to ${recipientEmail}`);
    } catch (emailErr) {
      console.error('Failed to send email notification:', emailErr);
      // We don't fail the request if email fails, it just skips the email.
    }

    res.status(201).json({
      success: true,
      message: 'Delivery request submitted. Waiting for recipient confirmation.',
      data: populated
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 2. Get All Delivery Requests (GET /api/deliveries/all)
// ─────────────────────────────────────────────────────────────────
router.get('/all', async (req, res) => {
  try {
    const requests = await DeliveryRequest.find()
      .populate('employeeId')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 3. Get Pending Requests for a Recipient (GET /api/deliveries/pending-for/:email)
//    Called by the recipient's dashboard to check for incoming confirmations.
// ─────────────────────────────────────────────────────────────────
router.get('/pending-for/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const pendingRequests = await DeliveryRequest.find({
      recipientEmail: email,
      status: 'Requested'
    }).populate('employeeId').sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: pendingRequests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 4. Recipient Confirms Delivery (PATCH /api/deliveries/confirm/:id)
//    Recipient presses "Accept" on the popup. Status → Confirmed.
// ─────────────────────────────────────────────────────────────────
router.patch('/confirm/:id', async (req, res) => {
  try {
    const updated = await DeliveryRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'Heading to Sender' },
      { new: true }
    ).populate('employeeId');

    if (!updated) return res.status(404).json({ success: false, message: 'Delivery request not found.' });

    // Automatically update the robot status to 'Moving' and assign the current task
    const RobotStatus = require('../models/RobotStatus');
    await RobotStatus.findOneAndUpdate(
      { robotId: "OFFICEMATE_ROBOT_01" },
      { 
        status: 'Moving', 
        currentTaskId: updated._id,
        currentLocation: "Dean's Office" // Base station start
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Delivery confirmed. The robot is now heading to the sender.',
      data: updated
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 5. Recipient Declines Delivery (PATCH /api/deliveries/decline/:id)
// ─────────────────────────────────────────────────────────────────
router.patch('/decline/:id', async (req, res) => {
  try {
    const updated = await DeliveryRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'Cancelled' },
      { new: true }
    ).populate('employeeId');

    if (!updated) return res.status(404).json({ success: false, message: 'Delivery request not found.' });

    res.status(200).json({
      success: true,
      message: 'Delivery declined and cancelled.',
      data: updated
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 6. Update Delivery Status (PATCH /api/deliveries/update-status/:id)
//    Used by Admin or the physical robot to advance through states.
// ─────────────────────────────────────────────────────────────────
router.patch('/update-status/:id', async (req, res) => {
  try {
    const { status, rfidAuthorized } = req.body;
    const updateFields = {};
    if (status) updateFields.status = status;
    if (rfidAuthorized !== undefined) updateFields.rfidAuthorized = rfidAuthorized;

    const updated = await DeliveryRequest.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    ).populate('employeeId');

    if (!updated) return res.status(404).json({ success: false, message: 'Delivery request not found.' });

    res.status(200).json({ success: true, message: 'Delivery status updated!', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});



module.exports = router;