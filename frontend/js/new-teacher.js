var jQuery = window.jQuery
var $ = jQuery
var Toastify = window.Toastify

// Function to check if the token exists and is in the correct format
function checkToken() {
    const token = localStorage.getItem("token")
    console.log("Retrieved token from localStorage:", token)

    if (!token) {
        console.error("No token found in localStorage")
        showToast("Authentication token not found. Please log in again.", "error")
        window.location.href = "login.html"
        return false
    }

    // Validate token format (simple check for three parts)
    const tokenParts = token.split(".")
    if (tokenParts.length !== 3) {
        console.error("Invalid token format:", token)
        localStorage.removeItem("token")
        showToast("Invalid authentication token. Please log in again.", "error")
        window.location.href = "login.html"
        return false
    }

    return true
}

// Function to get authentication headers
function getAuthHeaders() {
    const token = localStorage.getItem("token")
    if (token) {
        return {Authorization: "Bearer " + token}
    } else {
        return {}
    }
}

// Wait for document to be fully loaded and jQuery to be available
document.addEventListener("DOMContentLoaded", () => {
    // Check if jQuery is loaded
    if (typeof jQuery === "undefined") {
        console.error("jQuery is not loaded! AJAX functionality will not work.")
        alert("Error: jQuery is not loaded. Please check your internet connection and reload the page.")
        return
    }

    // Set up global AJAX error handler for 401 Unauthorized
    $(document).ajaxError(function (event, jqXHR, ajaxSettings, thrownError) {
        if (jqXHR.status === 401) {
            localStorage.removeItem('token')
            showToast("Session expired. Please log in again.", "error")
            setTimeout(() => {
                window.location.href = 'login.html'
            }, 1000)
        }
    })

    // Initialize the application only if token is valid
    if (checkToken()) {
        initializeApp()
    }
})

function initializeApp() {
    console.log("Token validated, initializing application...")

    // Initialize sidebar toggle
    initSidebar()

    // Load user profile
    loadUserProfile()

    // Load dashboard data
    loadDashboardData()

    // Navigation event handlers
    $("nav a").click(function (e) {
        e.preventDefault()

        // Update active state
        $("nav a").removeClass("active")
        $(this).addClass("active")

        // Update page title and breadcrumb
        const section = $(this).attr("href").substring(1)
        const sectionTitle = $(this).find("span").text()
        $("#page-title").text(sectionTitle)
        $("#breadcrumb-current").text(sectionTitle)

        // Load content based on section
        switch (section) {
            case "dashboard":
                loadDashboardData()
                break
            case "exams":
                loadExams()
                break
            case "grading":
                loadGrading()
                break
            case "students":
                loadStudents()
                break
        }
    })

    // Profile modal trigger
    $("#profile-trigger").click(() => {
        $("#profileModal").modal("show")
    })

    // Add question button event
    $("#addQuestionBtn").click(() => {
        const examId = $("#examId").val()
        addQuestion(examId)
    })

    // Question type change event
    $("#questionType").change(function () {
        const type = $(this).val()
        if (type === "MCQ") {
            $("#optionsField").show()
            $("#correctAnswerHelp").text("For MCQ, enter the option letter (e.g., A).")
        } else if (type === "TRUE_FALSE") {
            $("#optionsField").hide()
            $("#questionOptions").val("")
            $("#correctAnswerHelp").text('For True/False, enter "TRUE" or "FALSE".')
        } else {
            $("#optionsField").hide()
            $("#questionOptions").val("")
            $("#correctAnswerHelp").text("Enter the correct answer for this question.")
        }
    })

    // Add option button event
    $("#add-option-btn").click(() => {
        const optionsContainer = $("#options-container")
        const optionCount = optionsContainer.children().length

        if (optionCount >= 6) {
            showToast("Maximum 6 options allowed", "warning")
            return
        }

        const nextLabel = String.fromCharCode(65 + optionCount) // A, B, C, ...

        const optionRow = `
            <div class="option-row">
                <span class="option-label">${nextLabel}</span>
                <input type="text" class="form-control option-input" data-key="${nextLabel}">
            </div>
        `

        optionsContainer.append(optionRow)
    })

    // Logout button event
    $("#logout-btn").click((e) => {
        e.preventDefault()
        localStorage.removeItem("token")
        localStorage.removeItem("userSubject")
        window.location.href = "login.html"
    })
}

// Initialize sidebar
function initSidebar() {
    $("#sidebar-toggle").click(() => {
        $(".sidebar").toggleClass("collapsed expanded")
        $(".main-content").toggleClass("expanded")
    })

    // Auto-collapse sidebar on small screens
    if ($(window).width() < 1024) {
        $(".sidebar").addClass("collapsed")
        $(".main-content").addClass("expanded")
    }
}

function loadUserProfile() {
    ajaxWithRetry({
        url: "http://localhost:8080/api/v1/user/profile", // Changed from /auth/profile
        type: "GET",
        headers: getAuthHeaders(),
        success: (response) => {
            if (response.code === 200) {
                const user = response.data;
                localStorage.setItem("userSubject", user.subject || "");
                $("#sidebar-username").text(user.fullName || "Teacher");
                $("#sidebar-subject").text(user.subject || "Subject");
                $("#header-username").text(user.fullName || "Teacher");
                $("#modal-name").text(user.fullName || "Teacher");
                $("#modal-email").text(user.email || "teacher@example.com");
                $("#modal-subject").text(user.subject || "Subject");
                $("#modal-role").text(user.role || "Teacher");
                if (user.profilePicture) {
                    $("#sidebar-profile-img").attr("src", user.profilePicture);
                    $("#header-profile-img").attr("src", user.profilePicture);
                    $("#modal-profile-img").attr("src", user.profilePicture);
                }
            }
        },
        error: (xhr) => {
            if (xhr.status !== 401) {
                showToast(`Failed to load profile: ${xhr.status === 404 ? "Profile endpoint not found" : "Server error"}`, "error");
            }
        },
    });
}

// Load dashboard data
function loadDashboardData() {
    $("#content").html(`
        <div class="dashboard-stats">
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-file-alt"></i>
                </div>
                <div class="stat-info">
                    <h3>Total Exams</h3>
                    <p id="total-exams">0</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-question-circle"></i>
                </div>
                <div class="stat-info">
                    <h3>Total Questions</h3>
                    <p id="total-questions">0</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-user-graduate"></i>
                </div>
                <div class="stat-info">
                    <h3>Students</h3>
                    <p id="total-students">0</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-check-square"></i>
                </div>
                <div class="stat-info">
                    <h3>Pending Grades</h3>
                    <p id="pending-grades">0</p>
                </div>
            </div>
        </div>
        
        <div class="dashboard-content">
            <div class="recent-exams">
                <div class="section-header">
                    <h2>Recent Exams</h2>
                    <a href="#exams" class="view-all">View All</a>
                </div>
                <div id="recent-exams-list" class="exam-cards">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading exams...</p>
                    </div>
                </div>
            </div>
            
            <div class="pending-grading">
                <div class="section-header">
                    <h2>Pending Grading</h2>
                    <a href="#grading" class="view-all">View All</a>
                </div>
                <div id="pending-grading-list" class="grading-list">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading answers to grade...</p>
                    </div>
                </div>
            </div>
        </div>
    `)

    // Load exams for dashboard
    loadRecentExams()

    // Load pending grading for dashboard
    loadPendingGrading()

    // Load stats
    loadStats()
}

// Load stats for dashboard
function loadStats() {
    // Load total exams
    ajaxWithRetry({
        url: "http://localhost:8080/api/v1/exam/teacher-exams",
        type: "GET",
        headers: getAuthHeaders(),
        success: (response) => {
            if (response.code === 200) {
                $("#total-exams").text(response.data.length)

                // Count total questions across all exams
                let totalQuestions = 0
                response.data.forEach((exam) => {
                    if (exam.questionCount) {
                        totalQuestions += exam.questionCount
                    }
                })
                $("#total-questions").text(totalQuestions)
            }
        },
        error: (xhr) => {
            if (xhr.status !== 401) {
                showToast("Failed to load exam statistics", "error")
            }
        },
    })

    // Load total students
    const subject = localStorage.getItem("userSubject")
    if (subject) {
        ajaxWithRetry({
            url: `http://localhost:8080/api/v1/exam/students-by-subject/${encodeURIComponent(subject)}`,
            type: "GET",
            headers: getAuthHeaders(),
            success: (response) => {
                if (response.code === 200) {
                    $("#total-students").text(response.data.length)
                }
            },
            error: (xhr) => {
                if (xhr.status !== 401) {
                    console.error("Error loading student stats:", xhr)
                }
            },
        })
    }

    // Load pending grades
    ajaxWithRetry({
        url: "http://localhost:8080/api/v1/exam/answers-to-grade",
        type: "GET",
        headers: getAuthHeaders(),
        success: (response) => {
            if (response.code === 200) {
                $("#pending-grades").text(response.data.length)
            }
        },
        error: (xhr) => {
            if (xhr.status !== 401) {
                console.error("Error loading grading stats:", xhr)
            }
        },
    })
}

// Load recent exams for dashboard
function loadRecentExams() {
    ajaxWithRetry({
        url: "http://localhost:8080/api/v1/exam/teacher-exams",
        type: "GET",
        headers: getAuthHeaders(),
        success: (response) => {
            if (response.code === 200) {
                displayRecentExams(response.data.slice(0, 4)) // Show only 4 most recent
            } else {
                $("#recent-exams-list").html(`<p class="text-red-500">${response.message}</p>`)
            }
        },
        error: (xhr) => {
            if (xhr.status !== 401) {
                $("#recent-exams-list").html(`<p class="text-red-500">${handleAjaxError(xhr)}</p>`)
            }
        },
    })
}

// Display recent exams in dashboard
function displayRecentExams(exams) {
    if (exams.length === 0) {
        $("#recent-exams-list").html('<p class="text-gray-500">No exams found.</p>')
        return
    }

    let html = ""
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
                        <button class="view-btn" onclick="viewExamDetails(${exam.id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="add-btn" onclick="showAddQuestionModal(${exam.id})">
                            <i class="fas fa-plus"></i> Add Question
                        </button>
                    </div>
                </div>
            </div>
        `
    })

    $("#recent-exams-list").html(html)
}

function loadPendingGrading() {
    ajaxWithRetry({
        url: "http://localhost:8080/api/v1/exam/answers-to-grade",
        type: "GET",
        headers: getAuthHeaders(),
        success: (response) => {
            if (response.code === 200) {
                displayPendingGrading(response.data.slice(0, 3));
            } else {
                $("#pending-grading-list").html(`<p class="text-red-500">${response.message}</p>`);
            }
        },
        error: (xhr) => {
            if (xhr.status !== 401) {
                showToast(`Failed to load grading: ${xhr.status === 405 ? "Method not supported" : xhr.status === 404 ? "Endpoint not found" : "Server error"}`, "error");
                $("#pending-grading-list").html('<p class="text-red-500">Unable to load answers to grade.</p>');
            }
        },
    });
}

// Display pending grading in dashboard
function displayPendingGrading(answers) {
    if (answers.length === 0) {
        $("#pending-grading-list").html('<p class="text-gray-500">No answers to grade.</p>')
        return
    }

    let html = ""
    answers.forEach((a) => {
        html += `
            <div class="grading-item">
                <div class="grading-header">
                    <h4>Exam: ${a.examTitle || "Unknown"}</h4>
                    <span class="student-info">${a.studentName || "Unknown Student"}</span>
                </div>
                <div class="grading-content">
                    <p class="question">${a.questionContent || "N/A"}</p>
                    <p class="answer">${a.studentAnswer}</p>
                </div>
                <div class="grading-actions">
                    <input type="number" id="score-${a.id}" class="form-control" min="0" max="100" placeholder="Score">
                    <button onclick="gradeAnswer(${a.id})">Grade</button>
                </div>
            </div>
        `
    })

    $("#pending-grading-list").html(html)
}

function loadExams() {
    $("#content").html(`
        <h2 class="text-2xl font-bold mb-4">Your Subject Exams</h2>
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading exams...</p>
        </div>
    `)

    ajaxWithRetry({
        url: "http://localhost:8080/api/v1/exam/teacher-exams",
        type: "GET",
        headers: getAuthHeaders(),
        success: (response) => {
            if (response.code === 200) {
                displayExams(response.data)
            } else {
                $("#content").html(`<p class="text-red-500">${response.message}</p>`)
            }
        },
        error: (xhr) => {
            if (xhr.status !== 401) {
                $("#content").html(`<p class="text-red-500">${handleAjaxError(xhr)}</p>`)
            }
        },
    })
}

// Display all exams
function displayExams(exams) {
    let html = '<h2 class="text-2xl font-bold mb-4">Your Subject Exams</h2>'

    if (exams.length === 0) {
        html += '<p class="text-gray-500">No exams found for your subject.</p>'
        $("#content").html(html)
        return
    }

    html += '<div class="exam-cards">'

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
                        <button class="view-btn" onclick="viewExamDetails(${exam.id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="add-btn" onclick="showAddQuestionModal(${exam.id})">
                            <i class="fas fa-plus"></i> Add Question
                        </button>
                    </div>
                </div>
            </div>
        `
    })

    html += "</div>"
    $("#content").html(html)
}

// View exam details and questions
function viewExamDetails(examId) {
    ajaxWithRetry({
        url: `http://localhost:8080/api/v1/exam/${examId}`,
        type: "GET",
        headers: getAuthHeaders(),
        success: (response) => {
            if (response.code === 200) {
                const exam = response.data

                // Load questions for this exam
                ajaxWithRetry({
                    url: `http://localhost:8080/api/v1/exam/${examId}/questions`,
                    type: "GET",
                    headers: getAuthHeaders(),
                    success: (questionsResponse) => {
                        if (questionsResponse.code === 200) {
                            displayExamDetails(exam, questionsResponse.data)
                        } else {
                            displayExamDetails(exam, [])
                        }
                    },
                    error: () => {
                        displayExamDetails(exam, [])
                    },
                })
            } else {
                showToast("Error loading exam details", "error")
            }
        },
        error: (xhr) => {
            showToast(handleAjaxError(xhr), "error")
        },
    })
}

// Display exam details in modal
function displayExamDetails(exam, questions) {
    let html = `
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
    `

    // Display questions
    html += '<h3 class="text-xl font-bold mt-4 mb-3">Questions</h3>'

    if (questions.length === 0) {
        html += '<p class="text-gray-500">No questions added to this exam yet.</p>'
    } else {
        html += '<div class="question-list">'

        questions.forEach((q, index) => {
            const questionType = q.type || "MCQ"
            let typeClass = ""

            switch (questionType) {
                case "MCQ":
                    typeClass = "mcq"
                    break
                case "TRUE_FALSE":
                    typeClass = "true-false"
                    break
                case "SHORT_ANSWER":
                    typeClass = "short-answer"
                    break
                case "ESSAY":
                    typeClass = "essay"
                    break
                default:
                    typeClass = "mcq"
            }

            html += `
                <div class="question-item">
                    <div class="question-header">
                        <span class="question-type ${typeClass}">${questionType}</span>
                        <span>Question ${index + 1}</span>
                    </div>
                    <div class="question-content">
                        <div class="question-text">${q.content}</div>`

            // Display options for MCQ
            if (questionType === "MCQ" && q.options) {
                html += '<div class="question-options">'

                try {
                    const options = typeof q.options === "string" ? JSON.parse(q.options) : q.options

                    Object.entries(options).forEach(([key, value]) => {
                        const isCorrect = q.correctAnswer === key
                        html += `
                            <div class="option-item ${isCorrect ? "correct" : ""}">
                                <span class="option-label">${key}</span>
                                <div class="option-text">${value}</div>
                            </div>
                        `
                    })
                } catch (e) {
                    html += `<p class="text-red-500">Error parsing options: ${e.message}</p>`
                }

                html += "</div>"
            }

            // Display correct answer
            html += `<div class="correct-answer">
                        <strong>Correct Answer:</strong> ${q.correctAnswer}
                    </div>`

            html += `</div>
                </div>
            `
        })

        html += "</div>"
    }

    // Update modal content and show
    $("#examDetailsContent").html(html)
    $("#viewExamModal").modal("show")
}

// Show add question modal
function showAddQuestionModal(examId) {
    $("#examId").val(examId)
    $("#questionType").val("MCQ")
    $("#questionContent").val("")
    $("#correctAnswer").val("")

    // Reset options
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
    `)

    $("#optionsField").show()
    $("#correctAnswerHelp").text("For MCQ, enter the option letter (e.g., A).")

    $("#addQuestionModal").modal("show")
}

// Add question to exam
function addQuestion(examId) {
    const type = $("#questionType").val()
    const content = $("#questionContent").val()
    const correctAnswer = $("#correctAnswer").val()

    if (!type || !content || !correctAnswer) {
        showToast("Please fill all required fields", "error")
        return
    }

    let options = null

    if (type === "MCQ") {
        // Build options object from inputs
        const optionsObj = {}
        $(".option-input").each(function () {
            const key = $(this).data("key")
            const value = $(this).val().trim()

            if (value) {
                optionsObj[key] = value
            }
        })

        // Check if we have at least 2 options
        if (Object.keys(optionsObj).length < 2) {
            showToast("MCQ questions must have at least 2 options", "error")
            return
        }

        // Check if correct answer is one of the options
        if (!optionsObj[correctAnswer]) {
            showToast("Correct answer must match one of the option keys", "error")
            return
        }

        options = JSON.stringify(optionsObj)
    }

    const questionDTO = {
        examId: Number.parseInt(examId),
        type: type,
        content: content,
        correctAnswer: correctAnswer,
        options: options,
    }

    ajaxWithRetry({
        url: "http://localhost:8080/api/v1/exam/questions",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(questionDTO),
        headers: getAuthHeaders(),
        success: (response) => {
            if (response.code === 201) {
                showToast("Question added successfully", "success")
                $("#addQuestionModal").modal("hide")

                // Refresh questions if viewing exam details
                if ($("#viewExamModal").hasClass("show")) {
                    viewExamDetails(examId)
                }
            } else {
                showToast(response.message, "error")
            }
        },
        error: (xhr) => {
            showToast("Error adding question: " + (xhr.responseJSON?.message || "Unknown error"), "error")
        },
    })
}

// Load grading page
function loadGrading() {
    $("#content").html(`
        <h2 class="text-2xl font-bold mb-4">Answers to Grade</h2>
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading answers to grade...</p>
        </div>
    `)

    ajaxWithRetry({
        url: "http://localhost:8080/api/v1/exam/answers-to-grade",
        type: "GET",
        headers: getAuthHeaders(),
        success: (response) => {
            if (response.code === 200) {
                displayGrading(response.data)
            } else {
                $("#content").html(`<p class="text-red-500">${response.message}</p>`)
            }
        },
        error: (xhr) => {
            if (xhr.status !== 401) {
                $("#content").html(`<p class="text-red-500">${handleAjaxError(xhr)}</p>`)
            }
        },
    })
}

// Display grading page
function displayGrading(answers) {
    let html = '<h2 class="text-2xl font-bold mb-4">Answers to Grade</h2>'

    if (answers.length === 0) {
        html += '<p class="text-gray-500">No answers to grade.</p>'
        $("#content").html(html)
        return
    }

    html += '<div class="grading-list">'

    answers.forEach((a) => {
        html += `
            <div class="grading-item">
                <div class="grading-header">
                    <h4>Exam: ${a.examTitle || "Unknown"}</h4>
                    <span class="student-info">${a.studentName || "Unknown Student"}</span>
                </div>
                <div class="grading-content">
                    <p class="question">${a.questionContent || "N/A"}</p>
                    <p class="answer">${a.studentAnswer}</p>
                </div>
                <div class="grading-actions">
                    <input type="number" id="score-${a.id}" class="form-control" min="0" max="100" placeholder="Score">
                    <button onclick="gradeAnswer(${a.id})">Grade</button>
                </div>
            </div>
        `
    })

    html += "</div>"
    $("#content").html(html)
}

// Grade an answer
function gradeAnswer(answerId) {
    const score = $(`#score-${answerId}`).val()

    if (!score || score < 0 || score > 100) {
        showToast("Please enter a valid score between 0 and 100", "error")
        return
    }

    ajaxWithRetry({
        url: `http://localhost:8080/api/v1/exam/answers/${answerId}/grade`,
        type: "POST",
        data: {score: Number.parseInt(score)},
        headers: getAuthHeaders(),
        success: (response) => {
            if (response.code === 200) {
                showToast("Answer graded successfully", "success")

                // Refresh grading list
                if ($("#breadcrumb-current").text() === "Grading") {
                    loadGrading()
                } else {
                    // If on dashboard, refresh pending grading
                    loadPendingGrading()
                    loadStats()
                }
            } else {
                showToast(response.message, "error")
            }
        },
        error: (xhr) => {
            showToast(handleAjaxError(xhr), "error")
        },
    })
}

// Load students page
function loadStudents() {
    const subject = localStorage.getItem("userSubject")

    if (!subject) {
        $("#content").html('<p class="text-red-500">Subject not set. Please contact admin.</p>')
        return
    }

    $("#content").html(`
        <h2 class="text-2xl font-bold mb-4">Students in ${subject}</h2>
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading students...</p>
        </div>
    `)

    ajaxWithRetry({
        url: `http://localhost:8080/api/v1/exam/students-by-subject/${encodeURIComponent(subject)}`,
        type: "GET",
        headers: getAuthHeaders(),
        success: (response) => {
            if (response.code === 200) {
                displayStudents(response.data)
            } else {
                $("#content").html(`<p class="text-red-500">${response.message}</p>`)
            }
        },
        error: (xhr) => {
            if (xhr.status !== 401) {
                $("#content").html(`<p class="text-red-500">${handleAjaxError(xhr)}</p>`)
            }
        },
    })
}

// Display students page
function displayStudents(students) {
    const subject = localStorage.getItem("userSubject")
    let html = `<h2 class="text-2xl font-bold mb-4">Students in ${subject}</h2>`

    if (students.length === 0) {
        html += '<p class="text-gray-500">No students found.</p>'
        $("#content").html(html)
        return
    }

    html += `
        <div class="overflow-x-auto">
            <table class="w-full border-collapse">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="p-3 text-left">Name</th>
                        <th class="p-3 text-left">Email</th>
                        <th class="p-3 text-left">Grade</th>
                        <th class="p-3 text-left">Status</th>
                    </tr>
                </thead>
                <tbody>
    `

    students.forEach((s) => {
        html += `
            <tr class="border-b border-gray-200 hover:bg-gray-50">
                <td class="p-3">${s.fullName || "Unknown"}</td>
                <td class="p-3">${s.email}</td>
                <td class="p-3">${s.grade || "-"}</td>
                <td class="p-3">
                    <span class="px-2 py-1 rounded-full text-xs ${s.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}">
                        ${s.active ? "Active" : "Inactive"}
                    </span>
                </td>
            </tr>
        `
    })

    html += "</tbody></table></div>"
    $("#content").html(html)
}

// Helper functions
function handleAjaxError(xhr) {
    let message = "An error occurred"

    if (xhr.status === 403) {
        message = "Forbidden: You do not have permission."
    } else if (xhr.status === 404) {
        message = "Resource not found."
    } else {
        message = xhr.responseJSON?.message || "Server error."
    }

    return message
}

function showToast(message, type = "info") {
    const bgColor =
        type === "success" ? "#10b981" : type === "error" ? "#ef4444" : type === "warning" ? "#f59e0b" : "#3b82f6"

    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        backgroundColor: bgColor,
        stopOnFocus: true,
    }).showToast()
}

// Enhanced AJAX function with retry capability
function ajaxWithRetry(options, retries = 2, delay = 1000) {
    // Clone the options to avoid modifying the original
    const ajaxOptions = {...options}

    // Store the original error callback
    const originalErrorCallback = ajaxOptions.error

    // Replace with our own error handler that implements retry logic
    ajaxOptions.error = (xhr, textStatus, errorThrown) => {
        console.log(`AJAX request failed: ${textStatus}, Status: ${xhr.status}`)

        if (retries > 0 && xhr.status !== 401) { // Don't retry on 401
            console.log(`Retrying... (${retries} attempts left)`)
            setTimeout(() => {
                ajaxWithRetry(options, retries - 1, delay * 1.5)
            }, delay)
        } else {
            console.error("All retry attempts failed or 401 error")
            // Call the original error callback if provided
            if (originalErrorCallback) {
                originalErrorCallback(xhr, textStatus, errorThrown)
            }
        }
    }

    // Add timeout to prevent hanging requests
    if (!ajaxOptions.timeout) {
        ajaxOptions.timeout = 15000 // 15 seconds
    }

    // Execute the AJAX request
    $.ajax(ajaxOptions)
}

// Make functions available globally
window.viewExamDetails = viewExamDetails
window.showAddQuestionModal = showAddQuestionModal
window.gradeAnswer = gradeAnswer