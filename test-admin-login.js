// Test admin login functionality
async function testAdminLogin() {
    try {
        const response = await fetch('http://localhost:5002/api/auth/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@raphaelshorizon.com',
                password: 'admin123'
            })
        });

        const data = await response.json();
        console.log('Admin login test result:', data);

        if (data.success) {
            console.log('✅ Admin login successful!');
            console.log('Token:', data.token);
        } else {
            console.log('❌ Admin login failed:', data.message || 'Unknown error');
        }
    } catch (error) {
        console.error('❌ Admin login test error:', error);
    }
}

// Run the test
testAdminLogin();