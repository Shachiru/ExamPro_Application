document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    $("#loading").show();

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

            localStorage.setItem("email", user.email);

            $("#loading").fadeOut(300, () => {
                $("#content").fadeIn(300);
            });

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

    $("#content").hide();

    function showSection(sectionId) {
        $(".dashboard-content").hide();
        $(sectionId).fadeIn(300);
    }

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
        const startTime = $("#examStartTime").val();
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

        $("#saveExam").prop("disabled", true).html('<div class="three-body"><div class="three-body__dot"></div><div class="three-body__dot"></div><div class="three-body__dot"></div></div>');

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
                    loadExams();
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
            complete: function () {
                $("#saveExam").prop("disabled", false).html('<i class="bi bi-check-circle me-1"></i>Create Exam');
            },
        });
    });

    // Handle exam update
    $("#updateExamBtn").on("click", function () {
        const form = $("#updateExamForm")[0];
        if (!form.checkValidity()) {
            form.classList.add("was-validated");
            return;
        }

        const examId = $("#updateExamId").val();
        const title = $("#updateExamTitle").val().trim();
        const subject = $("#updateExamSubject").val().trim();
        const startTime = $("#updateExamStartTime").val();
        const duration = parseInt($("#updateExamDuration").val());
        const examType = $("#updateExamType").val();
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

        $("#updateExamBtn").prop("disabled", true).html('<div class="three-body"><div class="three-body__dot"></div><div class="three-body__dot"></div><div class="three-body__dot"></div></div>');

        $.ajax({
            url: `http://localhost:8080/api/v1/exam/${examId}`,
            method: "PUT",
            contentType: "application/json",
            headers: {
                Authorization: "Bearer " + token,
            },
            data: JSON.stringify(examData),
            success: function (response) {
                if (response.code === 200) {
                    showSuccess("Exam updated successfully!");
                    $("#updateExamModal").modal("hide");
                    form.reset();
                    form.classList.remove("was-validated");
                    loadExams();
                } else {
                    showError(response.message || "Error updating exam");
                }
            },
            error: function (xhr) {
                if (xhr.status === 401 || xhr.status === 403) {
                    showError("Unauthorized. Please log in again.");
                    localStorage.removeItem("token");
                    redirectToLogin();
                } else if (xhr.status === 400) {
                    showError("Invalid input: " + (xhr.responseJSON?.message || "Check your inputs"));
                } else {
                    showError("Error updating exam: " + (xhr.responseJSON?.message || "Unknown error"));
                }
            },
            complete: function () {
                $("#updateExamBtn").prop("disabled", false).html('<i class="bi bi-check-circle me-1"></i>Update Exam');
            },
        });
    });

    // Reset forms when modals are closed
    $("#createExamModal").on("hidden.bs.modal", () => {
        const form = document.getElementById("createExamForm");
        form.reset();
        form.classList.remove("was-validated");
    });

    $("#updateExamModal").on("hidden.bs.modal", () => {
        const form = document.getElementById("updateExamForm");
        form.reset();
        form.classList.remove("was-validated");
    });

    $("#logout").on("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        window.location.href = "login.html";
    });

    // Toggle sidebar for mobile
    $("#toggleSidebar").on("click", () => {
        $("#sidebar").toggleClass("show");
    });

    // Add Admin functionality
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
            showError("Passwords do not match.");
            $("#adminConfirmPassword").addClass("is-invalid");
            return;
        }

        const adminData = {
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
            redirectToLogin();
            return;
        }

        $("#saveAdmin").prop("disabled", true).html('<div class="three-body"><div class="three-body__dot"></div><div class="three-body__dot"></div><div class="three-body__dot"></div></div>');

        $.ajax({
            url: "http://localhost:8080/api/v1/user/sign_up/admin",
            method: "POST",
            contentType: "application/json",
            headers: {
                Authorization: "Bearer " + token,
            },
            data: JSON.stringify(adminData),
            success: function (response) {
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
            error: function (xhr) {
                if (xhr.status === 401 || xhr.status === 403) {
                    showError("Unauthorized. Please log in again.");
                    localStorage.removeItem("token");
                    redirectToLogin();
                } else {
                    showError("Error adding admin: " + (xhr.responseJSON?.message || "Unknown error"));
                }
            },
            complete: function () {
                $("#saveAdmin").prop("disabled", false).html('<i class="bi bi-check-circle me-1"></i>Add Administrator');
            },
        });
    });

    // Reset add admin form when modal is closed
    $("#addAdminModal").on("hidden.bs.modal", () => {
        const form = document.getElementById("addAdminForm");
        form.reset();
        form.classList.remove("was-validated");
    });

    // Load all admins
    function loadAllAdmins(page = 0, size = 10, filter = "all", search = "") {
        const token = localStorage.getItem("token");
        if (!token) {
            redirectToLogin();
            return;
        }

        let url = `http://localhost:8080/api/v1/user/admins?page=${page}&size=${size}`;
        if (filter !== "all") {
            url += `&status=${filter.toUpperCase()}`;
        }
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }

        $.ajax({
            url: url,
            method: "GET",
            headers: {
                Authorization: "Bearer " + token,
            },
            success: function (response) {
                if (response.code === 200 && response.data) {
                    updateAdminsTable(response.data.content, response.data);
                } else {
                    showError("Error loading admins");
                }
            },
            error: function (xhr) {
                if (xhr.status === 401 || xhr.status === 403) {
                    showError("Unauthorized. Please log in again.");
                    localStorage.removeItem("token");
                    redirectToLogin();
                } else {
                    showError("Error loading admins: " + (xhr.responseJSON?.message || "Unknown error"));
                }
            },
        });
    }

    // Update admins table
    function updateAdminsTable(admins, pageInfo) {
        const $tbody = $("#adminsTableBody");
        $tbody.empty();

        if (!admins || admins.length === 0) {
            $tbody.append('<tr><td colspan="9" class="text-center">No administrators found</td></tr>');
            updatePagination(0, 0, 0);
            return;
        }

        admins.forEach((admin) => {
            const status = admin.active ? "Active" : "Inactive";
            const statusClass = admin.active ? "text-success" : "text-danger";
            const row = `
                <tr>
                    <td>${admin.fullName}</td>
                    <td>${admin.username}</td>
                    <td>${admin.email}</td>
                    <td>${admin.nic}</td>
                    <td>${admin.phoneNumber || "N/A"}</td>
                    <td>${admin.dateOfBirth || "N/A"}</td>
                    <td>${admin.schoolName || "N/A"}</td>
                    <td><span class="${statusClass}">${status}</span></td>
                    <td>
                        <div class="dropdown">
                            <button class="btn-icon dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item view-admin" href="#" data-email="${admin.email}">View Details</a></li>
                                <li><a class="dropdown-item edit-admin" href="#" data-email="${admin.email}">Edit</a></li>
                                <li><a class="dropdown-item ${admin.active ? "deactivate-admin" : "activate-admin"}" href="#" data-email="${admin.email}">
                                    ${admin.active ? "Deactivate" : "Activate"}
                                </a></li>
                                <li><a class="dropdown-item delete-admin" href="#" data-email="${admin.email}">Delete</a></li>
                            </ul>
                        </div>
                    </td>
                </tr>`;
            $tbody.append(row);
        });

        updatePagination(pageInfo.number, pageInfo.totalPages, pageInfo.totalElements);
    }

    // Update pagination
    function updatePagination(currentPage, totalPages, totalItems) {
        const start = currentPage * 10 + 1;
        const end = Math.min((currentPage + 1) * 10, totalItems);
        $("#showingStart").text(start);
        $("#showingEnd").text(end);
        $("#totalAdmins").text(totalItems);

        $("#prevPage").prop("disabled", currentPage === 0);
        $("#nextPage").prop("disabled", currentPage >= totalPages - 1);
    }

    // Load exams
    function loadExams(filter = "all", search = "") {
        const token = localStorage.getItem("token");
        if (!token) {
            redirectToLogin();
            return;
        }

        let url = `http://localhost:8080/api/v1/exam/all`;
        if (filter !== "all") {
            url += `?status=${filter.toUpperCase()}`;
        }
        if (search) {
            url += `${filter === "all" ? "?" : "&"}search=${encodeURIComponent(search)}`;
        }

        // Show loader
        $("#loading").show();
        $("#examsTableBody").html('<tr><td colspan="8" class="text-center">Loading...</td></tr>');

        $.ajax({
            url: url,
            method: "GET",
            headers: {
                Authorization: "Bearer " + token,
            },
            success: function (response) {
                if (response.code === 200 && response.data) {
                    updateExamsTable(response.data);
                } else {
                    showError("Error loading exams: " + (response.message || "No data returned"));
                }
            },
            error: function (xhr) {
                if (xhr.status === 401 || xhr.status === 403) {
                    showError("Unauthorized. Please log in again.");
                    localStorage.removeItem("token");
                    redirectToLogin();
                } else if (xhr.status === 404) {
                    showError("Exam endpoint not found. Please contact support.");
                } else {
                    showError("Error loading exams: " + (xhr.responseJSON?.message || "Unknown error"));
                }
            },
            complete: function () {
                $("#loading").hide();
            },
        });
    }

    // Update exams table
    function updateExamsTable(exams) {
        const $tbody = $("#examsTableBody");
        $tbody.empty();

        if (!exams || exams.length === 0) {
            $tbody.append('<tr><td colspan="8" class="text-center">No exams found</td></tr>');
            $("#examShowingStart").text(0);
            $("#examShowingEnd").text(0);
            $("#totalExams").text(0);
            $("#examPrevPage").prop("disabled", true);
            $("#examNextPage").prop("disabled", true);
            return;
        }

        exams.forEach((exam) => {
            const startTime = new Date(exam.startTime).toLocaleString();
            const status = exam.status || (new Date(exam.startTime) > new Date() ? "Upcoming" : "Past");
            const statusClass = status === "Upcoming" ? "text-primary" : "text-muted";
            const row = `
            <tr>
                <td>${exam.title}</td>
                <td>${exam.subject}</td>
                <td>${startTime}</td>
                <td>${exam.duration} min</td>
                <td>${exam.examType}</td>
                <td>${exam.createdByEmail}</td>
                <td><span class="${statusClass}">${status}</span></td>
                <td>
                    <div class="dropdown">
                        <button class="btn-icon dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item view-exam" href="#" data-id="${exam.id}">View Details</a></li>
                            <li><a class="dropdown-item edit-exam" href="#" data-id="${exam.id}">Edit</a></li>
                            <li><a class="dropdown-item delete-exam" href="#" data-id="${exam.id}">Delete</a></li>
                        </ul>
                    </div>
                </td>
            </tr>`;
            $tbody.append(row);
        });

        $("#examShowingStart").text(1);
        $("#examShowingEnd").text(exams.length);
        $("#totalExams").text(exams.length);
        $("#examPrevPage").prop("disabled", true);
        $("#examNextPage").prop("disabled", true);
    }

    // Update exam pagination
    function updateExamPagination(currentPage, totalPages, totalItems) {
        const start = currentPage * 10 + 1;
        const end = Math.min((currentPage + 1) * 10, totalItems);
        $("#examShowingStart").text(start);
        $("#examShowingEnd").text(end);
        $("#totalExams").text(totalItems);

        $("#examPrevPage").prop("disabled", currentPage === 0);
        $("#examNextPage").prop("disabled", currentPage >= totalPages - 1);
    }

    // Handle edit admin
    $("#adminsTableBody").on("click", ".edit-admin", function (e) {
        e.preventDefault();
        const email = $(this).data("email");
        const token = localStorage.getItem("token");

        $.ajax({
            url: `http://localhost:8080/api/v1/user/profile/${email}`,
            method: "GET",
            headers: {
                Authorization: "Bearer " + token,
            },
            success: function (response) {
                if (response.code === 200 && response.data) {
                    const admin = response.data;
                    $("#editAdminEmail").val(admin.email);
                    $("#editAdminFullName").val(admin.fullName);
                    $("#editAdminNIC").val(admin.nic);
                    $("#editAdminDOB").val(admin.dateOfBirth);
                    $("#editAdminPhone").val(admin.phoneNumber);
                    $("#editAdminSchoolName").val(admin.schoolName);
                    $("#editAdminUsername").val(admin.username);
                    $("#editAdminModal").modal("show");
                } else {
                    showError("Error fetching admin details");
                }
            },
            error: function (xhr) {
                showError("Error fetching admin: " + (xhr.responseJSON?.message || "Unknown error"));
            },
        });
    });

    // Save updated admin
    $("#updateAdmin").on("click", function () {
        const form = document.getElementById("editAdminForm");
        if (!form.checkValidity()) {
            form.classList.add("was-validated");
            return;
        }

        const adminData = {
            email: $("#editAdminEmail").val(),
            fullName: $("#editAdminFullName").val().trim(),
            nic: $("#editAdminNIC").val().trim(),
            dateOfBirth: $("#editAdminDOB").val(),
            phoneNumber: $("#editAdminPhone").val().trim(),
            schoolName: $("#editAdminSchoolName").val().trim(),
            username: $("#editAdminUsername").val().trim(),
        };

        const token = localStorage.getItem("token");
        $.ajax({
            url: "http://localhost:8080/api/v1/user/update",
            method: "PUT",
            contentType: "application/json",
            headers: {
                Authorization: "Bearer " + token,
            },
            data: JSON.stringify(adminData),
            success: function (response) {
                if (response.code === 200) {
                    showSuccess("Admin updated successfully!");
                    $("#editAdminModal").modal("hide");
                    loadAllAdmins();
                } else {
                    showError(response.message || "Error updating admin");
                }
            },
            error: function (xhr) {
                showError("Error updating admin: " + (xhr.responseJSON?.message || "Unknown error"));
            },
        });
    });

    // Handle view admin details
    $("#adminsTableBody").on("click", ".view-admin", function (e) {
        e.preventDefault();
        const email = $(this).data("email");
        const token = localStorage.getItem("token");

        $.ajax({
            url: `http://localhost:8080/api/v1/user/profile/${email}`,
            method: "GET",
            headers: {
                Authorization: "Bearer " + token,
            },
            success: function (response) {
                if (response.code === 200 && response.data) {
                    const admin = response.data;
                    $("#detailsAdminName").text(admin.fullName);
                    $("#detailsAdminSchool").text(admin.schoolName || "N/A");
                    $("#detailsAdminUsername").text(admin.username);
                    $("#detailsAdminEmail").text(admin.email);
                    $("#detailsAdminNIC").text(admin.nic);
                    $("#detailsAdminPhone").text(admin.phoneNumber || "N/A");
                    $("#detailsAdminDOB").text(admin.dateOfBirth || "N/A");
                    $("#detailsAdminStatus").text(admin.active ? "Active" : "Inactive");
                    const initials = admin.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase();
                    $("#detailsAdminInitials").text(initials);
                    $("#editSelectedAdmin").data("email", admin.email);
                    $("#adminDetailsModal").modal("show");
                } else {
                    showError("Error fetching admin details");
                }
            },
            error: function (xhr) {
                showError("Error fetching admin: " + (xhr.responseJSON?.message || "Unknown error"));
            },
        });
    });

    // Handle edit from details modal
    $("#editSelectedAdmin").on("click", function () {
        const email = $(this).data("email");
        $("#adminDetailsModal").modal("hide");
        $(".edit-admin[data-email='" + email + "']").trigger("click");
    });

    // Handle deactivate admin
    $("#adminsTableBody").on("click", ".deactivate-admin", function (e) {
        e.preventDefault();
        const email = $(this).data("email");
        toggleAdminStatus(email, false);
    });

    // Handle activate admin
    $("#adminsTableBody").on("click", ".activate-admin", function (e) {
        e.preventDefault();
        const email = $(this).data("email");
        toggleAdminStatus(email, true);
    });

    // Toggle admin status
    function toggleAdminStatus(email, activate) {
        const token = localStorage.getItem("token");
        const action = activate ? "activate" : "deactivate";
        $.ajax({
            url: `http://localhost:8080/api/v1/user/${action}/${email}`,
            method: "PUT",
            headers: {
                Authorization: "Bearer " + token,
            },
            success: function (response) {
                if (response.code === 200) {
                    showSuccess(`Admin ${action}d successfully!`);
                    loadAllAdmins();
                } else {
                    showError(response.message || `Error ${action}ing admin`);
                }
            },
            error: function (xhr) {
                showError(`Error ${action}ing admin: ` + (xhr.responseJSON?.message || "Unknown error"));
            },
        });
    }

    // Handle delete admin
    $("#adminsTableBody").on("click", ".delete-admin", function (e) {
        e.preventDefault();
        const email = $(this).data("email");
        if (confirm("Are you sure you want to delete this admin?")) {
            const token = localStorage.getItem("token");
            $.ajax({
                url: `http://localhost:8080/api/v1/user/delete/${email}`,
                method: "DELETE",
                headers: {
                    Authorization: "Bearer " + token,
                },
                success: function (response) {
                    if (response.code === 200) {
                        showSuccess("Admin deleted successfully!");
                        loadAllAdmins();
                    } else {
                        showError(response.message || "Error deleting admin");
                    }
                },
                error: function (xhr) {
                    showError("Error deleting admin: " + (xhr.responseJSON?.message || "Unknown error"));
                },
            });
        }
    });

    // Handle view exam details
    $("#examsTableBody").on("click", ".view-exam", function (e) {
        e.preventDefault();
        const id = $(this).data("id");
        const token = localStorage.getItem("token");

        $.ajax({
            url: `http://localhost:8080/api/v1/exam/${id}`,
            method: "GET",
            headers: {
                Authorization: "Bearer " + token,
            },
            success: function (response) {
                if (response.code === 200 && response.data) {
                    const exam = response.data;
                    $("#detailsExamTitle").text(exam.title);
                    $("#detailsExamSubject").text(exam.subject);
                    $("#detailsExamStartTime").text(new Date(exam.startTime).toLocaleString());
                    $("#detailsExamDuration").text(exam.duration + " min");
                    $("#detailsExamType").text(exam.examType);
                    $("#detailsExamCreator").text(exam.createdByEmail);
                    $("#examDetailsModal").modal("show");
                } else {
                    showError("Error fetching exam details");
                }
            },
            error: function (xhr) {
                showError("Error fetching exam: " + (xhr.responseJSON?.message || "Unknown error"));
            },
        });
    });

    // Handle edit exam
    $("#examsTableBody").on("click", ".edit-exam", function (e) {
        e.preventDefault();
        const id = $(this).data("id");
        const token = localStorage.getItem("token");

        $.ajax({
            url: `http://localhost:8080/api/v1/exam/${id}`,
            method: "GET",
            headers: {
                Authorization: "Bearer " + token,
            },
            success: function (response) {
                if (response.code === 200 && response.data) {
                    const exam = response.data;
                    $("#updateExamId").val(exam.id);
                    $("#updateExamTitle").val(exam.title);
                    $("#updateExamSubject").val(exam.subject);
                    $("#updateExamStartTime").val(new Date(exam.startTime).toISOString().slice(0, 16));
                    $("#updateExamDuration").val(exam.duration);
                    $("#updateExamType").val(exam.examType);
                    $("#updateExamModal").modal("show");
                } else {
                    showError("Error fetching exam details");
                }
            },
            error: function (xhr) {
                showError("Error fetching exam: " + (xhr.responseJSON?.message || "Unknown error"));
            },
        });
    });

    // Handle delete exam
    $("#examsTableBody").on("click", ".delete-exam", function (e) {
        e.preventDefault();
        const id = $(this).data("id");
        if (confirm("Are you sure you want to delete this exam?")) {
            const token = localStorage.getItem("token");
            $.ajax({
                url: `http://localhost:8080/api/v1/exam/${id}`,
                method: "DELETE",
                headers: {
                    Authorization: "Bearer " + token,
                },
                success: function (response) {
                    if (response.code === 200) {
                        showSuccess("Exam deleted successfully!");
                        loadExams();
                    } else {
                        showError(response.message || "Error deleting exam");
                    }
                },
                error: function (xhr) {
                    showError("Error deleting exam: " + (xhr.responseJSON?.message || "Unknown error"));
                },
            });
        }
    });

    // Filter admins
    $(".filter-btn").on("click", function () {
        $(".filter-btn").removeClass("active");
        $(this).addClass("active");
        const filter = $(this).data("filter");
        loadAllAdmins(0, 10, filter, $("#searchAdmin").val());
    });

    // Search admins
    $("#searchAdmin").on("input", function () {
        const search = $(this).val();
        const filter = $(".filter-btn.active").data("filter");
        loadAllAdmins(0, 10, filter, search);
    });

    // Filter exams
    $(".filter-btn").on("click", function () {
        $(".filter-btn").removeClass("active");
        $(this).addClass("active");
        const filter = $(this).data("filter");
        loadExams(0, 10, filter, $("#searchExam").val());
    });

    // Search exams
    $("#searchExam").on("input", function () {
        const search = $(this).val();
        const filter = $(".filter-btn.active").data("filter");
        loadExams(0, 10, filter, search);
    });

    // Pagination controls
    $("#prevPage").on("click", function () {
        const currentPage = parseInt($("#showingStart").text()) / 10;
        const filter = $(".filter-btn.active").data("filter");
        loadAllAdmins(currentPage - 1, 10, filter, $("#searchAdmin").val());
    });

    $("#nextPage").on("click", function () {
        const currentPage = parseInt($("#showingStart").text()) / 10;
        const filter = $(".filter-btn.active").data("filter");
        loadAllAdmins(currentPage + 1, 10, filter, $("#searchAdmin").val());
    });

    $("#examPrevPage").on("click", function () {
        const currentPage = parseInt($("#examShowingStart").text()) / 10;
        const filter = $(".filter-btn.active").data("filter");
        loadExams(currentPage - 1, 10, filter, $("#searchExam").val());
    });

    $("#examNextPage").on("click", function () {
        const currentPage = parseInt($("#examShowingStart").text()) / 10;
        const filter = $(".filter-btn.active").data("filter");
        loadExams(currentPage + 1, 10, filter, $("#searchExam").val());
    });

    // Load dashboard stats
    function loadDashboard() {
        const token = localStorage.getItem("token");
        $.ajax({
            url: "http://localhost:8080/api/v1/dashboard/stats",
            method: "GET",
            headers: {
                Authorization: "Bearer " + token,
            },
            success: function (response) {
                if (response.code === 200 && response.data) {
                    $("#statsCards .card-value").eq(0).text(response.data.totalInstitutions);
                    $("#statsCards .card-value").eq(1).text(response.data.activeAdmins);
                    $("#statsCards .card-value").eq(2).text(response.data.totalCourses);
                    $("#statsCards .card-value").eq(3).text(response.data.examsThisMonth);
                }
            },
            error: function (xhr) {
                showError("Error loading dashboard stats");
            },
        });
    }

    // Utility functions
    function setActiveMenu(menu) {
        $(".menu-item").removeClass("active");
        $(menu).addClass("active");
    }

    function showSuccess(message) {
        Toastify({
            text: message,
            duration: 3000,
            backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
            className: "toast-success",
        }).showToast();
    }

    function showError(message) {
        Toastify({
            text: message,
            duration: 3000,
            backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
            className: "toast-error",
        }).showToast();
    }

    function redirectToLogin() {
        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);
    }
});