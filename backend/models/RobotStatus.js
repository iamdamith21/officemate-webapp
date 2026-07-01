const mongoose = require('mongoose');

const RobotStatusSchema = new mongoose.Schema({
  robotId: { 
    type: String, 
    default: "OFFICEMATE_ROBOT_01", 
    unique: true 
  },
  currentLocation: { 
    type: String, 
    default: "Charging Station" 
  },
  status: { 
    type: String, 
    enum: ['Idle', 'Moving', 'Delivering', 'Charging'], 
    default: 'Idle' 
  },
  batteryLevel: { 
    type: Number, 
    default: 100 
  },
  currentTaskId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'DeliveryRequest', 
    default: null 
  }
}, { timestamps: true });

module.exports = mongoose.model('RobotStatus', RobotStatusSchema);