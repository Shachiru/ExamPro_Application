document.addEventListener("DOMContentLoaded", function () {
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');

    togglePassword.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.querySelector('i').classList.toggle('fa-eye');
        this.querySelector('i').classList.toggle('fa-eye-slash');
    });

    $("#loginForm").on("submit", function (event) {
        event.preventDefault();
        const email = $("#email").val().trim();
        const password = $("#password").val().trim();
        const errorMessage = $("#errorMessage");
        const submitButton = $("button[type='submit']");

        if (!email || !password) {
            Toastify({
                text: "Please fill in all fields",
                duration: 3000,
                gravity: "top",
                position: "right",
                style: { background: "#ef4444", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)" }
            }).showToast();
            return;
        }

        submitButton.prop("disabled", true).text("Signing in...");
        $.ajax({
            url: "http://localhost:8080/api/v1/auth/sign_in",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ email: email, password: password }),
            success: function (data) {
                localStorage.setItem("token", data.data.token);
                localStorage.setItem("role", data.data.role);
                Toastify({
                    text: "Welcome to ExamPro! Login Successful",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    style: {
                        background: "#10b981",
                        borderRadius: "12px",
                        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: "1rem",
                        fontWeight: "500",
                        padding: "1rem 1.5rem",
                        color: "#fff"
                    }
                }).showToast();
                setTimeout(function () {
                    if (data.data.role === "ADMIN") window.location.href = "admin-dashboard.html";
                    else if (data.data.role === "TEACHER") window.location.href = "teacher-dashboard.html";
                    else if (data.data.role === "STUDENT") window.location.href = "student-dashboard.html";
                    else errorMessage.text("Invalid Role Assigned!").show();
                }, 1000);
            },
            error: function (xhr) {
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
                        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: "1rem",
                        fontWeight: "500",
                        padding: "1rem 1.5rem",
                        color: "#fff"
                    }
                }).showToast();
                submitButton.prop("disabled", false).text("Login");
            }
        });
    });

    // Google Sign-In
    var googleAuth;
    gapi.load('auth2', function() {
        googleAuth = gapi.auth2.init({
            client_id: 'YOUR_CLIENT_ID_HERE', // Replace with your Google Client ID
            scope: 'profile email',
            cookiepolicy: 'single_host_origin'
        });
    });

    $('#google-sign-in').on('click', function() {
        var btn = $(this);
        var originalText = btn.text();
        btn.prop('disabled', true).text("Signing in with Google...");

        if (googleAuth) {
            googleAuth.signIn().then(function(response) {
                var profile = response.getBasicProfile();
                var email = profile.getEmail();
                Toastify({
                    text: "Login successful via Google with email " + email,
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    style: {
                        background: "#10b981",
                        borderRadius: "12px",
                        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: "1rem",
                        fontWeight: "500",
                        padding: "1rem 1.5rem",
                        color: "#fff"
                    }
                }).showToast();
                btn.prop('disabled', false).text(originalText);
                // Add logic to handle Google token if needed
            }, function(error) {
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
                btn.prop('disabled', false).text(originalText);
            });
        } else {
            Toastify({
                text: "Google Sign-In not initialized",
                duration: 3000,
                gravity: "top",
                position: "right",
                style: {
                    background: "#ef4444",
                    borderRadius: "12px",
                    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)"
                }
            }).showToast();
            btn.prop('disabled', false).text(originalText);
        }
    });
});