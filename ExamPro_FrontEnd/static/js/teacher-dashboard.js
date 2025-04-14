const API_BASE_URL = 'http://localhost:8080/api/v1';
const token = localStorage.getItem('token');
const email = 'teacher@example.com'; // Should be dynamically retrieved from token in production

$(document).ready(function () {
    // Check authentication and role
    if (!token || localStorage.getItem('role') !== 'TEACHER') {
        localStorage.clear();
        window.location.href = 'login.html';
    }

    loadTeacherData();
    loadExams();

    // Handle profile form submission
    $('#profileForm').on('submit', function (e) {
        e.preventDefault();
        updateProfile();
    });
});

// Load teacher profile data
function loadTeacherData() {
    $.ajax({
        url: `${API_BASE_URL}/user/search?email=${email}`,
        method: 'GET',
        headers: {'Authorization': `Bearer ${token}`},
        success: function (result) {
            if (result.code === 200) {
                const user = result.data;
                $('#welcomeName').text(`Welcome, ${user.fullName}`);
                $('#fullName').val(user.fullName);
                $('#phoneNumber').val(user.phoneNumber);
                $('#schoolName').val(user.schoolName || 'N/A');
            }
        },
        error: function (xhr, status, error) {
            console.error('Error loading teacher data:', error);
            alert('Failed to load profile data.');
        }
    });
}

// Update teacher profile
function updateProfile() {
    const data = {
        fullName: $('#fullName').val(),
        phoneNumber: $('#phoneNumber').val(),
        schoolName: $('#schoolName').val(),
        password: $('#password').val() || undefined
    };

    $.ajax({
        url: `${API_BASE_URL}/user/update?email=${email}`,
        method: 'PUT',
        headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
        data: JSON.stringify(data),
        success: function (result) {
            if (result.code === 200) {
                alert('Profile updated successfully!');
                loadTeacherData();
            } else {
                alert(result.message);
            }
        },
        error: function (xhr, status, error) {
            console.error('Error updating profile:', error);
            alert('An error occurred while updating the profile.');
        }
    });
}

// Load exams created by the teacher (assuming an endpoint exists)
function loadExams() {
    $.ajax({
        url: `${API_BASE_URL}/exam/list`, // Note: This endpoint is assumed; adjust if different
        method: 'GET',
        headers: {'Authorization': `Bearer ${token}`},
        success: function (result) {
            if (result.code === 200) {
                const exams = result.data;
                const $examList = $('#examList');
                $examList.empty();
                exams.forEach(exam => {
                    const examCard = `
                        <div class="p-4 bg-gray-50 shadow-md rounded-lg">
                            <h4 class="text-lg font-semibold text-[#4361ee]">${exam.title}</h4>
                            <p class="text-sm text-gray-600">${exam.description || 'No description'}</p>
                            <p class="text-sm text-gray-600">Duration: ${exam.duration} minutes</p>
                            <div class="mt-2 flex space-x-2">
                                <button class="btn btn-sm btn-outline-primary" onclick="addQuestions(${exam.id})">
                                    <i class="fas fa-plus"></i> Add Questions
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteExam(${exam.id})">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    `;
                    $examList.append(examCard);
                });
            } else {
                alert(result.message);
            }
        },
        error: function (xhr, status, error) {
            console.error('Error loading exams:', error);
            alert('An error occurred while loading exams.');
        }
    });
}

// Open the create exam modal
function openCreateExamModal() {
    $('#createExamModal').modal('show');
}

$('#createExamForm').on('submit', function (e) {
    e.preventDefault(); // Prevent the default form submission
    createExam();
});

function createExam() {
    // Get form values
    const title = $('#examTitle').val().trim();
    const duration = parseInt($('#examDuration').val(), 10);
    const startTime = $('#examStartTime').val(); // e.g., "2025-03-27T10:00"
    const createdByEmail = getTeacherEmail(); // Get the logged-in teacher's email

    // Basic validation
    if (!title) {
        alert('Please enter an exam title.');
        return;
    }
    if (isNaN(duration) || duration <= 0) {
        alert('Duration must be a positive number.');
        return;
    }
    if (!startTime) {
        alert('Please select a start time.');
        return;
    }

    // Format start time to match your Postman example (append seconds)
    const formattedStartTime = startTime + ':00'; // Converts "2025-03-27T10:00" to "2025-03-27T10:00:00"

    // Create the JSON object matching your Postman request
    const examData = {
        title: title,
        duration: duration,
        startTime: formattedStartTime,
        createdByEmail: createdByEmail
    };

    // Send the request to the API
    $.ajax({
        url: '/api/v1/exam/create', // Replace with your actual API endpoint
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token'), // Include the auth token
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(examData),
        success: function (response) {
            if (response.code === 201) { // Adjust based on your API's success code
                alert('Exam created successfully!');
                // Optionally, redirect to an exam list or clear the form
                $('#createExamForm')[0].reset();
            } else {
                alert('Failed to create exam: ' + response.message);
            }
        },
        error: function (xhr, status, error) {
            console.error('Error:', error);
            alert('An error occurred while creating the exam.');
        }
    });
}

// Function to get the logged-in teacher's email
function getTeacherEmail() {
    const token = localStorage.getItem('token'); // Assuming token is stored here
    if (token) {
        const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
        return payload.email; // Assumes email is in the token payload
    }
    return null; // Handle case where token is missing
}

// Add questions to an exam (placeholder for further implementation)
function addQuestions(examId) {
    const questionData = {
        // Example question data; expand as needed
        text: prompt('Enter question text:'),
        options: [
            {text: prompt('Option 1:'), isCorrect: confirm('Is this the correct answer?')},
            {text: prompt('Option 2:'), isCorrect: false},
            {text: prompt('Option 3:'), isCorrect: false},
            {text: prompt('Option 4:'), isCorrect: false}
        ]
    };

    $.ajax({
        url: `${API_BASE_URL}/exam/${examId}/questions`,
        method: 'POST',
        headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
        data: JSON.stringify(questionData),
        success: function (result) {
            if (result.code === 201) {
                alert('Question added successfully!');
            } else {
                alert(result.message);
            }
        },
        error: function (xhr, status, error) {
            console.error('Error adding question:', error);
            alert('An error occurred while adding the question.');
        }
    });
}

// Delete an exam (assuming an endpoint exists)
function deleteExam(examId) {
    if (confirm('Are you sure you want to delete this exam?')) {
        $.ajax({
            url: `${API_BASE_URL}/exam/delete/${examId}`, // Assumed endpoint
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${token}`},
            success: function (result) {
                if (result.code === 200) {
                    alert('Exam deleted successfully!');
                    loadExams();
                } else {
                    alert(result.message);
                }
            },
            error: function (xhr, status, error) {
                console.error('Error deleting exam:', error);
                alert('An error occurred while deleting the exam.');
            }
        });
    }
}

// Logout functionality
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = 'index.html';
}