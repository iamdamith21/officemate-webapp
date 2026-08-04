import { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as ROSLIB from 'roslib';
import API from '../config/api';

const AuthContext = createContext();

// Resolution order: ?ros= query param (remembered) > previously remembered >
// build-time env > localhost.
//
// The query param exists because VITE_ROS_BRIDGE_URL is baked in by Vite at
// BUILD time, so on the Vercel deployment it can only be changed by editing the
// project env and redeploying. That is unworkable with an ephemeral tunnel
// (a cloudflared quick tunnel gets a new random hostname every restart), which
// would mean a redeploy per restart. With this, you open the deployed app once
// as ...?ros=wss://<current-tunnel-host> and it is remembered from then on.
//
// `?ros=` with an empty value clears the override and falls back to the build
// value — otherwise a stale hostname in localStorage is unclearable from the UI.
//
// Note this lets a link decide which bridge YOUR browser talks to, so treat a
// ...?ros=... link from someone else the same way you'd treat any other link.
//
// Still a module constant, evaluated once at load, so it stays out of the ROS
// effect's dependencies.
const ROS_URL_STORAGE_KEY = 'officeMate_rosUrl';

function resolveRosBridgeUrl() {
  const defaultUrl = import.meta.env.VITE_ROS_BRIDGE_URL || 'ws://10.54.61.152:9090';
  try {
    const override = new URLSearchParams(window.location.search).get('ros');
    if (override) {
      localStorage.setItem(ROS_URL_STORAGE_KEY, override);
      return override;
    }
    const remembered = localStorage.getItem(ROS_URL_STORAGE_KEY);
    if (remembered && remembered !== 'ws://localhost:9090' && remembered !== 'ws://10.204.248.152:9090') {
      return remembered;
    }
  } catch {}
  return defaultUrl;
}

const ROS_BRIDGE_URL = resolveRosBridgeUrl();

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
  const [isRobotOnline, setIsRobotOnline] = useState(false);
  // The live ROSLIB.Ros handle, exposed so components can subscribe to topics
  // beyond the four telemetry ones below (e.g. RobotLiveView needs /map,
  // /scan, /amcl_pose). Held in state, not a ref, so consumers re-subscribe
  // when the socket is replaced on reconnect.
  const [rosConn, setRosConn] = useState(null);
  const lastRobotMsg = useRef(0);
  const [rosData, setRosData] = useState({
    battery: null,     // null until a real reading arrives — see batteryValid
    navStatus: 'Idle',
    obstacleDist: 999, // default safe distance
    lockerStatus: false // false = locked, true = unlocked
  });
  // The robot only publishes /battery_level when a power monitor is actually
  // fitted. Showing a default of 100% in the meantime is worse than showing
  // nothing: it is a confident, wrong number about a safety-relevant value.
  const batteryValid = rosData.battery !== null;

  useEffect(() => {
    let ros;
    let reconnectTimeout;

    const connectRos = () => {
      console.log('Attempting to connect to Robot Connection...');
      // Point this at the robot with VITE_ROS_BRIDGE_URL in .env, e.g.
      //   VITE_ROS_BRIDGE_URL=ws://192.168.1.23:9090
      // The localhost default is only useful with scripts/mock_ros.cjs, or
      // when the browser is running on the Pi itself. See .env.example.
      ros = new ROSLIB.Ros({ url: ROS_BRIDGE_URL });

      ros.on('connection', () => {
        setIsRosConnected(true);
        setRosConn(ros);
        console.log(`Robot Connection established successfully (${ROS_BRIDGE_URL}).`);

        // The four topics below are NOT published by the robot directly — they
        // are produced by the `api_adapter` node in the robot's `web_bridge`
        // package, which translates the robot's native topics into this
        // simpler, browser-friendly contract:
        //
        //   /battery_level       Float32  percent 0..100  <- /battery/state
        //   /nav/status          String   display text    <- /mission_state
        //   /ultrasonic/distance Float32  CENTIMETRES     <- /ultrasonic/range
        //   /locker/status       Bool     true = unlocked <- /doors/state
        //
        // scripts/mock_ros.cjs fakes exactly the same four, so the mock and
        // the real robot are interchangeable. If you change a name or a unit
        // here, change it in BOTH api_adapter.py and mock_ros.cjs.

        // 1. Subscribe to Battery
        const batteryTopic = new ROSLIB.Topic({
          ros: ros,
          name: '/battery_level',
          messageType: 'std_msgs/Float32'
        });
        batteryTopic.subscribe(msg => {
          setRosData(prev => ({ ...prev, battery: msg.data }));
          lastRobotMsg.current = Date.now();
          setIsRobotOnline(true);
        });

        // 2. Subscribe to Navigation Status
        const navTopic = new ROSLIB.Topic({
          ros: ros,
          name: '/nav/status',
          messageType: 'std_msgs/String'
        });
        navTopic.subscribe(msg => {
          setRosData(prev => ({ ...prev, navStatus: msg.data }));
          lastRobotMsg.current = Date.now();
          setIsRobotOnline(true);
        });

        // 3. Subscribe to Obstacle Distance (Ultrasonic)
        const obstacleTopic = new ROSLIB.Topic({
          ros: ros,
          name: '/ultrasonic/distance',
          messageType: 'std_msgs/Float32'
        });
        obstacleTopic.subscribe(msg => {
          setRosData(prev => ({ ...prev, obstacleDist: msg.data }));
          lastRobotMsg.current = Date.now();
          setIsRobotOnline(true);
        });

        // 4. Subscribe to Locker Status
        const lockerTopic = new ROSLIB.Topic({
          ros: ros,
          name: '/locker/status',
          messageType: 'std_msgs/Bool' // true: unlocked, false: locked
        });
        lockerTopic.subscribe(msg => {
          setRosData(prev => ({ ...prev, lockerStatus: msg.data }));
          lastRobotMsg.current = Date.now();
          setIsRobotOnline(true);
        });
      });

      ros.on('error', (error) => {
        setIsRosConnected(false);
        setIsRobotOnline(false);
        setRosConn(null);
        console.log('Robot Connection connection error:', error);
      });

      ros.on('close', () => {
        setIsRosConnected(false);
        setIsRobotOnline(false);
        setRosConn(null);
        console.log('Robot Connection connection closed. Retrying in 5 seconds...');
        reconnectTimeout = setTimeout(connectRos, 5000);
      });
    };

    connectRos();

    const checkRobotOnline = setInterval(() => {
      // If we haven't heard from the robot in 6 seconds, consider it offline/not powered
      if (Date.now() - lastRobotMsg.current > 6000) {
        setIsRobotOnline(false);
      }
    }, 2000);

    return () => {
      if (ros) ros.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(checkRobotOnline);
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

    // Initial load + 5s polling. The synchronous fetch on mount is intentional
    // (we want data immediately, not one interval-tick later).
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      isRobotOnline,
      rosData,
      batteryValid,
      rosConn,
      rosBridgeUrl: ROS_BRIDGE_URL
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}