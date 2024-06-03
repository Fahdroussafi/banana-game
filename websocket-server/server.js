const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store connected clients and their player IDs
const clients = new Map();
const playerPositions = new Map();

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    const data = JSON.parse(message);
    console.log("Received message:", data);

    if (data.type === "ASSIGN_PLAYER_ID_REQUEST") {
      const playerID = uuidv4();
      clients.set(ws, playerID);
      playerPositions.set(playerID, { x: 0, y: 0 });

      ws.send(
        JSON.stringify({
          type: "ASSIGN_PLAYER_ID_RESPONSE",
          playerId: playerID,
        })
      );

      updatePlayerList();
    } else if (data.type === "UPDATE_PLAYER_POSITION") {
      const { playerId, position } = data;
      playerPositions.set(playerId, position);
      broadcastPlayerPositions();
    } else {
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    const playerId = clients.get(ws);
    clients.delete(ws);
    playerPositions.delete(playerId);
    updatePlayerList();
    broadcastPlayerPositions();
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

const updatePlayerList = () => {
  const playerList = Array.from(clients.values()).map((playerId) => ({
    playerId,
  }));

  const updateMessage = JSON.stringify({
    type: "UPDATE_PLAYER_LIST",
    playerList,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(updateMessage);
    }
  });
};

const broadcastPlayerPositions = () => {
  const positionsMessage = JSON.stringify({
    type: "UPDATE_PLAYER_POSITIONS",
    positions: Array.from(playerPositions.entries()).map(
      ([playerId, position]) => ({
        playerId,
        position,
      })
    ),
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(positionsMessage);
    }
  });
};

server.listen(8080, () => {
  console.log("Server started on port 8080");
});
