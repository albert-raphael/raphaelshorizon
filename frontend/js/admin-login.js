// API configuration - Use config.js or fallback to relative path
const API_BASE_URL = (window.APP_CONFIG && window.APP_CONFIG.apiBaseUrl) 
    ? window.APP_CONFIG.apiUrl('')  // Use the helper method (no extra /api)
    : '/api';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLogin);
    }
});

async function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if(submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Authenticating...';
    }
    
    try {
        const res = await fetch(`${API_BASE_URL}/auth/admin-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || 'Login failed');
        
        // Store tokens for both admin and regular auth systems
        // This ensures admin can access all protected pages
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        localStorage.setItem('authToken', data.token);  // For auth-guard.js compatibility
        localStorage.setItem('user', JSON.stringify(data.user));  // For auth-guard.js compatibility
        
        window.location.href = 'admin-dashboard.html';
        
    } catch (err) {
        alert(err.message);
        if(submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    }
}