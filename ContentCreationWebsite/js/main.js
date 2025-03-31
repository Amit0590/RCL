// Main JavaScript file for ContentPro website

// Form handling for content request form
// Authentication check function
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    if (!user || !token) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return false;
    }
    return true;
}

// Update UI based on authentication status
function updateAuthUI() {
    const isLoggedIn = checkAuth();
    const loginBtn = document.querySelector('.login-btn');
    const signupBtn = document.querySelector('.signup-btn');
    const logoutBtn = document.querySelector('.logout-btn');
    const profileLink = document.querySelector('.profile-link');

    if (isLoggedIn) {
        // User is logged in
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (profileLink) profileLink.style.display = 'inline-block';
        
        // Get user data
        const user = JSON.parse(localStorage.getItem('user'));
        // Update any user-specific UI elements
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.textContent = `${user.firstName} ${user.lastName}`;
        }
    } else {
        // User is not logged in
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (signupBtn) signupBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (profileLink) profileLink.style.display = 'none';
        
        // Redirect to login if on a protected page
        const currentPage = window.location.pathname;
        const protectedPages = ['dashboard.html', 'profile.html', 'request.html'];
        if (protectedPages.some(page => currentPage.endsWith(page))) {
            window.location.href = 'login.html';
            return false;
        }
    }
    return true;
}

// Function to handle OAuth login and signup
function handleOAuthRedirect(event, provider) {
    event.preventDefault();
    window.location.href = `/auth/${provider}`;
}

document.addEventListener('DOMContentLoaded', function() {
    // Update auth UI on every page load
    updateAuthUI();
    
    // Setup OAuth button handlers
    const socialButtons = document.querySelectorAll('.social-icon');
    if (socialButtons) {
        socialButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                // Extract provider from href (e.g., /auth/google -> google)
                const provider = this.getAttribute('href').split('/').pop();
                handleOAuthRedirect(e, provider);
            });
        });
    }
    
    // Setup logout functionality
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                credentials: 'include'
            })
            .then(() => {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                window.location.href = 'index.html';
            })
            .catch(error => {
                console.error('Logout error:', error);
                // Force logout even if API call fails
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                window.location.href = 'index.html';
            });
        });
    }
    
    // Content request form handling
    const requestForm = document.getElementById('requestForm');
    if (requestForm) {
        // Check authentication on request page
        if (!updateAuthUI()) return;
        
        requestForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(requestForm);
            const requestData = {};
            
            for (const [key, value] of formData.entries()) {
                requestData[key] = value;
            }
            
            // Send request to server
            fetch('/api/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(requestData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Your content request has been submitted successfully! Request ID: ' + data.requestId);
                    requestForm.reset();
                    window.location.href = 'dashboard.html';
                } else {
                    alert('Error submitting request: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while submitting your request. Please try again.');
            });
        });
        
        // Show/hide other content type field based on selection
        const contentTypeRadios = document.querySelectorAll('input[name="contentType"]');
        const otherContentTypeGroup = document.getElementById('otherContentTypeGroup');
        
        contentTypeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'other' && this.checked) {
                    otherContentTypeGroup.style.display = 'block';
                } else {
                    otherContentTypeGroup.style.display = 'none';
                }
            });
        });
        
        // Calculate estimated price based on selections
        const wordCountInput = document.getElementById('wordCount');
        const urgencySelect = document.getElementById('urgency');
        const priceEstimate = document.getElementById('priceEstimate');
        
        function updatePriceEstimate() {
            if (!wordCountInput || !urgencySelect || !priceEstimate) return;
            
            const wordCount = parseInt(wordCountInput.value) || 0;
            const urgency = urgencySelect.value;
            
            // Base rate: $0.10 per word
            let baseRate = 0.10;
            
            // Urgency multipliers
            const urgencyMultipliers = {
                'standard': 1.0,  // 7+ days
                'rush': 1.5,      // 3-6 days
                'urgent': 2.0     // 1-2 days
            };
            
            // Calculate price
            const estimatedPrice = wordCount * baseRate * urgencyMultipliers[urgency];
            
            // Update price display
            priceEstimate.textContent = '$' + estimatedPrice.toFixed(2);
        }
        
        // Add event listeners for price calculation
        if (wordCountInput && urgencySelect) {
            wordCountInput.addEventListener('input', updatePriceEstimate);
            urgencySelect.addEventListener('change', updatePriceEstimate);
            
            // Initial calculation
            updatePriceEstimate();
        }
    }
    
    // Login form handling
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Send login request to server
            fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.success && data.token) {
                    // Store user data and token in localStorage
                    localStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.setItem('token', data.token);
                    window.location.href = 'dashboard.html';
                } else {
                    throw new Error(data.message || 'Login failed');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                const errorMessage = error.message || 'An error occurred during login';
                alert(errorMessage);
                // Clear password field for security
                document.getElementById('password').value = '';
            });
        });
    }
    
    // Signup form handling
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const company = document.getElementById('company')?.value || ''; // Add company field with optional chaining
            
            // Validate passwords match
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
            
            // Send signup request to server
            fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    password,
                    company
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Store user data in localStorage
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    // Now we'll login automatically after signup
                    fetch('/api/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify({ email, password })
                    })
                    .then(response => response.json())
                    .then(loginData => {
                        if (loginData.success && loginData.token) {
                            localStorage.setItem('token', loginData.token);
                            alert('Registration successful! Redirecting to dashboard...');
                            window.location.href = 'dashboard.html';
                        } else {
                            alert('Registration successful! Please log in.');
                            window.location.href = 'login.html';
                        }
                    })
                    .catch(error => {
                        alert('Registration successful! Please log in.');
                        window.location.href = 'login.html';
                    });
                } else {
                    throw new Error(data.message || 'Registration failed');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred during registration. Please try again.');
            });
        });
    }
    
    // Dashboard tab functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabButtons.length > 0 && tabContents.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                // Show corresponding content
                const tabId = button.getAttribute('data-tab');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
    }
    
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const authButtons = document.querySelector('.auth-buttons');
    
    if (hamburger && navLinks && authButtons) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            authButtons.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
});