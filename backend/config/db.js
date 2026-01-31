const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      console.warn('⚠️  MONGODB_URI not set in .env file');
      return null;
    }

    // Validate connection string format
    if (!mongoURI.includes('@') && mongoURI.includes('mongodb+srv://')) {
      console.error('❌ MongoDB connection string appears to be missing username/password');
    }

    console.log('🔄 Connecting to MongoDB...');
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    return conn;

  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

