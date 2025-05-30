document.addEventListener('DOMContentLoaded', function () {
    const passwordToggles = document.querySelectorAll('.toggle-password');

    passwordToggles.forEach(function (toggle) {
        toggle.addEventListener('click', function () {
            const passwordInput = this.previousElementSibling;

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        });
    });

    const accountOptions = document.querySelectorAll('.account-type-option');
    const registrationForms = document.querySelectorAll('.register-form');

    accountOptions.forEach(function (option) {
        option.addEventListener('click', function () {
            accountOptions.forEach(function (opt) {
                opt.classList.remove('active');
            });

            this.classList.add('active');

            const formToShow = this.getAttribute('data-tab');

            registrationForms.forEach(function (form) {
                form.classList.remove('active');
            });

            document.getElementById(formToShow + '-form').classList.add('active');
        });
    });
});

async function handleSignup(event) {
    event.preventDefault();
    const submittedForm = event.target;
    const accountType = submittedForm.id.split('-')[0];
    const formData = { type: accountType };

    const inputFields = submittedForm.querySelectorAll('input, select');
    inputFields.forEach(function (input) {
        let fieldName = input.id;
        if (input.id.includes('email')) {
            fieldName = 'email';
        } else if (input.id.includes('password')) {
            fieldName = 'password';
        }
        formData[fieldName] = input.value;
    });

    try {
        const response = await fetch('https://dern-support-official-7zzw.onrender.com/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            setTimeout(() => {
                window.location.href = '../LoginPage/LoginPage.html';
            }, 50);
            submittedForm.reset();
        } else {
            const errorData = await response.json();
            alert(errorData.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during registration');
    }
}