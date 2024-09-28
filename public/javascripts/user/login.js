const signUpButton = document.getElementById("signUp");
const signInButton = document.getElementById("signIn");
const container = document.getElementById("container");

signUpButton.addEventListener("click", () => {
    container.classList.add("right-panel-active");
});

signInButton.addEventListener("click", () => {
    container.classList.remove("right-panel-active");
});

// Function for validating username
function validateUsername() {
    const username = document.getElementById("username").value;
    const usernameError = document.getElementById("usernameError");

    if (username.length < 3) {
        usernameError.textContent = "Username must be at least 3 characters long";
        return false;
    } else {
        usernameError.textContent = "";
        return true;
    }
}

// Function for validating email
function validateEmail() {
    const email = document.getElementById("email").value;
    const emailError = document.getElementById("emailError");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        emailError.textContent = "Please enter a valid email address";
        return false;
    } else {
        emailError.textContent = "";
        return true;
    }
}

// Function for validating password
function validatePassword() {
    const password = document.getElementById("password").value;
    const passwordError = document.getElementById("passwordError");

    if (password.length < 6) {
        passwordError.textContent = "Password must be at least 6 characters long";
        return false;
    } else {
        passwordError.textContent = "";
        return true;
    }
}

// Function for validating confirm password
function validateConfirmPassword() {
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const confirmPasswordError = document.getElementById("confirmPasswordError");

    if (password !== confirmPassword) {
        confirmPasswordError.textContent = "Passwords do not match";
        return false;
    } else {
        confirmPasswordError.textContent = "";
        return true;
    }
}

// Function for validating the signup form
function validateSignupForm() {
    const isUsernameValid = validateUsername();
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();

    return isUsernameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid;
}

// Function for validating the sign-in form
function validateSignInForm(event) {
    const email = document.getElementById("signinEmail").value;
    const password = document.getElementById("signinPassword").value;
    const emailError = document.getElementById("signinEmailError");
    const passwordError = document.getElementById("signinPasswordError");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let valid = true;

    // Validate Email
    if (!emailRegex.test(email)) {
        emailError.textContent = "Please enter a valid email address";
        valid = false;
    } else {
        emailError.textContent = "";
    }

    // Validate Password
    if (password.length < 6) {
        passwordError.textContent = "Password must be at least 6 characters long";
        valid = false;
    } else {
        passwordError.textContent = "";
    }

    if (!valid) {
        event.preventDefault(); // Prevent form submission if validation fails
    }

    return valid;
}

// Attach the validate function to the sign-in form
document.getElementById("signinForm").addEventListener("submit", validateSignInForm);
