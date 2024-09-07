import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
    user: string;
    text: string;
}

const socket: Socket = io('http://localhost:3001');

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState<string>('');
    const [user, setUser] = useState<string>('');

    useEffect(() => {
        socket.on('chatHistory', (chatHistory: Message[]) => {
            setMessages(chatHistory);
        });

        socket.on('chatMessage', (newMessage: Message) => {
            setMessages((prevMessages) => [...prevMessages, newMessage]);
        });

        return () => {
            socket.off('chatMessage');
            socket.off('chatHistory');
        };
    }, []);

    const sendMessage = () => {
        if (message.trim() && user.trim()) {
            const newMessage = { user, text: message };
            socket.emit('chatMessage', newMessage);
            setMessage('');
        }
    };

    return (
        <div>
            <h1>Chat</h1>
            <input
                type="text"
                placeholder="Enter your name"
                value={user}
                onChange={(e) => setUser(e.target.value)}
            />
            <div>
                <input
                    type="text"
                    placeholder="Enter message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <button onClick={sendMessage}>Send</button>
            </div>
            <div>
                {messages.map((msg, index) => (
                    <div key={index}>
                        <strong>{msg.user}:</strong> {msg.text}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Chat;
