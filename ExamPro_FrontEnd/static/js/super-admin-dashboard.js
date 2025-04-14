document.addEventListener('DOMContentLoaded', function () {
    // Initially, show loading and hide content
    $('#loading').show();
    $('#content').hide();

    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Make AJAX call to validate token and check role
    $.ajax({
        url: 'http://localhost:8080/api/v1/user/profile',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        success: function (response) {
            // Check response status
            if (response.code !== 200 || !response.data) {
                showError('Access denied: Invalid response from server');
                redirectToLogin();
                return;
            }

            const user = response.data;
            // Verify role is SUPER_ADMIN
            if (user.role !== 'SUPER_ADMIN') {
                showError('Access denied: Super Admin privileges required');
                redirectToLogin();
                return;
            }

            // User is authorized; populate user info and load dashboard
            $('#userFullName').text(user.fullName);
            $('#userRole').text(user.role);
            $('#modalUserFullName').text(user.fullName);
            $('#modalUserRole').text(user.role);
            $('#modalUserEmail').text(user.email);
            $('#modalUserPhone').text(user.phoneNumber || 'Not provided');
            $('#modalUserDOB').text(user.dateOfBirth || 'Not provided');
            $('#modalUserStatus').text(user.active ? 'Active' : 'Inactive');

            // Set user initials for avatar
            const initials = user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            $('#userInitials').text(initials);
            $('#modalUserInitials').text(initials);

            // Hide loading and show content
            $('#loading').hide();
            $('#content').show();

            // Load initial dashboard content
            loadDashboard();
        },
        error: function (xhr) {
            // Handle unauthorized or forbidden responses
            if (xhr.status === 401 || xhr.status === 403) {
                showError('Session expired or unauthorized access');
                localStorage.removeItem('token');
                redirectToLogin();
            } else {
                showError('Error loading profile: ' + (xhr.responseJSON?.message || 'Unknown error'));
            }
        }
    });

    // Menu event listeners
    $('#dashboardMenu').on('click', function (e) {
        e.preventDefault();
        $('#dashboardContent').show();
        $('#adminsContent').hide();
        setActiveMenu(this);
    });

    $('#adminsMenu').on('click', function (e) {
        e.preventDefault();
        $('#dashboardContent').hide();
        $('#adminsContent').show();
        setActiveMenu(this);
        loadAdminsList();
    });

    $('#logout').on('click', function (e) {
        e.preventDefault();
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });

    // Toggle sidebar for mobile
    $('#toggleSidebar').on('click', function () {
        $('#sidebar').toggleClass('active');
    });

    // Add Admin functionality
    const form = document.getElementById('addAdminForm');
    const saveAdminBtn = document.getElementById('saveAdmin');

    saveAdminBtn.addEventListener('click', function () {
        const fullName = document.getElementById('adminName').value.trim();
        const nic = document.getElementById('adminNIC').value.trim();
        const dateOfBirth = document.getElementById('adminDOB').value;
        const phoneNumber = document.getElementById('adminPhoneNumber').value.trim();
        const schoolName = document.getElementById('adminSchoolName').value.trim();
        const username = document.getElementById('adminUsername').value.trim();
        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;
        const confirmPassword = document.getElementById('adminConfirmPassword').value;

        // Validate form
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        const data = {
            fullName: fullName,
            nic: nic,
            dateOfBirth: dateOfBirth,
            phoneNumber: phoneNumber,
            schoolName: schoolName,
            username: username,
            email: email,
            password: password,
            role: 'ADMIN'
        };

        const token = localStorage.getItem('token');
        if (!token) {
            showError('You are not logged in. Please log in again.');
            return;
        }

        $.ajax({
            url: 'http://localhost:8080/api/v1/user/sign_up/admin',
            method: 'POST',
            contentType: 'application/json',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            data: JSON.stringify(data),
            success: function (response) {
                if (response.code === 201) {
                    Toastify({
                        text: 'Admin added successfully!',
                        duration: 3000,
                        gravity: 'top',
                        position: 'right',
                        style: {background: '#10b981'}
                    }).showToast();
                    $('#addAdminModal').modal('hide');
                    form.reset();
                    form.classList.remove('was-validated');
                    loadAdminsList(); // Refresh the admins list
                } else {
                    showError(response.message || 'Error adding admin');
                }
            },
            error: function (xhr) {
                if (xhr.status === 406) {
                    showError('Email already in use');
                } else if (xhr.status === 401 || xhr.status === 403) {
                    showError('Unauthorized. Please log in again.');
                    localStorage.removeItem('token');
                    redirectToLogin();
                } else {
                    showError('Error adding admin: ' + (xhr.responseJSON?.message || 'Unknown error'));
                }
            }
        });
    });

    // Reset the form when the modal is closed
    $('#addAdminModal').on('hidden.bs.modal', function () {
        form.reset();
        form.classList.remove('was-validated');
    });
});

// Helper functions
function showError(message) {
    Toastify({
        text: message,
        duration: 3000,
        gravity: 'top',
        position: 'right',
        style: {background: '#ef4444'}
    }).showToast();
}

function redirectToLogin() {
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

function setActiveMenu(element) {
    $('.menu-item').removeClass('active');
    $(element).addClass('active');
}

function loadDashboard() {
    // Placeholder for loading dashboard-specific data (e.g., stats)
    // Future AJAX calls can be added here
    $('#dashboardContent').show();
}

function loadAdminsList() {
    const token = localStorage.getItem('token');
    $.ajax({
        url: 'http://localhost:8080/api/v1/user/admins',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        success: function (response) {
            if (response.code === 200 && response.data) {
                const admins = response.data;
                const tableBody = $('#adminsTableBody');
                tableBody.empty();
                admins.forEach(admin => {
                    const row = `
                        <tr>
                            <td>${admin.fullName}</td>
                            <td>${admin.username}</td>
                            <td>${admin.email}</td>
                            <td>${admin.nic || 'N/A'}</td>
                            <td>${admin.phoneNumber || 'N/A'}</td>
                            <td>${admin.dateOfBirth || 'N/A'}</td>
                            <td>${admin.schoolName || 'N/A'}</td>
                            <td>${admin.active ? 'Active' : 'Inactive'}</td>
                            <td>
                                <button class="btn btn-sm btn-primary">Edit</button>
                                <button class="btn btn-sm btn-danger">Delete</button>
                            </td>
                        </tr>`;
                    tableBody.append(row);
                });
            } else {
                showError('Failed to load admins: ' + response.message);
            }
        },
        error: function (xhr) {
            if (xhr.status === 401 || xhr.status === 403) {
                showError('Unauthorized access to admins list');
                localStorage.removeItem('token');
                redirectToLogin();
            } else {
                showError('Error loading admins: ' + (xhr.responseJSON?.message || 'Unknown error'));
            }
        }
    });
}