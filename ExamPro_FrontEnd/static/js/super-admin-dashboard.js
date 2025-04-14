document.addEventListener("DOMContentLoaded", () => {
    // Initially, show loading and hide content
    $("#loading").show();
    $("#content").hide();

    // Check if token exists in localStorage
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // Make AJAX call to validate token and check role
    $.ajax({
        url: "http://localhost:8080/api/v1/user/profile",
        method: "GET",
        headers: {
            Authorization: "Bearer " + token,
        },
        success: (response) => {
            if (response.code !== 200 || !response.data) {
                showError("Access denied: Invalid response from server");
                redirectToLogin();
                return;
            }

            const user = response.data;
            if (user.role !== "SUPER_ADMIN") {
                showError("Access denied: Super Admin privileges required");
                redirectToLogin();
                return;
            }

            // Populate user info
            $("#userFullName").text(user.fullName);
            $("#userRole").text(user.role);
            $("#modalUserFullName").text(user.fullName);
            $("#modalUserRole").text(user.role);
            $("#modalUserEmail").text(user.email);
            $("#modalUserPhone").text(user.phoneNumber || "Not provided");
            $("#modalUserDOB").text(user.dateOfBirth || "Not provided");
            $("#modalUserStatus").text(user.active ? "Active" : "Inactive");

            const initials = user.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();
            $("#userInitials").text(initials);
            $("#modalUserInitials").text(initials);

            // Hide loading and show content
            $("#loading").hide();
            $("#content").show();

            // Load initial dashboard content
            loadDashboard();
        },
        error: (xhr) => {
            if (xhr.status === 401 || xhr.status === 403) {
                showError("Session expired or unauthorized access");
                localStorage.removeItem("token");
                redirectToLogin();
            } else {
                showError("Error loading profile: " + (xhr.responseJSON?.message || "Unknown error"));
            }
        },
    });

    function showSection(sectionId) {
        $(".dashboard-content").hide();
        $(sectionId).show();
    }

    $("#sidebar .menu-item").eq(4).attr("id", "examsMenu"); // Exams is the 5th menu item (index 4)

    // Menu event listeners
    $("#dashboardMenu").on("click", function (e) {
        e.preventDefault();
        showSection("#dashboardContent");
        setActiveMenu(this);
    });

    $("#adminsMenu").on("click", function (e) {
        e.preventDefault();
        showSection("#adminsContent");
        setActiveMenu(this);
        loadAllAdmins();
    });

    $("#examsMenu").on("click", function (e) {
        e.preventDefault();
        showSection("#examsContent");
        setActiveMenu(this);
        loadExams();
    });

    // Handle exam creation
    $("#saveExam").on("click", function () {
        const form = $("#createExamForm")[0];
        if (!form.checkValidity()) {
            form.classList.add("was-validated");
            return;
        }

        const title = $("#examTitle").val().trim();
        const subject = $("#examSubject").val().trim();
        const startTime = $("#examStartTime").val(); // Format: YYYY-MM-DDTHH:MM
        const duration = parseInt($("#examDuration").val());
        const examType = $("#examType").val();
        const createdByEmail = localStorage.getItem("email");

        // Client-side validation
        const now = new Date();
        const selectedStartTime = new Date(startTime);
        if (selectedStartTime <= now) {
            showError("Start time must be in the future.");
            return;
        }
        if (duration <= 0) {
            showError("Duration must be greater than 0 minutes.");
            return;
        }

        const examData = {
            title,
            subject,
            startTime,
            duration,
            examType,
            createdByEmail,
        };

        const token = localStorage.getItem("token");
        if (!token) {
            showError("You are not logged in. Please log in again.");
            redirectToLogin();
            return;
        }

        $.ajax({
            url: "http://localhost:8080/api/v1/exam/create",
            method: "POST",
            contentType: "application/json",
            headers: {
                Authorization: "Bearer " + token,
            },
            data: JSON.stringify(examData),
            success: function (response) {
                if (response.code === 201) {
                    showSuccess("Exam created successfully!");
                    $("#createExamModal").modal("hide");
                    form.reset();
                    form.classList.remove("was-validated");
                    loadExams(); // Refresh the exams list
                } else {
                    showError(response.message || "Error creating exam");
                }
            },
            error: function (xhr) {
                if (xhr.status === 401 || xhr.status === 403) {
                    showError("Unauthorized. Please log in again.");
                    localStorage.removeItem("token");
                    redirectToLogin();
                } else {
                    showError("Error creating exam: " + (xhr.responseJSON?.message || "Unknown error"));
                }
            },
        });
    });

    // Reset the form when the modal is closed
    $("#createExamModal").on("hidden.bs.modal", () => {
        const form = document.getElementById("createExamForm");
        form.reset();
        form.classList.remove("was-validated");
    });

    $("#logout").on("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("token");
        window.location.href = "login.html";
    });

    // Toggle sidebar for mobile
    $("#toggleSidebar").on("click", () => {
        $("#sidebar").toggleClass("show");
    });

    // Add Admin functionality (unchanged, included for completeness)
    const form = document.getElementById("addAdminForm");
    const saveAdminBtn = document.getElementById("saveAdmin");

    saveAdminBtn.addEventListener("click", () => {
        const fullName = document.getElementById("adminName").value.trim();
        const nic = document.getElementById("adminNIC").value.trim();
        const dateOfBirth = document.getElementById("adminDOB").value;
        const phoneNumber = document.getElementById("adminPhoneNumber").value.trim();
        const schoolName = document.getElementById("adminSchoolName").value.trim();
        const username = document.getElementById("adminUsername").value.trim();
        const email = document.getElementById("adminEmail").value.trim();
        const password = document.getElementById("adminPassword").value;
        const confirmPassword = document.getElementById("adminConfirmPassword").value;

        if (!form.checkValidity()) {
            form.classList.add("was-validated");
            return;
        }

        if (password !== confirmPassword) {
            showError("Passwords do not match");
            return;
        }

        const data = {
            fullName,
            nic,
            dateOfBirth,
            phoneNumber,
            schoolName,
            username,
            email,
            password,
            role: "ADMIN",
        };

        const token = localStorage.getItem("token");
        if (!token) {
            showError("You are not logged in. Please log in again.");
            return;
        }

        $.ajax({
            url: "http://localhost:8080/api/v1/user/sign_up/admin",
            method: "POST",
            contentType: "application/json",
            headers: {
                Authorization: "Bearer " + token,
            },
            data: JSON.stringify(data),
            success: (response) => {
                if (response.code === 201) {
                    showSuccess("Admin added successfully!");
                    $("#addAdminModal").modal("hide");
                    form.reset();
                    form.classList.remove("was-validated");
                    loadAllAdmins();
                } else {
                    showError(response.message || "Error adding admin");
                }
            },
            error: (xhr) => {
                if (xhr.status === 406) {
                    showError("Email already in use");
                } else if (xhr.status === 401 || xhr.status === 403) {
                    showError("Unauthorized. Please log in again.");
                    localStorage.removeItem("token");
                    redirectToLogin();
                } else {
                    showError("Error adding admin: " + (xhr.responseJSON?.message || "Unknown error"));
                }
            },
        });
    });

    $("#addAdminModal").on("hidden.bs.modal", () => {
        form.reset();
        form.classList.remove("was-validated");
    });

    // Initialize table features
    initAdminTableFeatures();
    initExamTableFeatures();
});

// Helper functions
function showError(message) {
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "#ef4444" },
    }).showToast();
}

function showSuccess(message) {
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "#10b981" },
    }).showToast();
}

function redirectToLogin() {
    setTimeout(() => {
        window.location.href = "login.html";
    }, 1000);
}

function setActiveMenu(element) {
    $(".menu-item").removeClass("active");
    $(element).addClass("active");
}

function loadDashboard() {
    $("#dashboardContent").show();
}

// Admin table functions (unchanged, included for context)
let currentPage = 1;
const itemsPerPage = 10;
let totalItems = 0;
let filteredAdmins = [];
let allAdmins = [];

function loadAllAdmins() {
    const token = localStorage.getItem("token");
    $("#adminsTableBody").html(
        '<tr><td colspan="9" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>'
    );

    $.ajax({
        url: "http://localhost:8080/api/v1/user/admins",
        method: "GET",
        headers: {
            Authorization: "Bearer " + token,
        },
        success: (response) => {
            if (response.code === 200 && response.data) {
                allAdmins = response.data;
                filteredAdmins = [...allAdmins];
                totalItems = filteredAdmins.length;
                updatePaginationInfo();
                displayAdmins();
            } else {
                showError("Failed to load admins: " + response.message);
            }
        },
        error: (xhr) => {
            if (xhr.status === 401 || xhr.status === 403) {
                showError("Unauthorized access to admins list");
                localStorage.removeItem("token");
                redirectToLogin();
            } else {
                showError("Error loading admins: " + (xhr.responseJSON?.message || "Unknown error"));
            }
        },
    });
}

function displayAdmins() {
    const tableBody = $("#adminsTableBody");
    tableBody.empty();

    if (filteredAdmins.length === 0) {
        tableBody.html('<tr><td colspan="9" class="text-center">No administrators found</td></tr>');
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredAdmins.length);

    $("#showingStart").text(startIndex + 1);
    $("#showingEnd").text(endIndex);
    $("#totalAdmins").text(filteredAdmins.length);

    $("#prevPage").prop("disabled", currentPage === 1);
    $("#nextPage").prop("disabled", endIndex >= filteredAdmins.length);

    for (let i = startIndex; i < endIndex; i++) {
        const admin = filteredAdmins[i];
        const formattedDate = admin.dateOfBirth ? new Date(admin.dateOfBirth).toLocaleDateString() : "N/A";
        const statusBadge = admin.active
            ? '<span class="badge bg-success rounded-pill">Active</span>'
            : '<span class="badge bg-danger rounded-pill">Inactive</span>';

        const row = `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar avatar-sm me-2">${getInitials(admin.fullName)}</div>
                        <div>${admin.fullName}</div>
                    </div>
                </td>
                <td>${admin.username}</td>
                <td>${admin.email}</td>
                <td>${admin.nic || "N/A"}</td>
                <td>${admin.phoneNumber || "N/A"}</td>
                <td>${formattedDate}</td>
                <td>${admin.schoolName || "N/A"}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-icon" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="#" onclick="editAdmin(${admin.id}); return false;">
                                <i class="fas fa-edit me-2 text-primary"></i>Edit
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="viewAdminDetails(${admin.id}); return false;">
                                <i class="fas fa-eye me-2 text-info"></i>View Details
                            </a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item ${admin.active ? "" : "text-success"}" href="#" onclick="toggleAdminStatus(${admin.id}, ${!admin.active}); return false;">
                                <i class="fas ${admin.active ? "fa-ban text-warning" : "fa-check-circle text-success"} me-2"></i>
                                ${admin.active ? "Deactivate" : "Activate"}
                            </a></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="deleteAdmin(${admin.id}); return false;">
                                <i class="fas fa-trash-alt me-2"></i>Delete
                            </a></li>
                        </ul>
                    </div>
                </td>
            </tr>`;
        tableBody.append(row);
    }
}

function updatePaginationInfo() {
    const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    }
}

function getInitials(name) {
    if (!name) return "?";
    return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
}

function viewAdminDetails(adminId) {
    const admin = allAdmins.find((a) => a.id === adminId);
    if (!admin) return;

    const formattedDate = admin.dateOfBirth ? new Date(admin.dateOfBirth).toLocaleDateString() : "N/A";
    $("#detailsAdminInitials").text(getInitials(admin.fullName));
    $("#detailsAdminName").text(admin.fullName);
    $("#detailsAdminSchool").text(admin.schoolName || "No school assigned");
    $("#detailsAdminUsername").text(admin.username);
    $("#detailsAdminEmail").text(admin.email);
    $("#detailsAdminNIC").text(admin.nic || "N/A");
    $("#detailsAdminPhone").text(admin.phoneNumber || "N/A");
    $("#detailsAdminDOB").text(formattedDate);
    const statusText = admin.active
        ? '<span class="badge bg-success rounded-pill">Active</span>'
        : '<span class="badge bg-danger rounded-pill">Inactive</span>';
    $("#detailsAdminStatus").html(statusText);
    $("#editSelectedAdmin").data("admin-id", adminId);
    $("#adminDetailsModal").modal("show");
}

function editAdmin(adminId) {
    console.log("Editing admin with ID:", adminId);
}

function toggleAdminStatus(adminId, setActive) {
    const token = localStorage.getItem("token");
    const action = setActive ? "activate" : "deactivate";

    if (confirm(`Are you sure you want to ${action} this administrator?`)) {
        $.ajax({
            url: `http://localhost:8080/api/v1/user/admin/${adminId}/status`,
            method: "PUT",
            headers: {
                Authorization: "Bearer " + token,
                "Content-Type": "application/json",
            },
            data: JSON.stringify({ active: setActive }),
            success: (response) => {
                if (response.code === 200) {
                    showSuccess(`Administrator ${setActive ? "activated" : "deactivated"} successfully`);
                    loadAllAdmins();
                } else {
                    showError("Failed to update status: " + response.message);
                }
            },
            error: (xhr) => {
                showError("Error updating status: " + (xhr.responseJSON?.message || "Unknown error"));
            },
        });
    }
}

function deleteAdmin(adminId) {
    const token = localStorage.getItem("token");

    if (confirm("Are you sure you want to delete this administrator? This action cannot be undone.")) {
        $.ajax({
            url: `http://localhost:8080/api/v1/user/admin/${adminId}`,
            method: "DELETE",
            headers: {
                Authorization: "Bearer " + token,
            },
            success: (response) => {
                if (response.code === 200) {
                    showSuccess("Administrator deleted successfully");
                    loadAllAdmins();
                } else {
                    showError("Failed to delete administrator: " + response.message);
                }
            },
            error: (xhr) => {
                showError("Error deleting administrator: " + (xhr.responseJSON?.message || "Unknown error"));
            },
        });
    }
}

function initDropdownFix() {
    $(document).on("show.bs.dropdown", ".table-responsive .dropdown", function (e) {
        const $toggleBtn = $(e.target);
        const $dropdown = $(this).find(".dropdown-menu");
        const togglePos = $toggleBtn.offset();
        $dropdown.css({
            top: togglePos.top + $toggleBtn.outerHeight() + "px",
            left: togglePos.left - $dropdown.outerWidth() + $toggleBtn.outerWidth() + "px",
        });
    });
}

function initAdminTableFeatures() {
    $("#editSelectedAdmin").click(function () {
        const adminIdForEdit = $(this).data("admin-id");
        $("#adminDetailsModal").modal("hide");
        editAdmin(adminIdForEdit);
    });

    $("#searchAdmin").on("input", function () {
        const searchTerm = $(this).val().toLowerCase();
        filteredAdmins = allAdmins.filter((admin) => {
            return (
                admin.fullName.toLowerCase().includes(searchTerm) ||
                admin.username.toLowerCase().includes(searchTerm) ||
                admin.email.toLowerCase().includes(searchTerm) ||
                (admin.schoolName && admin.schoolName.toLowerCase().includes(searchTerm)) ||
                (admin.nic && admin.nic.toLowerCase().includes(searchTerm)) ||
                (admin.phoneNumber && admin.phoneNumber.toLowerCase().includes(searchTerm))
            );
        });
        currentPage = 1;
        updatePaginationInfo();
        displayAdmins();
    });

    $(".filter-btn").click(function () {
        const filter = $(this).data("filter");
        $(".filter-btn").removeClass("active");
        $(this).addClass("active");

        if (filter === "all") {
            filteredAdmins = [...allAdmins];
        } else if (filter === "active") {
            filteredAdmins = allAdmins.filter((admin) => admin.active);
        } else if (filter === "inactive") {
            filteredAdmins = allAdmins.filter((admin) => !admin.active);
        }

        currentPage = 1;
        updatePaginationInfo();
        displayAdmins();
    });

    $("#prevPage").click(() => {
        if (currentPage > 1) {
            currentPage--;
            displayAdmins();
        }
    });

    $("#nextPage").click(() => {
        const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayAdmins();
        }
    });

    initDropdownFix();
}

// Exam table functions
let examCurrentPage = 1;
const examItemsPerPage = 10;
let totalExamItems = 0;
let filteredExams = [];
let allExams = [];

function loadExams() {
    const token = localStorage.getItem("token");

    $("#examsTableBody").html(
        '<tr><td colspan="8" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>'
    );

    $.ajax({
        url: "http://localhost:8080/api/v1/exam/all",
        method: "GET",
        headers: {
            Authorization: "Bearer " + token,
        },
        success: (response) => {
            if (response.code === 200 && response.data) {
                allExams = response.data;
                filteredExams = [...allExams];
                totalExamItems = filteredExams.length;
                examUpdatePaginationInfo();
                displayExams();
            } else {
                showError("Failed to load exams: " + response.message);
                $("#examsTableBody").html('<tr><td colspan="8" class="text-center">No exams found</td></tr>');
            }
        },
        error: (xhr) => {
            if (xhr.status === 401 || xhr.status === 403) {
                showError("Unauthorized access to exams list");
                localStorage.removeItem("token");
                redirectToLogin();
            } else {
                showError("Error loading exams: " + (xhr.responseJSON?.message || "Unknown error"));
                $("#examsTableBody").html('<tr><td colspan="8" class="text-center">Error loading exams</td></tr>');
            }
        },
    });
}

function displayExams() {
    const tableBody = $("#examsTableBody");
    tableBody.empty();

    if (filteredExams.length === 0) {
        tableBody.html('<tr><td colspan="8" class="text-center">No exams found</td></tr>');
        return;
    }

    const startIndex = (examCurrentPage - 1) * examItemsPerPage;
    const endIndex = Math.min(startIndex + examItemsPerPage, filteredExams.length);

    $("#examShowingStart").text(startIndex + 1);
    $("#examShowingEnd").text(endIndex);
    $("#totalExams").text(filteredExams.length);

    $("#examPrevPage").prop("disabled", examCurrentPage === 1);
    $("#examNextPage").prop("disabled", endIndex >= filteredExams.length);

    for (let i = startIndex; i < endIndex; i++) {
        const exam = filteredExams[i];
        const startTime = new Date(exam.startTime).toLocaleString();
        const now = new Date();
        const examStart = new Date(exam.startTime);
        const examEnd = new Date(examStart.getTime() + exam.duration * 60000);
        let statusBadge = "";
        if (now < examStart) {
            statusBadge = '<span class="badge bg-warning rounded-pill">Upcoming</span>';
        } else if (now >= examStart && now <= examEnd) {
            statusBadge = '<span class="badge bg-success rounded-pill">Ongoing</span>';
        } else {
            statusBadge = '<span class="badge bg-danger rounded-pill">Past</span>';
        }

        const row = `
            <tr>
                <td>${exam.title}</td>
                <td>${exam.subject}</td>
                <td>${startTime}</td>
                <td>${exam.duration} mins</td>
                <td>${exam.examType || "N/A"}</td>
                <td>${exam.createdByEmail}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-icon" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="#" onclick="viewExamDetails(${exam.id}); return false;">
                                <i class="fas fa-eye me-2 text-info"></i>View Details
                            </a></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="deleteExam(${exam.id}); return false;">
                                <i class="fas fa-trash-alt me-2"></i>Delete
                            </a></li>
                        </ul>
                    </div>
                </td>
            </tr>`;
        tableBody.append(row);
    }
}

function examUpdatePaginationInfo() {
    const totalPages = Math.ceil(filteredExams.length / examItemsPerPage);
    if (examCurrentPage > totalPages && totalPages > 0) {
        examCurrentPage = totalPages;
    }
}

function initExamTableFeatures() {
    $("#searchExam").on("input", function () {
        const searchTerm = $(this).val().toLowerCase();
        filteredExams = allExams.filter((exam) => {
            return (
                exam.title.toLowerCase().includes(searchTerm) ||
                exam.subject.toLowerCase().includes(searchTerm) ||
                exam.createdByEmail.toLowerCase().includes(searchTerm) ||
                (exam.examType && exam.examType.toLowerCase().includes(searchTerm))
            );
        });
        examCurrentPage = 1;
        examUpdatePaginationInfo();
        displayExams();
    });

    $(".filter-btn[data-filter]").click(function () {
        const filter = $(this).data("filter");
        $(".filter-btn").removeClass("active");
        $(this).addClass("active");

        const now = new Date();
        if (filter === "all") {
            filteredExams = [...allExams];
        } else if (filter === "upcoming") {
            filteredExams = allExams.filter((exam) => new Date(exam.startTime) > now);
        } else if (filter === "past") {
            filteredExams = allExams.filter((exam) => {
                const startTime = new Date(exam.startTime);
                const endTime = new Date(startTime.getTime() + exam.duration * 60000);
                return endTime < now;
            });
        }

        examCurrentPage = 1;
        examUpdatePaginationInfo();
        displayExams();
    });

    $("#examPrevPage").click(() => {
        if (examCurrentPage > 1) {
            examCurrentPage--;
            displayExams();
        }
    });

    $("#examNextPage").click(() => {
        const totalPages = Math.ceil(filteredExams.length / examItemsPerPage);
        if (examCurrentPage < totalPages) {
            examCurrentPage++;
            displayExams();
        }
    });

    initDropdownFix();
}

function viewExamDetails(examId) {
    console.log("Viewing exam details for ID:", examId);
}

function deleteExam(examId) {
    const token = localStorage.getItem("token");

    if (confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
        $.ajax({
            url: `http://localhost:8080/api/v1/exam/${examId}`,
            method: "DELETE",
            headers: {
                Authorization: "Bearer " + token,
            },
            success: (response) => {
                if (response.code === 200) {
                    showSuccess("Exam deleted successfully");
                    loadExams();
                } else {
                    showError("Failed to delete exam: " + response.message);
                }
            },
            error: (xhr) => {
                showError("Error deleting exam: " + (xhr.responseJSON?.message || "Unknown error"));
            },
        });
    }
}