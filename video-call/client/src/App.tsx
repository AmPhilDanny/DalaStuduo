import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { VideoRoom } from './pages/VideoRoom';

function Lobby() {
  const navigate = useNavigate();
  const [roomIdInput, setRoomIdInput] = useState('');

  const createRoom = () => {
    const newRoomId = uuidv4().slice(0, 8);
    navigate(`/room/${newRoomId}`);
  };

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomIdInput.trim()) {
      navigate(`/room/${roomIdInput.trim()}`);
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md mx-4 border border-gray-800">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Video Call</h1>
        <p className="text-gray-400 text-sm mb-8 text-center">Create a room or join an existing one</p>

        <button
          onClick={createRoom}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors mb-6"
        >
          Create Room
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-gray-900 px-3 text-gray-500">or join existing</span>
          </div>
        </div>

        <form onSubmit={joinRoom}>
          <input
            type="text"
            value={roomIdInput}
            onChange={(e) => setRoomIdInput(e.target.value)}
            placeholder="Enter room ID"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
          />
          <button
            type="submit"
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/room/:roomId" element={<VideoRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
