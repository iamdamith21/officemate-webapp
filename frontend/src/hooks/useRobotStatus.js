import { useState, useEffect } from 'react';
import API from '../config/api';

/**
 * Custom hook to poll the robot's live status every `intervalMs` milliseconds.
 */
export default function useRobotStatus(intervalMs = 5000) {
  const [robotStatus, setRobotStatus] = useState({
    currentLocation: "Dean's Office",
    status: 'Idle',
    batteryLevel: 100,
  });

  useEffect(() => {
    const fetchRobotStatus = async () => {
      try {
        const response = await API.get('/robot/status');
        if (response.data.success) setRobotStatus(response.data.data);
      } catch { /* robot status endpoint optional */ }
    };

    fetchRobotStatus();
    const interval = setInterval(fetchRobotStatus, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return robotStatus;
}
