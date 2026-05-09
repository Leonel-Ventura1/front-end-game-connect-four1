import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSocketHandlers } from './websocket/handlers.js';
import authRoutes from './modules/auth/routes.js';
import userRoutes from './modules/user/routes.js';
import roomRoutes from './modules/room/routes.js';
import gameRoutes from './modules/game/routes.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/games', gameRoutes);

app.get('/health', (res) => {
  res.json({ status: 'ok' });
});


setupSocketHandlers(io);


app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  console.error("REGISTER ERROR:", err);

  res.status(500).json({
    error: err?.message || err,
    stack: err?.stack
  });
});



const PORT = process.env.BACKEND_PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
