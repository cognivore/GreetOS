import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
// import cors from 'cors';
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
    media?: string; // This is a path, really. :cringe:
}

interface User {
    id: string;
    name: string;
    isAllowedToChat: boolean;
}

export interface TimestampedMedia {
    media: WatchZoneMediaFile;
    timestamp: number;
}

// Load the greenlist (allowed usernames and mediaDirs)
const greenlistPath = path.join(__dirname, 'greenlist.json');
const greenlist: { allowedUsernames: string[]; mediaDirs: string[] } = JSON.parse(
    fs.readFileSync(greenlistPath, 'utf8')
);

export type MediaState = 'idle' | 'playing' | 'paused';

export interface WatchZoneMediaFile {
    dir: string;
    file: string;
    mode: MediaState;
}

let users: User[] = [];
let messages: Message[] = [];
let playingNow: WatchZoneMediaFile | null = null;

// Helper function to send the user list only to allowed users
const sendUserListToAllowedUsers = () => {
    const allowedUsers = users.filter((u) => u.isAllowedToChat);
    io.emit('userList', allowedUsers.map(({ id, name }) => ({ id, name })));
};

// Helper function to check if a username is in the greenlist
const isUsernameInGreenlist = (username: string): boolean => {
    return greenlist.allowedUsernames.includes(username);
};

// Helper function to list media files from all directories in greenlist recursively
const getMediaFilesFromDirs = () => {
    return greenlist.mediaDirs.map((dir) => {
        try {
            const mediaFiles = traverseDirectoryRecursively(dir);
            console.log("Found media files in directory:", dir, mediaFiles);
            return { dir, files: mediaFiles };
        } catch (error) {
            console.error(`Error reading media directory: ${dir}`, error);
            return { dir: path.basename(dir), files: [] };
        }
    });
};

// Function to recursively traverse directories and collect media files
const traverseDirectoryRecursively = (dir: string) => {
    let mediaFiles: string[] = [];

    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        entries.forEach((entry) => {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                // Recursively traverse subdirectories
                mediaFiles = mediaFiles.concat(traverseDirectoryRecursively(fullPath));
            } else if (entry.isFile() && /\.(mp4|webm)$/i.test(entry.name)) {
                // Collect the media file if it matches .mp4 or .webm
                mediaFiles.push(fullPath);
            }
        });
    } catch (error) {
        console.error(`Error reading directory: ${dir}`, error);
    }

    return mediaFiles;
};

// Serve static media files from directories
greenlist.mediaDirs.forEach((dir) => {
    const mediaEndpoint = `/media/${dir}`.replace(/\/\//g, '/');
    console.log("Setting up media endpoint:", mediaEndpoint);
    app.use(mediaEndpoint, express.static(`/${dir}`.replace(/\/\//g, '/')));
});

// Serve static assets (React app) from the `dist` folder
const frontendDir = path.join(__dirname, '../dist'); // Assuming your frontend is built in the 'dist' directory
app.use(express.static(frontendDir));

// Catch-all route to serve `index.html` for client-side routing
app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDir, 'index.html'));
});

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
                console.log('Username is in the greenlist');
                user.name = newUsername;
                user.isAllowedToChat = true;
                console.log('User allowed to chat:', user);

                // Notify user and send chat history
                socket.emit('chatEnabled', true);
                socket.emit('chatHistory', messages);
                sendUserListToAllowedUsers();

                // Send media file listings from all directories
                const mediaFiles = getMediaFilesFromDirs();
                socket.emit('mediaList', mediaFiles); // Send media files to the user
            } else {
                // Deny access if username is not in greenlist
                socket.emit('error', 'Username not allowed');
            }
        }
    });

    // Handle chat messages
    socket.on('chatMessage', (message: Message) => {
        console.log('Trying to send message:', message);
        const user = users.find((u) => u.id === socket.id);

        if (user && user.isAllowedToChat) {
            console.log('User is allowed to chat');
            const timestampedMessage = { ...message, timestamp: new Date().toLocaleTimeString() };
            messages.push(timestampedMessage); // Add message to chat history
            io.emit('chatMessage', timestampedMessage); // Broadcast message to all clients
            // Update WatchZoneMediaFile if message contains "media" field and the file exists
            if (message.media) {
                playingNow = {
                    dir: path.dirname(message.media),
                    file: path.basename(message.media),
                    mode: 'idle'
                };
            }
            io.emit('playingNow', playingNow);
        } else {
            socket.emit('error', 'You are not allowed to chat');
        }
    });

    socket.on('playMedia', (media: WatchZoneMediaFile) => {
        if (playingNow) {
            media.mode = 'playing';
            if (media.dir !== playingNow.dir && media.file !== playingNow.file) {
                io.emit('playingNow', media);
            }
            socket.broadcast.emit('playingNowPlay', media);
        }
    });

    socket.on('pauseMedia', (media: WatchZoneMediaFile) => {
        if (playingNow) {
            media.mode = 'paused';
            if (media.dir !== playingNow.dir && media.file !== playingNow.file) {
                io.emit('playingNow', media);
            }
            socket.broadcast.emit('playingNowPause', media);
        }
    });

    let lastSeekEvent = { timestamp: 0, media: { dir: '', file: '' } };

    socket.on('seekMedia', (media: WatchZoneMediaFile, timestamp: number) => {
        if (lastSeekEvent.media && lastSeekEvent.media.dir === media.dir && lastSeekEvent.media.file === media.file && lastSeekEvent.timestamp === timestamp) {
            return;
        }
        if (playingNow) {
            console.log(`Seeking media to ${timestamp} seconds`);
            if (media.dir !== playingNow.dir && media.file !== playingNow.file) {
                io.emit('playingNow', media);
            }
            socket.broadcast.emit('playingNowSeek', { media, timestamp } as TimestampedMedia);
            lastSeekEvent = { timestamp, media };
        }
    });

    // Handle media selection
    socket.on('selectMedia', (mediaFile: { dir: string; file: string }) => {
        const user = users.find((u) => u.id === socket.id);
        if (user && user.isAllowedToChat) {
            const mediaPath = `/media/${mediaFile.dir}/${mediaFile.file}`;
            const timestamp = new Date().toLocaleTimeString();
            const mediaMessage = { username: user.name, text: '', timestamp, media: mediaPath };
            messages.push(mediaMessage); // Add media message to chat history
            io.emit('chatMessage', mediaMessage); // Broadcast media to all users
        } else {
            socket.emit('error', 'You are not allowed to share media');
        }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        users = users.filter((u) => u.id !== socket.id); // Remove user from list
        sendUserListToAllowedUsers(); // Update user list for allowed users
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
