// Password visibility toggle
const togglePasswordButtons = document.querySelectorAll('.toggle-password');

togglePasswordButtons.forEach(button => {
    button.addEventListener('click', function() {
        const passwordInput = this.previousElementSibling;
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.querySelector('i').classList.toggle('fa-eye');
        this.querySelector('i').classList.toggle('fa-eye-slash');
    });
});

// Role-dependent fields toggle
const roleSelect = document.getElementById('role');
const adminField = document.getElementById('adminField');
const studentField = document.getElementById('studentField');
const teacherField = document.getElementById('teacherField');

roleSelect.addEventListener('change', function() {
    // Hide all role-dependent fields first
    adminField.style.display = 'none';
    studentField.style.display = 'none';
    teacherField.style.display = 'none';

    // Show the appropriate field based on the selected role
    switch(this.value) {
        case 'ADMIN':
            adminField.style.display = 'block';
            break;
        case 'STUDENT':
            studentField.style.display = 'block';
            break;
        case 'TEACHER':
            teacherField.style.display = 'block';
            break;
    }
});

// Profile picture preview
const profilePictureInput = document.getElementById('profilePicture');
const profilePicturePreview = document.getElementById('profilePicturePreview');
const profilePlaceholder = document.getElementById('profilePlaceholder');

profilePictureInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const reader = new FileReader();

        reader.onload = function(e) {
            profilePicturePreview.style.backgroundImage = `url('${e.target.result}')`;
            profilePlaceholder.style.display = 'none';
        }

        reader.readAsDataURL(this.files[0]);
    }
});

// Form submission
document.getElementById("signupForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const fullName = document.getElementById("fullName").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const nic = document.getElementById("nic").value;
    const phoneNumber = document.getElementById("phoneNumber").value;
    const dateOfBirth = document.getElementById("dateOfBirth").value;
    const role = document.getElementById("role").value;
    const errorMessage = document.getElementById("errorMessage");

    // Get role-specific field value
    let schoolName = null;
    let grade = null;
    let subject = null;

    switch(role) {
        case 'ADMIN':
            schoolName = document.getElementById("schoolName").value;
            break;
        case 'STUDENT':
            grade = document.getElementById("grade").value;
            break;
        case 'TEACHER':
            subject = document.getElementById("subject").value;
            break;
    }

    // Password validation
    if (password !== confirmPassword) {
        errorMessage.textContent = "Passwords do not match!";
        errorMessage.style.display = "block";
        return;
    }

    // Get profile picture as base64 string
    let profilePicture = "";
    const profilePictureFile = document.getElementById("profilePicture").files[0];
    if (profilePictureFile) {
        try {
            const reader = new FileReader();
            profilePicture = await new Promise((resolve, reject) => {
                reader.onload = e => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(profilePictureFile);
            });
        } catch (error) {
            console.error("Error reading profile picture:", error);
        }
    }

    // Prepare data for submission
    const userData = {
        email,
        fullName,
        username,
        password,
        nic,
        phoneNumber,
        dateOfBirth,
        role,
        profilePicture,
        schoolName,
        grade,
        subject
    };

    try {
        const response = await fetch("http://localhost:8080/api/v1/user/sign_up", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            // Successful registration
            window.location.href = "login.html?registered=true";
        } else {
            errorMessage.textContent = data.message || "Registration failed. Please try again.";
            errorMessage.style.display = "block";
        }
    } catch (error) {
        errorMessage.textContent = "An error occurred. Please try again.";
        errorMessage.style.display = "block";
        console.error("Registration error:", error);
    }
});