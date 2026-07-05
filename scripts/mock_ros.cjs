const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 9090 });

wss.on('connection', function connection(ws) {
  console.log('[Mock ROS] Client connected. UI should now be unlocked.');

  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('[Mock ROS] received: %s', data);
  });

  // Keep connection alive
  setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.ping();
    }
  }, 30000);
});

// Battery Simulation Loop
let currentBattery = 100;
setInterval(async () => {
  try {
    currentBattery = currentBattery > 5 ? currentBattery - 1 : 100;
    await fetch('http://localhost:5000/api/robot/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentLocation: "Dean's Office",
        status: currentBattery === 100 ? 'Charging' : 'Idle',
        batteryLevel: currentBattery
      })
    });
  } catch (err) {
    // Silently fail if API is not running yet
  }
}, 5000);

console.log('Mock Robot WebSocket server running on ws://localhost:9090');
