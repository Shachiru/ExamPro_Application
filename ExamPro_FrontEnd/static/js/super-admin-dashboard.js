document.addEventListener("DOMContentLoaded", () => {
    // Initially, show loading and hide content
    $("#loading").show()
    $("#content").hide()

    // Check if token exists in localStorage
    const token = localStorage.getItem("token")
    if (!token) {
        window.location.href = "login.html"
        return
    }

    // Make AJAX call to validate token and check role
    $.ajax({
        url: "http://localhost:8080/api/v1/user/profile",
        method: "GET",
        headers: {
            Authorization: "Bearer " + token,
        },
        success: (response) => {
            // Check response status
            if (response.code !== 200 || !response.data) {
                showError("Access denied: Invalid response from server")
                redirectToLogin()
                return
            }

            const user = response.data
            // Verify role is SUPER_ADMIN
            if (user.role !== "SUPER_ADMIN") {
                showError("Access denied: Super Admin privileges required")
                redirectToLogin()
                return
            }

            // User is authorized; populate user info and load dashboard
            $("#userFullName").text(user.fullName)
            $("#userRole").text(user.role)
            $("#modalUserFullName").text(user.fullName)
            $("#modalUserRole").text(user.role)
            $("#modalUserEmail").text(user.email)
            $("#modalUserPhone").text(user.phoneNumber || "Not provided")
            $("#modalUserDOB").text(user.dateOfBirth || "Not provided")
            $("#modalUserStatus").text(user.active ? "Active" : "Inactive")

            // Set user initials for avatar
            const initials = user.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase()
            $("#userInitials").text(initials)
            $("#modalUserInitials").text(initials)

            // Hide loading and show content
            $("#loading").hide()
            $("#content").show()

            // Load initial dashboard content
            loadDashboard()
        },
        error: (xhr) => {
            // Handle unauthorized or forbidden responses
            if (xhr.status === 401 || xhr.status === 403) {
                showError("Session expired or unauthorized access")
                localStorage.removeItem("token")
                redirectToLogin()
            } else {
                showError("Error loading profile: " + (xhr.responseJSON?.message || "Unknown error"))
            }
        },
    })

    // Menu event listeners
    $("#dashboardMenu").on("click", function (e) {
        e.preventDefault()
        $("#dashboardContent").show()
        $("#adminsContent").hide()
        setActiveMenu(this)
    })

    $("#adminsMenu").on("click", function (e) {
        e.preventDefault()
        $("#dashboardContent").hide()
        $("#adminsContent").show()
        setActiveMenu(this)
        loadAllAdmins() // Changed to use the enhanced function
    })

    $("#logout").on("click", (e) => {
        e.preventDefault()
        localStorage.removeItem("token")
        window.location.href = "login.html"
    })

    // Toggle sidebar for mobile
    $("#toggleSidebar").on("click", () => {
        $("#sidebar").toggleClass("show")
    })

    // Add Admin functionality
    const form = document.getElementById("addAdminForm")
    const saveAdminBtn = document.getElementById("saveAdmin")

    saveAdminBtn.addEventListener("click", () => {
        const fullName = document.getElementById("adminName").value.trim()
        const nic = document.getElementById("adminNIC").value.trim()
        const dateOfBirth = document.getElementById("adminDOB").value
        const phoneNumber = document.getElementById("adminPhoneNumber").value.trim()
        const schoolName = document.getElementById("adminSchoolName").value.trim()
        const username = document.getElementById("adminUsername").value.trim()
        const email = document.getElementById("adminEmail").value.trim()
        const password = document.getElementById("adminPassword").value
        const confirmPassword = document.getElementById("adminConfirmPassword").value

        // Validate form
        if (!form.checkValidity()) {
            form.classList.add("was-validated")
            return
        }

        if (password !== confirmPassword) {
            showError("Passwords do not match")
            return
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
            role: "ADMIN",
        }

        const token = localStorage.getItem("token")
        if (!token) {
            showError("You are not logged in. Please log in again.")
            return
        }

        $.ajax({
            url: "http://localhost:8080/api/v1/user/sign_up/admin",
            method: "POST",
            contentType: "application/json",
            headers: {
                Authorization: "Bearer " + token,
            },
            data: JSON.stringify(data),
            success: (response) => {
                if (response.code === 201) {
                    Toastify({
                        text: "Admin added successfully!",
                        duration: 3000,
                        gravity: "top",
                        position: "right",
                        style: { background: "#10b981" },
                    }).showToast()
                    $("#addAdminModal").modal("hide")
                    form.reset()
                    form.classList.remove("was-validated")
                    loadAllAdmins() // Changed to use the enhanced function
                } else {
                    showError(response.message || "Error adding admin")
                }
            },
            error: (xhr) => {
                if (xhr.status === 406) {
                    showError("Email already in use")
                } else if (xhr.status === 401 || xhr.status === 403) {
                    showError("Unauthorized. Please log in again.")
                    localStorage.removeItem("token")
                    redirectToLogin()
                } else {
                    showError("Error adding admin: " + (xhr.responseJSON?.message || "Unknown error"))
                }
            },
        })
    })

    // Reset the form when the modal is closed
    $("#addAdminModal").on("hidden.bs.modal", () => {
        form.reset()
        form.classList.remove("was-validated")
    })

    // Initialize the enhanced admin table features
    initAdminTableFeatures()
})

// Helper functions
function showError(message) {
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "#ef4444" },
    }).showToast()
}

function showSuccess(message) {
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "#10b981" },
    }).showToast()
}

function redirectToLogin() {
    setTimeout(() => {
        window.location.href = "login.html"
    }, 1000)
}

function setActiveMenu(element) {
    $(".menu-item").removeClass("active")
    $(element).addClass("active")
}

function loadDashboard() {
    // Placeholder for loading dashboard-specific data (e.g., stats)
    // Future AJAX calls can be added here
    $("#dashboardContent").show()
}

// Variables for pagination
let currentPage = 1
const itemsPerPage = 10
let totalItems = 0
let filteredAdmins = []
let allAdmins = []

// Function to load all admins at once and handle filtering/pagination in client side
function loadAllAdmins() {
    const token = localStorage.getItem("token")

    // Show loading state
    $("#adminsTableBody").html(
        '<tr><td colspan="9" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>',
    )

    $.ajax({
        url: "http://localhost:8080/api/v1/user/admins",
        method: "GET",
        headers: {
            Authorization: "Bearer " + token,
        },
        success: (response) => {
            if (response.code === 200 && response.data) {
                allAdmins = response.data
                filteredAdmins = [...allAdmins]
                totalItems = filteredAdmins.length
                updatePaginationInfo()
                displayAdmins()
            } else {
                showError("Failed to load admins: " + response.message)
            }
        },
        error: (xhr) => {
            if (xhr.status === 401 || xhr.status === 403) {
                showError("Unauthorized access to admins list")
                localStorage.removeItem("token")
                redirectToLogin()
            } else {
                showError("Error loading admins: " + (xhr.responseJSON?.message || "Unknown error"))
            }
        },
    })
}

// Function to display admins with pagination
function displayAdmins() {
    const tableBody = $("#adminsTableBody")
    tableBody.empty()

    if (filteredAdmins.length === 0) {
        tableBody.html('<tr><td colspan="9" class="text-center">No administrators found</td></tr>')
        return
    }

    // Calculate start and end index for current page
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, filteredAdmins.length)

    // Update pagination display
    $("#showingStart").text(startIndex + 1)
    $("#showingEnd").text(endIndex)
    $("#totalAdmins").text(filteredAdmins.length)

    // Enable/disable pagination buttons
    $("#prevPage").prop("disabled", currentPage === 1)
    $("#nextPage").prop("disabled", endIndex >= filteredAdmins.length)

    // Display admins for current page
    for (let i = startIndex; i < endIndex; i++) {
        const admin = filteredAdmins[i]

        // Format date if available
        const formattedDate = admin.dateOfBirth ? new Date(admin.dateOfBirth).toLocaleDateString() : "N/A"

        // Create status badge with appropriate color
        const statusBadge = admin.active
            ? '<span class="badge bg-success rounded-pill">Active</span>'
            : '<span class="badge bg-danger rounded-pill">Inactive</span>'

        const row = `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar avatar-sm me-2">${getInitials(admin.fullName)}</div>
                        <div>${admin.fullName}</div>
                    </div>
                </td>
                <td>${admin.username}</td>
                <td>${admin.email}</td>
                <td>${admin.nic || "N/A"}</td>
                <td>${admin.phoneNumber || "N/A"}</td>
                <td>${formattedDate}</td>
                <td>${admin.schoolName || "N/A"}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-icon" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="#" onclick="editAdmin(${admin.id})">
                                <i class="fas fa-edit me-2 text-primary"></i>Edit
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="viewAdminDetails(${admin.id})">
                                <i class="fas fa-eye me-2 text-info"></i>View Details
                            </a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item ${admin.active ? "" : "text-success"}" href="#" onclick="toggleAdminStatus(${admin.id}, ${!admin.active})">
                                <i class="fas ${admin.active ? "fa-ban text-warning" : "fa-check-circle text-success"} me-2"></i>
                                ${admin.active ? "Deactivate" : "Activate"}
                            </a></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="deleteAdmin(${admin.id})">
                                <i class="fas fa-trash-alt me-2"></i>Delete
                            </a></li>
                        </ul>
                    </div>
                </td>
            </tr>`
        tableBody.append(row)
    }
}

// Function to update pagination information
function updatePaginationInfo() {
    const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage)
    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages
    }
}

// Helper function to get initials from name
function getInitials(name) {
    if (!name) return "?"
    return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
}

// Function to view admin details
function viewAdminDetails(adminId) {
    const admin = allAdmins.find((a) => a.id === adminId)
    if (!admin) return

    // Format date if available
    const formattedDate = admin.dateOfBirth ? new Date(admin.dateOfBirth).toLocaleDateString() : "N/A"

    // Update modal content
    $("#detailsAdminInitials").text(getInitials(admin.fullName))
    $("#detailsAdminName").text(admin.fullName)
    $("#detailsAdminSchool").text(admin.schoolName || "No school assigned")
    $("#detailsAdminUsername").text(admin.username)
    $("#detailsAdminEmail").text(admin.email)
    $("#detailsAdminNIC").text(admin.nic || "N/A")
    $("#detailsAdminPhone").text(admin.phoneNumber || "N/A")
    $("#detailsAdminDOB").text(formattedDate)

    // Set status with appropriate color
    const statusText = admin.active
        ? '<span class="badge bg-success rounded-pill">Active</span>'
        : '<span class="badge bg-danger rounded-pill">Inactive</span>'
    $("#detailsAdminStatus").html(statusText)

    // Store admin ID for edit button
    $("#editSelectedAdmin").data("admin-id", adminId)

    // Show the modal
    $("#adminDetailsModal").modal("show")
}

// Functions for admin actions
function editAdmin(adminId) {
    // Implement edit functionality
    console.log("Editing admin with ID:", adminId)
    // Open the edit modal or navigate to edit page
}

function toggleAdminStatus(adminId, setActive) {
    const token = localStorage.getItem("token")
    const action = setActive ? "activate" : "deactivate"

    if (confirm(`Are you sure you want to ${action} this administrator?`)) {
        $.ajax({
            url: `http://localhost:8080/api/v1/user/admin/${adminId}/status`,
            method: "PUT",
            headers: {
                Authorization: "Bearer " + token,
                "Content-Type": "application/json",
            },
            data: JSON.stringify({ active: setActive }),
            success: (response) => {
                if (response.code === 200) {
                    showSuccess(`Administrator ${setActive ? "activated" : "deactivated"} successfully`)
                    loadAllAdmins() // Reload the list
                } else {
                    showError("Failed to update status: " + response.message)
                }
            },
            error: (xhr) => {
                showError("Error updating status: " + (xhr.responseJSON?.message || "Unknown error"))
            },
        })
    }
}

function deleteAdmin(adminId) {
    const token = localStorage.getItem("token")

    if (confirm("Are you sure you want to delete this administrator? This action cannot be undone.")) {
        $.ajax({
            url: `http://localhost:8080/api/v1/user/admin/${adminId}`,
            method: "DELETE",
            headers: {
                Authorization: "Bearer " + token,
            },
            success: (response) => {
                if (response.code === 200) {
                    showSuccess("Administrator deleted successfully")
                    loadAllAdmins() // Reload the list
                } else {
                    showError("Failed to delete administrator: " + response.message)
                }
            },
            error: (xhr) => {
                showError("Error deleting administrator: " + (xhr.responseJSON?.message || "Unknown error"))
            },
        })
    }
}

// Initialize admin table features
function initAdminTableFeatures() {
    // Edit button in details modal
    $("#editSelectedAdmin").click(function () {
        const adminIdForEdit = $(this).data("admin-id")
        $("#adminDetailsModal").modal("hide")
        editAdmin(adminIdForEdit)
    })

    // Search functionality
    $("#searchAdmin").on("input", function () {
        const searchTerm = $(this).val().toLowerCase()

        // Filter admins based on search term
        filteredAdmins = allAdmins.filter((admin) => {
            return (
                admin.fullName.toLowerCase().includes(searchTerm) ||
                admin.username.toLowerCase().includes(searchTerm) ||
                admin.email.toLowerCase().includes(searchTerm) ||
                (admin.schoolName && admin.schoolName.toLowerCase().includes(searchTerm)) ||
                (admin.nic && admin.nic.toLowerCase().includes(searchTerm)) ||
                (admin.phoneNumber && admin.phoneNumber.toLowerCase().includes(searchTerm))
            )
        })

        // Reset pagination and display results
        currentPage = 1
        updatePaginationInfo()
        displayAdmins()
    })

    // Filter buttons
    $(".filter-btn").click(function () {
        const filter = $(this).data("filter")

        // Update active button
        $(".filter-btn").removeClass("active")
        $(this).addClass("active")

        // Filter admins based on status
        if (filter === "all") {
            filteredAdmins = [...allAdmins]
        } else if (filter === "active") {
            filteredAdmins = allAdmins.filter((admin) => admin.active)
        } else if (filter === "inactive") {
            filteredAdmins = allAdmins.filter((admin) => !admin.active)
        }

        // Reset pagination and display results
        currentPage = 1
        updatePaginationInfo()
        displayAdmins()
    })

    // Pagination controls
    $("#prevPage").click(() => {
        if (currentPage > 1) {
            currentPage--
            displayAdmins()
        }
    })

    $("#nextPage").click(() => {
        const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage)
        if (currentPage < totalPages) {
            currentPage++
            displayAdmins()
        }
    })
}
