const themeToggle = document.getElementById('theme-toggle');
const wholePizzaIcon = themeToggle.querySelector('.icon-whole');
const slicePizzaIcon = themeToggle.querySelector('.icon-slice');
const navToggleButton = document.getElementById("nav-toggle-button");
const mobileFloatNav = document.querySelector(".mobile-float-nav");
const desktopNav = document.querySelector(".desktop-nav");
const centerCircle = document.querySelector(".center-circle");
const navSegments = document.querySelectorAll(".mobile-float-nav .nav-segment");    
const contactForm = document.getElementById('contactForm');
const formResponse = document.getElementById('formResponse');
const emailField = document.getElementById('email');
const messageField = document.getElementById('message');
const submitBtn = document.getElementById('submitBtn');

function togglePizzaTheme() {
    const theme = document.documentElement.getAttribute('data-theme');

    // Change icons based on the current theme
    if (theme === 'dark') {
        wholePizzaIcon.style.transform = 'rotate(-180deg) scale(0)';
        slicePizzaIcon.style.transform = 'rotate(0deg) scale(1)';
    } else {
        wholePizzaIcon.style.transform = 'rotate(0deg) scale(1)';
        slicePizzaIcon.style.transform = 'rotate(180deg) scale(0)';
    }
}

// Set initial state of icons when the page loads
document.addEventListener('DOMContentLoaded', () => {
    togglePizzaTheme();
});

// Handler for theme toggle button click
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = (currentTheme === 'dark') ? 'light' : 'dark';
    
    // Toggle the theme
    document.documentElement.setAttribute('data-theme', newTheme);

    // Save the new theme to localStorage
    try {
        localStorage.setItem('theme', newTheme);
    } catch (error) {
        console.error("Error saving theme to localStorage:", error.message);
    }

    togglePizzaTheme();
});

// Function to initialize the theme based on localStorage, URL parameter, or browser preference
const initTheme = () => {
    let savedTheme;
    
    try {
        // Attempt to get the theme from localStorage
        savedTheme = localStorage.getItem('theme');
    } catch (error) {
        console.error("Error reading theme from localStorage:", error.message);
        savedTheme = null; 
    }

    // Get the theme from the URL parameters, if set
    const urlTheme = new URLSearchParams(window.location.search).get('theme');
    
    // Get the system's preferred theme (either dark or light)
    const browserTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    // Set the theme, prioritizing URL parameter > saved theme > browser preference > default to light
    const themeToSet = urlTheme || savedTheme || browserTheme || 'light';
    
    // Set the theme on the document element
    document.documentElement.setAttribute('data-theme', themeToSet);
    
    // Ensure theme is saved to localStorage when initialized (if it wasn't already)
    if (savedTheme !== themeToSet) {
        try {
            localStorage.setItem('theme', themeToSet);
        } catch (error) {
            console.error("Error saving theme to localStorage:", error.message);
        }
    }
}

// Initialize the theme on page load
initTheme();


    // Toggle Mobile/ Desktop Navigation
    const toggleNavVisibility = () => {
        const isMobile = window.innerWidth <= 768;
        desktopNav.style.display = isMobile ? 'none' : 'flex';
        mobileFloatNav.style.display = isMobile ? 'flex' : 'none';
        navToggleButton.style.display = isMobile ? 'block' : 'none';
    };

    window.addEventListener("resize", toggleNavVisibility);
    toggleNavVisibility();

    // Show/Hide Mobile Navigation on button click
    navToggleButton.addEventListener("click", () => mobileFloatNav.classList.toggle("hidden"));
    
    // Scroll to specific sections when navigation segments are clicked
    navSegments.forEach(segment => {
        segment.addEventListener("click", () => {
            const targetSection = document.getElementById(segment.getAttribute("data-target"));
            targetSection?.scrollIntoView({ behavior: "smooth" });
        });
    });

    // Scroll to top when center circle is clicked
    centerCircle.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

    // Arrange navigation segments in a circular layout
    const radius = 50, totalSegments = navSegments.length;
    navSegments.forEach((segment, index) => {
        const angle = (360 / totalSegments) * index;
        segment.style.transform = `translate(${radius * Math.cos((angle * Math.PI) / 180)}px, ${radius * Math.sin((angle * Math.PI) / 180)}px)`;
    });

    // Fix desktop navigation at top when scrolled
    const navOffsetTop = desktopNav.offsetTop;
    window.addEventListener("scroll", () => {
        desktopNav.classList.toggle("fixed", window.scrollY > navOffsetTop);
    });



    // Script for smooth scrolling to a section
document.querySelector('.see-more-button').addEventListener('click', function (e) {
    e.preventDefault(); // Disabling the standard link behavior
    document.querySelector('#section1').scrollIntoView({
        behavior: 'smooth'
    });
});


 // Form Validation
 const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;    

 const validateForm = () => {
     const isEmailValid = emailPattern.test(emailField.value.trim());
     const isMessageValid = messageField.value.trim() !== '';
     submitBtn.disabled = !(isEmailValid && isMessageValid);
 };

 emailField.addEventListener('input', validateForm);
 messageField.addEventListener('input', validateForm);

 // Safe function to read from localStorage
 function safeReadStorage(key) {
     try {
         return JSON.parse(localStorage.getItem(key)) || [];
     } catch (error) {
         console.error("Error reading from localStorage:", error.message);
         return [];
     }
 }

 // Safe function to write to localStorage
 function safeWriteStorage(key, value) {
     try {
         localStorage.setItem(key, JSON.stringify(value));
     } catch (error) {
         console.error("Error writing to localStorage:", error.message);
     }
 }

 contactForm.addEventListener('submit', async (e) => {
     e.preventDefault();
     submitBtn.disabled = true;
     formResponse.textContent = '';

     // Spam Protection
     const now = Date.now();
     const oneMinute = 60 * 1000;
     let submissions = safeReadStorage('submissions');

     // Remove entries older than one minute
     const recentSubmissions = submissions.filter(timestamp => now - timestamp < oneMinute);
     
     if (recentSubmissions.length >= 5) {
         formResponse.textContent = 'You have reached the maximum of 5 submissions per minute. Please try again later.';
         formResponse.style.color = 'red';
         submitBtn.disabled = false;
         return;
     }

     if (recentSubmissions.length && now - recentSubmissions[recentSubmissions.length - 1] < oneMinute) {
         formResponse.textContent = 'Please wait at least a minute before submitting again.';
         formResponse.style.color = 'red';
         submitBtn.disabled = false;
         return;
     }

     recentSubmissions.push(now);
     safeWriteStorage('submissions', recentSubmissions);

     // Change button text to "Sending..."
     submitBtn.textContent = 'Sending...';

     const formData = new FormData(contactForm);
     try {
         const response = await fetch('https://script.google.com/macros/s/AKfycbxUbPt7dwfbK928m-KRled0s4km18cJCgZHV9Nohf7MnvCoxxrSvMXqs1zblzi1wWfq/exec', {
             method: 'POST',
             body: formData
         });

         if (response.ok) {
             formResponse.textContent = 'Message sent successfully!';
             formResponse.style.color = 'green';
             contactForm.reset();
         } else {
             formResponse.textContent = 'Error sending message. Please try again later.';
             formResponse.style.color = 'red';
         }
     } catch (error) {
         console.error('Error sending form:', error.message);
         formResponse.textContent = 'Error connecting to the server. Please try again.';
         formResponse.style.color = 'red';
     } finally {
         submitBtn.textContent = 'Send Message';
         submitBtn.disabled = false;
     }
 });

