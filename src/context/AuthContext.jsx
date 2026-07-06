import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as ROSLIB from 'roslib';
import API from '../config/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('officeMate_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [notifications, setNotifications] = useState([]);
  const [deliveryRequests, setDeliveryRequests] = useState([]);
  const [pendingConfirmations, setPendingConfirmations] = useState([]);
  const notifiedRequests = useRef(new Set());

  const [isRosConnected, setIsRosConnected] = useState(false);
  const [rosData, setRosData] = useState({
    battery: 100,
    navStatus: 'Idle',
    obstacleDist: 999, // default safe distance
    lockerStatus: false // false = locked, true = unlocked
  });

  useEffect(() => {
    let ros;
    let reconnectTimeout;

    const connectRos = () => {
      console.log('Attempting to connect to Robot Connection...');
      ros = new ROSLIB.Ros({
        url: import.meta.env.VITE_ROS_BRIDGE_URL || 'ws://localhost:9090'
      });

      ros.on('connection', () => {
        setIsRosConnected(true);
        console.log('Robot Connection established successfully.');

        // 1. Subscribe to Battery
        const batteryTopic = new ROSLIB.Topic({
          ros: ros,
          name: '/battery_level',
          messageType: 'std_msgs/Float32'
        });
        batteryTopic.subscribe(msg => setRosData(prev => ({ ...prev, battery: msg.data })));

        // 2. Subscribe to Navigation Status
        const navTopic = new ROSLIB.Topic({
          ros: ros,
          name: '/nav/status',
          messageType: 'std_msgs/String'
        });
        navTopic.subscribe(msg => setRosData(prev => ({ ...prev, navStatus: msg.data })));

        // 3. Subscribe to Obstacle Distance (Ultrasonic)
        const obstacleTopic = new ROSLIB.Topic({
          ros: ros,
          name: '/ultrasonic/distance',
          messageType: 'std_msgs/Float32'
        });
        obstacleTopic.subscribe(msg => setRosData(prev => ({ ...prev, obstacleDist: msg.data })));

        // 4. Subscribe to Locker Status
        const lockerTopic = new ROSLIB.Topic({
          ros: ros,
          name: '/locker/status',
          messageType: 'std_msgs/Bool' // true: unlocked, false: locked
        });
        lockerTopic.subscribe(msg => setRosData(prev => ({ ...prev, lockerStatus: msg.data })));
      });

      ros.on('error', (error) => {
        setIsRosConnected(false);
        console.log('Robot Connection connection error:', error);
      });

      ros.on('close', () => {
        setIsRosConnected(false);
        console.log('Robot Connection connection closed. Retrying in 5 seconds...');
        reconnectTimeout = setTimeout(connectRos, 5000);
      });
    };

    connectRos();

    return () => {
      if (ros) ros.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Login — now stores role, _id, department, and phone
  const login = (email, name, role = 'Lecturer', _id = null, department = '', phone = '') => {
    const userData = { email, name, role, _id, department, phone };
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
        const incoming = response.data.data;
        setPendingConfirmations(incoming);
        
        // Trigger browser notification for new requests
        if (typeof Notification !== 'undefined') {
          incoming.forEach(req => {
            if (!notifiedRequests.current.has(req._id)) {
              notifiedRequests.current.add(req._id);
              if (Notification.permission === 'granted') {
                new Notification('New Delivery Request', {
                  body: `${req.senderEmail || 'A colleague'} has requested a delivery to you.`
                });
              } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                  if (permission === 'granted') {
                    new Notification('New Delivery Request', {
                      body: `${req.senderEmail || 'A colleague'} has requested a delivery to you.`
                    });
                  }
                });
              }
            }
          });
        }
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
      isRosConnected,
      rosData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}