document.addEventListener("DOMContentLoaded", function () {
    // Password toggle functionality
    const togglePassword = document.getElementById('togglePassword');
    const password = document.getElementById('password');
    const loaderContainer = document.getElementById('loaderContainer');

    togglePassword.addEventListener('click', function() {
        // Toggle the type attribute
        const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
        password.setAttribute('type', type);

        // Toggle the eye icon
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });

    // Function to show loader
    function showLoader() {
        loaderContainer.style.display = 'flex';
    }

    // Function to hide loader
    function hideLoader() {
        loaderContainer.style.display = 'none';
    }

    $("#loginForm").on("submit", function (event) {
        event.preventDefault();
        const email = $("#email").val().trim();
        const password = $("#password").val().trim();
        const errorMessage = $("#errorMessage");
        const submitButton = $(".login-button");

        if (!email || !password) {
            Toastify({
                text: "Please fill in all fields",
                duration: 3000,
                gravity: "top",
                position: "right",
                style: {background: "#ef4444", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)"}
            }).showToast();
            return;
        }

        submitButton.prop("disabled", true).val("Signing in...");
        showLoader(); // Show loader before AJAX request

        $.ajax({
            url: "http://localhost:8080/api/v1/auth/sign_in",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({email: email, password: password}),
            success: function (data) {
                localStorage.setItem("jwtToken", data.data.token);
                localStorage.setItem("role", data.data.role);
                hideLoader(); // Hide loader on success

                Toastify({
                    text: "Welcome to ExamPro! Login Successful",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    style: {
                        background: "#10b981",
                        borderRadius: "12px",
                        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)"
                    }
                }).showToast();

                setTimeout(function () {
                    if (data.data.role === "SUPER_ADMIN") {
                        window.location.href = "super-admin-dashboard.html";
                    } else if (data.data.role === "ADMIN") {
                        window.location.href = "admin-dashboard.html";
                    } else if (data.data.role === "TEACHER") {
                        window.location.href = "teacher-dashboard.html";
                    } else if (data.data.role === "STUDENT") {
                        window.location.href = "student-dashboard.html";
                    } else {
                        errorMessage.text("Invalid Role Assigned!").show();
                        submitButton.prop("disabled", false).val("Sign In");
                    }
                }, 1000);
            },
            error: function (xhr) {
                hideLoader(); // Hide loader on error
                let errorMsg = xhr.responseJSON?.message || "Invalid email or password!";
                errorMessage.text(errorMsg).show();
                Toastify({
                    text: `Login Failed: ${errorMsg}`,
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    style: {
                        background: "#ef4444",
                        borderRadius: "12px",
                        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)"
                    }
                }).showToast();
                submitButton.prop("disabled", false).val("Sign In");
            }
        });
    });

    // Google Sign-In
    var googleAuth;
    gapi.load('auth2', function () {
        googleAuth = gapi.auth2.init({
            client_id: 'YOUR_CLIENT_ID_HERE',
            scope: 'profile email',
            cookiepolicy: 'single_host_origin'
        });
    });

    $('#google-sign-in').on('click', function () {
        var btn = $(this);
        btn.prop('disabled', true);
        showLoader(); // Show loader before Google auth

        if (googleAuth) {
            googleAuth.signIn().then(function (response) {
                var profile = response.getBasicProfile();
                var email = profile.getEmail();
                hideLoader(); // Hide loader on success

                Toastify({
                    text: "Login successful via Google with email " + email,
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    style: {
                        background: "#10b981",
                        borderRadius: "12px",
                        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)"
                    }
                }).showToast();
                btn.prop('disabled', false);
            }, function (error) {
                hideLoader(); // Hide loader on error

                Toastify({
                    text: "Google Sign-In failed",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    style: {
                        background: "#ef4444",
                        borderRadius: "12px",
                        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)"
                    }
                }).showToast();
                btn.prop('disabled', false);
            });
        }
    });
});