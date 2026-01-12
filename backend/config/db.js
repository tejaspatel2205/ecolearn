const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // ============================================
    // MONGODB ATLAS (CLOUD) - COMMENTED OUT
    // ============================================
    // const mongoURI = process.env.MONGODB_URI;
    // 
    // if (!mongoURI) {
    //   console.warn('⚠️  MONGODB_URI not set in .env file');
    //   console.warn('📝 Please create backend/.env with:');
    //   console.warn('   MONGODB_URI=your_mongodb_connection_string');
    //   console.warn('📖 See MONGODB_SETUP.md for instructions');
    //   console.warn('');
    //   console.warn('⚠️  Server will start but database operations will fail');
    //   console.warn('⚠️  Continuing without database connection...');
    //   return null;
    // }
    //
    // // Validate connection string format
    // if (!mongoURI.includes('@') && mongoURI.includes('mongodb+srv://')) {
    //   console.error('❌ MongoDB connection string appears to be missing username/password');
    //   console.error('📝 Connection string should be: mongodb+srv://username:password@cluster.mongodb.net/database');
    //   console.error('📖 See MONGODB_AUTH_FIX.md for instructions');
    //   throw new Error('Invalid MongoDB connection string format');
    // }
    //
    // const conn = await mongoose.connect(mongoURI, {
    //   serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    // });
    //
    // console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    // console.log(`📊 Database: ${conn.connection.name}`);
    // return conn;

    // ============================================
    // MONGODB COMPASS (LOCAL) - FOR TESTING
    // ============================================
    // Force local MongoDB connection (completely ignore .env for testing)
    // DO NOT use process.env.MONGODB_URI - it has Atlas connection
    const localMongoURI = 'mongodb://localhost:27017/ecolearn';
    
    console.log('🔧 Connecting to LOCAL MongoDB (MongoDB Compass)...');
    console.log(`📝 Connection: mongodb://localhost:27017/ecolearn`);
    console.log(`💡 Make sure MongoDB is running locally on port 27017`);
    console.log(`⚠️  Ignoring MONGODB_URI from .env file (using local only)`);
    
    const conn = await mongoose.connect(localMongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
    });

    console.log(`✅ MongoDB Connected (Local): ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Connection: ${conn.connection.readyState === 1 ? 'Ready' : 'Connecting...'}`);
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
      console.error('');
      console.error('⚠️  Cannot connect to local MongoDB!');
      console.error('📝 Make sure MongoDB is running locally');
      console.error('');
      console.error('To start MongoDB:');
      console.error('1. Open MongoDB Compass');
      console.error('2. Or start MongoDB service:');
      console.error('   Windows: net start MongoDB');
      console.error('   Mac/Linux: brew services start mongodb-community');
      console.error('   Or: mongod --dbpath /path/to/data');
      console.error('');
      console.error('Default connection: mongodb://localhost:27017/ecolearn');
    } else {
      console.error('📝 Please check your MongoDB connection');
      console.error('📖 Using local MongoDB: mongodb://localhost:27017/ecolearn');
    }
    
    console.error('');
    console.error('⚠️  Server will start but database operations will fail');
    return null;
  }
};

module.exports = connectDB;

