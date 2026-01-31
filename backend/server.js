const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { findAvailablePort } = require('./utils/portDetector');

dotenv.config();

const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT) || 3001;

// Connect to MongoDB
connectDB();

// Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.headers.origin}`);
  next();
});

app.use(cors({
  origin: true, // Allow all origins for debugging
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/institutions', require('./routes/institutions'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/lessons', require('./routes/lessons'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/challenges', require('./routes/challenges'));
app.use('/api/student', require('./routes/student'));
app.use('/api/teacher', require('./routes/teacher'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/exam-planner', require('./routes/examPlanner'));
app.use('/api/badges', require('./routes/badges'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'EcoLearn API is running',
    database: 'MongoDB',
    port: app.get('port') || DEFAULT_PORT
  });
});

// Get current port (for frontend auto-detection)
app.get('/api/port', (req, res) => {
  res.json({
    port: app.get('port') || DEFAULT_PORT,
    url: `http://localhost:${app.get('port') || DEFAULT_PORT}`
  });
});

// Start server with automatic port detection
const http = require('http');
const { Server } = require('socket.io');

// ... (previous imports)

// Start server with automatic port detection
async function startServer() {
  try {
    const port = await findAvailablePort(DEFAULT_PORT, 10);

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.IO
    const io = new Server(server, {
      cors: {
        origin: true, // Allow all origins for now (matches app.use(cors))
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Make io accessible to routes
    app.set('io', io);

    // Socket.IO connection handler
    io.on('connection', (socket) => {
      console.log(`🔌 New client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });
    });

    server.listen(port, () => {
      app.set('port', port);
      console.log(`🚀 EcoLearn Backend API is running on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);

      if (port !== DEFAULT_PORT) {
        console.log(`⚠️  Port ${DEFAULT_PORT} was busy, using port ${port} instead`);
        console.log(`💡 Update your frontend .env.local: NEXT_PUBLIC_API_URL=http://localhost:${port}`);
      } else {
        console.log(`✅ Using default port ${DEFAULT_PORT}`);
      }
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} became busy, restart the server to find a new port`);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('❌ Failed to find available port:', error.message);
    process.exit(1);
  }
}

// Export app for Vercel
module.exports = app;

// Only start server if running directly
if (require.main === module) {
  startServer();
}
