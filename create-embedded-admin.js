const bcrypt = require('./backend/node_modules/bcryptjs');
const fs = require('fs');
const path = require('path');

const createEmbeddedAdmin = async () => {
  try {
    const usersPath = path.join(__dirname, 'embedded-data', 'users.json');

    // Read existing users
    let users = [];
    if (fs.existsSync(usersPath)) {
      users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    }

    // Check if admin already exists
    const existingAdmin = users.find(u => u.email === 'admin@raphaelshorizon.com');
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      console.log('Admin credentials:');
      console.log('Email: admin@raphaelshorizon.com');
      console.log('Password: admin123');
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Create admin user
    const adminUser = {
      _id: 'admin_' + Date.now().toString(36),
      name: 'Administrator',
      email: 'admin@raphaelshorizon.com',
      password: hashedPassword,
      role: 'admin',
      avatar: 'default-avatar.jpg',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    // Add to users array
    users.push(adminUser);

    // Write back to file
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

    console.log('✅ Admin user created successfully!');
    console.log('Admin credentials:');
    console.log('Email: admin@raphaelshorizon.com');
    console.log('Password: admin123');
    console.log('Role: admin');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
};

createEmbeddedAdmin();