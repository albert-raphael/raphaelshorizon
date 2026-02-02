#!/usr/bin/env node
/**
 * Admin Password Reset Script
 * 
 * Usage: 
 *   node scripts/reset-admin-password.js [new-password]
 *   
 * If no password is provided, a secure random password will be generated.
 */

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(__dirname, '../embedded-data/users.json');

// Generate a secure random password
function generateSecurePassword(length = 16) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
    let password = '';
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        password += chars[randomBytes[i] % chars.length];
    }
    return password;
}

async function resetAdminPassword(newPassword) {
    try {
        // Read users file
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        
        // Find admin user
        const adminIndex = users.findIndex(u => u.role === 'admin');
        
        if (adminIndex === -1) {
            console.error('❌ No admin user found in the database.');
            console.log('\nTo create an admin user, run: node create-admin.js');
            process.exit(1);
        }
        
        const admin = users[adminIndex];
        
        // Use provided password or generate new one
        const password = newPassword || generateSecurePassword();
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Update admin password
        users[adminIndex].password = hashedPassword;
        users[adminIndex].passwordUpdatedAt = new Date().toISOString();
        
        // Write back to file
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        
        console.log('\n✅ Admin password has been reset successfully!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  Admin Email:    ', admin.email);
        console.log('  New Password:   ', password);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n⚠️  IMPORTANT: Save this password securely!');
        console.log('   It will not be shown again.\n');
        
        if (!newPassword) {
            console.log('💡 Tip: You can also set a specific password:');
            console.log('   node scripts/reset-admin-password.js YourNewPassword123!\n');
        }
        
    } catch (error) {
        console.error('❌ Error resetting password:', error.message);
        process.exit(1);
    }
}

// Get password from command line argument
const newPassword = process.argv[2];

// Run the reset
resetAdminPassword(newPassword);
