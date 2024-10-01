function toggleCategoryStatus(categoryId, currentStatus) {
    console.log("Function invoked");
    console.log("Category ID:", categoryId);
    console.log("Current Status:", currentStatus);

    // Determine the new status
    const newStatus = currentStatus === "listed" ? "unlisted" : "listed";
    console.log("New Status:", newStatus);

    // Make an Axios PATCH request to update the status in the backend
    axios
        .patch(`/admin/product-management/update-status/${categoryId}`, { status: newStatus })
        .then((response) => {
            console.log("Response from server:", response.data);
            if (response.data.success) {
                // Update the button's appearance and text based on the new status
                const button = document.querySelector(`#status-form-${categoryId} button`);
                button.textContent = newStatus === "listed" ? "Unlist" : "List";
                button.className = newStatus === "listed" ? "status-btn unlist-btn" : "status-btn list-btn";

                // Update the onclick event for the button
                button.setAttribute("onclick", `toggleCategoryStatus('${categoryId}', '${newStatus}')`);
                location.reload();
            } else {
                console.error("Failed to update status.");
            }
        })
        .catch((error) => {
            console.error("Error updating category status:", error);
        });
}
