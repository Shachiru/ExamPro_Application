document.addEventListener("DOMContentLoaded", function () {
    // Check authentication status when page loads
    function checkAuthentication() {
        const token = localStorage.getItem('token'); // Changed to "token"
        const role = localStorage.getItem('role');

        console.log("Checking authentication - Token:", token, "Role:", role);

        if (!token || role !== "SUPER_ADMIN") {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    // Exit early if authentication check fails
    if (!checkAuthentication()) return;

    // Initialize user data
    let userData = null;

    // Fetch user profile details
    function fetchUserDetails() {
        const token = localStorage.getItem('token'); // Changed to "token"
        console.log("Fetching user details...");
        $.ajax({
            url: "http://localhost:8080/api/v1/user/profile",
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            success: function (response) {
                if (response.code === 200) {
                    userData = response.data;
                    $("#userFullName").text(userData.fullName || "Unknown User");
                    $("#userRole").text(userData.role || "Unknown Role");
                    const initials = userData.fullName ? userData.fullName.split(" ").map(word => word.charAt(0)).join("").toUpperCase() : "??";
                    $("#userInitials").text(initials);

                    // Update modal user profile fields
                    $("#modalUserFullName").text(userData.fullName || "Unknown User");
                    $("#modalUserRole").text(userData.role || "Unknown Role");
                    $("#modalUserInitials").text(initials);
                    $("#modalUserEmail").text(userData.email || "N/A");
                    $("#modalUserPhone").text(userData.phoneNumber || "N/A");
                    $("#modalUserDOB").text(userData.dateOfBirth || "N/A");
                    $("#modalUserStatus").text(userData.isActive ? "Active" : "Inactive");
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
                console.error("Error fetching user details:", xhr);
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

    // Load user details when page loads
    fetchUserDetails();

    // Toggle sidebar on mobile view
    document.getElementById('toggleSidebar').addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('show');
    });

    // Handle logout
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
                localStorage.removeItem('token'); // Changed to "token"
                localStorage.removeItem('role');
                window.location.href = 'index.html';
            }
        }).showToast();
    });

    // Fetch admin users list
    function fetchAdmins() {
        const token = localStorage.getItem('token'); // Changed to "token"
        $.ajax({
            url: "http://localhost:8080/api/v1/user/admins",
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            success: function (response) {
                if (response.code === 200) {
                    const admins = response.data;
                    const tbody = $("#adminsTableBody");
                    tbody.empty();

                    if (admins.length === 0) {
                        tbody.append('<tr><td colspan="9" class="text-center">No admins found</td></tr>');
                    } else {
                        admins.forEach(admin => {
                            const row = `
                                <tr>
                                    <td>${admin.fullName || 'N/A'}</td>
                                    <td>${admin.username || 'N/A'}</td>
                                    <td>${admin.email || 'N/A'}</td>
                                    <td>${admin.nic || 'N/A'}</td>
                                    <td>${admin.phoneNumber || 'N/A'}</td>
                                    <td>${admin.dateOfBirth || 'N/A'}</td>
                                    <td>${admin.schoolName || 'N/A'}</td>
                                    <td>${admin.isActive ? 'Active' : 'Inactive'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-danger delete-admin" data-email="${admin.email}">
                                            <i class="fas fa-trash"></i> Delete
                                        </button>
                                    </td>
                                </tr>
                            `;
                            tbody.append(row);
                        });

                        // Set up delete admin functionality
                        $(".delete-admin").on("click", function () {
                            const email = $(this).data("email");
                            if (confirm(`Are you sure you want to delete the admin with email ${email}?`)) {
                                deleteAdmin(email);
                            }
                        });
                    }
                } else {
                    Toastify({
                        text: "Failed to load admins: " + response.message,
                        duration: 3000,
                        gravity: "top",
                        position: "right",
                        backgroundColor: "#dc3545",
                        stopOnFocus: true
                    }).showToast();
                }
            },
            error: function (xhr) {
                console.error("Error fetching admins:", xhr);
                Toastify({
                    text: "Error loading admins: " + (xhr.responseJSON?.message || "Unknown error"),
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#dc3545",
                    stopOnFocus: true
                }).showToast();
            }
        });
    }

    // Delete admin function
    function deleteAdmin(email) {
        const token = localStorage.getItem('token'); // Changed to "token"
        $.ajax({
            url: `http://localhost:8080/api/v1/user/delete/${email}`,
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            success: function (response) {
                if (response.code === 200) {
                    Toastify({
                        text: "Admin deleted successfully!",
                        duration: 3000,
                        gravity: "top",
                        position: "right",
                        backgroundColor: "#28a745",
                        stopOnFocus: true
                    }).showToast();
                    fetchAdmins(); // Refresh the list
                } else {
                    Toastify({
                        text: "Failed to delete admin: " + response.message,
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
                    text: "Error deleting admin: " + (xhr.responseJSON?.message || "Unknown error"),
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#dc3545",
                    stopOnFocus: true
                }).showToast();
            }
        });
    }

    // Toggle between Dashboard and Admins content
    document.getElementById('dashboardMenu').addEventListener('click', (e) => {
        e.preventDefault();
        console.log("Dashboard menu clicked");
        $("#dashboardContent").show();
        $("#adminsContent").hide();
        $(".menu-item").removeClass("active");
        $("#dashboardMenu").addClass("active");
    });

    document.getElementById('adminsMenu').addEventListener('click', (e) => {
        e.preventDefault();
        console.log("Admins menu clicked");
        $("#dashboardContent").hide();
        $("#adminsContent").show();
        $(".menu-item").removeClass("active");
        $("#adminsMenu").addClass("active");
        fetchAdmins();
    });

    // Add new admin form validation and submission
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

        const nic = document.getElementById('adminNIC').value;
        const nicRegex = /^[0-9]{9}[Vv]$/;
        if (!nicRegex.test(nic)) {
            Toastify({
                text: "NIC must be in the format 123456789V",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#dc3545",
                stopOnFocus: true
            }).showToast();
            return;
        }

        const phoneNumber = document.getElementById('adminPhoneNumber').value;
        const phoneRegex = /^07[0-9]{8}$/; // Example: 0712345678
        if (!phoneRegex.test(phoneNumber)) {
            Toastify({
                text: "Phone number must be a 10-digit number starting with 07 (e.g., 0712345678)",
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
            username: document.getElementById('adminUsername').value,
            email: document.getElementById('adminEmail').value,
            password: password,
            nic: document.getElementById('adminNIC').value,
            phoneNumber: document.getElementById('adminPhoneNumber').value,
            dateOfBirth: document.getElementById('adminDOB').value,
            schoolName: document.getElementById('adminSchoolName').value,
            isActive: document.querySelector('input[name="adminStatus"]:checked').value === 'active',
            role: 'ADMIN'
        };

        addNewAdmin(adminData);
    });

    // Function to add a new admin
    function addNewAdmin(adminData) {
        const token = localStorage.getItem('token'); // Changed to "token"
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
                            document.getElementById('addAdminForm').reset();
                            if ($("#adminsContent").is(":visible")) {
                                fetchAdmins();
                            }
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
    }

    // Clear form when modal is closed
    $('#addAdminModal').on('hidden.bs.modal', function () {
        document.getElementById('addAdminForm').reset();
    });

    // Add event listeners for other menu items (currently they only change active state)
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        if (!item.id.includes('dashboardMenu') && !item.id.includes('adminsMenu') && !item.id.includes('logout')) {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                $(".menu-item").removeClass("active");
                item.classList.add("active");

                if ($("#dashboardContent").is(":visible")) {
                    Toastify({
                        text: "This feature is not implemented yet.",
                        duration: 3000,
                        gravity: "top",
                        position: "right",
                        backgroundColor: "#ffc107",
                        stopOnFocus: true
                    }).showToast();
                }
            });
        }
    });

    // Initialize dropdown functionality for timeFilter
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const selectedText = this.textContent;
            document.getElementById('timeFilter').textContent = selectedText;

            document.querySelectorAll('.dropdown-item').forEach(el => {
                el.classList.remove('active');
            });

            this.classList.add('active');

            Toastify({
                text: `Time period changed to ${selectedText}`,
                duration: 2000,
                gravity: "top",
                position: "right",
                backgroundColor: "#4361ee",
                stopOnFocus: true
            }).showToast();
        });
    });
});