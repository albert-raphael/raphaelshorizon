const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/raphaels_horizon', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.log('Continuing in development mode without database...');
    }
  }
};

module.exports = connectDB;