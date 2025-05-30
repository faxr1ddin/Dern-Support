document.addEventListener('DOMContentLoaded', function () {
    const togglePassword = document.querySelector('.toggle-password');
    const password = document.getElementById('password');

    if (togglePassword && password) {
        togglePassword.addEventListener('click', function () {
            const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
            password.setAttribute('type', type);
            this.classList.toggle('fa-eye-slash');
        });
    }

    initializeDefaultAdmin();

    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function initializeDefaultAdmin() {
    try {
        const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@gmail.com',
                password: '1234'
            })
        });

        if (!response.ok) {
            await createDefaultAdmin();
        }
    } catch (error) {
        console.error('Error checking admin:', error);
    }
}

async function createDefaultAdmin() {
    try {
        const defaultAdmin = {
            email: 'admin@gmail.com',
            password: '1234',
            'full-name': 'System Administrator',
            type: 'business',
            'business-name': 'Dern-Support',
            isAdmin: true,
            createdAt: new Date().toISOString()
        };

        const response = await fetch('http://localhost:3000/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(defaultAdmin)
        });

        if (response.ok) {
            console.log('Default admin account created');
        } else {
            console.error('Failed to create admin account');
        }
    } catch (error) {
        console.error('Error creating admin:', error);
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            sessionStorage.setItem('currentUser', email);

            if (email === 'admin@gmail.com') {
                window.location.href = '../DashboardPage/AdminDashboard.html';
            } else {
                window.location.href = '../DashboardPage/Dashboard.html';
            }
        } else {
            alert(data.message || 'Invalid email or password');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
    }
}