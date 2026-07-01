const mongoose = require('mongoose');

const DeliveryRequestSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  senderEmail: {
    type: String,
    default: ''
  },
  recipientEmail: {
    // Email of the recipient — used to notify and filter for the recipient's dashboard
    type: String,
    required: true
  },
  recipientName: {
    type: String,
    required: true
  },
  pickupLocation: {
    // The sender's location (e.g., "Dept of IT - Room 101")
    type: String,
    required: true
  },
  deliveryDestination: {
    // The recipient's location (e.g., "Dept of CT - Room 202")
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: [
      'Requested',        // Step 1: Lecturer has placed the delivery request
      'Confirmed',        // Step 2: Recipient has confirmed — robot starts moving
      'Heading to Sender', // Step 3: Robot is travelling to sender's location for pickup
      'Heading to Recipient', // Step 4: Files loaded, robot heading to recipient
      'Awaiting Pickup',  // Step 5: Robot waiting at recipient's location for pickup
      'Completed',        // Step 6: Delivery completed, robot returning to base
      'Cancelled'         // Cancelled at any point
    ],
    default: 'Requested'
  },
  rfidAuthorized: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('DeliveryRequest', DeliveryRequestSchema);