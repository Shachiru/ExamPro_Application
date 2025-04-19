// login.js
document.addEventListener("DOMContentLoaded", function () {
    const togglePassword = document.getElementById('togglePassword');
    const password = document.getElementById('password');
    const loaderContainer = document.getElementById('loaderContainer');

    togglePassword.addEventListener('click', function () {
        const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
        password.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });

    function showLoader() {
        loaderContainer.style.display = 'flex';
    }

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
        showLoader();

        $.ajax({
            url: "http://localhost:8080/api/v1/auth/sign_in",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({email: email, password: password}),
            success: function (data) {
                console.log("Full login response:", JSON.stringify(data, null, 2));
                console.log("Response data:", data.data);

                if (!data.data || !data.data.token) {
                    console.error("No token in response");
                    throw new Error("No token received from server");
                }

                const token = data.data.token;
                console.log("Received token:", token);
                localStorage.setItem("token", token);
                localStorage.setItem("role", data.data.role);
                localStorage.setItem("email", data.data.email); // Store email for profile

                const storedToken = localStorage.getItem("token");
                console.log("Stored token from localStorage:", storedToken);

                const tokenParts = token.split('.');
                console.log("Token parts count:", tokenParts.length);
                if (tokenParts.length !== 3) {
                    console.error("Invalid token format:", token);
                    localStorage.removeItem("token");
                    throw new Error("Received token is not a valid JWT");
                }

                hideLoader();
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
                    redirectBasedOnRole(data.data.role, submitButton);
                }, 1000);
            },
            error: function (xhr) {
                hideLoader();
                console.error("Login error status:", xhr.status);
                console.error("Login error response:", xhr.responseText);
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

    function redirectBasedOnRole(role, button) {
        if (role === "SUPER_ADMIN") {
            window.location.href = "super-admin-dashboard.html";
        } else if (role === "ADMIN") {
            window.location.href = "admin-dashboard.html";
        } else if (role === "TEACHER") {
            window.location.href = "teacher-dashboard.html";
        } else if (role === "STUDENT") {
            window.location.href = "student-dashboard.html";
        } else {
            $("#errorMessage").text("Invalid Role Assigned!").show();
            button.prop("disabled", false).val("Sign In");
        }
    }
});