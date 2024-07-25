const WebSocket = require("ws");

let wss;

// Function to initialize the WebSocket server
const initializeWebSocket = (server) => {
  wss = new WebSocket.Server({ server });
  wss.on("connection", (ws) => {
    // console.log("WebSocket client connected");
  });
};

// Function to broadcast messages to all connected WebSocket clients
const broadcastMessage = (message) => {
  if (wss) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
};

module.exports = { initializeWebSocket, broadcastMessage };
