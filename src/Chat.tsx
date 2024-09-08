import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import MediaMessage from './MediaMessage';
import MediaSelector from './MediaSelector';

interface Message {
    username: string;
    text?: string;
    media?: string;
    timestamp: string;
}

interface User {
    id: string;
    name: string;
}

interface ChatProps {
    socket: Socket;
    username: string;
}

const Chat: React.FC<ChatProps> = ({ socket, username }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [mediaList, setMediaList] = useState<{ dir: string; files: string[] }[]>([]);
    const [showMediaSelector, setShowMediaSelector] = useState(false);
    const messageEndRef = useRef<HTMLDivElement | null>(null); // Ref for scrolling

    // Scroll to the bottom when a new message arrives
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        socket.on('chatHistory', (chatHistory: Message[]) => {
            setMessages(chatHistory);
        });

        socket.on('chatMessage', (newMessage: Message) => {
            setMessages((prevMessages) => [...prevMessages, newMessage]);
        });

        socket.on('userList', (userList: User[]) => {
            setUsers(userList);
        });

        socket.on('mediaList', (mediaFiles) => {
            setMediaList(mediaFiles);
        });

        return () => {
            socket.off('chatHistory');
            socket.off('chatMessage');
            socket.off('userList');
            socket.off('mediaList');
        };
    }, [socket]);

    const sendMessage = () => {
        if (message.trim() && username.trim()) {
            const timestamp = new Date().toLocaleTimeString();
            const newMessage = { username, text: message, timestamp };
            socket.emit('chatMessage', newMessage); // Send message to the server
            setMessage(''); // Clear input field after sending
        }
    };

    const handleSelectMedia = (dir: string, file: string) => {
        socket.emit('selectMedia', { dir, file });
        setShowMediaSelector(false); // Hide media selector after choosing a file
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-gray-900">
            <div className="flex flex-grow overflow-hidden">

                {/* Message Area */}
                <div className="flex-grow bg-gray-800 p-4 overflow-y-auto">
                    <div className="w-full">
                        {messages.map((msg, index) => (
                            <div key={index} className="mb-4 text-white w-full">
                                {msg.media ? (
                                    <MediaMessage
                                        mediaUrl={msg.media}
                                        timestamp={msg.timestamp}
                                        username={msg.username}
                                    />
                                ) : (
                                    <div className="w-full">
                                        <div className="w-full flex justify-between">
                                            <span className="text-sm text-gray-400">{msg.timestamp}</span>
                                            <strong className="text-blue-400">{msg.username}</strong>
                                        </div>
                                        <span className="block w-full break-words">{msg.text}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messageEndRef} /> {/* Invisible div to scroll to */}
                    </div>
                </div>

                {/* User List */}
                <div className="bg-gray-700 text-white w-48 p-4 md:block hidden">
                    <h2 className="text-lg font-bold mb-4">Users</h2>
                    <ul className="space-y-2">
                        {users.map((user) => (
                            <li key={user.id}>{user.name}</li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Media Selector */}
            {showMediaSelector && (
                <MediaSelector
                    mediaList={mediaList}
                    onSelectMedia={handleSelectMedia}
                />
            )}

            {/* Input Area */}
            <div className="flex p-2 bg-gray-700 border-t border-gray-600 w-full">
                <input
                    type="text"
                    className="flex-grow p-2 border border-gray-500 bg-gray-800 text-white rounded-l focus:outline-none"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <button
                    className="bg-blue-500 text-white px-4 rounded-r hover:bg-blue-600"
                    onClick={sendMessage}
                >
                    Send
                </button>

                {/* Toggle Media Selector Button */}
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ml-2"
                    onClick={() => setShowMediaSelector(!showMediaSelector)}
                >
                    {showMediaSelector ? 'Hide Media' : 'Select Media'}
                </button>
            </div>
        </div>
    );
};

export default Chat;
