const signUpButton = document.getElementById("signUp");
const signInButton = document.getElementById("signIn");
const container = document.getElementById("container");

signUpButton.addEventListener("click", () => {
    container.classList.add("right-panel-active");
});

signInButton.addEventListener("click", () => {
    container.classList.remove("right-panel-active");
});

const sendOtpButton = document.getElementById("sendOtpButton");
const countdownDisplay = document.getElementById("countdownDisplay");
let countdown;

sendOtpButton.addEventListener("click", () => {
    // Disable the button after clicking
    sendOtpButton.disabled = true;
    let timeLeft = 60; // 60 seconds countdown

    countdownDisplay.textContent = `OTP sent! You can request again in ${timeLeft} seconds.`;

    countdown = setInterval(() => {
        timeLeft--;
        countdownDisplay.textContent = `OTP sent! You can request again in ${timeLeft} seconds.`;

        if (timeLeft <= 0) {
            clearInterval(countdown);
            sendOtpButton.disabled = false;
            countdownDisplay.textContent = "";
        }
    }, 1000);
});
