// register.js - תיקון פשוט
document.addEventListener('DOMContentLoaded', initRegisterPage);

const registerBaseUrl = window.API_BASE_URL || 'https://proj.ruppin.ac.il/cgroup17/test2/tar1/api';

function initRegisterPage() {
    const elements = {
        form: document.getElementById('registerForm'),
        firstName: document.getElementById('firstName'),
        lastName: document.getElementById('lastName'),
        email: document.getElementById('email'),
        username: document.getElementById('username'),
        password: document.getElementById('password'),
        confirmPassword: document.getElementById('confirmPassword'),
        messageDiv: document.getElementById('registerMessage')
    };

    // בדיקה שכל האלמנטים קיימים
    if (!elements.username || !elements.password || !elements.confirmPassword) {
        console.error('❌ Required elements not found');
        return;
    }

    elements.password.addEventListener('input', () => validatePasswordMatch(elements));
    elements.confirmPassword.addEventListener('input', () => validatePasswordMatch(elements));
    elements.username.addEventListener('input', () => validateUsername(elements));
    elements.form.addEventListener('submit', (e) => handleFormSubmit(e, elements));
}

function validatePasswordMatch(elements) {
    // בדיקת קיום
    if (!elements || !elements.password || !elements.confirmPassword) return;

    const password = elements.password.value;
    const confirmPassword = elements.confirmPassword.value;

    if (confirmPassword && password !== confirmPassword) {
        elements.confirmPassword.setCustomValidity('Passwords do not match');
        elements.confirmPassword.classList.add('is-invalid');
    } else {
        elements.confirmPassword.setCustomValidity('');
        elements.confirmPassword.classList.remove('is-invalid');
    }
}

function validateUsername(elements) {
    // בדיקת קיום - זה התיקון העיקרי!
    if (!elements || !elements.username) return;

    const username = elements.username.value;
    if (username.length > 0 && username.length < 3) {
        elements.username.setCustomValidity('Username must be at least 3 characters long');
        elements.username.classList.add('is-invalid');
    } else {
        elements.username.setCustomValidity('');
        elements.username.classList.remove('is-invalid');
    }
}

function handleFormSubmit(e, elements) {
    e.preventDefault();

    const userData = {
        Username: elements.username.value.trim(),
        Email: elements.email.value.trim(),
        PasswordHash: elements.password.value,
        FirstName: elements.firstName.value.trim(),
        LastName: elements.lastName.value.trim(),
        AvatarUrl: '/assets/default-avatar.png'
    };

    submitRegistration(userData, elements.messageDiv);
}

function submitRegistration(userData, messageDiv) {
    ajaxCall(
        'POST',
        `${registerBaseUrl}/users/register`,
        JSON.stringify(userData),
        function (response) {
            // console.log('✅ Registration response:', response);

            // עכשיו השרת מחזיר JSON עם success flag
            if (response && response.success === true) {
                showSuccessMessage(messageDiv, userData.Username);
            } else {
                showErrorMessage(messageDiv, response.message || 'Registration failed');
            }
        },
        function (xhr, status, error) {
            console.error('❌ Registration failed:', xhr.status, xhr.responseText);

            let errorMsg = 'Registration failed. Please try again.';
            try {
                const errorResponse = JSON.parse(xhr.responseText);
                if (errorResponse.message) {
                    errorMsg = errorResponse.message;
                }
            } catch (e) {
                // אם זה לא JSON, השתמש בהודעה הכללית
            }

            showErrorMessage(messageDiv, errorMsg);
        }
    );
}

function showSuccessMessage(messageDiv, username) {
    messageDiv.classList.remove('d-none', 'alert-danger');
    messageDiv.classList.add('alert-success');
    messageDiv.innerHTML = '🎉 Registration successful! Logging you in...';

    // התחברות אוטומטית לאחר הרשמה מוצלחת
    const password = document.getElementById('password').value;

    // קריאה לפונקציית התחברות מ-auth.js
    Auth.login(username, password).then(loginResult => {
        if (loginResult.success) {
            messageDiv.innerHTML = '🎉 Registration and login successful! Redirecting...';
            setTimeout(() => {
                window.location.href = 'news.html'; // או כל דף שאתה רוצה לאחר התחברות
            }, 1500);
        } else {
            // אם ההתחברות נכשלה, הפנה לדף לוגין
            messageDiv.innerHTML = '🎉 Registration successful! Please login manually.';
            localStorage.setItem('demoUsername', username);
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    }).catch(error => {
        // אם יש שגיאה בהתחברות, הפנה לדף לוגין
        console.error('Login after registration failed:', error);
        messageDiv.innerHTML = '🎉 Registration successful! Please login manually.';
        localStorage.setItem('demoUsername', username);
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    });
}

function showErrorMessage(messageDiv, msg) {
    messageDiv.classList.remove('d-none', 'alert-success');
    messageDiv.classList.add('alert-danger');
    messageDiv.innerHTML = msg;
}