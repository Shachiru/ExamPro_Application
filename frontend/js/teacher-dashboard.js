const API_BASE_URL = "http://localhost:8080/api/v1"
const token = localStorage.getItem("token")

function setAuthHeader(xhr) {
    if (token) xhr.setRequestHeader("Authorization", "Bearer " + token)
}

$(document).ready(() => {
    const role = localStorage.getItem("role")
    if (!token || role !== "TEACHER") {
        window.location.href = "login.html"
        return
    }

    $('[data-bs-toggle="tooltip"]').tooltip()

    showContent("dashboardContent")

    // Modified sidebar toggle to properly handle tables in the menu
    $(".sidebar-toggle").click(() => {
        $(".sidebar").toggleClass("sidebar-collapsed")
        $(".main-content").toggleClass("main-content-expanded")

        // Instead of toggling opacity, use visually-hidden class
        if ($(".sidebar").hasClass("sidebar-collapsed")) {
            $(".menu-text").addClass("visually-hidden")
        } else {
            $(".menu-text").removeClass("visually-hidden")
        }

        // Force redraw of tables to ensure they remain visible
        $(".table").css("display", "none").height()
        $(".table").css("display", "table")
    })

    $(".mobile-sidebar-toggle").click(() => {
        $(".sidebar").toggleClass("mobile-show")

        // Ensure tables are visible when sidebar is shown on mobile
        if ($(".sidebar").hasClass("mobile-show")) {
            $(".table").css("display", "none").height()
            $(".table").css("display", "table")
        }
    })

    $("#dashboard, #profileDropdown").click(function () {
        showContent("dashboardContent")
        setActiveMenu($(this).attr("id"))
        return false
    })

    $("#manageQuestions, #quickAddQuestion").click(() => {
        showContent("questionsContent")
        setActiveMenu("manageQuestions")
        return false
    })

    $("#viewStudents").click(function () {
        showContent("studentsContent")
        setActiveMenu($(this).attr("id"))
        return false
    })

    $("#profile").click(function () {
        loadProfile()
        $("#profileModal").modal("show")
        setActiveMenu($(this).attr("id"))
        return false
    })

    $("#logout, #logoutDropdown").click(() => {
        if (confirm("Are you sure you want to logout?")) {
            localStorage.removeItem("token")
            localStorage.removeItem("role")
            window.location.href = "login.html"
        }
        return false
    })

    $("#questionType").change(function () {
        $("#optionsField").toggle($(this).val() === "MCQ")
    })

    $("#saveQuestion").click(() => {
        saveQuestion()
    })

    $("#saveProfile").click(() => {
        saveProfile()
    })

    $("#profilePictureInput").change(function () {
        const file = this.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                $("#profilePicture").attr("src", e.target.result)
            }
            reader.readAsDataURL(file)
        }
    })

    $("#uploadPicture").click(() => {
        uploadProfilePicture()
    })

    $("#deletePicture").click(() => {
        deleteProfilePicture()
    })

    $(".image-overlay").click(() => {
        $("#profilePictureInput").click()
    })

    // Fix for tables visibility when content is loaded
    function initializeTooltips() {
        $('[data-bs-toggle="tooltip"]').tooltip()
    }

    initializeTooltips()
})

function showContent(contentId) {
    $("#dashboardContent, #questionsContent, #studentsContent").addClass("d-none")
    $(`#${contentId}`).removeClass("d-none")

    // Force table redraw when content is shown to ensure tables are visible
    setTimeout(() => {
        $(".table").css("display", "none").height()
        $(".table").css("display", "table")
    }, 50)

    if (contentId === "questionsContent") {
        loadQuestions()
    } else if (contentId === "dashboardContent") {
        loadDashboardStats()
    }
}

function setActiveMenu(menuId) {
    $(".sidebar-menu a").removeClass("active")
    $(`#${menuId}`).addClass("active")
}

function loadQuestions() {
    $.ajax({
        url: `${API_BASE_URL}/exam/questions`,
        method: "GET",
        beforeSend: setAuthHeader,
        success: (response) => {
            const tableBody = $("#questionBankTable tbody")
            tableBody.empty()
            response.forEach((question) => {
                const typeBadge =
                    {
                        MCQ: "bg-blue-100 text-blue-800",
                        TRUE_FALSE: "bg-green-100 text-green-800",
                        SHORT_ANSWER: "bg-purple-100 text-purple-800",
                        ESSAY: "bg-red-100 text-red-800",
                    }[question.type] || "bg-gray-100 text-gray-800"

                const difficultyBadge =
                    {
                        EASY: "bg-success",
                        MEDIUM: "bg-warning text-dark",
                        HARD: "bg-danger",
                    }[question.difficultyLevel] || "bg-gray-100 text-gray-800"

                const row = `<tr>
                    <td>${question.id}</td>
                    <td>${question.content}</td>
                    <td><span class="badge ${typeBadge}">${question.type}</span></td>
                    <td>${question.examName || "N/A"}</td>
                    <td><span class="badge ${difficultyBadge}">${question.difficultyLevel}</span></td>
                    <td>${question.points}</td>
                    <td>
                        <button class="btn btn-sm btn-warning custom-tooltip" data-tooltip="Edit" onclick="editQuestion('${question.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger custom-tooltip" data-tooltip="Delete" onclick="deleteQuestion('${question.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`
                tableBody.append(row)
            })

            // Force table redraw after loading data
            $(".table").css("display", "none").height()
            $(".table").css("display", "table")
        },
        error: (xhr) => {
            console.error("Error loading questions:", xhr.responseJSON?.message || "Unknown error")
            alert("Failed to load questions. Please try again.")
        },
    })
}

function editQuestion(questionId) {
    $.ajax({
        url: `${API_BASE_URL}/questions/${questionId}`,
        method: "GET",
        beforeSend: setAuthHeader,
        success: (question) => {
            $("#questionModal").modal("show")
            $("#questionModalTitle").text("Edit Question")
            $("#questionId").val(question.id)
            $("#examId").val(question.examId)
            $("#questionType").val(question.type).trigger("change")
            $("#questionContent").val(question.content)
            if (question.type === "MCQ") {
                $("#options").val(question.options.join(", "))
            } else {
                $("#options").val("")
            }
            $("#correctAnswer").val(question.correctAnswer)
            $("#difficultyLevel").val(question.difficultyLevel)
            $("#points").val(question.points)
        },
        error: (xhr) => {
            console.error("Error fetching question:", xhr.responseJSON?.message || "Unknown error")
            alert("Failed to load question details.")
        },
    })
}

function deleteQuestion(questionId) {
    if (confirm("Are you sure you want to delete this question?")) {
        $.ajax({
            url: `${API_BASE_URL}/questions/${questionId}`,
            method: "DELETE",
            beforeSend: setAuthHeader,
            success: () => {
                loadQuestions()
                alert("Question deleted successfully")
            },
            error: (xhr) => {
                console.error("Error deleting question:", xhr.responseJSON?.message || "Unknown error")
                alert("Failed to delete question.")
            },
        })
    }
}

function loadProfile() {
    $.ajax({
        url: `${API_BASE_URL}/user/profile`,
        method: "GET",
        beforeSend: setAuthHeader,
        success: (profile) => {
            $("#teacherFullName").val(profile.fullName)
            $("#teacherUsername").val(profile.username)
            $("#teacherEmail").val(profile.email)
            $("#teacherNIC").val(profile.nic)
            $("#teacherPhone").val(profile.phoneNumber)
            $("#teacherDOB").val(profile.dateOfBirth ? profile.dateOfBirth.split("T")[0] : "")
            $("#teacherSubject").val(profile.subject)
            $("#teacherSchoolName").val(profile.schoolName)

            if (profile.profilePicture) {
                $("#profilePicture").attr("src", profile.profilePicture)
            }

            const statusBadge = profile.isActive
                ? '<span class="badge bg-success">Active</span>'
                : '<span class="badge bg-danger">Inactive</span>'
            $("#teacherStatus").html(statusBadge)
        },
        error: (xhr) => {
            console.error("Error loading profile:", xhr.responseJSON?.message || "Unknown error")
            alert("Failed to load profile data.")
        },
    })
}

function loadDashboardStats() {
    $.ajax({
        url: `${API_BASE_URL}/exam/dashboard/stats`,
        method: "GET",
        beforeSend: setAuthHeader,
        success: (stats) => {
            $("#totalStudents").text(stats.totalStudents)
            $("#activeExams").text(stats.activeExams)
            $("#completionRate").text(stats.completionRate + "%")
            $("#averageScore").text(stats.averageScore)
        },
        error: (xhr) => {
            console.error("Error loading dashboard stats:", xhr.responseJSON?.message || "Unknown error")
            alert("Failed to load dashboard stats.")
        },
    })
}

function saveQuestion() {
    const questionId = $("#questionId").val()
    const questionDTO = {
        id: questionId || null,
        examId: $("#examId").val(),
        type: $("#questionType").val(),
        content: $("#questionContent").val(),
        correctAnswer: $("#correctAnswer").val(),
        options: $("#questionType").val() === "MCQ" ? $("#options").val().split(",") : null,
        difficultyLevel: $("#difficultyLevel").val(),
        points: $("#points").val(),
    }

    const url = questionId
        ? `${API_BASE_URL}/questions/${questionId}`
        : `${API_BASE_URL}/exams/${$("#examId").val()}/questions`
    const method = questionId ? "PUT" : "POST"

    $.ajax({
        url: url,
        method: method,
        contentType: "application/json",
        data: JSON.stringify(questionDTO),
        beforeSend: setAuthHeader,
        success: (response) => {
            $("#questionModal").modal("hide")
            alert("Question saved successfully")
            loadQuestions()
        },
        error: (xhr) => {
            alert("Error saving question: " + (xhr.responseJSON?.message || "Unknown error"))
        },
    })
}

function saveProfile() {
    const profileDTO = {
        fullName: $("#teacherFullName").val(),
        username: $("#teacherUsername").val(),
        phoneNumber: $("#teacherPhone").val(),
        dateOfBirth: $("#teacherDOB").val(),
        subject: $("#teacherSubject").val(),
        schoolName: $("#teacherSchoolName").val(),
    }

    $.ajax({
        url: `${API_BASE_URL}/user/update`,
        method: "PUT",
        contentType: "application/json",
        data: JSON.stringify(profileDTO),
        beforeSend: setAuthHeader,
        success: (response) => {
            $("#profileModal").modal("hide")
            alert("Profile updated successfully")
            loadProfile()
        },
        error: (xhr) => {
            alert("Error updating profile: " + (xhr.responseJSON?.message || "Unknown error"))
        },
    })
}

function uploadProfilePicture() {
    const fileInput = $("#profilePictureInput")[0]
    if (!fileInput.files || !fileInput.files[0]) {
        alert("Please select an image to upload")
        return
    }

    const formData = new FormData()
    formData.append("file", fileInput.files[0])

    $.ajax({
        url: `${API_BASE_URL}/user/profile-picture`,
        method: "POST",
        data: formData,
        contentType: false,
        processData: false,
        beforeSend: setAuthHeader,
        success: (response) => {
            alert("Profile picture updated successfully")
        },
        error: (xhr) => {
            alert("Error uploading picture: " + (xhr.responseJSON?.message || "Unknown error"))
        },
    })
}

function deleteProfilePicture() {
    if (confirm("Are you sure you want to delete your profile picture?")) {
        $.ajax({
            url: `${API_BASE_URL}/user/profile-picture`,
            method: "DELETE",
            beforeSend: setAuthHeader,
            success: () => {
                $("#profilePicture").attr("src", "https://via.placeholder.com/150")
                alert("Profile picture deleted successfully")
            },
            error: (xhr) => {
                alert("Error deleting picture: " + (xhr.responseJSON?.message || "Unknown error"))
            },
        })
    }
}
