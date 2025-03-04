import React, { useState, useEffect } from 'react';
import './Editor.css';

const Editor = ({ socket, roomId }) => {
  const [content, setContent] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handleEditorUpdate = ({ content, from }) => {
      if (from !== socket.id) {
        setContent(content);
      }
    };

    const handleRoomData = (data) => {
      if (data?.editorContent) {
        setContent(data.editorContent);
      }
    };

    socket.on('editor-update', handleEditorUpdate);
    socket.on('room-data', handleRoomData);

    return () => {
      socket.off('editor-update', handleEditorUpdate);
      socket.off('room-data', handleRoomData);
    };
  }, [socket]);

  const handleChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Debounce the update to avoid too many socket emissions
    const now = Date.now();
    if (socket && socket.connected && (!lastUpdate || now - lastUpdate > 100)) {
      socket.emit('editor-update', { content: newContent, roomId });
      setLastUpdate(now);
    }
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h3>Collaborative Editor</h3>
      </div>
      <textarea
        className="editor-textarea"
        value={content}
        onChange={handleChange}
        placeholder="Start typing here..."
      />
    </div>
  );
};

export default Editor;
