document.addEventListener('DOMContentLoaded', initRegisterPage);

const registerBaseUrl = 'http://localhost:5121/api';

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

    elements.password.addEventListener('input', () => validatePasswordMatch(elements));
    elements.confirmPassword.addEventListener('input', () => validatePasswordMatch(elements));
    elements.username.addEventListener('input', () => validateUsername(elements));
    elements.form.addEventListener('submit', (e) => handleFormSubmit(e, elements));
}

function validatePasswordMatch(elements) {
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
        firstName: elements.firstName.value,
        lastName: elements.lastName.value,
        email: elements.email.value,
        username: elements.username.value,
        passwordHash: elements.password.value,
        avatarUrl: '/assets/default-avatar.png'

    };

    submitRegistration(userData, elements.messageDiv, elements.username.value);
}


function submitRegistration(userData, messageDiv, username) {
    $.ajax({
        url: `${registerBaseUrl }/users/register`,
        type: 'POST',
        data: JSON.stringify(userData),
        contentType: 'application/json',
        success: function (response) {
            showSuccessMessage(messageDiv, username);
        },
        error: function (xhr) {
            showErrorMessage(messageDiv, xhr);
        }
    });
}

function showSuccessMessage(messageDiv, username) {
    messageDiv.classList.remove('d-none', 'alert-danger');
    messageDiv.classList.add('alert-success');
    messageDiv.innerHTML = 'Registration successful! Redirecting to login...';

    localStorage.setItem('demoUsername', username);

    setTimeout(function () {
        window.location.href = 'login.html';
    }, 2000);
}

function showErrorMessage(messageDiv, xhr) {
    messageDiv.classList.remove('d-none', 'alert-success');
    messageDiv.classList.add('alert-danger');

    try {
        const response = JSON.parse(xhr.responseText);
        if (response && response.message) {
            messageDiv.innerHTML = response.message;
        } else {
            messageDiv.innerHTML = 'Registration failed. Please try again.';
        }
    } catch {
        messageDiv.innerHTML = 'Registration failed. Please try again.';
    }
}
