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
    const email = document.getElementById("email").value || document.getElementById("signinEmail").value;
    const emailError = document.getElementById("emailError") || document.getElementById("signinEmailError");
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
    const password = document.getElementById("password").value || document.getElementById("signinPassword").value;
    const passwordError = document.getElementById("passwordError") || document.getElementById("signinPasswordError");

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

// Attach dynamic validation to the sign-in form fields
document.getElementById("signinEmail").addEventListener("keyup", validateEmail);
document.getElementById("signinPassword").addEventListener("keyup", validatePassword);

// Function for validating the sign-in form
function validateSignInForm(event) {
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();

    return isEmailValid && isPasswordValid;
}

// Attach the validate function to the sign-in form submit event
document.getElementById("signinForm").addEventListener("submit", validateSignInForm);
