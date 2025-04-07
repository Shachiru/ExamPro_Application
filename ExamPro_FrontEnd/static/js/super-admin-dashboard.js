document.addEventListener("DOMContentLoaded", function () {
    // Function to check authentication
    function checkAuthentication() {
        const token = localStorage.getItem('jwtToken');
        const role = localStorage.getItem('role');

        // Redirect to login if not authenticated or not Super Admin
        if (!token || role !== "SUPER_ADMIN") {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }

    if (!checkAuthentication()) return;

    let userData = null; // Store user data for editing

    // Fetch user details on page load
    function fetchUserDetails() {
        const token = localStorage.getItem('jwtToken');
        $.ajax({
            url: "http://localhost:8080/api/v1/user/profile",
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            success: function (response) {
                if (response.code === 200) {
                    userData = response.data;
                    // Update user profile section
                    $("#userFullName").text(userData.fullName || "Unknown User");
                    $("#userRole").text(userData.role || "Unknown Role");
                    const initials = userData.fullName ? userData.fullName.split(" ").map(word => word.charAt(0)).join("").toUpperCase() : "??";
                    $("#userInitials").text(initials);

                    // Populate modal with user details
                    $("#modalUserFullName").text(userData.fullName || "Unknown User");
                    $("#modalUserRole").text(userData.role || "Unknown Role");
                    $("#modalUserInitials").text(initials);
                    $("#modalUserEmail").text(userData.email || "N/A");
                    $("#modalUserPhone").text(userData.phoneNumber || "N/A");
                    $("#modalUserDOB").text(userData.dateOfBirth || "N/A");
                    $("#modalUserStatus").text(userData.isActive ? "Active" : "Inactive");

                    // Populate edit form
                    $("#editFullName").val(userData.fullName || "");
                    $("#editPhoneNumber").val(userData.phoneNumber || "");
                    $("#editDOB").val(userData.dateOfBirth || "");
                } else {
                    Toastify({
                        text: "Failed to load user profile: " + response.message,
                        duration: 3000,
                        gravity: "top",
                        position: "right",
                        backgroundColor: "#dc3545",
                        stopOnFocus: true
                    }).showToast();
                }
            },
            error: function (xhr) {
                Toastify({
                    text: "Error loading user profile: " + (xhr.responseJSON?.message || "Unknown error"),
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#dc3545",
                    stopOnFocus: true
                }).showToast();
            }
        });
    }

    // Fetch user details immediately after authentication check
    fetchUserDetails();

    // Toggle sidebar
    document.getElementById('toggleSidebar').addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('show');
    });

    // Logout functionality
    document.getElementById('logout').addEventListener('click', (e) => {
        e.preventDefault();
        Toastify({
            text: "Logging out...",
            duration: 2000,
            gravity: "top",
            position: "right",
            backgroundColor: "#4361ee",
            stopOnFocus: true,
            callback: function () {
                localStorage.removeItem('jwtToken');
                localStorage.removeItem('role');
                window.location.href = 'index.html';
            }
        }).showToast();
    });

    // Admin Form Validation & Submission
    document.getElementById('saveAdmin').addEventListener('click', () => {
        const form = document.getElementById('addAdminForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const password = document.getElementById('adminPassword').value;
        const confirmPassword = document.getElementById('adminConfirmPassword').value;

        if (password !== confirmPassword) {
            Toastify({
                text: "Passwords do not match!",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#dc3545",
                stopOnFocus: true
            }).showToast();
            return;
        }

        const adminData = {
            fullName: document.getElementById('adminName').value,
            email: document.getElementById('adminEmail').value,
            password: password,
            position: document.getElementById('adminPosition').value,
            department: document.getElementById('adminDepartment').value,
            active: document.querySelector('input[name="adminStatus"]:checked').value === 'active',
            role: 'ADMIN'
        };

        const token = localStorage.getItem('jwtToken');

        fetch('http://localhost:8080/api/v1/user/sign_up/admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(adminData)
        })
            .then(response => {
                if (response.status === 201) {
                    Toastify({
                        text: "Admin added successfully!",
                        duration: 3000,
                        gravity: "top",
                        position: "right",
                        backgroundColor: "#28a745",
                        stopOnFocus: true,
                        callback: function () {
                            const modal = bootstrap.Modal.getInstance(document.getElementById('addAdminModal'));
                            modal.hide();
                            form.reset();
                        }
                    }).showToast();
                } else if (response.status === 406) {
                    Toastify({
                        text: "Email already in use!",
                        duration: 3000,
                        gravity: "top",
                        position: "right",
                        backgroundColor: "#dc3545",
                        stopOnFocus: true
                    }).showToast();
                } else {
                    throw new Error('Failed to add admin');
                }
            })
            .catch(error => {
                Toastify({
                    text: "Error: " + error.message,
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#dc3545",
                    stopOnFocus: true
                }).showToast();
            });
    });

    // Profile Modal Edit Functionality
    document.getElementById('editProfileBtn').addEventListener('click', () => {
        $("#profileDetails").hide();
        $("#profileEditForm").show();
        $("#editProfileBtn").hide();
        $("#saveProfileBtn").show();
    });

    document.getElementById('saveProfileBtn').addEventListener('click', () => {
        const form = document.getElementById('editProfileForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const updatedUserData = {
            fullName: $("#editFullName").val(),
            phoneNumber: $("#editPhoneNumber").val(),
            dateOfBirth: $("#editDOB").val(),
            oldPassword: $("#editOldPassword").val() || null,
            password: $("#editNewPassword").val() || null
        };

        const token = localStorage.getItem('jwtToken');
        $.ajax({
            url: `http://localhost:8080/api/v1/user/update?email=${userData.email}`,
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            data: JSON.stringify(updatedUserData),
            success: function (response) {
                if (response.code === 200) {
                    Toastify({
                        text: "Profile updated successfully!",
                        duration: 3000,
                        gravity: "top",
                        position: "right",
                        backgroundColor: "#28a745",
                        stopOnFocus: true
                    }).showToast();
                    // Refresh user details
                    fetchUserDetails();
                    // Switch back to view mode
                    $("#profileDetails").show();
                    $("#profileEditForm").hide();
                    $("#editProfileBtn").show();
                    $("#saveProfileBtn").hide();
                } else {
                    Toastify({
                        text: "Failed to update profile: " + response.message,
                        duration: 3000,
                        gravity: "top",
                        position: "right",
                        backgroundColor: "#dc3545",
                        stopOnFocus: true
                    }).showToast();
                }
            },
            error: function (xhr) {
                Toastify({
                    text: "Error updating profile: " + (xhr.responseJSON?.message || "Unknown error"),
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#dc3545",
                    stopOnFocus: true
                }).showToast();
            }
        });
    });
});