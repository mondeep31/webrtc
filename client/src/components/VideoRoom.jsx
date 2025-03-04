import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Chat from './Chat';
import Editor from './Editor';
import './VideoRoom.css';

const VideoRoom = ({ roomId }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnectionRef = useRef();
  const socketRef = useRef();

  const servers = {
    iceServers: [
      {
        urls: [
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
        ],
      },
    ],
  };

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://localhost:5150');
    
    // Start video call after socket is connected
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      startCall();
    });

    // Handle remote user controls
    socketRef.current.on('user-control', ({ type, value, from }) => {
      if (remoteStream) {
        if (type === 'audio') {
          const audioTracks = remoteVideoRef.current.srcObject.getAudioTracks();
          audioTracks.forEach(track => track.enabled = value);
        } else if (type === 'video') {
          const videoTracks = remoteVideoRef.current.srcObject.getVideoTracks();
          videoTracks.forEach(track => track.enabled = value);
        }
      }
    });

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('user-control');
        socketRef.current.disconnect();
      }
    };
  }, []);

  const startCall = async () => {
    try {
      // Wait for video elements to be ready
      if (!localVideoRef.current || !remoteVideoRef.current) {
        console.log('Video elements not ready, retrying in 100ms');
        setTimeout(startCall, 100);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      localVideoRef.current.srcObject = stream;

      // Create new RTCPeerConnection
      peerConnectionRef.current = new RTCPeerConnection(servers);
      
      // Add local tracks to the connection
      stream.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      // Handle incoming tracks
      peerConnectionRef.current.ontrack = (event) => {
        console.log('Received remote track', event.streams[0]);
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
            console.log('Set remote video source');
          }
        }
      };

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Sending ICE candidate');
          socketRef.current.emit('ice-candidate', {
            candidate: event.candidate,
            roomId,
          });
        }
      };

      // Log connection state changes
      peerConnectionRef.current.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnectionRef.current.connectionState);
      };

      // Log ICE connection state changes
      peerConnectionRef.current.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnectionRef.current.iceConnectionState);
      };

      socketRef.current.emit('join-room', roomId);

      socketRef.current.on('user-connected', async (userId) => {
        console.log('New user connected:', userId);
        try {
          // Create and send offer
          const offer = await peerConnectionRef.current.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
          });
          console.log('Created offer:', offer);
          await peerConnectionRef.current.setLocalDescription(offer);
          console.log('Set local description');
          socketRef.current.emit('offer', { offer, roomId });
          console.log('Sent offer');
        } catch (error) {
          console.error('Error creating offer:', error);
        }
      });

      socketRef.current.on('offer', async ({ offer, from }) => {
        console.log('Received offer from:', from);
        try {
          if (!peerConnectionRef.current) {
            console.error('No peer connection available');
            return;
          }
          console.log('Setting remote description from offer');
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
          console.log('Creating answer');
          const answer = await peerConnectionRef.current.createAnswer();
          console.log('Setting local description');
          await peerConnectionRef.current.setLocalDescription(answer);
          console.log('Sending answer');
          socketRef.current.emit('answer', { answer, roomId });
        } catch (error) {
          console.error('Error handling offer:', error);
        }
      });

      socketRef.current.on('answer', async ({ answer }) => {
        console.log('Received answer');
        try {
          if (!peerConnectionRef.current) {
            console.error('No peer connection available');
            return;
          }
          console.log('Setting remote description from answer');
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          console.log('Connection established');
        } catch (error) {
          console.error('Error setting remote description:', error);
        }
      });

      socketRef.current.on('ice-candidate', async ({ candidate }) => {
        console.log('Received ICE candidate');
        try {
          if (!peerConnectionRef.current) {
            console.error('No peer connection available');
            return;
          }
          if (candidate) {
            console.log('Adding ICE candidate');
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('Added ICE candidate successfully');
          }
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      });

      socketRef.current.on('user-disconnected', () => {
        setRemoteStream(null);
      });

    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
        // Notify other users about the audio state change
        socketRef.current.emit('user-control', {
          type: 'audio',
          value: audioTrack.enabled,
          roomId,
        });
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
        // Notify other users about the video state change
        socketRef.current.emit('user-control', {
          type: 'video',
          value: videoTrack.enabled,
          roomId,
        });
      }
    }
  };

  return (
    <div className="video-room">
      <div className="main-content">
        <div className="video-section">
          <div className="video-container">
            <div className="video-wrapper">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="local-video"
              />
              <div className="video-label">You</div>
            </div>
            <div className="video-wrapper">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="remote-video"
              />
              <div className="video-label">Remote User</div>
            </div>
          </div>
          
          <div className="controls">
            <button
              onClick={toggleAudio}
              className={`control-button ${isAudioMuted ? 'off' : ''}`}
            >
              {isAudioMuted ? '🔇' : '🎤'}
            </button>
            <button
              onClick={toggleVideo}
              className={`control-button ${isVideoOff ? 'off' : ''}`}
            >
              {isVideoOff ? '📵' : '📹'}
            </button>
            <div className="room-id">
              Room ID: {roomId}
            </div>
          </div>
        </div>

        <div className="collaboration-section">
          {socketRef.current && (
            <>
              <Editor socket={socketRef.current} roomId={roomId} />
              <Chat socket={socketRef.current} roomId={roomId} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoRoom;
