import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';

interface UsernameInputProps {
    socket: Socket;
    parentSetUsername: React.Dispatch<React.SetStateAction<string>>;
}

const UsernameInput: React.FC<UsernameInputProps> = ({ socket, parentSetUsername }) => {
    const [username, innerSetUsername] = useState('');
    const setUsername = (value: string) => {
        innerSetUsername(value);
        parentSetUsername(value);
    };
    const [error, setError] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        socket.emit('setUsername', username);

        socket.on('chatEnabled', (isAllowed: boolean) => {
            if (isAllowed) {
                navigate('/chat'); // Navigate to chat if username is valid
            } else {
                setError(true); // Show error if username is invalid
                setTimeout(() => setError(false), 500); // Reset error state
            }
        });

        socket.on('error', (message: string) => {
            console.error(message);
        });
    };

    return (
        <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
            <form
                onSubmit={handleSubmit}
                className={`flex flex-col items-center p-4 bg-gray-800 rounded-lg ${error ? 'animate-shake' : ''
                    }`}
            >
                <label className="mb-4 text-lg">Who are you?</label>
                <input
                    type="text"
                    className="p-2 bg-gray-700 text-white border border-gray-500 rounded focus:outline-none"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <button
                    type="submit"
                    className="mt-4 bg-blue-500 px-4 py-2 rounded hover:bg-blue-600"
                >
                    Submit
                </button>
                {error && <p className="text-red-500 mt-2">Invalid username. Try again!</p>}
            </form>
        </div>
    );
};

export default UsernameInput;
