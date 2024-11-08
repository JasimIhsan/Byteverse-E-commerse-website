const Order = require("../../model/orders");
const Offer = require("../../model/offers");
const Coupon = require("../../model/coupon");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const fs = require("fs");
const { format } = require("date-fns");

// controller for getting admin login page - get method
const getAdminLogin = async (req, res) => {
    try {
        const error_msg = req.query.error;
        res.render("admin/login", { error_msg });
    } catch (error) {
        console.error("Error from rendering admin Login page : \n ", error);
    }
};

// controller for checking the admin credentials like username and password - post method
const postAdminLogin = async (req, res) => {
    try {
        const username = "admin";
        const password = "123456";

        const { adminUsername, adminPassword } = req.body;
        console.log(adminUsername);
        console.log(adminPassword);

        if (adminUsername == username && adminPassword == password) {
            req.session.admin = true;
            res.redirect("/admin/dashboard");
        } else {
            res.redirect("/admin?error=Incorrect password and username");
        }
    } catch (error) {
        console.error("Error from posting admin Login page : \n", error);
    }
};

// controller for getting admin dashboard - get method
const getAdminDashboard = async (req, res) => {
    try {
        let { search = "", timeFilter = "all", startDate, endDate } = req.query;

        startDate = startDate ? new Date(startDate) : new Date();
        endDate = endDate ? new Date(endDate) : new Date();

        console.log("time filter : ", timeFilter);
        console.log("start Date : ", startDate.toLocaleString());
        console.log("end Date : ", endDate.toLocaleString());

        if (timeFilter === "today") {
            startDate.setDate(startDate.getDate() - 1);
        } else if (timeFilter === "week") {
            startDate.setDate(startDate.getDate() - 7);
        } else if (timeFilter === "month") {
            startDate.setMonth(startDate.getMonth() - 1);
        } else if (timeFilter === "all") {
            startDate = new Date("1970-01-01");
        } else if (timeFilter === "custom") {
            if (!startDate || !endDate) {
                console.error("Custom date range requires both startDate and endDate.");
                res.status(400).send("Please provide both start and end dates for the custom filter.");
                return;
            }
        }

        const salesData = await Order.aggregate([
            {
                $match: {
                    orderDate: {
                        $gte: startDate,
                        $lt: endDate,
                    },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format:
                                timeFilter === "today"
                                    ? "%Y-%m-%d"
                                    : timeFilter === "week"
                                    ? "%Y-%U"
                                    : timeFilter === "month"
                                    ? "%Y-%m" // For month, group by month
                                    : "%Y-%m-%d", // For "all", group by day
                            date: "$orderDate",
                        },
                    },
                    totalOrders: { $sum: 1 },
                    totalAmount: { $sum: "$total" },
                    totalCouponDiscount: { $sum: "$couponDiscount" },
                    totalOfferDiscount: { $sum: "$offerDiscount" },
                    totalDiscount: {
                        $sum: { $add: ["$couponDiscount", "$offerDiscount"] },
                    },
                },
            },
            {
                $project: {
                    date: "$_id",
                    totalOrders: 1,
                    totalAmount: 1,
                    totalCouponDiscount: 1,
                    totalOfferDiscount: 1,
                    totalDiscount: 1,
                    _id: 0,
                },
            },
            {
                $sort: {
                    date: 1,
                },
            },
        ]);

        // console.log("salesData : ", salesData);

        const overallSalesCount = salesData.reduce((acc, item) => acc + item.totalOrders, 0);
        const overallOrderAmount = salesData.reduce((acc, item) => acc + item.totalAmount, 0);
        const overallCouponDiscount = salesData.reduce((acc, item) => acc + item.totalCouponDiscount, 0);
        const overallOfferDiscount = salesData.reduce((acc, item) => acc + item.totalOfferDiscount, 0);
        const overallDiscount = overallCouponDiscount + overallOfferDiscount;

        const productsData = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lt: endDate,
                    },
                },
            },
            { $unwind: "$products" },
            {
                $group: {
                    _id: "$products.productId",
                    totalQuantity: { $sum: "$products.quantity" },
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails",
                },
            },
            { $unwind: "$productDetails" },
            {
                $project: {
                    name: "$productDetails.name",
                    quantitySold: "$totalQuantity",
                    _id: 0,
                },
            },
            { $sort: { quantitySold: -1 } },
            { $limit: 10 },
        ]);

        const categoriesData = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lt: endDate,
                    },
                },
            },
            { $unwind: "$products" },
            {
                $lookup: {
                    from: "products",
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "productDetails",
                },
            },
            { $unwind: "$productDetails" },
            {
                $group: {
                    _id: "$productDetails.category",
                    totalQuantity: { $sum: "$products.quantity" },
                },
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "categoryDetails",
                },
            },
            { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } },
            {
                $match: {
                    categoryDetails: { $ne: null },
                },
            },
            {
                $project: {
                    name: "$categoryDetails.name",
                    quantitySold: "$totalQuantity",
                    _id: 0,
                },
            },
            { $sort: { quantitySold: -1 } },
            { $limit: 10 },
        ]);

        const brandsData = await Order.aggregate([
            { $unwind: "$products" },
            {
                $match: {
                    createdAt: { $gte: startDate, $lt: endDate },
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "productDetails",
                },
            },
            { $unwind: "$productDetails" },
            {
                $group: {
                    _id: "$productDetails.brand",
                    quantitySold: { $sum: "$products.quantity" },
                },
            },
            {
                $project: {
                    name: { $ifNull: ["$_id", "Unknown Brand"] },
                    quantitySold: "$quantitySold",
                    _id: 0,
                },
            },
            { $sort: { quantitySold: -1 } },
            { $limit: 5 },
        ]);

        console.log("productData : ", productsData);
        console.log("category data : ", categoriesData);
        console.log("brands data   : ", brandsData);

        const labels = salesData.map((item) => item.date);
        const ordersData = salesData.map((item) => item.totalOrders);
        const amountData = salesData.map((item) => item.totalAmount);
        const discountData = salesData.map((item) => item.totalDiscount);

        res.render("admin/dashboard", {
            search,
            salesData,
            tableSalesData: salesData.reverse(),
            overallSalesCount,
            overallOrderAmount,
            overallCouponDiscount,
            overallOfferDiscount,
            overallDiscount,
            productsData,
            categoriesData,
            brandsData,
            timeFilter,
            startDate,
            endDate,
            labels,
            ordersData,
            amountData,
            discountData,
        });
    } catch (error) {
        console.error("Error from rendering admin dashboard: \n", error);
        res.status(500).send("Internal Server Error");
    }
};

// controller for logout from the account (destroying session) - post method
const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log("Unable to destroy admin session : \n", err);
                res.redirect("/admin/dashboard");
            } else {
                res.redirect("/admin");
            }
        });
    } catch (error) {
        console.log("Error from logging out admin home : \n", error);
    }
};

// controller for downloading sales report - post method
const downloadReport = async (req, res) => {
    try {
        const { format, timeFilter = "all" } = req.query;

        let startDate = new Date();
        const endDate = new Date();

        // Handle different time filter conditions
        if (timeFilter === "today") {
            startDate.setDate(startDate.getDate() - 1);
        } else if (timeFilter === "week") {
            startDate.setDate(startDate.getDate() - 7);
        } else if (timeFilter === "month") {
            startDate.setMonth(startDate.getMonth() - 1);
        } else if (timeFilter === "all") {
            startDate = new Date("1970-01-01"); // Include all records
        }

        // Fetch sales data based on filter
        const salesData = await Order.aggregate([
            {
                $match: {
                    orderDate: {
                        $gte: startDate,
                        $lt: endDate,
                    },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: timeFilter === "today" ? "%Y-%m-%d" : timeFilter === "week" ? "%Y-%U" : "%Y-%m",
                            date: "$orderDate",
                        },
                    },
                    totalOrders: { $sum: 1 },
                    totalAmount: { $sum: "$total" },
                    totalCouponDiscount: { $sum: "$couponDiscount" },
                    totalOfferDiscount: { $sum: "$offerDiscount" },
                    totalDiscount: {
                        $sum: { $add: ["$couponDiscount", "$offerDiscount"] },
                    },
                },
            },
            {
                $project: {
                    date: "$_id",
                    totalOrders: 1,
                    totalAmount: 1,
                    totalCouponDiscount: 1,
                    totalOfferDiscount: 1,
                    totalDiscount: 1,
                    _id: 0,
                },
            },
            {
                $sort: {
                    date: 1,
                },
            },
        ]);

        // Generate PDF or Excel based on format
        if (format === "pdf") {
            generatePDF(salesData, startDate, endDate, res);
        } else if (format === "excel") {
            generateExcel(salesData, startDate, endDate, res);
        } else {
            res.status(400).send("Invalid format");
        }
    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Helper function to generate PDF
const generatePDF = (salesData, startDate, endDate, res) => {
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="sales_report.pdf"`);

    doc.pipe(res);

    // Color scheme
    const colors = {
        primary: "#3a37d5", // Blue
        secondary: "#5c59e8", // Light blue
        accent: "#1e40af", // Dark blue
        headerText: "#ffffff", // White
        text: "#1f2937", // Dark gray
        border: "#cbd5e1", // Light gray
        positive: "#059669", // Green
        alternate: "#f1f5f9", // Very light gray
    };

    // Document measurements
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;
    const headerHeight = 140; // Increased height to accommodate time period

    // Header section
    doc.rect(0, 0, pageWidth, headerHeight).fill(colors.primary);

    // Decorative pattern in header
    doc.save();
    doc.rect(0, 0, pageWidth, headerHeight).clip();
    for (let i = -50; i < pageWidth + 50; i += 20) {
        doc.lineWidth(0.5)
            .strokeOpacity(0.1)
            .moveTo(i, 0)
            .lineTo(i + 10, headerHeight)
            .stroke(colors.headerText);
    }
    doc.restore();

    // Company name
    doc.fontSize(20).font("Helvetica-Bold").fillColor(colors.headerText).text("Byteverse E-Commerce Website", margin, 30, {
        width: contentWidth,
        align: "center",
        opacity: 0.9,
    });

    // Title text
    doc.fontSize(28).font("Helvetica-Bold").fillColor(colors.headerText).text("Sales Report", margin, 60, {
        width: contentWidth,
        align: "center",
        opacity: 0.9,
    });

    // Format the time period
    const formatDateRange = (start, end) => {
        const startFormatted = format(new Date(start), "MMM dd, yyyy");
        const endFormatted = format(new Date(end), "MMM dd, yyyy");
        return `${startFormatted} - ${endFormatted}`;
    };

    // Time period text
    doc.fontSize(12)
        .font("Helvetica-Bold")
        .fillColor(colors.headerText)
        .text(`Report Period: ${formatDateRange(startDate, endDate)}`, margin, 95, {
            width: contentWidth,
            align: "center",
        });

    // Date generated text
    doc.fontSize(12)
        .font("Helvetica")
        .fillColor(colors.headerText)
        .text(`Generated on: ${format(new Date(), "MMM dd, yyyy")}`, margin, 115, {
            width: contentWidth,
            align: "center",
        });

    // Table configuration
    const tableTop = headerHeight + 30;
    const tableHeaders = ["Date", "Total Orders", "Total Amount", "Coupon Discount", "Offer Discount", "Total Discount"];
    const columnWidths = [100, 80, 90, 90, 90, 90];
    const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    const startX = (pageWidth - tableWidth) / 2;

    // Row heights
    const headerRowHeight = 40;
    const dataRowHeight = 35;

    // Draw table header
    let currentX = startX;
    let currentY = tableTop;

    // Header background
    doc.fillColor(colors.primary);
    doc.rect(startX, currentY, tableWidth, headerRowHeight).fill();

    // Header text
    doc.fontSize(11).font("Helvetica-Bold").fillColor(colors.headerText);

    tableHeaders.forEach((header, i) => {
        doc.text(header, currentX, currentY + headerRowHeight / 2 - 6, {
            width: columnWidths[i],
            align: "center",
        });
        currentX += columnWidths[i];
    });

    // Table rows
    currentY += headerRowHeight;

    // Calculate if we need a new page
    const rowsPerPage = Math.floor((pageHeight - currentY - 100) / dataRowHeight);

    salesData.forEach((item, rowIndex) => {
        // Check if we need a new page
        if (rowIndex > 0 && rowIndex % rowsPerPage === 0) {
            doc.addPage();
            currentY = margin;

            // Redraw header on new page
            doc.fillColor(colors.primary).rect(startX, currentY, tableWidth, headerRowHeight).fill();

            doc.fontSize(11).font("Helvetica-Bold").fillColor(colors.headerText);

            let headerX = startX;
            tableHeaders.forEach((header, i) => {
                doc.text(header, headerX, currentY + headerRowHeight / 2 - 6, {
                    width: columnWidths[i],
                    align: "center",
                });
                headerX += columnWidths[i];
            });
            currentY += headerRowHeight;
        }

        // Row background
        doc.fillColor(rowIndex % 2 === 0 ? "#ffffff" : colors.alternate)
            .rect(startX, currentY, tableWidth, dataRowHeight)
            .fill();

        currentX = startX;

        // Date column
        doc.font("Helvetica")
            .fontSize(10)
            .fillColor(colors.text)
            .text(format(new Date(item.date), "MMM dd, yyyy"), currentX, currentY + dataRowHeight / 2 - 5, {
                width: columnWidths[0],
                align: "center",
            });
        currentX += columnWidths[0];

        // Orders column
        doc.font("Helvetica-Bold")
            .fillColor(colors.accent)
            .text(item.totalOrders.toString(), currentX, currentY + dataRowHeight / 2 - 5, {
                width: columnWidths[1],
                align: "center",
            });
        currentX += columnWidths[1];

        // Amount columns
        const amounts = [
            { value: item.totalAmount, color: colors.positive },
            { value: item.totalCouponDiscount, color: colors.text },
            { value: item.totalOfferDiscount, color: colors.text },
            { value: item.totalDiscount, color: colors.accent },
        ];

        amounts.forEach((amount, i) => {
            doc.font("Helvetica")
                .fillColor(amount.color)
                .text(
                    `₹${amount.value.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}`,
                    currentX,
                    currentY + dataRowHeight / 2 - 5,
                    {
                        width: columnWidths[i + 2],
                        align: "center",
                    }
                );
            currentX += columnWidths[i + 2];
        });

        currentY += dataRowHeight;

        // Draw row border
        doc.lineWidth(0.5)
            .strokeColor(colors.border)
            .moveTo(startX, currentY)
            .lineTo(startX + tableWidth, currentY)
            .stroke();
    });

    // Draw vertical borders
    currentX = startX;
    for (let i = 0; i <= columnWidths.length; i++) {
        doc.moveTo(currentX, tableTop).lineTo(currentX, currentY).stroke();
        currentX += columnWidths[i] || 0;
    }

    // Summary section
    currentY += 30;

    // Calculate totals
    const totalAmount = salesData.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalOrders = salesData.reduce((sum, item) => sum + item.totalOrders, 0);
    const totalDiscount = salesData.reduce((sum, item) => sum + item.totalDiscount, 0);

    // Summary box
    const summaryHeight = 80;
    const summaryWidth = tableWidth * 0.8;
    const summaryX = (pageWidth - summaryWidth) / 2;

    doc.rect(summaryX, currentY, summaryWidth, summaryHeight).fillColor("#f8fafc").fill().strokeColor(colors.border).stroke();

    // Summary content
    doc.font("Helvetica-Bold").fontSize(12).fillColor(colors.primary);

    // Summary text
    const summaryData = [
        { label: "Total Orders:", value: totalOrders.toLocaleString() },
        { label: "Total Discounts:", value: `₹${totalDiscount.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
        { label: "Total Revenue:", value: `₹${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
    ];

    summaryData.forEach((item, index) => {
        const y = currentY + 20 + index * 20;
        doc.text(item.label, summaryX + 20, y);
        doc.text(item.value, summaryX + summaryWidth - 150, y, { width: 130, align: "right" });
    });

    doc.end();
};

// Helper function to generate Excel
const generateExcel = (salesData, startDate, endDate, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    // Custom colors matching the PDF
    const colors = {
        primary: "3A37D5", // Blue
        secondary: "5C59E8", // Light blue
        accent: "1E40AF", // Dark blue
        headerText: "FFFFFF", // White
        text: "1F2937", // Dark gray
        border: "CBD5E1", // Light gray
        positive: "059669", // Green
        alternate: "F1F5F9", // Very light gray
    };

    // Set column widths
    worksheet.properties.defaultRowHeight = 25;
    worksheet.columns = [
        { width: 2 }, // A - Left margin
        { width: 15 }, // B - Date
        { width: 15 }, // C - Total Orders
        { width: 15 }, // D - Total Amount
        { width: 20 }, // E - Coupon Discount
        { width: 20 }, // F - Offer Discount
        { width: 20 }, // G - Total Discount
        { width: 2 }, // H - Right margin
    ];

    // Header Section
    // Merge cells for header section
    worksheet.mergeCells("B1:G1");
    worksheet.mergeCells("B2:G2");
    worksheet.mergeCells("B3:G3");
    worksheet.mergeCells("B4:G4");

    // Add gradient-like effect to header
    ["B1", "B2", "B3", "B4"].forEach((cell, index) => {
        const row = worksheet.getRow(index + 1);
        for (let col = 2; col <= 7; col++) {
            const cell = row.getCell(col);
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: colors.primary },
            };
        }
    });

    // Company name
    const titleCell = worksheet.getCell("B1");
    titleCell.value = "Byteverse E-Commerce Website";
    titleCell.font = {
        name: "Arial",
        size: 16,
        bold: true,
        color: { argb: colors.headerText },
    };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    // Report title
    const reportTitleCell = worksheet.getCell("B2");
    reportTitleCell.value = "Sales Report";
    reportTitleCell.font = {
        name: "Arial",
        size: 20,
        bold: true,
        color: { argb: colors.headerText },
    };
    reportTitleCell.alignment = { horizontal: "center", vertical: "middle" };

    // Time period
    const timePeriodCell = worksheet.getCell("B3");
    timePeriodCell.value = `Report Period: ${format(new Date(startDate), "MMM dd, yyyy")} - ${format(new Date(endDate), "MMM dd, yyyy")}`;
    timePeriodCell.font = {
        name: "Arial",
        size: 12,
        bold: true,
        color: { argb: colors.headerText },
    };
    timePeriodCell.alignment = { horizontal: "center", vertical: "middle" };

    // Generated date
    const generatedDateCell = worksheet.getCell("B4");
    generatedDateCell.value = `Generated on: ${format(new Date(), "MMM dd, yyyy")}`;
    generatedDateCell.font = {
        name: "Arial",
        size: 11,
        color: { argb: colors.headerText },
    };
    generatedDateCell.alignment = { horizontal: "center", vertical: "middle" };

    // Add spacing
    worksheet.addRow([]);

    // Table headers
    const headers = ["Date", "Total Orders", "Total Amount", "Coupon Discount", "Offer Discount", "Total Discount"];
    const headerRow = worksheet.addRow(["", ...headers, ""]);
    headerRow.height = 30;

    // Style header cells
    for (let i = 2; i <= 7; i++) {
        const cell = headerRow.getCell(i);
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: colors.primary },
        };
        cell.font = {
            bold: true,
            color: { argb: colors.headerText },
            size: 11,
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
            top: { style: "thin", color: { argb: colors.headerText } },
            left: { style: "thin", color: { argb: colors.headerText } },
            bottom: { style: "thin", color: { argb: colors.headerText } },
            right: { style: "thin", color: { argb: colors.headerText } },
        };
    }

    // Add and style data rows
    salesData.forEach((item, index) => {
        const rowData = [
            "", // Left margin
            format(new Date(item.date), "MMM dd, yyyy"),
            item.totalOrders,
            item.totalAmount,
            item.totalCouponDiscount,
            item.totalOfferDiscount,
            item.totalDiscount,
            "", // Right margin
        ];

        const row = worksheet.addRow(rowData);
        row.height = 25;

        // Style each cell in the row
        for (let i = 2; i <= 7; i++) {
            const cell = row.getCell(i);

            // Alternate row colors
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: index % 2 === 0 ? "FFFFFF" : colors.alternate },
            };

            // Add borders
            cell.border = {
                top: { style: "thin", color: { argb: colors.border } },
                left: { style: "thin", color: { argb: colors.border } },
                bottom: { style: "thin", color: { argb: colors.border } },
                right: { style: "thin", color: { argb: colors.border } },
            };

            // Cell alignment and font
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.font = {
                name: "Arial",
                size: 10,
                color: { argb: colors.text },
            };

            // Format numbers
            if (i === 2) {
                // Date column
                cell.font.color = { argb: colors.text };
            } else if (i === 3) {
                // Total Orders
                cell.font = {
                    bold: true,
                    color: { argb: colors.accent },
                };
            } else if (i === 4) {
                // Total Amount
                cell.font.color = { argb: colors.positive };
                cell.numFmt = "₹#,##0.00";
            } else {
                // Discount columns
                cell.numFmt = "₹#,##0.00";
            }
        }
    });

    // Add spacing before summary
    worksheet.addRow([]);
    worksheet.addRow([]);

    // Summary section with enhanced styling
    const summaryStartRow = worksheet.rowCount + 1;

    // Add summary box
    for (let i = 0; i < 3; i++) {
        const row = worksheet.getRow(summaryStartRow + i);
        for (let col = 2; col <= 7; col++) {
            const cell = row.getCell(col);
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "F8FAFC" },
            };
            cell.border = {
                top: { style: "thin", color: { argb: colors.border } },
                left: { style: "thin", color: { argb: colors.border } },
                bottom: { style: "thin", color: { argb: colors.border } },
                right: { style: "thin", color: { argb: colors.border } },
            };
        }
    }

    // Calculate totals
    const totalAmount = salesData.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalOrders = salesData.reduce((sum, item) => sum + item.totalOrders, 0);
    const totalDiscount = salesData.reduce((sum, item) => sum + item.totalDiscount, 0);

    // Add summary data with enhanced styling
    const summaryData = [
        ["Total Orders:", totalOrders],
        ["Total Discounts:", totalDiscount],
        ["Total Revenue:", totalAmount],
    ];

    summaryData.forEach((data, index) => {
        const row = worksheet.getRow(summaryStartRow + index);

        // Label cell (merged)
        const labelCell = row.getCell(2);
        worksheet.mergeCells(`B${summaryStartRow + index}:D${summaryStartRow + index}`);
        labelCell.value = data[0];
        labelCell.font = {
            bold: true,
            color: { argb: colors.primary },
            size: 11,
        };
        labelCell.alignment = { horizontal: "center", vertical: "middle" };

        // Value cell (merged)
        const valueCell = row.getCell(5);
        worksheet.mergeCells(`E${summaryStartRow + index}:G${summaryStartRow + index}`);
        valueCell.value = data[1];
        valueCell.font = {
            bold: true,
            size: 11,
        };
        valueCell.numFmt = data[0].includes("Orders") ? "#,##0" : "₹#,##0.00";
        valueCell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // Protect the worksheet
    worksheet.protect(process.env.SALES_REPORT_EXCEL_PASSWORD, {
        selectLockedCells: true,
        selectUnlockedCells: true,
        formatCells: false,
        formatColumns: false,
        formatRows: false,
        insertColumns: false,
        insertRows: false,
        insertHyperlinks: false,
        deleteColumns: false,
        deleteRows: false,
        sort: false,
        autoFilter: false,
        pivotTables: false,
    });

    // Lock all cells
    worksheet.eachRow({ includeEmpty: true }, (row) => {
        row.eachCell({ includeEmpty: true }, (cell) => {
            cell.protection = {
                locked: true,
                hidden: false,
            };
        });
    });

    // Set print area and page setup
    worksheet.pageSetup.printArea = `A1:H${worksheet.rowCount}`;
    worksheet.pageSetup.fitToPage = true;
    worksheet.pageSetup.fitToWidth = 1;
    worksheet.pageSetup.fitToHeight = 0;
    worksheet.pageSetup.margins = {
        left: 0.7,
        right: 0.7,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3,
    };
    // Set response headers
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="sales_report.xlsx"`);

    return workbook.xlsx.write(res).then(() => res.end());
};

module.exports = {
    getAdminLogin,
    getAdminDashboard,
    postAdminLogin,
    logout,
    downloadReport,
};
