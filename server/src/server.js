import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { PORT, CORS_CONFIG } from './config/index.js';
import setupSocketController from './controllers/socketController.js';

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: CORS_CONFIG });

// Setup socket controller
setupSocketController(io);

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
