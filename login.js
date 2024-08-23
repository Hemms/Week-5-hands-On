document.addEventListener('DOMContentLoaded', () => {
    const sessionToken = JSON.parse(sessionStorage.getItem('token'));
    if (sessionToken) window.location.replace('./index.html'); // Redirect if logged in
    
    const form = document.getElementById('form');
    const authMsg = document.getElementById('auth-msg');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:5502/api/login', {
                method: 'POST', // Changed to POST
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const { message, token } = await response.json();

            if (!response.ok) {
                authMsg.textContent = message || 'Login failed, please try again';
            } else {
                authMsg.textContent = 'Access granted';
                // Store user details in local storage
                sessionStorage.setItem('token', token);

                // Redirect to homepage
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }

        } catch (err) {
            authMsg.textContent = 'An error occurred: ' + err.message;
        }
    });
});