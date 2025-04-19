document.addEventListener('DOMContentLoaded', function () {
    const loader = document.getElementById('loader');

    loader.style.display = 'flex';
    window.addEventListener('load', function () {
        setTimeout(() => {
            loader.classList.add('fade-out');
            setTimeout(() => loader.style.display = 'none', 500);
        }, 1000);
    });

    document.getElementById('loginBtn').addEventListener('click', function (e) {
        e.preventDefault();
        loader.style.display = 'flex';
        loader.classList.remove('fade-out');
        setTimeout(() => {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.style.display = 'none';
                window.location.href = 'login.html';
            }, 500);
        }, 800);
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({behavior: 'smooth'});
            }
        });
    });

    const animateOnScroll = function () {
        const cards = document.querySelectorAll('.feature-card, .testimonial-card');
        cards.forEach(card => {
            const cardPosition = card.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.2;
            if (cardPosition < screenPosition) {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }
        });
    };
    window.addEventListener('scroll', animateOnScroll);
    window.addEventListener('load', animateOnScroll);
    document.querySelectorAll('.feature-card, .testimonial-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    // Subscribe form submission with validation
    document.getElementById('subscribeForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const email = document.getElementById('subscribeEmail');
        const emailValue = email.value.trim();
        const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

        if (!emailPattern.test(emailValue)) {
            alert('Please enter a valid email address.');
            return;
        }

        loader.style.display = 'flex';
        loader.classList.remove('fade-out');

        fetch('/api/subscribe', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email: emailValue})
        })
            .then(response => {
                loader.classList.add('fade-out');
                setTimeout(() => loader.style.display = 'none', 500);
                if (response.ok) {
                    alert('Subscribed successfully!');
                    email.value = '';
                } else {
                    alert('Subscription failed. Please try again later.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                loader.classList.add('fade-out');
                setTimeout(() => loader.style.display = 'none', 500);
                alert('An error occurred. Please try again.');
            });
    });

    // Add scroll effect to navbar
    window.addEventListener('scroll', function () {
        const navbar = document.getElementById('mainNav');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    window.addEventListener('scroll', function () {
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.nav-link');

        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;

            if (window.scrollY >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            const span = link.querySelector('span');
            if (span) {
                span.remove();
            }

            const href = link.getAttribute('href');
            if (href === `#${current}`) {
                link.classList.add('active');
                link.innerHTML += `<span class="position-absolute bottom-0 start-50 translate-middle-x bg-primary" style="height: 2px; width: 50%; opacity: 0.8;"></span>`;
            }
        });
    });
});