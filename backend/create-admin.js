const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/raphaels_horizon');

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@raphaelshorizon.com',
      password: 'admin123',
      role: 'admin'
    });

    console.log('Admin user created successfully:', adminUser.email);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
};

createAdminUser();