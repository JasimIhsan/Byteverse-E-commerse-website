function toggleUserStatus(userId, currentStatus) {
    // Determine the new status
    const newStatus = currentStatus === "Blocked" ? "Unblocked" : "Blocked";

    // Make a PATCH request to update the status in the backend
    axios
        .patch(`/admin/user-management/update-status/${userId}`, { status: newStatus })
        .then((response) => {
            if (response.data.success) {
                // Update the button's appearance and text based on the new status
                const button = document.querySelector(`#status-form-${userId} button`);
                button.textContent = newStatus === "Unblocked" ? "Block" : "Unblock";
                button.className = newStatus === "Unblocked" ? "status-btn block-btn" : "status-btn unblock-btn";

                button.setAttribute("onclick", `toggleUserStatus('${userId}', '${newStatus}')`);
            } else {
                console.error("Failed to update status.");
            }
        })
        .catch((error) => {
            console.error("Error updating user status:", error);
        });
}
