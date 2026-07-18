import { useState, useRef, useEffect } from 'react';

// ─── Knowledge Base ─────────────────────────────────────────────
// Comprehensive topic-response map for the OfficeMate assistant.
const KNOWLEDGE_BASE = [
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'],
    response: "Hello! 👋 I'm the OfficeMate Assistant. I can help you with deliveries, robot status, account management, RFID cards, and more. What would you like to know?"
  },
  {
    keywords: ['how are you', 'how do you do', 'what\'s up'],
    response: "I'm doing great, thank you for asking! I'm always here to help you with the OfficeMate delivery system. What can I assist you with today?"
  },
  {
    keywords: ['thank', 'thanks', 'appreciate', 'cheers'],
    response: "You're welcome! 😊 Don't hesitate to reach out if you need anything else. Happy to help!"
  },
  {
    keywords: ['bye', 'goodbye', 'see you', 'later', 'take care'],
    response: "Goodbye! Have a wonderful day! 👋 Feel free to chat anytime you need help with OfficeMate."
  },
  // ── Robot Status ──
  {
    keywords: ['status', 'where is', 'robot location', 'robot position', 'where robot', 'current location'],
    response: "The OfficeMate robot's current status is displayed on your Dashboard under 'OfficeMate Robot Status'. It shows the live location, battery level, and hardware sync state. The robot's home base is the Dean's Office, and it returns there automatically after each delivery."
  },
  {
    keywords: ['battery', 'charge', 'power', 'charging'],
    response: "The robot's battery level is shown on the Dashboard and Admin panel. When the battery is low, the robot automatically returns to the Dean's Office charging dock. Admins can also manually return the robot to base using the 'Return to Dean's Office' button."
  },
  {
    keywords: ['ros', 'rosbridge', 'hardware', 'raspberry pi', 'pi', 'connection', 'offline', 'online'],
    response: "OfficeMate connects to the physical robot via Robot Connection (WebSocket on port 9090). The connection status is shown as a green 'Robot Sync Active' or red 'Robot Offline' indicator. If it shows offline, the Raspberry Pi or ROS bridge server may not be running. Contact your system administrator."
  },
  // ── Delivery Workflow ──
  {
    keywords: ['delivery', 'send', 'how to send', 'create delivery', 'new delivery', 'deliver documents', 'send documents', 'send package'],
    response: "To send a delivery:\n1️⃣ Go to 'Create Delivery' in the sidebar\n2️⃣ Enter the recipient's staff email — their name auto-fills\n3️⃣ Select your pickup room and their delivery room\n4️⃣ Describe the items and click 'Send Delivery Request'\n\nThe recipient will get a pop-up notification to accept or decline. Once accepted, the robot dispatches automatically!"
  },
  {
    keywords: ['confirm', 'accept', 'incoming', 'pending', 'notification', 'pop-up', 'popup', 'approve'],
    response: "When someone sends you a delivery request, a pop-up notification appears on your Dashboard. You can either 'Accept Delivery' (the robot starts moving) or 'Decline' (the request is cancelled). The system polls for new requests every 5 seconds automatically."
  },
  {
    keywords: ['track', 'tracking', 'progress', 'state', 'pipeline', 'status of delivery', 'where is my delivery'],
    response: "Active deliveries are tracked in real-time on your Dashboard with a 5-step state machine:\n📋 Requested → 🚗 Heading to Sender → 📦 En Route → ⏳ Awaiting Pickup → 🎉 Completed\n\nThe current step is highlighted, and the floor map shows the robot's live position."
  },
  {
    keywords: ['cancel', 'decline', 'reject'],
    response: "You can decline an incoming delivery request from the pop-up notification on your Dashboard. Once declined, the request status changes to 'Cancelled'. Currently, senders cannot cancel a request that has already been accepted."
  },
  {
    keywords: ['history', 'past deliveries', 'previous', 'log', 'records'],
    response: "Your delivery history is available at the bottom of the Dashboard page in the 'Delivery History' table. It shows all sent and received deliveries with their Ref ID, sender, recipient, contents, and current status."
  },
  // ── RFID & Locker ──
  {
    keywords: ['rfid', 'card', 'scan', 'locker', 'lock', 'unlock', 'cabinet', 'compartment', 'staff card'],
    response: "Each staff member has an RFID card registered in the system (format: XX XX XX XX in hexadecimal, e.g., 38 8B 95 1A). The RFID card is used to unlock the robot's locker compartment for secure document pickup and drop-off. You can find your RFID number on your registration details."
  },
  // ── Account & Auth ──
  {
    keywords: ['login', 'sign in', 'log in', 'authentication', 'access'],
    response: "To log in, use your Staff Email and password on the login page. If you're an admin, use admin credentials. If you don't have an account yet, click 'Create an Account' to register."
  },
  {
    keywords: ['register', 'create account', 'sign up', 'new account', 'registration'],
    response: "To register:\n1️⃣ Click 'Create an Account' on the login page\n2️⃣ Enter your full name, staff email, department, and RFID card number (in hex format like 38 8B 95 1A)\n3️⃣ Set a password (min. 6 characters)\n\nNote: Registrations are currently limited to the Department of Information Technology."
  },
  {
    keywords: ['password', 'reset', 'forgot', 'change password', 'reset password'],
    response: "If you forgot your password, click 'Forgot Password?' on the login screen. Enter your staff email and you'll receive a reset link via email. The link expires after 1 hour. You can also change your password from the Profile page."
  },
  {
    keywords: ['profile', 'my account', 'account info', 'my details', 'personal info'],
    response: "Visit the 'Profile' page from the sidebar to view your account details including your name, email, department, and role. You can also manage your security settings and change your password from there."
  },
  // ── Admin Features ──
  {
    keywords: ['admin', 'control panel', 'dashboard admin', 'admin features', 'management'],
    response: "The Admin Control Panel provides:\n🎛️ Manual robot controls (Pause, Resume, Emergency Stop, Return to Base)\n📊 System health monitoring (navigation, sensors, locker, battery)\n📋 All delivery requests management with state advancement\n📡 Live radar map showing robot surroundings\n📈 Reports & Analytics for delivery statistics"
  },
  {
    keywords: ['emergency', 'stop', 'halt', 'pause', 'resume'],
    response: "Admins can control the robot manually:\n⏸️ Pause — Holds the robot at its current position\n▶️ Resume — Continues the current task\n🚨 Emergency Stop — Immediately halts all robot movement\n🏠 Return to Base — Sends the robot back to the Dean's Office\n\nThese controls are in the Admin Dashboard under 'Manual Override'."
  },
  // ── Analytics ──
  {
    keywords: ['analytics', 'statistics', 'reports', 'data', 'metrics', 'chart', 'graph'],
    response: "The Analytics page (Admin only) shows:\n📊 Total delivery count\n✅ Success rate percentage\n⏱️ Average delivery time\n📈 Deliveries per day bar chart\n\nAccess it from 'Reports & Analytics' in the sidebar."
  },
  // ── Map & Navigation ──
  {
    keywords: ['map', 'floor plan', 'navigation', 'room', 'location', 'faculty', 'building'],
    response: "The Faculty Floor Map on the Dashboard shows the building layout with departments (IT, CT, IDS), the Dean's Office (home base), and common areas (Lecture Halls, Staff Room, Conference Room). The robot's live position is shown as a blue dot that moves in real-time during deliveries."
  },
  {
    keywords: ['department', 'departments', 'faculty', 'it department', 'ct department', 'ids department'],
    response: "OfficeMate serves three departments:\n🖥️ Department of Information Technology (IT) — Rooms 101, 102, Lab 201\n💻 Department of Computational Technology (CT) — Room 103, Lab 202\n📚 Department of Interdisciplinary Studies (IDS) — Room 104, Lab 203\n\nThe robot operates from the Dean's Office as its home base."
  },
  // ── Technical ──
  {
    keywords: ['sensor', 'obstacle', 'lidar', 'detect', 'avoid'],
    response: "The OfficeMate robot is equipped with obstacle detection sensors that are monitored via the Admin Dashboard's radar map. The scan range is approximately 12 metres. The robot uses these sensors for autonomous navigation and obstacle avoidance throughout the faculty corridors."
  },
  {
    keywords: ['how does it work', 'technology', 'tech stack', 'system', 'architecture'],
    response: "OfficeMate uses:\n🌐 React + Vite frontend with Tailwind CSS\n⚡ Node.js/Express backend with MongoDB Atlas\n🤖 Robot Hardware Control System on Raspberry Pi\n📡 WebSocket connection via Robot Connection\n🔐 RFID authentication for locker access\n☁️ Deployed on Vercel (frontend + serverless API)"
  },
  // ── Misc ──
  {
    keywords: ['help', 'what can you do', 'features', 'capabilities', 'options'],
    response: "I can help you with:\n📦 Creating and tracking deliveries\n🤖 Robot status and location\n🔐 RFID card and locker information\n👤 Account management (login, register, password reset)\n🎛️ Admin controls and analytics\n🗺️ Faculty map and room locations\n⚙️ Technical information about the system\n\nJust ask me anything!"
  },
  {
    keywords: ['who made', 'who built', 'developer', 'created by', 'about'],
    response: "OfficeMate is an Autonomous Robotic Delivery Platform designed for the Faculty of Information Technology. It enables staff members to send documents and packages to colleagues via an autonomous delivery robot, complete with RFID-secured locker compartments."
  },
  {
    keywords: ['time', 'how long', 'duration', 'delivery time', 'speed'],
    response: "Delivery times depend on the distance between rooms and corridor traffic. The average delivery time is approximately 4-5 minutes within the faculty building. The robot navigates autonomously using autonomous path planning and obstacle avoidance."
  },
  {
    keywords: ['safe', 'security', 'secure', 'privacy', 'data'],
    response: "OfficeMate ensures security through:\n🔐 RFID-authenticated locker access — only the sender and recipient can open the compartment\n🔒 Password-protected user accounts\n📧 Email-based password reset with expiring tokens\n👤 Role-based access control (Lecturer vs Admin)\n\nAll data is stored securely in MongoDB Atlas."
  },
  {
    keywords: ['error', 'problem', 'issue', 'bug', 'not working', 'broken', 'fix'],
    response: "If you're experiencing issues:\n1️⃣ Check if the Robot Connection is connected (green indicator on Dashboard)\n2️⃣ Try logging out and back in\n3️⃣ Clear your browser cache\n4️⃣ Check your internet connection\n5️⃣ Contact the system administrator if the problem persists\n\nFor 'Network Error' messages, ensure the backend server is running."
  },
];

/**
 * Finds the best matching response from the knowledge base.
 */
function findResponse(input) {
  const lower = input.toLowerCase().trim();
  const inputWords = lower.split(/\W+/).filter(w => w.length > 2);
  
  let bestMatch = null;
  let bestScore = 0;

  for (const topic of KNOWLEDGE_BASE) {
    let score = 0;
    for (const keyword of topic.keywords) {
      // Exact substring match (high score)
      if (lower.includes(keyword)) {
        score += keyword.split(' ').length * 3;
      }
      
      // Word intersection match (to catch variations or reordered words)
      const keywordWords = keyword.split(/\W+/).filter(w => w.length > 2);
      let matchCount = 0;
      for (const kw of keywordWords) {
         // check if the keyword word is a substring of any input word or vice versa
         if (inputWords.some(iw => iw.includes(kw) || kw.includes(iw))) {
             matchCount++;
         }
      }
      // If at least half the significant words in the keyword match, give points
      if (matchCount > 0 && (matchCount >= Math.ceil(keywordWords.length / 2))) {
          score += matchCount;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = topic;
    }
  }

  if (bestMatch && bestScore > 0) {
    return bestMatch.response;
  }

  // Smart fallback
  return `I'm not sure I understand entirely, but I'd love to help! Here are some common things you can ask me:\n\n• "How do I send a delivery?"\n• "Where is the robot?"\n• "How does RFID work?"\n• "How do I change my password?"\n\nOr just type 'help' to see everything I can assist with!`;
}

export default function ChatAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! 👋 I'm your OfficeMate assistant. Ask me anything about deliveries, the robot, your account, or the system!", isUser: false }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const toggleChat = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const sendMessage = (text) => {
    if (!text.trim()) return;

    const userMessage = { id: Date.now(), text: text, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Generate AI response
    setTimeout(() => {
      const botText = findResponse(userMessage.text);
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: botText, isUser: false }]);
    }, 800);
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 glass-card border border-slate-200/50 shadow-2xl rounded-2xl overflow-hidden flex flex-col mb-4 animate-fade-in-up" style={{ height: '450px' }}>
          
          {/* Header */}
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-md relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center text-lg shadow-sm">
                🤖
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">OfficeMate Agent</h3>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                  <span className="text-[10px] text-blue-100 uppercase tracking-wider font-semibold">Online</span>
                </div>
              </div>
            </div>
            <button onClick={toggleChat} className="text-white hover:text-blue-200 transition-colors focus:outline-none p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 backdrop-blur-sm">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm whitespace-pre-line ${
                  msg.isUser 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {['How to send a delivery?', 'Where is the robot?', 'Analytics Reports', 'My RFID details'].map((chip) => (
                  <button 
                    key={chip}
                    onClick={() => sendMessage(chip)}
                    className="text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200/60 px-3 py-1.5 rounded-full hover:bg-blue-100 hover:scale-105 transition-all shadow-sm"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200/50">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <button 
                type="submit" 
                disabled={!inputValue.trim()}
                className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={toggleChat}
        className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center hover:bg-blue-700 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
    </div>
  );
}
