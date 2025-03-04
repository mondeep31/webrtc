# WebRTC Video Chat Application

A real-time video chat application built with WebRTC, React, and Node.js.

## Features

- Real-time video and audio communication
- Mute/unmute audio
- Turn video on/off
- Room-based communication
- Modern and responsive UI
- WebSocket signaling server

## Setup Instructions

### Server Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```
   The server will run on port 5000.

### Client Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The client will run on port 3000.

## Usage

1. Open the application in your browser
2. Create a new room or join an existing one using a room ID
3. Share the room ID with another user to start a video call
4. Use the control buttons to mute/unmute audio or turn video on/off

## Technical Stack

- Frontend: React, Vite, Socket.io-client
- Backend: Node.js, Express, Socket.io
- WebRTC for peer-to-peer communication
- Modern CSS for styling
