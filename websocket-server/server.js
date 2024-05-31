// server.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Set();
const playerIds = new Set();
wss.on("connection", (ws) => {
  clients.add(ws);
  console.log(clients.size);
  console.log("Client connected");

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    console.log(data);
    if (data.type === "ASSIGN_PLAYER_ID_REQUEST") {
      // Respond to the client with the assigned player ID
      const playerID = uuidv4();
      playerIds.add(playerID);
      ws.send(
        JSON.stringify({
          type: "ASSIGN_PLAYER_ID_RESPONSE",
          playerId: playerID,
        })
      );

      const playerList = Array.from(playerIds).map((playerId) => ({
        playerId,
        playerCount: clients.size,
      }));
      ws.send(
        JSON.stringify({
          type: "UPDATE_PLAYER_LIST",
          playerList,
        })
      );
    } else {
      // Broadcast received message to all clients except the sender
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  });

  ws.on("close", (code, message) => {
    console.log("message on close", code, message.toJSON());
    clients.delete(ws);
    console.log("Client disconnected");
  });
});

server.listen(8080, () => {
  console.log("Server started on port 8080");
});
