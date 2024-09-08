import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Chat from './Chat';
import UsernameInput from './UsernameInput';
import { io, Socket } from 'socket.io-client';
import './App.css';

const port = window.location.port ? `:${window.location.port}` : '';
const socket: Socket = io(`${window.location.protocol}//${window.location.hostname}${port}`);

const App: React.FC = () => {
    const [isChatEnabled, setIsChatEnabled] = useState(false);
    const [username, setUsername] = useState('');

    useEffect(() => {
        // Listen for chatEnabled event
        socket.on('chatEnabled', (isAllowed: boolean) => {
            if (isAllowed) {
                setIsChatEnabled(true);
            }
        });

        // Clean up the socket connection when the component unmounts
        return () => {
            socket.off('chatEnabled');
        };
    }, []);

    return (
        <Router>
            <Routes>
                {/* Route to the username input */}
                <Route
                    path="/"
                    element={<UsernameInput socket={socket} parentSetUsername={setUsername} />}
                />
                {/* Route to the chat */}
                {isChatEnabled && <Route path="/chat" element={<Chat socket={socket} username={username} />} />}
            </Routes>
        </Router>
    );
};

export default App;
