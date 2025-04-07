$(document).ready(function () {
    const token = localStorage.getItem('token'); // Assuming token is stored in localStorage after login
    let currentQuestionIndex = 0;
    let questions = [];
    let answers = [];
    let studentExamId = null;
    let timerInterval;
    let lowTimeThreshold = 60; // 60 seconds threshold for time warning

    // Add sidebar toggle for responsive design
    $('.main-content').prepend('<button class="sidebar-toggle"><i class="fas fa-bars"></i></button>');

    $('.sidebar-toggle').on('click', function() {
        $('.sidebar').toggleClass('show');
        $('.main-content').toggleClass('sidebar-active');
    });

    // Handle modal close to clean up timer
    $('#examModal').on('hidden.bs.modal', function () {
        if (timerInterval) {
            clearInterval(timerInterval);
        }
    });

    // Add event listener for cancel button
    $('#cancel-exam').on('click', function() {
        if (confirm('Are you sure you want to cancel this exam? Your progress will not be saved.')) {
            clearInterval(timerInterval);
            resetExam();
        }
    });

    // Function to reset exam state
    function resetExam() {
        currentQuestionIndex = 0;
        questions = [];
        answers = [];
        studentExamId = null;
    }

    // Load initial dashboard data
    loadDashboardData();

    // Load Dashboard Data with error handling
    function loadDashboardData() {
        try {
            // Mock data for now (replace with actual API calls)
            $('#student-name').text('Alex');
            $('#welcome-name').text('Alex');
            $('#enrolled-courses').text('5');
            $('#upcoming-exams').text('3');
            $('#completed-exams').text('12');
            $('#average-score').text('85%');

            // Upcoming Exams (Mock data - replace with API call to fetch exams)
            const upcomingExams = [
                { id: 1, title: 'Physics Midterm', course: 'Physics 101', date: 'May 20, 2023', time: '10:00 AM - 12:00 PM', duration: '2 hours', status: 'Ready' },
                { id: 2, title: 'Calculus Quiz', course: 'Mathematics 202', date: 'May 22, 2023', time: '2:00 PM - 3:00 PM', duration: '1 hour', status: 'Not Ready' },
                { id: 3, title: 'Computer Science Lab', course: 'CS 301', date: 'May 25, 2023', time: '1:30 PM - 3:30 PM', duration: '2 hours', status: 'Ready' }
            ];

            $('#upcoming-exams-list').empty(); // Clear existing content before adding new

            upcomingExams.forEach(exam => {
                $('#upcoming-exams-list').append(`
                    <div class="col-md-4 col-sm-6 mb-4">
                        <div class="card shadow-sm upcoming-exam-card">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h5 class="font-semibold">${exam.title}</h5>
                                    <p>${exam.course}</p>
                                </div>
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${exam.status === 'Ready' ? 'status-ready' : 'status-not-ready'}">
                                    ${exam.status}
                                </span>
                            </div>
                            <div class="mt-4">
                                <p><i class="fas fa-calendar-alt mr-2 text-gray-500" aria-hidden="true"></i>${exam.date}</p>
                                <p><i class="fas fa-clock mr-2 text-gray-500" aria-hidden="true"></i>${exam.time}</p>
                                <p><i class="fas fa-list mr-2 text-gray-500" aria-hidden="true"></i>${exam.duration}</p>
                            </div>
                            <button class="btn btn-primary mt-4 w-full start-exam ${exam.status !== 'Ready' ? 'disabled' : ''}" data-exam-id="${exam.id}" data-exam-title="${exam.title}" ${exam.status !== 'Ready' ? 'disabled' : ''}>
                                ${exam.status === 'Ready' ? 'Prepare for Exam' : 'Not Available Yet'}
                            </button>
                        </div>
                    </div>
                `);
            });

            // Recent Results (Mock data - replace with API call)
            const recentResults = [
                { exam: 'Physics Quiz 1', course: 'Physics 101', date: 'May 5, 2023', score: '82%' },
                { exam: 'Mathematics Homework 3', course: 'Mathematics 202', date: 'May 3, 2023', score: '88%' },
                { exam: 'CS Project Evaluation', course: 'CS 301', date: 'Apr 28, 2023', score: '95%' },
                { exam: 'Physics Lab Report', course: 'Physics 101', date: 'Apr 25, 2023', score: '78%' },
                { exam: 'Mathematics Midterm', course: 'Mathematics 202', date: 'Apr 20, 2023', score: '82%' }
            ];

            $('#recent-results').empty(); // Clear existing content before adding new

            recentResults.forEach(result => {
                $('#recent-results').append(`
                    <tr>
                        <td>${result.exam}</td>
                        <td>${result.course}</td>
                        <td>${result.date}</td>
                        <td class="text-green-600">${result.score}</td>
                    </tr>
                `);
            });

            // Course Progress (Mock data - replace with API call)
            const courseProgress = [
                { course: 'Physics 101', progress: 75, color: 'bg-blue-600' },
                { course: 'Mathematics 202', progress: 60, color: 'bg-purple-600' },
                { course: 'CS 301', progress: 90, color: 'bg-green-600' },
                { course: 'English 101', progress: 45, color: 'bg-yellow-600' },
                { course: 'History 205', progress: 30, color: 'bg-red-600' }
            ];

            $('#course-progress').empty(); // Clear existing content before adding new

            courseProgress.forEach(course => {
                $('#course-progress').append(`
                    <div class="mb-3">
                        <div class="flex justify-between">
                            <p class="text-sm">${course.course}</p>
                            <p class="text-sm">${course.progress}%</p>
                        </div>
                        <div class="progress">
                            <div class="progress-bar ${course.color}" role="progressbar" style="width: ${course.progress}%;" aria-valuenow="${course.progress}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </div>
                `);
            });

            // Announcements (Mock data - replace with API call)
            const announcements = [
                { message: 'Physics 101 exam preparation material available', time: '2 hours ago', urgent: true },
                { message: 'Mathematics 202 homework deadline extended', time: 'Yesterday', urgent: false },
                { message: 'CS 301 project groups have been assigned', time: '2 days ago', urgent: false }
            ];

            $('#announcements').empty(); // Clear existing content before adding new

            announcements.forEach(announcement => {
                $('#announcements').append(`
                    <li class="flex items-start announcement-item">
                        <i class="fas ${announcement.urgent ? 'fa-exclamation-circle text-red-500' : 'fa-check-circle text-green-500'}" aria-hidden="true"></i>
                        <div>
                            <p class="text-sm text-gray-700">${announcement.message}</p>
                            <p class="text-xs text-gray-500">${announcement.time}</p>
                        </div>
                    </li>
                `);
            });
        } catch (error) {
            console.error("Error loading dashboard data:", error);
            showErrorMessage("Failed to load dashboard data. Please refresh the page or try again later.");
        }
    }

    // Show error message
    function showErrorMessage(message) {
        alert(message);
        // A better approach would be to use a toast notification or a dedicated error message area
    }

    // Start Exam with proper error handling
    $(document).on('click', '.start-exam', function () {
        if ($(this).hasClass('disabled')) return;

        const examId = $(this).data('exam-id');
        const examTitle = $(this).data('exam-title');

        // Show loading state
        $(this).prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Loading...');

        $.ajax({
            url: `http://localhost:8080/api/v1/exam/${examId}/start`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function (response) {
                if (response.code === 201) {
                    studentExamId = response.data.id; // Store studentExamId
                    $('#examModal').modal('show');
                    $('#exam-title').text(examTitle);
                    startTimer(response.data.examId);
                    loadQuestions(examId); // Load questions (mock for now)
                } else {
                    alert(response.message);
                }
            },
            error: function (err) {
                const errorMsg = err.responseJSON ? err.responseJSON.message : "Network error. Please check your connection.";
                showErrorMessage('Failed to start exam: ' + errorMsg);
            },
            complete: function() {
                // Reset button state
                $('.start-exam[data-exam-id="' + examId + '"]').prop('disabled', false).html('Prepare for Exam');
            }
        });
    });

    // Start Timer with better UI feedback
    function startTimer(examId) {
        $.ajax({
            url: `http://localhost:8080/api/v1/exam/student-exams/${studentExamId}/time-remaining`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function (response) {
                let seconds = response.data;
                updateTimerDisplay(seconds);

                timerInterval = setInterval(() => {
                    if (seconds <= 0) {
                        clearInterval(timerInterval);
                        $('#submit-exam').click();
                        return;
                    }

                    seconds--;
                    updateTimerDisplay(seconds);
                }, 1000);
            },
            error: function (err) {
                const errorMsg = err.responseJSON ? err.responseJSON.message : "Network error. Please check your connection.";
                showErrorMessage('Failed to fetch remaining time: ' + errorMsg);
                // Fallback to a default time
                let defaultTime = 3600; // 1 hour
                updateTimerDisplay(defaultTime);

                timerInterval = setInterval(() => {
                    if (defaultTime <= 0) {
                        clearInterval(timerInterval);
                        $('#submit-exam').click();
                        return;
                    }

                    defaultTime--;
                    updateTimerDisplay(defaultTime);
                }, 1000);
            }
        });
    }

    // Update timer display with visual warnings
    function updateTimerDisplay(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const timeDisplay = `${minutes}:${secs < 10 ? '0' : ''}${secs}`;

        const $timeElement = $('#time-remaining');
        $timeElement.text(timeDisplay);

        // Add visual warnings when time is running low
        if (seconds <= 30) {
            $timeElement.removeClass('time-normal time-warning').addClass('time-danger');
        } else if (seconds <= lowTimeThreshold) {
            $timeElement.removeClass('time-normal time-danger').addClass('time-warning');
        } else {
            $timeElement.removeClass('time-warning time-danger').addClass('time-normal');
        }
    }

    // Load Questions (Mock for now - replace with actual API call)
    function loadQuestions(examId) {
        // Simulate loading state
        $('#question-content').html('<div class="text-center"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Loading questions...</p></div>');

        // In a real app, use AJAX to fetch questions
        setTimeout(() => {
            // Mock questions
            questions = [
                { id: 1, content: 'What is the capital of France?', options: ['Paris', 'London', 'Berlin', 'Madrid'], correctAnswer: 'Paris' },
                { id: 2, content: 'What is 2 + 2?', options: ['3', '4', '5', '6'], correctAnswer: '4' },
                { id: 3, content: 'Which planet is known as the Red Planet?', options: ['Jupiter', 'Mars', 'Venus', 'Mercury'], correctAnswer: 'Mars' }
            ];

            // Initialize answers array with nulls matching questions length
            answers = Array(questions.length).fill(null);

            $('#total-questions').text(questions.length);
            displayQuestion(currentQuestionIndex);
        }, 500); // Simulate network delay
    }

    // Display Question with improved accessibility
    function displayQuestion(index) {
        const question = questions[index];
        $('#current-question').text(index + 1);

        // Create proper radio button + label pairs
        let optionsHtml = '';
        question.options.forEach((option, i) => {
            const optionId = `option-${index}-${i}`;
            optionsHtml += `
                <div class="option-container">
                    <input type="radio" name="answer-${index}" id="${optionId}" value="${option}" class="answer-option">
                    <label for="${optionId}" class="option-label">${option}</label>
                </div>
            `;
        });

        $('#question-content').html(`
            <p class="font-semibold mb-3">${question.content}</p>
            <div class="options-container">
                ${optionsHtml}
            </div>
        `);

        // Check if there's a saved answer for this question
        if (answers[index]) {
            $(`input[value="${answers[index].studentAnswer}"]`).prop('checked', true);
        }

        // Update button states
        $('#prev-question').prop('disabled', index === 0);
        $('#next-question').text(index === questions.length - 1 ? 'Finish' : 'Next');
    }

    // Previous Question
    $('#prev-question').click(function () {
        if (currentQuestionIndex > 0) {
            saveAnswer();
            currentQuestionIndex--;
            displayQuestion(currentQuestionIndex);
        }
    });

    // Next Question
    $('#next-question').click(function () {
        if (currentQuestionIndex < questions.length - 1) {
            saveAnswer();
            currentQuestionIndex++;
            displayQuestion(currentQuestionIndex);
        } else {
            // On last question, prepare for submission
            saveAnswer();
            if (confirm("Are you sure you want to finish and submit your exam?")) {
                submitExam();
            }
        }
    });

    // Save the current answer
    function saveAnswer() {
        const selectedOption = $(`input[name="answer-${currentQuestionIndex}"]:checked`).val();
        if (selectedOption) {
            answers[currentQuestionIndex] = {
                questionId: questions[currentQuestionIndex].id,
                studentAnswer: selectedOption
            };
        }
    }

    // Submit Exam with loading feedback
    $('#submit-exam').click(function() {
        if (confirm("Are you sure you want to submit your exam? You cannot change your answers afterward.")) {
            submitExam();
        }
    });

    // Submit Exam function
    function submitExam() {
        // Save any unsaved answer from the current question
        saveAnswer();

        // Count unanswered questions
        const unansweredCount = answers.filter(answer => answer === null).length;

        if (unansweredCount > 0 && !confirm(`You have ${unansweredCount} unanswered questions. Do you still want to submit?`)) {
            return;
        }

        // Show loading state
        $('#submit-exam').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Submitting...');
        $('#cancel-exam').prop('disabled', true);

        // Format answers for submission
        const answersToSubmit = answers.map((answer, index) => {
            return {
                questionId: questions[index].id,
                studentAnswer: answer ? answer.studentAnswer : ''
            };
        });

        // Clear the timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }

        // Submit answers to server
        $.ajax({
            url: `http://localhost:8080/api/v1/exam/student-exams/${studentExamId}/submit`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                answers: answersToSubmit
            }),
            success: function(response) {
                if (response.code === 200) {
                    alert("Exam submitted successfully!");
                    $('#examModal').modal('hide');
                    resetExam();

                    // Reload dashboard to show updated data
                    loadDashboardData();
                } else {
                    alert(response.message || "There was an issue submitting your exam.");
                }
            },
            error: function(err) {
                const errorMsg = err.responseJSON ? err.responseJSON.message : "Network error. Please check your connection.";
                showErrorMessage('Failed to submit exam: ' + errorMsg);
            },
            complete: function() {
                // Reset button states
                $('#submit-exam').prop('disabled', false).html('Submit Exam');
                $('#cancel-exam').prop('disabled', false);
            }
        });
    }

    // Logout function
    function logout() {
        if (confirm("Are you sure you want to logout?")) {
            // Clear any stored authentication
            localStorage.removeItem('token');
            // Redirect to login page
            window.location.href = "login.html";
        }
    }

    // Global logout button
    $('button.btn-danger').click(function() {
        logout();
    });

    // Handle window resize
    $(window).resize(function() {
        if ($(window).width() > 992) {
            $('.sidebar').removeClass('show');
            $('.main-content').removeClass('sidebar-active');
        }
    });
});