function validateName() {
    const name = document.getElementById("name").value;
    const name_error = document.getElementById("name-error");

    if (name.trim().length === 0) {
        name_error.textContent = "Product name cannot be empty or contain only spaces";
        return false;
    } else if (name.includes(" ")) {
        name_error.textContent = "Product name cannot contain spaces";
        return false;
    } else if (name.length < 3) {
        name_error.textContent = "Product name must be at least 3 characters long";
        return false;
    } else {
        name_error.textContent = "";
        return true;
    }
}

function validateBrand() {
    const brand = document.getElementById("brand").value;
    const brand_error = document.getElementById("brand-error");

    if (brand === "") {
        brand_error.textContent = "Please select a brand.";
        return false;
    } else {
        brand_error.textContent = ""; // Clear the error message
        return true;
    }
}

function validateCategory() {
    const category = document.getElementById("category").value;
    const category_error = document.getElementById("category-error");

    if (category === "") {
        category_error.textContent = "Please select a category.";
        return false;
    } else {
        category_error.textContent = ""; // Clear the error message
        return true;
    }
}

function validatePrice() {
    const price = document.getElementById("price").value;
    const price_error = document.getElementById("price-error");

    if (price < 0) {
        price_error.textContent = "Price must be a positive number.";
        return false;
    } else if (stock == "e" || stock == "E") {
        price_error.textContent = "Price cannot contain 'e'.";
        return false;
    } else if (price.includes("e") || price.includes("E")) {
        price_error.textContent = "Price cannot contain 'e'.";
        return false;
    } else {
        price_error.textContent = "";
    }
}

function validateStock() {
    const stock = document.getElementById("stock").value;
    const stock_error = document.getElementById("stock-error");

    if (stock < 150 || stock < 0) {
        stock_error.textContent = "Stock must be at least 150 and a positive number.";
        return false;
    } else if (stock == "e" || stock == "E") {
        stock_error.textContent = "Stock cannot contain 'e'.";
        return false;
    } else if (stock.includes("e") || stock.includes("E")) {
        stock_error.textContent = "Stock cannot contain 'e'.";
        return false;
    } else {
        stock_error.textContent = "";
        return true;
    }
}

function validateProcessorBrand() {
    const brand = document.getElementById("processor-brand").value;
    const brand_error = document.getElementById("processor-brand-error");

    if (brand === "") {
        brand_error.textContent = "Please select a processor brand.";
        return false;
    } else {
        brand_error.textContent = "";
        return true;
    }
}

function validateProcessorModel() {
    const model = document.getElementById("processor-model").value;
    const model_error = document.getElementById("processor-model-error");

    if (model.trim().length === 0) {
        model_error.textContent = "Processor model cannot be empty.";
        return false;
    } else {
        model_error.textContent = "";
        return true;
    }
}

function validateProcessorCores() {
    const cores = document.getElementById("processor-cores").value;
    const cores_error = document.getElementById("processor-cores-error");

    if (cores === "") {
        cores_error.textContent = "Processor cores cannot be empty.";
        return false;
    } else if (cores <= 0) {
        cores_error.textContent = "Processor cores must be a positive number.";
        return false;
    } else {
        cores_error.textContent = "";
        return true;
    }
}

function validateProcessorSpeed() {
    const speed = document.getElementById("processor-speed").value;
    const speed_error = document.getElementById("processor-speed-error");

    // Check if the input is a valid number format
    const speedRegex = /^\d+(\.\d+)? GHz$/; // Matches a number with optional decimal followed by ' GHz'
    if (speed.trim().length === 0) {
        speed_error.textContent = "Processor speed cannot be empty.";
        return false;
    } else if (!speedRegex.test(speed)) {
        speed_error.textContent = "Processor speed must be in the format 'x GHz'.";
        return false;
    } else {
        speed_error.textContent = "";
        return true;
    }
}

function validateRamSize() {
    const ramSize = document.getElementById("ram-size").value;
    const ramSize_error = document.getElementById("ram-size-error");

    if (ramSize === "") {
        ramSize_error.textContent = "Please select a RAM size.";
        return false;
    } else {
        ramSize_error.textContent = "";
        return true;
    }
}

function validateRamType() {
    const ramType = document.getElementById("ram-type").value;
    const ramTypeError = document.getElementById("ram-type-error");

    if (ramType === "") {
        ramTypeError.textContent = "Please select a RAM type.";
        return false;
    } else {
        ramTypeError.textContent = "";
        return true;
    }
}

function validateStorageType() {
    const storageType = document.getElementById("storage-type").value;
    const storageTypeError = document.getElementById("storage-type-error");

    if (storageType === "") {
        storageTypeError.textContent = "Please select a storage type.";
        return false;
    } else {
        storageTypeError.textContent = "";
        return true;
    }
}

function validateStorageCapacity() {
    const storageCapacity = document.getElementById("storage-capacity").value;
    const storageCapacityError = document.getElementById("storage-capacity-error");

    if (storageCapacity === "") {
        storageCapacityError.textContent = "Please select a storage capacity.";
        return false;
    } else {
        storageCapacityError.textContent = "";
        return true;
    }
}

function validateDisplaySize() {
    const displaySize = document.getElementById("display-size").value;
    const displaySizeError = document.getElementById("display-size-error");

    // Regular expression to match positive numbers
    const sizeRegex = /^[0-9]*\.?[0-9]+$/; // Matches only positive numbers and decimal points

    if (displaySize.trim().length === 0) {
        displaySizeError.textContent = "Display size cannot be empty.";
        return false;
    } else if (!sizeRegex.test(displaySize)) {
        displaySizeError.textContent = "Display size must be a positive number.";
        return false;
    } else {
        displaySizeError.textContent = "";
        return true;
    }
}

function validateDisplayResolution() {
    const displayResolution = document.getElementById("display-resolution").value;
    const displayResolutionError = document.getElementById("display-resolution-error");

    // Regular expression for display resolution format (e.g., "1920x1080")
    const resolutionRegex = /^\d{3,4}x\d{3,4}$/; // Matches 'WidthxHeight'

    if (displayResolution.trim().length === 0) {
        displayResolutionError.textContent = "Display resolution cannot be empty.";
        return false;
    } else if (!resolutionRegex.test(displayResolution)) {
        displayResolutionError.textContent = "Display resolution must be in the format WidthxHeight (e.g., 1920x1080).";
        return false;
    } else {
        displayResolutionError.textContent = "";
        return true;
    }
}

function validateGraphicsBrand() {
    const graphicsBrand = document.getElementById("graphics-brand").value;
    const graphicsBrandError = document.getElementById("graphics-brand-error");

    if (graphicsBrand === "") {
        graphicsBrandError.textContent = "Please select a graphics brand.";
        return false;
    } else {
        graphicsBrandError.textContent = "";
        return true;
    }
}

function validateGraphicsModel() {
    const graphicsModel = document.getElementById("graphics-model").value;
    const errorElement = document.getElementById("graphics-model-error");

    if (graphicsModel.trim().length === 0) {
        errorElement.textContent = "Graphics model cannot be empty.";
        return false;
    } else {
        errorElement.textContent = "";
        return true;
    }
}

function validateGraphicsMemory() {
    const graphicsMemory = document.getElementById("graphics-memory").value;
    const errorElement = document.getElementById("graphics-memory-error");
    const memoryRegex = /^(0|[1-9][0-9]*)GB$/; // Matches positive integers followed by 'GB'

    // Check if the input is empty
    if (graphicsMemory.trim().length === 0) {
        errorElement.textContent = "Graphics memory cannot be empty.";
        return false;
    }
    // Check if the input matches the required format
    else if (!memoryRegex.test(graphicsMemory)) {
        errorElement.textContent = "Graphics memory must be a positive integer followed by 'GB'.";
        return false;
    }
    // If all validations pass
    else {
        errorElement.textContent = ""; // Clear any error message
        return true;
    }
}

function validateBatteryCapacity() {
    const batteryCapacity = document.getElementById("battery-capacity").value;
    const errorElement = document.getElementById("battery-capacity-error");
    const capacityRegex = /^[1-9]\d* mAh$/; // Matches positive integers followed by " mAh"

    if (batteryCapacity.trim().length === 0) {
        errorElement.textContent = "Battery capacity cannot be empty.";
        return false;
    } else if (!capacityRegex.test(batteryCapacity)) {
        errorElement.textContent = "Battery capacity must be a positive integer followed by 'mAh'.";
        return false;
    } else {
        errorElement.textContent = ""; // Clear any error message
        return true;
    }
}

function validateBatteryType() {
    const batteryType = document.getElementById("battery-type").value;
    const errorElement = document.getElementById("battery-type-error");

    // Check if a battery type has been selected
    if (batteryType === "") {
        errorElement.textContent = "Please select a battery type.";
        return false;
    } else {
        errorElement.textContent = ""; // Clear any error message
        return true;
    }
}

function validateOperatingSystem() {
    const osSelect = document.getElementById("os");
    const errorElement = document.getElementById("os-error");

    // Check if a valid option is selected
    if (osSelect.value === "") {
        errorElement.textContent = "Please select an operating system.";
        return false;
    } else {
        errorElement.textContent = ""; // Clear any error message
        return true;
    }
}

function validateWeight() {
    const weight = document.getElementById("weight").value;
    const weightError = document.getElementById("weight-error");
    const weightRegex = /^[0-9]+(\.[0-9]+)?kg$/; // Matches numbers with optional decimal followed by 'kg'

    if (weight.trim().length === 0) {
        weightError.textContent = "Weight cannot be empty.";
        return false;
    } else if (!weightRegex.test(weight)) {
        weightError.textContent = "Weight must be a positive number followed by 'kg'.";
        return false;
    } else {
        weightError.textContent = "";
        return true;
    }
}
function validateWidth() {
    const width = document.getElementById("width").value;
    const widthError = document.getElementById("width-error");
    const dimensionRegex = /^[0-9]+$/; // Matches only positive integers

    if (width.trim().length === 0) {
        widthError.textContent = "Width cannot be empty.";
        return false;
    } else if (!dimensionRegex.test(width) || width <= 0) {
        widthError.textContent = "Width must be a positive integer.";
        return false;
    } else {
        widthError.textContent = "";
        return true;
    }
}
function validateHeight() {
    const height = document.getElementById("height").value;
    const heightError = document.getElementById("height-error");
    const dimensionRegex = /^[0-9]+$/; // Matches only positive integers

    if (height.trim().length === 0) {
        heightError.textContent = "Height cannot be empty.";
        return false;
    } else if (!dimensionRegex.test(height) || height <= 0) {
        heightError.textContent = "Height must be a positive integer.";
        return false;
    } else {
        heightError.textContent = "";
        return true;
    }
}

function validateDepth() {
    const depth = document.getElementById("depth").value;
    const depthError = document.getElementById("depth-error");
    const dimensionRegex = /^[0-9]+$/; // Matches only positive integers

    if (depth.trim().length === 0) {
        depthError.textContent = "Depth cannot be empty.";
        return false;
    } else if (!dimensionRegex.test(depth) || depth <= 0) {
        depthError.textContent = "Depth must be a positive integer.";
        return false;
    } else {
        depthError.textContent = "";
        return true;
    }
}

function validateWarranty() {
    const warranty = document.getElementById("warranty").value;
    const warrantyError = document.getElementById("warranty-error");
    const warrantyRegex = /^(0|[1-9]\d*)\s*(years?|months?)$/i; // Matches formats like "1 year", "2 months", "3 Years"

    if (warranty.trim().length === 0) {
        warrantyError.textContent = "Warranty cannot be empty.";
        return false;
    } else if (!warrantyRegex.test(warranty)) {
        warrantyError.textContent = "Warranty must be in the format 'X years' or 'X months'.";
        return false;
    } else {
        warrantyError.textContent = "";
        return true;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");

    form.addEventListener("submit", function (e) {
        // Prevent form submission initially
        e.preventDefault();

        // Call validation functions for all fields
        const isNameValid = validateName();
        const isBrandValid = validateBrand();
        const isCategoryValid = validateCategory();
        const isPriceValid = validatePrice();
        const isStockValid = validateStock();
        const isProcessorBrandValid = validateProcessorBrand();
        const isProcessorModelValid = validateProcessorModel();
        const isProcessorCoresValid = validateProcessorCores();
        const isProcessorSpeedValid = validateProcessorSpeed();
        const isRamSizeValid = validateRamSize();
        const isRamTypeValid = validateRamType();
        const isStorageTypeValid = validateStorageType();
        const isStorageCapacityValid = validateStorageCapacity();
        const isDisplaySizeValid = validateDisplaySize();
        const isDisplayResolutionValid = validateDisplayResolution();
        const isGraphicsBrandValid = validateGraphicsBrand();
        const isGraphicsModelValid = validateGraphicsModel();
        const isGraphicsMemoryValid = validateGraphicsMemory();
        const isBatteryCapacityValid = validateBatteryCapacity();
        const isBatteryTypeValid = validateBatteryType();
        const isOperatingSystemValid = validateOperatingSystem();
        const isWeightValid = validateWeight();
        const isWidthValid = validateWidth();
        const isHeightValid = validateHeight();
        const isDepthValid = validateDepth();
        const isWarrantyValid = validateWarranty();
        const areImagesValid = validateImages();

        // Check if all validations pass
        const isFormValid =
            isNameValid &&
            isBrandValid &&
            isCategoryValid &&
            isPriceValid &&
            isStockValid &&
            isProcessorBrandValid &&
            isProcessorModelValid &&
            isProcessorCoresValid &&
            isProcessorSpeedValid &&
            isRamSizeValid &&
            isRamTypeValid &&
            isStorageTypeValid &&
            isStorageCapacityValid &&
            isDisplaySizeValid &&
            isDisplayResolutionValid &&
            isGraphicsBrandValid &&
            isGraphicsModelValid &&
            isGraphicsMemoryValid &&
            isBatteryCapacityValid &&
            isBatteryTypeValid &&
            isOperatingSystemValid &&
            isWeightValid &&
            isWidthValid &&
            isHeightValid &&
            isDepthValid &&
            isWarrantyValid &&
            areImagesValid;

        if (isFormValid) {
            // If form is valid, submit it
            form.submit();
        } else {
            // If form is invalid, show error messages
            displayErrors();
        }
    });
});

function displayErrors() {
    // Remove previous error messages
    let errorDiv = document.getElementById("error-messages");
    if (errorDiv) {
        errorDiv.remove(); // Clear previous errors
    }

    // Create a new error message container
    const newErrorDiv = document.createElement("div");
    newErrorDiv.id = "error-messages";
    newErrorDiv.style.color = "red";
    newErrorDiv.innerHTML = "<p>Please correct the highlighted fields before submitting.</p>";
    document.querySelector("form").prepend(newErrorDiv);

    // Highlight fields with validation errors
    highlightInvalidField("name", validateName());
    highlightInvalidField("brand", validateBrand());
    highlightInvalidField("category", validateCategory());
    highlightInvalidField("price", validatePrice());
    highlightInvalidField("stock", validateStock());
    highlightInvalidField("processorBrand", validateProcessorBrand());
    highlightInvalidField("processorModel", validateProcessorModel());
    highlightInvalidField("processorCores", validateProcessorCores());
    highlightInvalidField("processorSpeed", validateProcessorSpeed());
    highlightInvalidField("ramSize", validateRamSize());
    highlightInvalidField("ramType", validateRamType());
    highlightInvalidField("storageType", validateStorageType());
    highlightInvalidField("storageCapacity", validateStorageCapacity());
    highlightInvalidField("displaySize", validateDisplaySize());
    highlightInvalidField("displayResolution", validateDisplayResolution());
    highlightInvalidField("graphicsBrand", validateGraphicsBrand());
    highlightInvalidField("graphicsModel", validateGraphicsModel());
    highlightInvalidField("graphicsMemory", validateGraphicsMemory());
    highlightInvalidField("batteryCapacity", validateBatteryCapacity());
    highlightInvalidField("batteryType", validateBatteryType());
    highlightInvalidField("operatingSystem", validateOperatingSystem());
    highlightInvalidField("weight", validateWeight());
    highlightInvalidField("width", validateWidth());
    highlightInvalidField("height", validateHeight());
    highlightInvalidField("depth", validateDepth());
    highlightInvalidField("warranty", validateWarranty());
    highlightInvalidField("images", validateImages());
}

function highlightInvalidField(fieldName, isValid) {
    const field = document.getElementById(fieldName);
    if (!isValid) {
        field.style.borderColor = "red"; // Highlight invalid field
    } else {
        field.style.borderColor = ""; // Reset to default if valid
    }
}
