// Password visibility toggle
const togglePassword = document.querySelector('.toggle-password');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.querySelector('i').classList.toggle('fa-eye');
    this.querySelector('i').classList.toggle('fa-eye-slash');
});

// Form submission
document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("errorMessage");

    try {
        const response = await fetch("http://localhost:8080/api/v1/auth/sign_in", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.data.token);
            localStorage.setItem("role", data.data.role);

            if (data.data.role === "ADMIN") {
                window.location.href = "admin-dashboard.html";
            } else if (data.data.role === "TEACHER") {
                window.location.href = "teacher-dashboard.html";
            } else if (data.data.role === "STUDENT") {
                window.location.href = "student-admin-dashboard.html";
            } else {
                errorMessage.textContent = "Invalid Role Assigned!";
                errorMessage.style.display = "block";
            }
        } else {
            errorMessage.textContent = data.message || "Invalid email or password!";
            errorMessage.style.display = "block";
        }
    } catch (error) {
        errorMessage.textContent = "An error occurred. Please try again.";
        errorMessage.style.display = "block";
    }
});