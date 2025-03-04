import React, { useState, useEffect } from 'react';
import VideoRoom from './components/VideoRoom';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

function App() {
  const [roomId, setRoomId] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);

  const createAndJoinRoom = () => {
    const newRoomId = uuidv4();
    setRoomId(newRoomId);
    setIsInRoom(true);
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      setIsInRoom(true);
    }
  };

  return (
    <div className="app">
      {!isInRoom ? (
        <div className="join-container">
          <h1>WebRTC Video Chat</h1>
          <button onClick={createAndJoinRoom} className="create-button">
            Create New Room
          </button>
          <div className="divider">OR</div>
          <form onSubmit={joinRoom} className="join-form">
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="room-input"
            />
            <button type="submit" className="join-button">
              Join Room
            </button>
          </form>
        </div>
      ) : (
        <VideoRoom roomId={roomId} />
      )}
    </div>
  );
}

export default App;
