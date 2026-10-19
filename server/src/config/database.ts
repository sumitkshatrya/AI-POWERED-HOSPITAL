import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env';

// Use system DNS or fallback to public DNS if necessary
// dns.setServers(['8.8.8.8', '1.1.1.1']);

let isConnected = false;

export const connectMongoDB = async (): Promise<typeof mongoose> => {
  if (isConnected || mongoose.connection.readyState === 1) {
    console.log('[MongoDB] Using existing database connection.');
    return mongoose;
  }

  try {
    mongoose.connection.on('connected', () => {
      isConnected = true;
      console.log('[MongoDB] Successfully connected to MongoDB.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('[MongoDB] Disconnected from MongoDB.');
    });

    console.log('[MongoDB] DNS servers:', dns.getServers());

    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 25,
      minPoolSize: 2,
      autoIndex: env.NODE_ENV !== 'production',
    });

    isConnected = true;

    return conn;
  } catch (error) {
    console.error('[MongoDB] Failed to connect to database:', error);
    throw error;
  }
};

export const connectDatabase = connectMongoDB;

export const disconnectMongoDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[MongoDB] Disconnected from MongoDB.');
  }
};

export const disconnectDatabase = disconnectMongoDB;

export const dbConfig = {
  driver: 'MONGODB',
  status: 'CONNECTED',
  isReady: () => mongoose.connection.readyState === 1,
};