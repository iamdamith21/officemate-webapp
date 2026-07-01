import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as ROSLIB from 'roslib';
import API from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('officeMate_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [notifications, setNotifications] = useState([]);
  const [deliveryRequests, setDeliveryRequests] = useState([]);
  const [pendingConfirmations, setPendingConfirmations] = useState([]);

  const [isRosConnected, setIsRosConnected] = useState(false);

  useEffect(() => {
    let ros;
    let reconnectTimeout;

    const connectRos = () => {
      console.log('Attempting to connect to ROS Bridge...');
      ros = new ROSLIB.Ros({
        url: 'ws://localhost:9090'
      });

      ros.on('connection', () => {
        setIsRosConnected(true);
        console.log('ROS Bridge connection established successfully.');
      });

      ros.on('error', (error) => {
        setIsRosConnected(false);
        console.log('ROS Bridge connection error:', error);
      });

      ros.on('close', () => {
        setIsRosConnected(false);
        console.log('ROS Bridge connection closed. Retrying in 5 seconds...');
        reconnectTimeout = setTimeout(connectRos, 5000);
      });
    };

    connectRos();

    return () => {
      if (ros) ros.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Login — now stores role, _id, and department
  const login = (email, name, role = 'Lecturer', _id = null, department = '') => {
    const userData = { email, name, role, _id, department };
    setUser(userData);
    localStorage.setItem('officeMate_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setPendingConfirmations([]);
    setDeliveryRequests([]);
    localStorage.removeItem('officeMate_user');
  };

  // Add notification to bell dropdown
  const addNotification = (title, message) => {
    const newNotif = {
      id: Date.now(),
      title,
      message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Fetch all deliveries for general dashboard view
  const fetchDeliveries = async () => {
    try {
      const response = await API.get('/deliveries/all');
      if (response.data.success) {
        setDeliveryRequests(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    }
  };

  // Poll for delivery requests where this user is the recipient and status === 'Requested'
  const fetchPendingConfirmations = async (email) => {
    try {
      const encoded = encodeURIComponent(email);
      const response = await API.get(`/deliveries/pending-for/${encoded}`);
      if (response.data.success) {
        setPendingConfirmations(response.data.data);
      }
    } catch (error) {
      console.error('Error polling pending confirmations:', error);
    }
  };

  // Confirm a delivery request (recipient accepts)
  const confirmDelivery = async (deliveryId) => {
    try {
      await API.patch(`/deliveries/confirm/${deliveryId}`);
      setPendingConfirmations(prev => prev.filter(d => d._id !== deliveryId));
      await fetchDeliveries();
      addNotification('Delivery Confirmed', 'The robot will now head to the sender to collect the documents.');
    } catch (error) {
      console.error('Error confirming delivery:', error);
    }
  };

  // Decline a delivery request (recipient declines)
  const declineDelivery = async (deliveryId) => {
    try {
      await API.patch(`/deliveries/decline/${deliveryId}`);
      setPendingConfirmations(prev => prev.filter(d => d._id !== deliveryId));
      await fetchDeliveries();
    } catch (error) {
      console.error('Error declining delivery:', error);
    }
  };

  // Polling effect — run when user is logged in
  useEffect(() => {
    if (!user) return;

    fetchDeliveries();
    const deliveryPoll = setInterval(fetchDeliveries, 5000);

    // Only poll for pending confirmations if the user is a Lecturer (potential recipient)
    let confirmPoll;
    if (user.email && user.role !== 'Admin') {
      fetchPendingConfirmations(user.email);
      confirmPoll = setInterval(() => fetchPendingConfirmations(user.email), 5000);
    }

    return () => {
      clearInterval(deliveryPoll);
      if (confirmPoll) clearInterval(confirmPoll);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      notifications,
      deliveryRequests,
      pendingConfirmations,
      fetchDeliveries,
      addNotification,
      confirmDelivery,
      declineDelivery,
      isRosConnected
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}