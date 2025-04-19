document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    $("#loading").show();

    const originalSetText = $.fn.text;
    $.fn.text = function (text) {
        const result = originalSetText.apply(this, arguments);

        if (this.attr('id') === 'modalUserStatus' && text !== undefined) {
            const isActive = text === 'Active';
            $('#statusBadge').removeClass('status-active status-inactive')
                .addClass(isActive ? 'status-active' : 'status-inactive');
        }

        return result;
    };

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

            const profileImage = user.profilePicture || 'default-profile.png';
            $("#userProfileImage").attr('src', profileImage);
            $("#modalUserProfileImage").attr('src', profileImage);

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

    $(".profile-image-container").on("click", function () {
        $("#profileImageInput").click();
    });

    $(".icon-btn").on("click", function (e) {
        e.stopPropagation();
    });

    $(".delete-btn").on("click", function (e) {
        e.stopPropagation();
        $(".image-overlay .fa-trash").click();
    });

    $(".upload-icon").on("click", function (e) {
        e.stopPropagation();
        $("#profileImageInput").click();
    });

    $("#profileImageInput").on("change", function () {
        const file = this.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('email', localStorage.getItem("email"));
            formData.append('file', file);

            $.ajax({
                url: "http://localhost:8080/api/v1/user/profile-picture",
                method: "POST",
                headers: {Authorization: "Bearer " + token},
                processData: false,
                contentType: false,
                data: formData,
                success: (response) => {
                    if (response.code === 200 && response.data) {
                        const profilePicture = response.data.profilePicture || 'default-profile.png';
                        $("#userProfileImage").attr('src', profilePicture);
                        $("#modalUserProfileImage").attr('src', profilePicture);
                        showSuccess('Profile picture updated successfully');
                    } else {
                        showError('Failed to update profile picture');
                    }
                },
                error: (xhr) => {
                    showError('Failed to update profile picture: ' + (xhr.responseJSON?.message || 'Unknown error'));
                }
            });
        }
    });

    $(".image-overlay").on("click", ".fa-trash", async function (e) {
        e.stopPropagation();

        if (!confirm("Are you sure you want to delete your profile picture?")) return;

        try {
            const response = await $.ajax({
                url: "http://localhost:8080/api/v1/user/profile-picture",
                method: "DELETE",
                headers: {
                    Authorization: "Bearer " + token,
                    "Content-Type": "application/json"
                },
                dataType: "json"
            });

            if (response.code === 200) {
                const defaultImage = 'default-profile.png';
                $("#userProfileImage").attr('src', defaultImage + '?t=' + Date.now());
                $("#modalUserProfileImage").attr('src', defaultImage + '?t=' + Date.now());
                showSuccess(response.message || 'Profile picture deleted successfully');
            } else {
                showError(response.message || 'Failed to delete profile picture');
            }
        } catch (error) {
            const errorMsg = error.responseJSON?.message ||
                error.statusText ||
                'Network error - please check your connection';
            showError(`Deletion failed: ${errorMsg}`);
            console.error('Delete error:', error);
        }
    });

    $("#profileImageInput").on("click", function (e) {
        e.stopPropagation();
    });

    $("#content").hide();

    function showSection(sectionId) {
        $(".dashboard-content").hide();
        $(sectionId).fadeIn(300);
    }

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

    $("#teachersMenu").on("click", function (e) {
        e.preventDefault();
        showSection("#teachersContent");
        setActiveMenu(this);
        loadAllTeachers();
    });

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

    $("#toggleSidebar").on("click", () => {
        $("#sidebar").toggleClass("show");
    });

    // Add Admin functionality
    const adminForm = document.getElementById("addAdminForm");
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

        if (!adminForm.checkValidity()) {
            adminForm.classList.add("was-validated");
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
                    adminForm.reset();
                    adminForm.classList.remove("was-validated");
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

    // Add Teacher functionality
    const teacherForm = document.getElementById("addTeacherForm");
    const saveTeacherBtn = document.getElementById("saveTeacher");

    saveTeacherBtn.addEventListener("click", () => {
        const fullName = document.getElementById("teacherName").value.trim();
        const nic = document.getElementById("teacherNIC").value.trim();
        const dateOfBirth = document.getElementById("teacherDOB").value;
        const phoneNumber = document.getElementById("teacherPhoneNumber").value.trim();
        const schoolName = document.getElementById("teacherSchoolName").value.trim();
        const subject = document.getElementById("teacherSubject").value.trim();
        const username = document.getElementById("teacherUsername").value.trim();
        const email = document.getElementById("teacherEmail").value.trim();
        const password = document.getElementById("teacherPassword").value;
        const confirmPassword = document.getElementById("teacherConfirmPassword").value;

        if (!teacherForm.checkValidity()) {
            teacherForm.classList.add("was-validated");
            return;
        }

        if (password !== confirmPassword) {
            showError("Passwords do not match.");
            $("#teacherConfirmPassword").addClass("is-invalid");
            return;
        }

        const teacherData = {
            fullName,
            nic,
            dateOfBirth,
            phoneNumber,
            schoolName,
            subject,
            username,
            email,
            password,
            role: "TEACHER",
        };

        const token = localStorage.getItem("token");
        if (!token) {
            showError("You are not logged in. Please log in again.");
            redirectToLogin();
            return;
        }

        $("#saveTeacher").prop("disabled", true).html('<div class="three-body"><div class="three-body__dot"></div><div class="three-body__dot"></div><div class="three-body__dot"></div></div>');

        $.ajax({
            url: "http://localhost:8080/api/v1/user/sign_up/teacher",
            method: "POST",
            contentType: "application/json",
            headers: {
                Authorization: "Bearer " + token,
            },
            data: JSON.stringify(teacherData),
            success: function (response) {
                if (response.code === 201) {
                    showSuccess("Teacher added successfully!");
                    $("#addTeacherModal").modal("hide");
                    teacherForm.reset();
                    teacherForm.classList.remove("was-validated");
                    loadAllTeachers();
                } else {
                    showError(response.message || "Error adding teacher");
                }
            },
            error: function (xhr) {
                if (xhr.status === 401 || xhr.status === 403) {
                    showError("Unauthorized. Please log in again.");
                    localStorage.removeItem("token");
                    redirectToLogin();
                } else {
                    showError("Error adding teacher: " + (xhr.responseJSON?.message || "Unknown error"));
                }
            },
            complete: function () {
                $("#saveTeacher").prop("disabled", false).html('<i class="bi bi-check-circle me-1"></i>Add Teacher');
            },
        });
    });

    $("#addAdminModal").on("hidden.bs.modal", () => {
        const form = document.getElementById("addAdminForm");
        form.reset();
        form.classList.remove("was-validated");
    });

    $("#addTeacherModal").on("hidden.bs.modal", () => {
        const form = document.getElementById("addTeacherForm");
        form.reset();
        form.classList.remove("was-validated");
    });

    $("#editTeacherModal").on("hidden.bs.modal", () => {
        const form = document.getElementById("editTeacherForm");
        form.reset();
        form.classList.remove("was-validated");
    });

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
            const toggleAction = admin.active ? "deactivate-admin" : "activate-admin";
            const toggleIcon = admin.active ? "fa-toggle-off" : "fa-toggle-on";
            const toggleTitle = admin.active ? "Deactivate" : "Activate";
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
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary view-admin me-1" data-email="${admin.email}" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning edit-admin me-1" data-email="${admin.email}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info ${toggleAction} me-1" data-email="${admin.email}" title="${toggleTitle}">
                            <i class="fas ${toggleIcon}"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-admin" data-email="${admin.email}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
            $tbody.append(row);
        });

        updatePagination(pageInfo.number, pageInfo.totalPages, pageInfo.totalElements);
    }

    function updatePagination(currentPage, totalPages, totalItems) {
        const start = currentPage * 10 + 1;
        const end = Math.min((currentPage + 1) * 10, totalItems);
        $("#showingStart").text(start);
        $("#showingEnd").text(end);
        $("#totalAdmins").text(totalItems);

        $("#prevPage").prop("disabled", currentPage === 0);
        $("#nextPage").prop("disabled", currentPage >= totalPages - 1);
    }

    function loadAllTeachers(page = 0, size = 10, filter = "all", search = "") {
        const token = localStorage.getItem("token");
        if (!token) {
            redirectToLogin();
            return;
        }

        let url = `http://localhost:8080/api/v1/user/teachers?page=${page}&size=${size}`;
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
                    updateTeachersTable(response.data.content, response.data);
                } else {
                    showError("Error loading teachers");
                }
            },
            error: function (xhr) {
                if (xhr.status === 401 || xhr.status === 403) {
                    showError("Unauthorized. Please log in again.");
                    localStorage.removeItem("token");
                    redirectToLogin();
                } else {
                    showError("Error loading teachers: " + (xhr.responseJSON?.message || "Unknown error"));
                }
            },
        });
    }

    function updateTeachersTable(teachers, pageInfo) {
        const $tbody = $("#teachersTableBody");
        $tbody.empty();

        if (!teachers || teachers.length === 0) {
            $tbody.append('<tr><td colspan="10" class="text-center">No teachers found</td></tr>');
            updateTeacherPagination(0, 0, 0);
            return;
        }

        teachers.forEach((teacher) => {
            const status = teacher.active ? "Active" : "Inactive";
            const statusClass = teacher.active ? "text-success" : "text-danger";
            const toggleAction = teacher.active ? "deactivate-teacher" : "activate-teacher";
            const toggleIcon = teacher.active ? "fa-toggle-off" : "fa-toggle-on";
            const toggleTitle = teacher.active ? "Deactivate" : "Activate";
            const row = `
            <tr>
                <td>${teacher.fullName}</td>
                <td>${teacher.username}</td>
                <td>${teacher.email}</td>
                <td>${teacher.nic}</td>
                <td>${teacher.phoneNumber || "N/A"}</td>
                <td>${teacher.dateOfBirth || "N/A"}</td>
                <td>${teacher.schoolName || "N/A"}</td>
                <td>${teacher.subject || "N/A"}</td>
                <td><span class="${statusClass}">${status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary view-teacher me-1" data-email="${teacher.email}" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning edit-teacher me-1" data-email="${teacher.email}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info ${toggleAction} me-1" data-email="${teacher.email}" title="${toggleTitle}">
                            <i class="fas ${toggleIcon}"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-teacher" data-email="${teacher.email}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
            $tbody.append(row);
        });

        updateTeacherPagination(pageInfo.number, pageInfo.totalPages, pageInfo.totalElements);
    }

    function updateTeacherPagination(currentPage, totalPages, totalItems) {
        const start = currentPage * 10 + 1;
        const end = Math.min((currentPage + 1) * 10, totalItems);
        $("#teacherShowingStart").text(start);
        $("#teacherShowingEnd").text(end);
        $("#totalTeachers").text(totalItems);

        $("#teacherPrevPage").prop("disabled", currentPage === 0);
        $("#teacherNextPage").prop("disabled", currentPage >= totalPages - 1);
    }

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
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary view-exam me-1" data-id="${exam.id}" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning edit-exam me-1" data-id="${exam.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-exam" data-id="${exam.id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
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

    function updateExamPagination(currentPage, totalPages, totalItems) {
        const start = currentPage * 10 + 1;
        const end = Math.min((currentPage + 1) * 10, totalItems);
        $("#examShowingStart").text(start);
        $("#examShowingEnd").text(end);
        $("#totalExams").text(totalItems);

        $("#examPrevPage").prop("disabled", currentPage === 0);
        $("#examNextPage").prop("disabled", currentPage >= totalPages - 1);
    }

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

    $("#teachersTableBody").on("click", ".edit-teacher", function (e) {
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
                    const teacher = response.data;
                    $("#editTeacherEmail").val(teacher.email);
                    $("#editTeacherFullName").val(teacher.fullName);
                    $("#editTeacherNIC").val(teacher.nic);
                    $("#editTeacherDOB").val(teacher.dateOfBirth);
                    $("#editTeacherPhone").val(teacher.phoneNumber);
                    $("#editTeacherSchoolName").val(teacher.schoolName);
                    $("#editTeacherSubject").val(teacher.subject);
                    $("#editTeacherUsername").val(teacher.username);
                    $("#editTeacherModal").modal("show");
                } else {
                    showError("Error fetching teacher details");
                }
            },
            error: function (xhr) {
                showError("Error fetching teacher: " + (xhr.responseJSON?.message || "Unknown error"));
            },
        });
    });

    $("#updateTeacher").on("click", function () {
        const form = document.getElementById("editTeacherForm");
        if (!form.checkValidity()) {
            form.classList.add("was-validated");
            return;
        }

        const teacherData = {
            email: $("#editTeacherEmail").val(),
            fullName: $("#editTeacherFullName").val().trim(),
            nic: $("#editTeacherNIC").val().trim(),
            dateOfBirth: $("#editTeacherDOB").val(),
            phoneNumber: $("#editTeacherPhone").val().trim(),
            schoolName: $("#editTeacherSchoolName").val().trim(),
            subject: $("#editTeacherSubject").val().trim(),
            username: $("#editTeacherUsername").val().trim(),
        };

        const token = localStorage.getItem("token");
        $.ajax({
            url: "http://localhost:8080/api/v1/user/update",
            method: "PUT",
            contentType: "application/json",
            headers: {
                Authorization: "Bearer " + token,
            },
            data: JSON.stringify(teacherData),
            success: function (response) {
                if (response.code === 200) {
                    showSuccess("Teacher updated successfully!");
                    $("#editTeacherModal").modal("hide");
                    loadAllTeachers();
                } else {
                    showError(response.message || "Error updating teacher");
                }
            },
            error: function (xhr) {
                showError("Error updating teacher: " + (xhr.responseJSON?.message || "Unknown error"));
            },
        });
    });

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

    $("#teachersTableBody").on("click", ".view-teacher", function (e) {
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
                    const teacher = response.data;
                    $("#detailsTeacherName").text(teacher.fullName);
                    $("#detailsTeacherSchool").text(teacher.schoolName || "N/A");
                    $("#detailsTeacherUsername").text(teacher.username);
                    $("#detailsTeacherEmail").text(teacher.email);
                    $("#detailsTeacherNIC").text(teacher.nic);
                    $("#detailsTeacherPhone").text(teacher.phoneNumber || "N/A");
                    $("#detailsTeacherDOB").text(teacher.dateOfBirth || "N/A");
                    $("#detailsTeacherSubject").text(teacher.subject || "N/A");
                    $("#detailsTeacherStatus").text(teacher.active ? "Active" : "Inactive");
                    const initials = teacher.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase();
                    $("#detailsTeacherInitials").text(initials);
                    $("#editSelectedTeacher").data("email", teacher.email);
                    $("#teacherDetailsModal").modal("show");
                } else {
                    showError("Error fetching teacher details");
                }
            },
            error: function (xhr) {
                showError("Error fetching teacher: " + (xhr.responseJSON?.message || "Unknown error"));
            },
        });
    });

    $("#editSelectedAdmin").on("click", function () {
        const email = $(this).data("email");
        $("#adminDetailsModal").modal("hide");
        $(".edit-admin[data-email='" + email + "']").trigger("click");
    });

    $("#editSelectedTeacher").on("click", function () {
        const email = $(this).data("email");
        $("#teacherDetailsModal").modal("hide");
        $(".edit-teacher[data-email='" + email + "']").trigger("click");
    });

    $("#adminsTableBody").on("click", ".deactivate-admin", function (e) {
        e.preventDefault();
        const email = $(this).data("email");
        toggleAdminStatus(email, false);
    });

    $("#adminsTableBody").on("click", ".activate-admin", function (e) {
        e.preventDefault();
        const email = $(this).data("email");
        toggleAdminStatus(email, true);
    });

    $("#teachersTableBody").on("click", ".deactivate-teacher", function (e) {
        e.preventDefault();
        const email = $(this).data("email");
        toggleTeacherStatus(email, false);
    });

    $("#teachersTableBody").on("click", ".activate-teacher", function (e) {
        e.preventDefault();
        const email = $(this).data("email");
        toggleTeacherStatus(email, true);
    });

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

    function toggleTeacherStatus(email, activate) {
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
                    showSuccess(`Teacher ${action}d successfully!`);
                    loadAllTeachers();
                } else {
                    showError(response.message || `Error ${action}ing teacher`);
                }
            },
            error: function (xhr) {
                showError(`Error ${action}ing teacher: ` + (xhr.responseJSON?.message || "Unknown error"));
            },
        });
    }

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

    $("#teachersTableBody").on("click", ".delete-teacher", function (e) {
        e.preventDefault();
        const email = $(this).data("email");
        if (confirm("Are you sure you want to delete this teacher?")) {
            const token = localStorage.getItem("token");
            $.ajax({
                url: `http://localhost:8080/api/v1/user/delete/${email}`,
                method: "DELETE",
                headers: {
                    Authorization: "Bearer " + token,
                },
                success: function (response) {
                    if (response.code === 200) {
                        showSuccess("Teacher deleted successfully!");
                        loadAllTeachers();
                    } else {
                        showError(response.message || "Error deleting teacher");
                    }
                },
                error: function (xhr) {
                    showError("Error deleting teacher: " + (xhr.responseJSON?.message || "Unknown error"));
                },
            });
        }
    });

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

    $(".filter-btn").on("click", function () {
        $(".filter-btn").removeClass("active");
        $(this).addClass("active");
        const filter = $(this).data("filter");
        const section = $(this).closest(".dashboard-content").attr("id");
        if (section === "adminsContent") {
            loadAllAdmins(0, 10, filter, $("#searchAdmin").val());
        } else if (section === "examsContent") {
            loadExams(filter, $("#searchExam").val());
        } else if (section === "teachersContent") {
            loadAllTeachers(0, 10, filter, $("#searchTeacher").val());
        }
    });

    $("#searchAdmin").on("input", function () {
        const search = $(this).val();
        const filter = $(".filter-btn.active").data("filter");
        loadAllAdmins(0, 10, filter, search);
    });

    $("#searchExam").on("input", function () {
        const search = $(this).val();
        const filter = $(".filter-btn.active").data("filter");
        loadExams(filter, search);
    });

    $("#searchTeacher").on("input", function () {
        const search = $(this).val();
        const filter = $(".filter-btn.active").data("filter");
        loadAllTeachers(0, 10, filter, search);
    });

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

    $("#teacherPrevPage").on("click", function () {
        const currentPage = parseInt($("#teacherShowingStart").text()) / 10;
        const filter = $(".filter-btn.active").data("filter");
        loadAllTeachers(currentPage - 1, 10, filter, $("#searchTeacher").val());
    });

    $("#teacherNextPage").on("click", function () {
        const currentPage = parseInt($("#teacherShowingStart").text()) / 10;
        const filter = $(".filter-btn.active").data("filter");
        loadAllTeachers(currentPage + 1, 10, filter, $("#searchTeacher").val());
    });

    function loadDashboard() {
        const token = localStorage.getItem("token");
        if (!token) {
            redirectToLogin();
            return;
        }

        $("#statsCards").html(`
        <div class="row mb-4">
            <div class="col-md-3 col-sm-6 mb-4 mb-md-0">
                <div class="stat-card skeleton">
                    <div class="card-icon skeleton-icon"></div>
                    <div class="card-value skeleton-value"></div>
                    <div class="card-label skeleton-text"></div>
                    <div class="growth-indicator skeleton-text"></div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-4 mb-md-0">
                <div class="stat-card skeleton">
                    <div class="card-icon skeleton-icon"></div>
                    <div class="card-value skeleton-value"></div>
                    <div class="card-label skeleton-text"></div>
                    <div class="growth-indicator skeleton-text"></div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-4 mb-md-0">
                <div class="stat-card skeleton">
                    <div class="card-icon skeleton-icon"></div>
                    <div class="card-value skeleton-value"></div>
                    <div class="card-label skeleton-text"></div>
                    <div class="growth-indicator skeleton-text"></div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-4 mb-md-0">
                <div class="stat-card skeleton">
                    <div class="card-icon skeleton-icon"></div>
                    <div class="card-value skeleton-value"></div>
                    <div class="card-label skeleton-text"></div>
                    <div class="growth-indicator skeleton-text"></div>
                </div>
            </div>
        </div>
    `);

        $.ajax({
            url: "http://localhost:8080/api/v1/dashboard/stats",
            method: "GET",
            headers: {
                Authorization: "Bearer " + token,
            },
            success: function (response) {
                if (response.code === 200 && response.data) {
                    $("#totalAdminsCard").text(response.data.totalAdmins);
                    $("#totalStudentsCard").text(response.data.totalStudents);
                    $("#totalTeachersCard").text(response.data.totalTeachers);
                    $("#examsThisMonthCard").text(response.data.examsThisMonth);
                } else {
                    showError("Failed to load dashboard stats");
                    $("#statsCards").html('<p class="text-center text-danger">Failed to load stats</p>');
                }
            },
            error: function (xhr) {
                showError("Error loading dashboard stats: " + (xhr.responseJSON?.message || "Unknown error"));
                $("#statsCards").html('<p class="text-center text-danger">Failed to load stats</p>');
            },
        });
    }

    // Toggle password visibility
    $(".toggle-password").on("click", function () {
        const input = $(this).closest(".input-group").find("input");
        const type = input.attr("type") === "password" ? "text" : "password";
        input.attr("type", type);
        $(this).find("i").toggleClass("bi-eye bi-eye-slash");
    });

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

    // Periodically check if token is present in local storage
    function checkTokenPresence() {
        // Check immediately on function call
        if (!localStorage.getItem('token')) {
            logout();
            return;
        }

        // Then set up interval for periodic checking
        setInterval(() => {
            if (!localStorage.getItem('token')) {
                logout();
            }
        }, 5000); // Check every 5 seconds
    }

    // Call this function when document is ready
    $(document).ready(function () {
        // Other initialization code...

        // Start token presence check
        checkTokenPresence();
    });
});