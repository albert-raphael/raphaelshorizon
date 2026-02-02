const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/raphaels_horizon', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('CRITICAL: Database connection error:', error.message);
    console.error('Make sure MONGO_URI is correct and reachable from the server.');
    
    if (process.env.NODE_ENV === 'production') {
      console.warn('Production mode: Application will attempt to stay alive but DB features will fail.');
      // Don't exit immediately, let the health check routes respond so we can see the server is up
      // process.exit(1); 
    } else {
      console.log('Continuing in development mode without database...');
    }
  }
};

module.exports = connectDB;