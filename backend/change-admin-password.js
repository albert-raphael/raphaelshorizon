/**
 * Admin Password Change Script
 * 
 * Usage: node change-admin-password.js <new-password>
 * Example: node change-admin-password.js MyNewSecurePassword123!
 * 
 * Run this on the DigitalOcean droplet inside the backend container:
 * docker exec -it raphaelshorizon-backend-1 node change-admin-password.js YourNewPassword
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const USERS_FILE = path.join(__dirname, 'embedded-data', 'users.json');

async function changeAdminPassword(newPassword) {
    if (!newPassword || newPassword.length < 8) {
        console.error('❌ Error: Password must be at least 8 characters long');
        console.log('\nUsage: node change-admin-password.js <new-password>');
        console.log('Example: node change-admin-password.js MyNewSecurePassword123!');
        process.exit(1);
    }

    try {
        // Read users
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        
        // Find admin user
        const adminIndex = users.findIndex(u => u.role === 'admin' && u.email === 'admin@raphaelshorizon.com');
        
        if (adminIndex === -1) {
            console.error('❌ Admin user not found!');
            process.exit(1);
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password
        users[adminIndex].password = hashedPassword;
        users[adminIndex].passwordUpdatedAt = new Date().toISOString();
        
        // Save
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        
        console.log('✅ Admin password changed successfully!');
        console.log(`   Email: ${users[adminIndex].email}`);
        console.log(`   Updated at: ${users[adminIndex].passwordUpdatedAt}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Get password from command line
const newPassword = process.argv[2];
changeAdminPassword(newPassword);
