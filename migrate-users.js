const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.production') });

const User = require('./models/User');

const migrateUsers = async () => {
  try {
    console.log('MONGO_URI:', process.env.MONGO_URI);
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Read users from JSON file
    const usersPath = path.join(__dirname, 'embedded-data', 'users.json');
    if (!fs.existsSync(usersPath)) {
      console.log('No users.json file found');
      return;
    }

    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    console.log(`Found ${users.length} users to migrate`);

    // Migrate each user
    for (const userData of users) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping`);
        continue;
      }

      // Create user object
      const userObj = {
        name: userData.name,
        email: userData.email,
        password: userData.password, // Already hashed
        role: userData.role || 'user',
        avatar: userData.avatar || 'default-avatar.jpg',
        createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
        lastLogin: userData.lastLogin ? new Date(userData.lastLogin) : null,
        subscriptionActive: true, // Set all users as active
      };

      // Add Google ID if exists
      if (userData.googleId) {
        userObj.googleId = userData.googleId;
        userObj.authProvider = 'google';
      }

      // Add subscription data if exists
      if (userData.subscription) {
        userObj.subscription = userData.subscription;
      }

      // Create user in database
      const user = new User(userObj);
      await user.save();
      console.log(`Migrated user: ${userData.email}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

migrateUsers();