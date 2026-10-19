import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectMongoDB } from './config/database';
import { initSocket } from './socket';
import { ensureDemoAccounts } from './services/demoSeeder.service';

const startServer = async () => {
  try {
    // Connect to MongoDB before starting server
    await connectMongoDB();

    // Ensure all 14 demo accounts are seeded and ready
    await ensureDemoAccounts();

    const server = http.createServer(app);
    initSocket(server);

    const PORT = parseInt(env.PORT, 10);
    server.listen(PORT, () => {
      console.log(`Hospital Platform Backend Server running on port ${PORT} [${env.NODE_ENV}] (Real-time Socket.IO enabled)`);
    });
  } catch (error) {
    console.error('Failed to start server due to database connection failure:', error);
    process.exit(1);
  }
};

startServer();
