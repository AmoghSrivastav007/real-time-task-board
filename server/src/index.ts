import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import responseTime from 'response-time';
import { Server } from 'socket.io';
import { setupSocketIO } from './socket';
import authRoutes from './routes/auth';
import boardRoutes from './routes/boards';
import columnRoutes from './routes/columns';
import taskRoutes from './routes/tasks';
import memberRoutes from './routes/members';
import commentRoutes from './routes/comments';
import attachmentRoutes from './routes/attachments';
import userRoutes from './routes/users';
import notificationRoutes from './routes/notifications';

const app = express();
const httpServer = http.createServer(app);

// All allowed origins — env vars + localhost always included for local dev
const allowedOrigins = [
  ...new Set(
    [
      process.env.CLIENT_URL,
      process.env.SOCKET_CORS_ORIGIN,
      'http://localhost:3000',
      'http://localhost:3001',
    ]
      .filter(Boolean)
      .map((o) => o!.replace(/\/$/, ''))
  ),
];

function isAllowed(origin: string | undefined): boolean {
  if (!origin) return true; // allow Postman / server-to-server
  return allowedOrigins.includes(origin.replace(/\/$/, ''));
}

const io = new Server(httpServer, {
  cors: {
    origin: (origin, cb) => {
      if (isAllowed(origin)) cb(null, true);
      else cb(new Error(`Socket CORS blocked: ${origin}`));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

app.use(cors({
  origin: (origin, cb) => {
    if (isAllowed(origin)) cb(null, true);
    else cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(responseTime((req, _res, time) => {
  console.log(`[${req.method}] ${req.url} - ${time.toFixed(2)}ms`);
}));

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/boards', memberRoutes);
app.use('/api/columns', columnRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tasks/:taskId/comments', commentRoutes);
app.use('/api/tasks/:taskId/attachments', attachmentRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

setupSocketIO(io);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed CORS origins: ${allowedOrigins.join(', ')}`);
});

export { app, httpServer, io };
