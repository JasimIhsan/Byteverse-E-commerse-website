function changeUserStatus(userId, status) {
    fetch(`/admin/user-management/${userId}`, {
        method: "POST", // Use POST since we are using a form-like structure
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: status }), // Send the new status
    })
        .then((response) => {
            if (response.ok) {
                location.reload(); // Reload the page to see the changes
            } else {
                alert("Error updating status");
            }
        })
        .catch((error) => {
            console.error("Error:", error);
        });
}

// Function to toggle user status
function toggleUserStatus(userId, currentStatus) {
    // Determine the new status
    const newStatus = currentStatus === "Unblocked" ? "Blocked" : "Unblocked";

    // Make an Axios PATCH request to update the status in the backend
    axios
        .patch(`/admin/user-management/update-status/${userId}`, { status: newStatus })
        .then((response) => {
            if (response.data.success) {
                // Update the button's appearance and text based on the new status
                const button = document.querySelector(`#status-form-${userId} button`);
                button.textContent = newStatus === "Unblocked" ? "Unblock" : "Block";
                button.className = newStatus === "Unblocked" ? "status-btn unblock-btn" : "status-btn block-btn";

                button.setAttribute("onclick", `toggleUserStatus('${userId}', '${newStatus}')`);
            } else {
                console.error("Failed to update status.");
            }
        })
        .catch((error) => {
            console.error("Error updating user status:", error);
        });
}

const error = document.getElementById("error");
