document.addEventListener("DOMContentLoaded", function () {
    const defaultCountdown = 120; // Set default countdown to 2 minutes (120 seconds)
    let countdown = sessionStorage.getItem("countdown") ? parseInt(sessionStorage.getItem("countdown")) : defaultCountdown;

    const timerElement = document.getElementById("timer");
    const resendLink = document.getElementById("resend-otp");
    const otpInputs = document.querySelectorAll(".input-field input");
    const verifyButton = document.querySelector("button");

    // Enable next input on keyup
    otpInputs.forEach((input, index) => {
        input.addEventListener("keyup", function (e) {
            // Check if the input is filled and move to the next input
            if (e.target.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].disabled = false;
                otpInputs[index + 1].focus();
            }

            // Activate the button if all inputs are filled
            if (areAllInputsFilled()) {
                verifyButton.classList.add("active");
                verifyButton.disabled = false;
            } else {
                verifyButton.classList.remove("active");
                verifyButton.disabled = true;
            }

            // Handle backspace key
            if (e.key === "Backspace" && index > 0 && input.value.length === 0) {
                otpInputs[index - 1].focus(); // Move focus to the previous input
                otpInputs[index - 1].value = ""; // Clear the previous input if needed
                verifyButton.classList.remove("active");
                verifyButton.disabled = true;
            }
        });

        // Restrict input to only one digit
        input.addEventListener("input", function (e) {
            const value = e.target.value;
            // Allow only digits (0-9) and limit to 1 character
            if (!/^\d*$/.test(value) || value.length > 1) {
                e.target.value = value.slice(0, 1); // Set the value to the first character if it's too long
            }
        });
    });

    // Function to check if all inputs are filled
    const areAllInputsFilled = () => {
        return Array.from(otpInputs).every((input) => input.value.length === 1);
    };

    // Countdown function
    const startCountdown = () => {
        const countdownInterval = setInterval(() => {
            if (countdown > 0) {
                countdown--;
                sessionStorage.setItem("countdown", countdown); // Store countdown in sessionStorage

                // Convert seconds to minutes and seconds
                const minutes = Math.floor(countdown / 60);
                const seconds = countdown % 60;

                // Format to display as MM:SS
                timerElement.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
            } else {
                clearInterval(countdownInterval);
                enableResendLink();
                sessionStorage.removeItem("countdown"); // Clear countdown when it reaches zero
            }
        }, 1000);
    };

    // Enable resend OTP link
    const enableResendLink = () => {
        resendLink.classList.remove("disabled");
        resendLink.style.pointerEvents = "auto";
        resendLink.style.color = "#5C59E8";
        timerElement.textContent = "";
    };

    // Start countdown or enable resend link if countdown is expired
    if (countdown > 0) {
        startCountdown();
    } else {
        enableResendLink();
    }

    // Resend OTP function
    resendLink.addEventListener("click", async function (e) {
        e.preventDefault();

        // Disable the resend link while processing
        resendLink.style.pointerEvents = "none";
        resendLink.style.color = "grey";
        timerElement.textContent = countdown;

        try {
            const response = await fetch("/signup/resend-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                // SweetAlert2 success notification
                Swal.fire({
                    icon: "success",
                    title: "Success!",
                    text: "OTP has been resent!",
                    confirmButtonText: "OK",
                    customClass: {
                        confirmButton: "customClass", // Optional: Add your custom class
                    },
                });
            } else {
                // SweetAlert2 error notification
                Swal.fire({
                    icon: "error",
                    title: "Error!",
                    text: "Failed to resend OTP. Please try again.",
                    confirmButtonText: "OK",
                    customClass: {
                        confirmButton: "customClass",
                    },
                });
            }
        } catch (error) {
            console.error("Error resending OTP:", error);
            Swal.fire({
                icon: "error",
                title: "Error!",
                text: "An error occurred. Please try again later.",
                confirmButtonText: "OK",
                customClass: {
                    confirmButton: "customClass",
                },
            });
        }

        // Restart the countdown after resending OTP
        countdown = 120; // Reset to 2 minutes (120 seconds) after resending OTP
        sessionStorage.setItem("countdown", countdown); // Store new countdown in sessionStorage
        startCountdown();
    });
});
