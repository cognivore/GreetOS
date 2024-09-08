import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
//import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; // This is necessary for ESM

// ESM way to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

// Interface definitions
interface Message {
    username: string;
    text: string;
    timestamp: string;
}

interface User {
    id: string;
    name: string;
    isAllowedToChat: boolean;
}

// Load the greenlist (allowed usernames)
const greenlistPath = path.join(__dirname, 'greenlist.json');
const greenlist: { allowedUsernames: string[] } = JSON.parse(
    fs.readFileSync(greenlistPath, 'utf8')
);

let users: User[] = [];
let messages: Message[] = [];

// Helper function to send the user list only to allowed users
const sendUserListToAllowedUsers = () => {
    const allowedUsers = users.filter((u) => u.isAllowedToChat);
    io.emit('userList', allowedUsers.map(({ id, name }) => ({ id, name })));
};

// Helper function to check if a username is in the greenlist
const isUsernameInGreenlist = (username: string): boolean => {
    return greenlist.allowedUsernames.includes(username);
};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // By default, all users are redlisted (not allowed to chat)
    users.push({ id: socket.id, name: `User-${socket.id.substring(0, 4)}`, isAllowedToChat: false });

    // Listen for username change
    socket.on('setUsername', (newUsername: string) => {
        console.log('User', socket.id, 'requested to set username to', newUsername);

        const user = users.find((u) => u.id === socket.id);

        if (user) {
            if (isUsernameInGreenlist(newUsername)) {
                console.log("Username is in the greenlist");
                console.log("Was: ", user);
                // If username is in the greenlist, allow the user to chat
                user.name = newUsername;
                user.isAllowedToChat = true;
                console.log("Now: ", user);
                socket.emit('chatEnabled', true); // Notify the user that they are allowed to chat
                socket.emit('chatHistory', messages); // Send chat history to the allowed user
                sendUserListToAllowedUsers(); // Broadcast the updated user list
            } else {
                // If username is not in the greenlist, deny access
                socket.emit('error', 'Username not allowed');
            }
        }
    });

    // Handle chat messages
    socket.on('chatMessage', (message: Message) => {
        console.log('Trying to send message:', message);
        const user = users.find((u) => u.id === socket.id);

        console.log("Found user:", user);
        if (user && user.isAllowedToChat) {
            console.log("User is allowed to chat");
            // Only allowed users can send messages
            const timestampedMessage = { ...message, timestamp: new Date().toLocaleTimeString() };
            messages.push(timestampedMessage); // Add message to chat history
            io.emit('chatMessage', timestampedMessage); // Broadcast message to all clients
        } else {
            // If the user is not allowed to chat, deny the action
            socket.emit('error', 'You are not allowed to chat');
        }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        users = users.filter((u) => u.id !== socket.id); // Remove the user from the list
        sendUserListToAllowedUsers(); // Update the user list for allowed users
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
