var jQuery = window.jQuery;
var $ = jQuery;
var Toastify = window.Toastify;

document.addEventListener("DOMContentLoaded", () => {
    if (checkToken()) {
        initializeApp();
    }
});

function checkToken() {
    const token = localStorage.getItem("token");
    if (!token) {
        console.error("No token found in localStorage");
        showToast("Authentication token not found. Please log in again.", "error");
        window.location.href = "login.html";
        return false;
    }
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) {
        console.error("Invalid token format:", token);
        localStorage.removeItem("token");
        showToast("Invalid authentication token. Please log in again.", "error");
        window.location.href = "login.html";
        return false;
    }
    return true;
}

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    if (token) {
        return { Authorization: "Bearer " + token };
    }
    return {};
}

function initializeApp() {
    console.log("Token validated, initializing application...");
    initSidebar();
    loadUserProfile();
    loadDashboardData();

    $("#sidebar a").click(function (e) {
        e.preventDefault();
        $("#sidebar a").removeClass("active");
        $(this).addClass("active");
        const section = $(this).attr("id").replace("Menu", "").toLowerCase();
        const sectionTitle = $(this).find("span").text();
        $("#section-title").text(sectionTitle);
        switch (section) {
            case "dashboard":
                loadDashboardData();
                break;
            case "exams":
                loadExams();
                break;
            case "logout":
                logout();
                break;
        }
    });

    $("#toggleSidebar").click(() => {
        $("#sidebar").toggleClass("show");
        $(".content").toggleClass("expanded");
    });

    $(".user-profile").click(() => {
        $("#userProfileModal").modal("show");
    });

    $("#addQuestionBtn").click(() => {
        const examId = $("#examId").val();
        addQuestion(examId);
    });

    $("#questionType").change(function () {
        const type = $(this).val();
        if (type === "MCQ") {
            $("#optionsField").show();
            $("#correctAnswerHelp").text("For MCQ, enter the option letter (e.g., A).");
        } else if (type === "TRUE_FALSE") {
            $("#optionsField").hide();
            $("#questionOptions").val("");
            $("#correctAnswerHelp").text('For True/False, enter "TRUE" or "FALSE".');
        } else {
            $("#optionsField").hide();
            $("#questionOptions").val("");
            $("#correctAnswerHelp").text("Enter the correct answer for this question.");
        }
    });

    $("#add-option-btn").click(() => {
        const optionsContainer = $("#options-container");
        const optionCount = optionsContainer.children().length;
        if (optionCount >= 6) {
            showToast("Maximum 6 options allowed", "warning");
            return;
        }
        const nextLabel = String.fromCharCode(65 + optionCount);
        const optionRow = `
            <div class="option-row">
                <span class="option-label">${nextLabel}</span>
                <input type="text" class="form-control option-input" data-key="${nextLabel}">
            </div>
        `;
        optionsContainer.append(optionRow);
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
                headers: { Authorization: "Bearer " + localStorage.getItem("token") },
                processData: false,
                contentType: false,
                data: formData,
                success: (response) => {
                    if (response.code === 200 && response.data) {
                        const profilePicture = response.data.profilePicture || 'assets/default-user.jpg';
                        $("#userProfileImage").attr('src', profilePicture);
                        $("#modalUserProfileImage").attr('src', profilePicture);
                        showToast('Profile picture updated successfully', "success");
                    } else {
                        showToast('Failed to update profile picture', "error");
                    }
                },
                error: (xhr) => {
                    showToast('Failed to update profile picture: ' + (xhr.responseJSON?.message || 'Unknown error'), "error");
                }
            });
        }
    });
}

function initSidebar() {
    if ($(window).width() < 1024) {
        $("#sidebar").addClass("collapsed");
        $(".content").addClass("expanded");
    }
}

function loadUserProfile() {
    $("#loading").show();
    ajaxWithRetry({
        url: "http://localhost:8080/api/v1/user/profile",
        type: "GET",
        headers: getAuthHeaders(),
        success: (response) => {
            if (response.code === 200) {
                const user = response.data;
                localStorage.setItem("userSubject", user.subject || "");
                localStorage.setItem("email", user.email);
                $("#userFullName").text(user.fullName || "Teacher");
                $("#userRole").text(user.role || "Teacher");
                $("#modalUserFullName").text(user.fullName || "Teacher");
                $("#modalUserRole").text(user.role || "Teacher");
                $("#modalUserEmail").text(user.email || "teacher@example.com");
                $("#modalUserPhone").text(user.phoneNumber || "Not provided");
                $("#modalUserDOB").text(user.dateOfBirth || "Not provided");
                $("#modalUserStatus").text(user.active ? "Active" : "Inactive");
                const profileImage = user.profilePicture || 'assets/default-user.jpg';
                $("#userProfileImage").attr('src', profileImage);
                $("#modalUserProfileImage").attr('src', profileImage);
                $("#loading").fadeOut(300);
            }
        },
        error: (xhr) => {
            if (xhr.status !== 401) {
                showToast(`Failed to load profile: ${xhr.statusText}`, "error");
            }
            $("#loading").fadeOut(300);
        }
    });
}

function loadDashboardData() {
    $("#dashboardContent").html(`
        <div class="row mb-4">
            <div class="col-md-12">
                <div class="section-header">
                    <h1 class="section-title fs-4" id="section-title">Teacher Dashboard</h1>
                </div>
                <p class="text-muted mb-4">Overview of your teaching activities</p>
            </div>
        </div>
        <div class="row mb-4" id="statsCards">
            <div class="col-md-3 col-sm-6 mb-4 mb-md-0">
                <div class="stat-card">
                    <div class="card-icon" style="background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <div class="card-value" id="totalExamCard">0</div>
                    <div class="card-label">Total Exams</div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-4 mb-md-0">
                <div class="stat-card">
                    <div class="card-icon" style="background: linear-gradient(135deg, #3f37c9 0%, #4cc9f0 100%);">
                        <i class="fas fa-user-graduate"></i>
                    </div>
                    <div class="card-value" id="totalStudentsCard">0</div>
                    <div class="card-label">Total Students</div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-4 mb-md-0">
                <div class="stat-card">
                    <div class="card-icon" style="background: linear-gradient(135deg, #8338ec 0%, #3a86ff 100%);">
                        <i class="fas fa-question-circle"></i>
                    </div>
                    <div class="card-value" id="totalQuestionsCard">0</div>
                    <div class="card-label">Total Questions</div>
                </div>
            </div>
        </div>
        <div class="recent-exams">
            <div class="section-header">
                <h2>Recent Exams</h2>
                <a href="#" id="examsMenu" class="view-all">View All</a>
            </div>
            <div id="recent-exams-list" class="exam-cards">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading exams...</p>
                </div>
            </div>
        </div>
    `);
    loadStats();
    loadRecentExams();
}

function loadStats() {
    ajaxWithRetry({
        url: "http://localhost:8080/api/v1/exam/teacher-exams",
        type: "GET",
        headers: getAuthHeaders(),
        success: (response) => {
            if (response.code === 200) {
                $("#totalExamCard").text(response.data.length);
                let totalQuestions = 0;
                response.data.forEach((exam) => {
                    if (exam.questionCount) {
                        totalQuestions += exam.questionCount;
                    }
                });
                $("#totalQuestionsCard").text(totalQuestions);
            }
        },
        error: (xhr) => {
            if (xhr.status !== 401) {
                showToast("Failed to load exam statistics", "error");
            }
        }
    });

    const subject = localStorage.getItem("userSubject");
    if (subject) {
        ajaxWithRetry({
            url: `http://localhost:8080/api/v1/exam/students-by-subject/${encodeURIComponent(subject)}`,
            type: "GET",
            headers: getAuthHeaders(),
            success: (response) => {
                if (response.code === 200) {
                    $("#totalStudentsCard").text(response.data.length);
                }
            },
            error: (xhr) => {
                if (xhr.status !== 401) {
                    console.error("Error loading student stats:", xhr);
                }
            }
        });
    }
}

function loadRecentExams() {
    ajaxWithRetry({
        url: "http://localhost:8080/api/v1/exam/teacher-exams",
        type: "GET",
        headers: getAuthHeaders(),
        success: (response) => {
            if (response.code === 200) {
                displayRecentExams(response.data.slice(0, 4));
            } else {
                $("#recent-exams-list").html(`<p class="text-danger">${response.message}</p>`);
            }
        },
        error: (xhr) => {
            if (xhr.status !== 401) {
                $("#recent-exams-list").html(`<p class="text-danger">${handleAjaxError(xhr)}</p>`);
            }
        }
    });
}

function displayRecentExams(exams) {
    if (exams.length === 0) {
        $("#recent-exams-list").html('<p class="text-muted">No exams found.</p>');
        return;
    }
    let html = "";
    exams.forEach((exam) => {
        html += `
            <div class="exam-card">
                <div class="exam-card-header">
                    <h3>${exam.title}</h3>
                </div>
                <div class="exam-card-body">
                    <div class="exam-info">
                        <div class="exam-info-item">
                            <i class="fas fa-book"></i>
                            <span>${exam.subject || "N/A"}</span>
                        </div>
                        <div class="exam-info-item">
                            <i class="fas fa-graduation-cap"></i>
                            <span>Grade: ${exam.grade || "N/A"}</span>
                        </div>
                        <div class="exam-info-item">
                            <i class="fas fa-clock"></i>
                            <span>${exam.duration || "N/A"} minutes</span>
                        </div>
                        <div class="exam-info-item">
                            <i class="fas fa-question-circle"></i>
                            <span>${exam.questionCount || 0} Questions</span>
                        </div>
                    </div>
                    <div class="exam-card-actions">
                        <button class="view-btn btn btn-sm btn-outline-primary" onclick="viewExamDetails(${exam.id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="add-btn btn btn-sm btn-outline-success" onclick="showAddQuestionModal(${exam.id})">
                            <i class="fas fa-plus"></i> Add Question
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    $("#recent-exams-list").html(html);
}

function loadExams() {
    $("#dashboardContent").html(`
        <div class="row mb-4">
            <div class="col-md-12">
                <div class="section-header">
                    <h1 class="section-title fs-4" id="section-title">Exams</h1>
                </div>
                <p class="text-muted mb-4">Manage your exams</p>
            </div>
        </div>
        <div id="exams-list" class="exam-cards">
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading exams...</p>
            </div>
        </div>
    `);
    ajaxWithRetry({
        url: "http://localhost:8080/api/v1/exam/teacher-exams",
        type: "GET",
        headers: getAuthHeaders(),
        success: (response) => {
            if (response.code === 200) {
                displayExams(response.data);
            } else {
                $("#exams-list").html(`<p class="text-danger">${response.message}</p>`);
            }
        },
        error: (xhr) => {
            if (xhr.status !== 401) {
                $("#exams-list").html(`<p class="text-danger">${handleAjaxError(xhr)}</p>`);
            }
        }
    });
}

function displayExams(exams) {
    let html = "";
    if (exams.length === 0) {
        html = '<p class="text-muted">No exams found for your subject.</p>';
    } else {
        exams.forEach((exam) => {
            html += `
                <div class="exam-card">
                    <div class="exam-card-header">
                        <h3>${exam.title}</h3>
                    </div>
                    <div class="exam-card-body">
                        <div class="exam-info">
                            <div class="exam-info-item">
                                <i class="fas fa-book"></i>
                                <span>${exam.subject || "N/A"}</span>
                            </div>
                            <div class="exam-info-item">
                                <i class="fas fa-graduation-cap"></i>
                                <span>Grade: ${exam.grade || "N/A"}</span>
                            </div>
                            <div class="exam-info-item">
                                <i class="fas fa-clock"></i>
                                <span>${exam.duration || "N/A"} minutes</span>
                            </div>
                            <div class="exam-info-item">
                                <i class="fas fa-question-circle"></i>
                                <span>${exam.questionCount || 0} Questions</span>
                            </div>
                        </div>
                        <div class="exam-card-actions">
                            <button class="view-btn btn btn-sm btn-outline-primary" onclick="viewExamDetails(${exam.id})">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="add-btn btn btn-sm btn-outline-success" onclick="showAddQuestionModal(${exam.id})">
                                <i class="fas fa-plus"></i> Add Question
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    $("#exams-list").html(html);
}

function viewExamDetails(examId) {
    ajaxWithRetry({
        url: `http://localhost:8080/api/v1/exam/${examId}`,
        type: "GET",
        headers: getAuthHeaders(),
        success: (response) => {
            if (response.code === 200) {
                const exam = response.data;
                ajaxWithRetry({
                    url: `http://localhost:8080/api/v1/exam/${examId}/questions`,
                    type: "GET",
                    headers: getAuthHeaders(),
                    success: (questionsResponse) => {
                        if (questionsResponse.code === 200) {
                            displayExamDetails(exam, questionsResponse.data);
                        } else {
                            displayExamDetails(exam, []);
                        }
                    },
                    error: () => {
                        displayExamDetails(exam, []);
                    }
                });
            } else {
                showToast("Error loading exam details", "error");
            }
        },
        error: (xhr) => {
            showToast(handleAjaxError(xhr), "error");
        }
    });
}

function displayExamDetails(exam, questions) {
    let html = `
        <div class="modal fade" id="viewExamModal" tabindex="-1" aria-labelledby="viewExamModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="viewExamModalLabel">${exam.title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="examDetailsContent">
                        <div class="exam-details-header">
                            <h2>${exam.title}</h2>
                            <p>${exam.subject || "N/A"} | Grade: ${exam.grade || "N/A"}</p>
                        </div>
                        <div class="exam-details-info">
                            <div class="exam-details-item">
                                <h4>Duration</h4>
                                <p>${exam.duration || "N/A"} minutes</p>
                            </div>
                            <div class="exam-details-item">
                                <h4>Total Questions</h4>
                                <p>${questions.length}</p>
                            </div>
                            <div class="exam-details-item">
                                <h4>Passing Score</h4>
                                <p>${exam.passingScore || "N/A"}%</p>
                            </div>
                            <div class="exam-details-item">
                                <h4>Status</h4>
                                <p>${exam.status || "Active"}</p>
                            </div>
                        </div>
                        <div class="exam-details-actions">
                            <button class="btn btn-primary" onclick="showAddQuestionModal(${exam.id})">
                                <i class="fas fa-plus"></i> Add Question
                            </button>
                        </div>
                        <h3 class="text-xl font-bold mt-4 mb-3">Questions</h3>
    `;
    if (questions.length === 0) {
        html += '<p class="text-muted">No questions added to this exam yet.</p>';
    } else {
        html += '<div class="question-list">';
        questions.forEach((q, index) => {
            const questionType = q.type || "MCQ";
            let typeClass = "";
            switch (questionType) {
                case "MCQ": typeClass = "mcq"; break;
                case "TRUE_FALSE": typeClass = "true-false"; break;
                case "SHORT_ANSWER": typeClass = "short-answer"; break;
                case "ESSAY": typeClass = "essay"; break;
                default: typeClass = "mcq";
            }
            html += `
                <div class="question-item">
                    <div class="question-header">
                        <span class="question-type ${typeClass}">${questionType}</span>
                        <span>Question ${index + 1}</span>
                    </div>
                    <div class="question-content">
                        <div class="question-text">${q.content}</div>`;
            if (questionType === "MCQ" && q.options) {
                html += '<div class="question-options">';
                try {
                    const options = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
                    Object.entries(options).forEach(([key, value]) => {
                        const isCorrect = q.correctAnswer === key;
                        html += `
                            <div class="option-item ${isCorrect ? "correct" : ""}">
                                <span class="option-label">${key}</span>
                                <div class="option-text">${value}</div>
                            </div>
                        `;
                    });
                } catch (e) {
                    html += `<p class="text-danger">Error parsing options: ${e.message}</p>`;
                }
                html += "</div>";
            }
            html += `
                        <div class="correct-answer">
                            <strong>Correct Answer:</strong> ${q.correctAnswer}
                        </div>
                    </div>
                </div>
            `;
        });
        html += "</div>";
    }
    html += `
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    $("#dashboardContent").append(html);
    $("#viewExamModal").modal("show");
}

function showAddQuestionModal(examId) {
    $("#examId").val(examId);
    $("#questionType").val("MCQ");
    $("#questionContent").val("");
    $("#correctAnswer").val("");
    $("#options-container").html(`
        <div class="option-row">
            <span class="option-label">A</span>
            <input type="text" class="form-control option-input" data-key="A">
        </div>
        <div class="option-row">
            <span class="option-label">B</span>
            <input type="text" class="form-control option-input" data-key="B">
        </div>
        <div class="option-row">
            <span class="option-label">C</span>
            <input type="text" class="form-control option-input" data-key="C">
        </div>
        <div class="option-row">
            <span class="option-label">D</span>
            <input type="text" class="form-control option-input" data-key="D">
        </div>
    `);
    $("#optionsField").show();
    $("#correctAnswerHelp").text("For MCQ, enter the option letter (e.g., A).");
    $("#addQuestionModal").modal("show");
}

function addQuestion(examId) {
    const type = $("#questionType").val();
    const content = $("#questionContent").val();
    const correctAnswer = $("#correctAnswer").val();
    if (!type || !content || !correctAnswer) {
        showToast("Please fill all required fields", "error");
        return;
    }
    let options = null;
    if (type === "MCQ") {
        const optionsObj = {};
        $(".option-input").each(function () {
            const key = $(this).data("key");
            const value = $(this).val().trim();
            if (value) {
                optionsObj[key] = value;
            }
        });
        if (Object.keys(optionsObj).length < 2) {
            showToast("MCQ questions must have at least 2 options", "error");
            return;
        }
        if (!optionsObj[correctAnswer]) {
            showToast("Correct answer must match one of the option keys", "error");
            return;
        }
        options = JSON.stringify(optionsObj);
    }
    const questionDTO = {
        examId: Number.parseInt(examId),
        type: type,
        content: content,
        correctAnswer: correctAnswer,
        options: options
    };
    ajaxWithRetry({
        url: "http://localhost:8080/api/v1/exam/questions",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(questionDTO),
        headers: getAuthHeaders(),
        success: (response) => {
            if (response.code === 201) {
                showToast("Question added successfully", "success");
                $("#addQuestionModal").modal("hide");
                if ($("#viewExamModal").hasClass("show")) {
                    viewExamDetails(examId);
                }
            } else {
                showToast(response.message, "error");
            }
        },
        error: (xhr) => {
            showToast("Error adding question: " + (xhr.responseJSON?.message || "Unknown error"), "error");
        }
    });
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userSubject");
    localStorage.removeItem("email");
    window.location.href = "login.html";
}

function handleAjaxError(xhr) {
    let message = "An error occurred";
    if (xhr.status === 403) {
        message = "Forbidden: You do not have permission.";
    } else if (xhr.status === 404) {
        message = "Resource not found.";
    } else {
        message = xhr.responseJSON?.message || "Server error.";
    }
    return message;
}

function showToast(message, type = "info") {
    const bgColor = type === "success" ? "#10b981" : type === "error" ? "#ef4444" : type === "warning" ? "#f59e0b" : "#3b82f6";
    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        backgroundColor: bgColor,
        stopOnFocus: true
    }).showToast();
}

function ajaxWithRetry(options, retries = 2, delay = 1000) {
    const ajaxOptions = { ...options };
    const originalErrorCallback = ajaxOptions.error;
    ajaxOptions.error = (xhr, textStatus, errorThrown) => {
        console.log(`AJAX request failed: ${textStatus}, Status: ${xhr.status}`);
        if (retries > 0 && xhr.status !== 401) {
            console.log(`Retrying... (${retries} attempts left)`);
            setTimeout(() => {
                ajaxWithRetry(options, retries - 1, delay * 1.5);
            }, delay);
        } else {
            console.error("All retry attempts failed or 401 error");
            if (xhr.status === 401) {
                localStorage.removeItem("token");
                showToast("Session expired. Please log in again.", "error");
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1000);
            }
            if (originalErrorCallback) {
                originalErrorCallback(xhr, textStatus, errorThrown);
            }
        }
    };
    if (!ajaxOptions.timeout) {
        ajaxOptions.timeout = 15000;
    }
    $.ajax(ajaxOptions);
}

window.viewExamDetails = viewExamDetails;
window.showAddQuestionModal = showAddQuestionModal;