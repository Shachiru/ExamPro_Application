document.addEventListener("DOMContentLoaded", function () {
    // Form steps navigation
    const steps = document.querySelectorAll('.step');
    const stepContents = document.querySelectorAll('.step-content');
    const step1Next = document.getElementById('step1Next');
    const step2Next = document.getElementById('step2Next');
    const step2Prev = document.getElementById('step2Prev');
    const step3Prev = document.getElementById('step3Prev');

    step1Next.addEventListener('click', function () {
        // Validate step 1
        const fullName = document.getElementById('fullName').value.trim();
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();

        if (!fullName || !username || !email || !password || !confirmPassword) {
            Toastify({
                text: "Please fill in all fields",
                duration: 3000,
                gravity: "top",
                position: "right",
                style: {background: "#ef4444", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)"}
            }).showToast();
            return;
        }

        if (password !== confirmPassword) {
            Toastify({
                text: "Passwords do not match",
                duration: 3000,
                gravity: "top",
                position: "right",
                style: {background: "#ef4444", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)"}
            }).showToast();
            return;
        }

        // Move to step 2
        steps[0].classList.remove('active');
        steps[1].classList.add('active');
        stepContents[0].classList.remove('active');
        stepContents[1].classList.add('active');
    });

    step2Next.addEventListener('click', function () {
        // Validate step 2
        const nic = document.getElementById('nic').value.trim();
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        const dateOfBirth = document.getElementById('dateOfBirth').value;

        if (!nic || !phoneNumber || !dateOfBirth) {
            Toastify({
                text: "Please fill in all fields",
                duration: 3000,
                gravity: "top",
                position: "right",
                style: {background: "#ef4444", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)"}
            }).showToast();
            return;
        }

        // Move to step 3
        steps[1].classList.remove('active');
        steps[2].classList.add('active');
        stepContents[1].classList.remove('active');
        stepContents[2].classList.add('active');
    });

    step2Prev.addEventListener('click', function () {
        // Move back to step 1
        steps[1].classList.remove('active');
        steps[0].classList.add('active');
        stepContents[1].classList.remove('active');
        stepContents[0].classList.add('active');
    });

    step3Prev.addEventListener('click', function () {
        // Move back to step 2
        steps[2].classList.remove('active');
        steps[1].classList.add('active');
        stepContents[2].classList.remove('active');
        stepContents[1].classList.add('active');
    });

    // Password toggle and strength meter
    const togglePassword = document.getElementById('togglePassword');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const passwordStrengthBar = document.querySelector('.password-strength-bar');

    togglePassword.addEventListener('click', function () {
        const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
        password.setAttribute('type', type);
        confirmPassword.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });

    password.addEventListener('input', function () {
        const value = this.value;

        // Simple password strength check
        if (value.length < 6) {
            passwordStrengthBar.className = 'password-strength-bar';
            passwordStrengthBar.classList.add('weak');
        } else if (value.length < 10) {
            passwordStrengthBar.className = 'password-strength-bar';
            passwordStrengthBar.classList.add('medium');
        } else {
            passwordStrengthBar.className = 'password-strength-bar';
            passwordStrengthBar.classList.add('strong');
        }
    });

    // Profile image upload
    const loaderContainer = document.getElementById('loaderContainer');
    const profileInput = document.getElementById('profileInput');
    const profileImageContainer = document.getElementById('profileImageContainer');
    let profileImageFile = null;

    profileInput.addEventListener('change', function (e) {
        if (e.target.files && e.target.files[0]) {
            profileImageFile = e.target.files[0];
            const reader = new FileReader();

            reader.onload = function (e) {
                profileImageContainer.innerHTML = `<img src="${e.target.result}" class="profile-image" alt="Profile Preview">`;
            }

            reader.readAsDataURL(profileImageFile);
        }
    });

    profileImageContainer.addEventListener('click', function () {
        profileInput.click();
    });

    // Loader functions
    function showLoader() {
        loaderContainer.style.display = 'flex';
    }

    function hideLoader() {
        loaderContainer.style.display = 'none';
    }

    // Form submission
    $("#signupForm").on("submit", function (event) {
        event.preventDefault();

        const fullName = $("#fullName").val().trim();
        const username = $("#username").val().trim();
        const email = $("#email").val().trim();
        const password = $("#password").val().trim();
        const confirmPasswordVal = $("#confirmPassword").val().trim();
        const nic = $("#nic").val().trim();
        const phoneNumber = $("#phoneNumber").val().trim();
        const dateOfBirth = $("#dateOfBirth").val();
        const grade = $("#grade").val().trim();
        const schoolName = $("#schoolName").val().trim();

        const errorMessage = $("#errorMessage");
        const submitButton = $(".signup-button");

        if (!fullName || !username || !email || !password || !confirmPasswordVal || !nic ||
            !phoneNumber || !dateOfBirth || !grade || !schoolName) {
            Toastify({
                text: "Please fill in all fields",
                duration: 3000,
                gravity: "top",
                position: "right",
                style: {background: "#ef4444", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)"}
            }).showToast();
            return;
        }

        if (password !== confirmPasswordVal) {
            Toastify({
                text: "Passwords do not match",
                duration: 3000,
                gravity: "top",
                position: "right",
                style: {background: "#ef4444", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)"}
            }).showToast();
            return;
        }

        const formData = new FormData();

        const userData = {
            fullName: fullName,
            username: username,
            email: email,
            password: password,
            confirmPassword: confirmPasswordVal,
            nic: nic,
            phoneNumber: phoneNumber,
            dateOfBirth: dateOfBirth,
            grade: grade,
            schoolName: schoolName,
            role: "STUDENT"
        };

        formData.append('userDTO', new Blob([JSON.stringify(userData)], {type: 'application/json'}));

        if (profileImageFile) {
            formData.append('profileImage', profileImageFile);
        }

        submitButton.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-2"></i> Creating Account...');
        showLoader();

        $.ajax({
            url: "http://localhost:8080/api/v1/user/sign_up/student",
            method: "POST",
            processData: false,
            contentType: false,
            data: formData,
            success: function (data) {
                console.log("Registration successful:", data);

                hideLoader();

                if (data.data && data.data.token) {
                    localStorage.setItem("token", data.data.token);
                    localStorage.setItem("role", data.data.role);
                    localStorage.setItem("email", data.data.email);

                    Toastify({
                        text: "Registration Successful! Welcome to ExamPro.",
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
                        window.location.href = "student-dashboard.html";
                    }, 1500);
                } else {
                    errorMessage.text("Registration successful but token is missing").show();
                    submitButton.prop("disabled", false).html('Create Account <i class="fas fa-check ml-1"></i>');
                }
            },
            error: function (xhr) {
                hideLoader();
                console.error("Registration error:", xhr.responseText);

                let errorMsg = "Registration failed";
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }

                errorMessage.text(errorMsg).show();

                Toastify({
                    text: `Registration Failed: ${errorMsg}`,
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    style: {
                        background: "#ef4444",
                        borderRadius: "12px",
                        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)"
                    }
                }).showToast();

                submitButton.prop("disabled", false).html('Create Account <i class="fas fa-check ml-1"></i>');
            }
        });
    });
});