const express = require('express');
const router = express.Router();
const RobotStatus = require('../models/RobotStatus');

// 📋 1. Get Live Robot Status (GET /api/robot/status)
router.get('/status', async (req, res) => {
  try {
    let robot = await RobotStatus.findOne({ robotId: "OFFICEMATE_ROBOT_01" }).populate('currentTaskId');
    
    // Auto-create default robot state record if database is fresh/empty
    if (!robot) {
      robot = new RobotStatus({
        robotId: "OFFICEMATE_ROBOT_01",
        currentLocation: "Charging Station",
        status: "Idle",
        batteryLevel: 100,
        currentTaskId: null
      });
      await robot.save();
    }
    
    res.status(200).json({ success: true, data: robot });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🤖 2. Update Robot Status (POST /api/robot/update)
// Sent by ROS2 navigation nodes or script engines to report telemetry
router.post('/update', async (req, res) => {
  try {
    const { currentLocation, status, batteryLevel, currentTaskId } = req.body;
    
    const updatedRobot = await RobotStatus.findOneAndUpdate(
      { robotId: "OFFICEMATE_ROBOT_01" },
      { currentLocation, status, batteryLevel, currentTaskId },
      { new: true, upsert: true }
    ).populate('currentTaskId');
    
    res.status(200).json({ success: true, message: 'Robot status updated!', data: updatedRobot });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;