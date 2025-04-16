document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // Validate token and load profile
    $.ajax({
        url: "http://localhost:8080/api/v1/user/profile",
        method: "GET",
        headers: { Authorization: "Bearer " + token },
        success: (response) => {
            if (response.code !== 200 || !response.data) {
                showError("Invalid server response");
                redirectToLogin();
                return;
            }

            const user = response.data;
            if (user.role !== "ADMIN") {
                showError("Access denied: Admin role required");
                redirectToLogin();
                return;
            }

            // Populate profile
            $("#userFullName").text(user.fullName);
            $("#userRole").text(user.role);
            $("#modalUserFullName").text(user.fullName);
            $("#modalUserRole").text(user.role);
            $("#modalUserEmail").text(user.email);
            $("#modalUserPhone").text(user.phoneNumber || "Not provided");
            $("#modalUserDOB").text(user.dateOfBirth || "Not provided");
            $("#modalUserSchool").text(user.schoolName || "Not provided");
            $("#modalUserStatus").text(user.isActive ? "Active" : "Inactive");

            const initials = user.fullName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
            $("#userInitials").text(initials);
            $("#modalUserInitials").text(initials);

            localStorage.setItem("email", user.email);
            loadDashboard();
        },
        error: (xhr) => {
            if (xhr.status === 401 || xhr.status === 403) {
                showError("Session expired or unauthorized");
                localStorage.removeItem("token");
                redirectToLogin();
            } else {
                showError("Error loading profile: " + (xhr.responseJSON?.message || "Unknown error"));
            }
        },
    });

    // Section navigation
    function showSection(sectionId) {
        $(".dashboard-content").hide();
        $(sectionId).show();
    }

    $("#dashboardMenu").on("click", (e) => {
        e.preventDefault();
        showSection("#dashboardContent");
        setActiveMenu(this);
        loadDashboard();
    });

    $("#teachersMenu").on("click", (e) => {
        e.preventDefault();
        showSection("#teachersContent");
        setActiveMenu(this);
        loadTeachers();
    });

    $("#studentsMenu").on("click", (e) => {
        e.preventDefault();
        showSection("#studentsContent");
        setActiveMenu(this);
        loadStudents();
    });

    $("#examsMenu").on("click", (e) => {
        e.preventDefault();
        showSection("#examsContent");
        setActiveMenu(this);
        loadExams();
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

    // Add Teacher
    $("#saveTeacher").on("click", () => {
        const form = $("#addTeacherForm")[0];
        if (!form.checkValidity()) {
            form.classList.add("was-validated");
            return;
        }

        const data = {
            fullName: $("#teacherName").val().trim(),
            nic: $("#teacherNIC").val().trim(),
            dateOfBirth: $("#teacherDOB").val(),
            phoneNumber: $("#teacherPhoneNumber").val().trim(),
            subject: $("#teacherSubject").val().trim(),
            username: $("#teacherUsername").val().trim(),
            email: $("#teacherEmail").val().trim(),
            password: $("#teacherPassword").val(),
            role: "TEACHER",
        };

        if (data.password !== $("#teacherConfirmPassword").val()) {
            showError("Passwords do not match");
            return;
        }

        $.ajax({
            url: "http://localhost:8080/api/v1/user/sign_up/teacher",
            method: "POST",
            contentType: "application/json",
            headers: { Authorization: "Bearer " + token },
            data: JSON.stringify(data),
            success: (response) => {
                if (response.code === 201) {
                    showSuccess("Teacher added successfully");
                    $("#addTeacherModal").modal("hide");
                    form.reset();
                    form.classList.remove("was-validated");
                    loadTeachers();
                } else {
                    showError(response.message || "Error adding teacher");
                }
            },
            error: (xhr) => {
                handleAjaxError(xhr, "Error adding teacher");
            },
        });
    });

    $("#addTeacherModal").on("hidden.bs.modal", () => {
        $("#addTeacherForm")[0].reset();
        $("#addTeacherForm").removeClass("was-validated");
    });

    // Exam CRUD
    $("#saveExam").on("click", () => {
        const form = $("#createExamForm")[0];
        if (!form.checkValidity()) {
            form.classList.add("was-validated");
            return;
        }

        const examData = {
            title: $("#examTitle").val().trim(),
            subject: $("#examSubject").val().trim(),
            startTime: $("#examStartTime").val(),
            duration: parseInt($("#examDuration").val()),
            examType: $("#examType").val(),
            createdByEmail: localStorage.getItem("email"),
        };

        if (new Date(examData.startTime) <= new Date()) {
            showError("Start time must be in the future");
            return;
        }

        $.ajax({
            url: "http://localhost:8080/api/v1/exam/create",
            method: "POST",
            contentType: "application/json",
            headers: { Authorization: "Bearer " + token },
            data: JSON.stringify(examData),
            success: (response) => {
                if (response.code === 201) {
                    showSuccess("Exam created successfully");
                    $("#createExamModal").modal("hide");
                    form.reset();
                    form.classList.remove("was-validated");
                    loadExams();
                } else {
                    showError(response.message || "Error creating exam");
                }
            },
            error: (xhr) => {
                handleAjaxError(xhr, "Error creating exam");
            },
        });
    });

    $("#updateExamBtn").on("click", () => {
        const form = $("#updateExamForm")[0];
        if (!form.checkValidity()) {
            form.classList.add("was-validated");
            return;
        }

        const examData = {
            title: $("#updateExamTitle").val().trim(),
            subject: $("#updateExamSubject").val().trim(),
            startTime: $("#updateExamStartTime").val(),
            duration: parseInt($("#updateExamDuration").val()),
            examType: $("#updateExamType").val(),
            createdByEmail: localStorage.getItem("email"),
        };

        const examId = $("#updateExamId").val();

        if (new Date(examData.startTime) <= new Date()) {
            showError("Start time must be in the future");
            return;
        }

        $.ajax({
            url: `http://localhost:8080/api/v1/exam/${examId}`,
            method: "PUT",
            contentType: "application/json",
            headers: { Authorization: "Bearer " + token },
            data: JSON.stringify(examData),
            success: (response) => {
                if (response.code === 200) {
                    showSuccess("Exam updated successfully");
                    $("#updateExamModal").modal("hide");
                    form.reset();
                    form.classList.remove("was-validated");
                    loadExams();
                } else {
                    showError(response.message || "Error updating exam");
                }
            },
            error: (xhr) => {
                handleAjaxError(xhr, "Error updating exam");
            },
        });
    });

    $("#createExamModal, #updateExamModal").on("hidden.bs.modal", () => {
        $("#createExamForm, #updateExamForm")[0].reset();
        $("#createExamForm, #updateExamForm").removeClass("was-validated");
    });

    // Load Functions
    function loadDashboard() {
        $.ajax({
            url: "http://localhost:8080/api/v1/user/teachers",
            method: "GET",
            headers: { Authorization: "Bearer " + token },
            success: (response) => {
                if (response.code === 200) $("#teacherCount").text(response.data.length);
            },
        });
        $.ajax({
            url: "http://localhost:8080/api/v1/user/students",
            method: "GET",
            headers: { Authorization: "Bearer " + token },
            success: (response) => {
                if (response.code === 200) $("#studentCount").text(response.data.length);
            },
        });
        $.ajax({
            url: "http://localhost:8080/api/v1/exam/all",
            method: "GET",
            headers: { Authorization: "Bearer " + token },
            success: (response) => {
                if (response.code === 200) $("#examCount").text(response.data.length);
            },
        });
    }

    function loadTeachers() {
        $.ajax({
            url: "http://localhost:8080/api/v1/user/teachers",
            method: "GET",
            headers: { Authorization: "Bearer " + token },
            success: (response) => {
                if (response.code === 200 && response.data) {
                    const tbody = $("#teachersTableBody");
                    tbody.empty();
                    response.data.forEach(teacher => {
                        tbody.append(`
                            <tr>
                                <td>${teacher.fullName}</td>
                                <td>${teacher.username}</td>
                                <td>${teacher.email}</td>
                                <td>${teacher.subject || "N/A"}</td>
                                <td>${teacher.isActive ? "Active" : "Inactive"}</td>
                                <td><button class="btn btn-sm btn-primary">Edit</button></td>
                            </tr>
                        `);
                    });
                }
            },
            error: (xhr) => {
                handleAjaxError(xhr, "Error loading teachers");
            },
        });
    }

    function loadStudents() {
        $.ajax({
            url: "http://localhost:8080/api/v1/user/students",
            method: "GET",
            headers: { Authorization: "Bearer " + token },
            success: (response) => {
                if (response.code === 200 && response.data) {
                    const tbody = $("#studentsTableBody");
                    tbody.empty();
                    response.data.forEach(student => {
                        tbody.append(`
                            <tr>
                                <td>${student.fullName}</td>
                                <td>${student.username}</td>
                                <td>${student.email}</td>
                                <td>${student.grade || "N/A"}</td>
                                <td>${student.isActive ? "Active" : "Inactive"}</td>
                                <td><button class="btn btn-sm btn-primary">View</button></td>
                            </tr>
                        `);
                    });
                }
            },
            error: (xhr) => {
                handleAjaxError(xhr, "Error loading students");
            },
        });
    }

    function loadExams() {
        $.ajax({
            url: "http://localhost:8080/api/v1/exam/all",
            method: "GET",
            headers: { Authorization: "Bearer " + token },
            success: (response) => {
                if (response.code === 200 && response.data) {
                    const tbody = $("#examsTableBody");
                    tbody.empty();
                    response.data.forEach(exam => {
                        const startTime = new Date(exam.startTime).toLocaleString();
                        const status = new Date(exam.startTime) > new Date() ? "Upcoming" : "Past";
                        tbody.append(`
                            <tr>
                                <td>${exam.title}</td>
                                <td>${exam.subject}</td>
                                <td>${startTime}</td>
                                <td>${exam.duration} mins</td>
                                <td>${exam.examType}</td>
                                <td>${status}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="editExam('${exam.id}')">Edit</button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteExam('${exam.id}')">Delete</button>
                                </td>
                            </tr>
                        `);
                    });
                }
            },
            error: (xhr) => {
                handleAjaxError(xhr, "Error loading exams");
            },
        });
    }

    window.editExam = (examId) => {
        $.ajax({
            url: `http://localhost:8080/api/v1/exam/${examId}`,
            method: "GET",
            headers: { Authorization: "Bearer " + token },
            success: (response) => {
                if (response.code === 200) {
                    const exam = response.data;
                    $("#updateExamId").val(exam.id);
                    $("#updateExamTitle").val(exam.title);
                    $("#updateExamSubject").val(exam.subject);
                    $("#updateExamStartTime").val(new Date(exam.startTime).toISOString().slice(0, 16));
                    $("#updateExamDuration").val(exam.duration);
                    $("#updateExamType").val(exam.examType);
                    $("#updateExamModal").modal("show");
                }
            },
        });
    };

    window.deleteExam = (examId) => {
        if (confirm("Are you sure you want to delete this exam?")) {
            $.ajax({
                url: `http://localhost:8080/api/v1/exam/${examId}`,
                method: "DELETE",
                headers: { Authorization: "Bearer " + token },
                success: (response) => {
                    if (response.code === 200) {
                        showSuccess("Exam deleted successfully");
                        loadExams();
                    }
                },
                error: (xhr) => {
                    handleAjaxError(xhr, "Error deleting exam");
                },
            });
        }
    };

    // Helpers
    function showError(message) {
        Toastify({ text: message, duration: 3000, gravity: "top", position: "right", style: { background: "#ef4444" } }).showToast();
    }

    function showSuccess(message) {
        Toastify({ text: message, duration: 3000, gravity: "top", position: "right", style: { background: "#10b981" } }).showToast();
    }

    function redirectToLogin() {
        setTimeout(() => window.location.href = "login.html", 1000);
    }

    function setActiveMenu(element) {
        $(".menu-item").removeClass("active");
        $(element).addClass("active");
    }

    function handleAjaxError(xhr, defaultMsg) {
        if (xhr.status === 401 || xhr.status === 403) {
            showError("Unauthorized. Please log in again.");
            localStorage.removeItem("token");
            redirectToLogin();
        } else {
            showError(defaultMsg + ": " + (xhr.responseJSON?.message || "Unknown error"));
        }
    }
});