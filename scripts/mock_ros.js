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

console.log('Mock ROSBridge WebSocket server running on ws://localhost:9090');
