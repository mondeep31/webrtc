import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5150;

// Socket.io connection handling
// Store room data
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle joining a room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', socket.id);
    
    // Initialize room data if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        editorContent: '',
        messages: []
      });
    }
    
    // Send current room data to the joining user
    const roomData = rooms.get(roomId);
    socket.emit('room-data', roomData);
  });

  // Handle offer signal
  socket.on('offer', ({ offer, roomId }) => {
    socket.to(roomId).emit('offer', { offer, from: socket.id });
  });

  // Handle answer signal
  socket.on('answer', ({ answer, roomId }) => {
    socket.to(roomId).emit('answer', { answer, from: socket.id });
  });

  // Handle ICE candidate
  socket.on('ice-candidate', ({ candidate, roomId }) => {
    socket.to(roomId).emit('ice-candidate', { candidate, from: socket.id });
  });

  // Handle user controls
  socket.on('user-control', ({ type, value, roomId }) => {
    console.log(`User ${socket.id} in room ${roomId} changed ${type} to ${value}`);
    socket.to(roomId).emit('user-control', { type, value, from: socket.id });
  });

  // Handle chat messages
  socket.on('chat-message', ({ message, roomId }) => {
    const roomData = rooms.get(roomId);
    const newMessage = {
      id: Date.now(),
      sender: socket.id,
      content: message,
      timestamp: new Date().toISOString()
    };
    
    roomData.messages.push(newMessage);
    io.to(roomId).emit('chat-message', newMessage);
  });

  // Handle editor updates
  socket.on('editor-update', ({ content, roomId }) => {
    const roomData = rooms.get(roomId);
    roomData.editorContent = content;
    socket.to(roomId).emit('editor-update', { content, from: socket.id });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    io.emit('user-disconnected', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
