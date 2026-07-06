const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 9090 });

let subscribers = {};

wss.on('connection', function connection(ws) {
  console.log('[Mock ROS] Client connected via rosbridge.');

  ws.on('error', console.error);

  ws.on('message', function message(data) {
    try {
      const msg = JSON.parse(data);
      if (msg.op === 'subscribe') {
        if (!subscribers[msg.topic]) subscribers[msg.topic] = [];
        subscribers[msg.topic].push(ws);
        console.log(`[Mock ROS] Client subscribed to ${msg.topic}`);
      }
    } catch {
      // ignore parsing errors
    }
  });

  ws.on('close', () => {
    // Basic cleanup
    for(const topic in subscribers) {
      subscribers[topic] = subscribers[topic].filter(c => c !== ws);
    }
  });
});

const publishMsg = (topic, msg) => {
  if (subscribers[topic]) {
    const data = JSON.stringify({
      op: 'publish',
      topic: topic,
      msg: msg
    });
    subscribers[topic].forEach(ws => {
      if (ws.readyState === 1) ws.send(data);
    });
  }
};

// Battery Simulation Loop
let currentBattery = 100;
let dist = 100.0;
let locked = false;

setInterval(async () => {
  currentBattery = currentBattery > 5 ? currentBattery - 0.5 : 100;
  dist = dist > 10 ? dist - 5.0 : 100.0;
  locked = !locked;

  // Publish to mocked ROS topics
  publishMsg('/battery_level', { data: currentBattery });
  publishMsg('/nav/status', { data: 'Moving to Sender' });
  publishMsg('/ultrasonic/distance', { data: dist });
  publishMsg('/locker/status', { data: locked });

  try {
    await fetch('http://localhost:5000/api/robot/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentLocation: "Dean's Office",
        status: currentBattery === 100 ? 'Charging' : 'Idle',
        batteryLevel: currentBattery
      })
    });
  } catch {
    // Silently fail if API is not running yet
  }
}, 2000);

console.log('Mock ROS Bridge WebSocket server running on ws://localhost:9090');
