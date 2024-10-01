function toggleCategoryStatus(categoryId, currentStatus) {
    // Determine the new status
    const newStatus = currentStatus === "listed" ? "unlisted" : "listed";

    // Make an Axios PATCH request to update the status in the backend
    axios
        .patch(`/admin/category-management/update-status/${categoryId}`, { status: newStatus })
        .then((response) => {
            // console.log(response);

            if (response.status == 200) {
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

const modal = document.getElementById("addCategoryModal");
const btn = document.getElementById("addCategoryBtn");
const span = document.getElementById("closeAddModal");
const urlParams = new URLSearchParams(window.location.search);
const addCatmsg = urlParams.get("addCatmsg");

btn.onclick = function () {
    modal.style.display = "block";
};

span.onclick = function () {
    modal.style.display = "none";
};

window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

const error = document.getElementById("error");
if (error) {
    setTimeout(() => {
        error.style.display = "none";
    }, 3000);
}

document.addEventListener("DOMContentLoaded", function () {
    const editModal = document.getElementById("editCategoryModal");
    const editButtons = document.querySelectorAll(".edit-btn");
    const closeEditModal = document.getElementById("closeEditModal");

    editButtons.forEach((btn) => {
        btn.onclick = function () {
            const categoryId = this.getAttribute("data-id");
            const categoryName = this.getAttribute("data-name");
            const categoryDescription = this.getAttribute("data-description");

            console.log("input datas : ", categoryId, categoryName, categoryDescription);

            document.getElementById("edit-cat-id").value = categoryId;
            document.getElementById("edit-cat-name").value = categoryName;
            document.getElementById("edit-cat-description").value = categoryDescription;

            editModal.style.display = "block";
        };
    });

    // Close modal when clicking on <span> (x)
    closeEditModal.onclick = function () {
        editModal.style.display = "none";
    };

    // Close modal when clicking anywhere outside the modal
    window.onclick = function (event) {
        if (event.target === editModal) {
            editModal.style.display = "none";
        }
    };
});
