import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins for now
        methods: ['GET', 'POST'],
    },
});

app.use(cors());
app.use(express.json());

let messages: { user: string; text: string }[] = [];

io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    // Send all previous messages to the new client
    socket.emit('chatHistory', messages);

    // Listen for new chat messages
    socket.on('chatMessage', (message) => {
        messages.push(message);
        io.emit('chatMessage', message); // Distribute to all clients
    });

    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
