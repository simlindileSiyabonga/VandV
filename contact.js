// Mobile menu toggle
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        
        if (navLinks.style.display === 'flex') {
            navLinks.style.position = 'absolute';
            navLinks.style.top = '100%';
            navLinks.style.left = '0';
            navLinks.style.right = '0';
            navLinks.style.flexDirection = 'column';
            navLinks.style.background = 'rgba(10, 10, 10, 0.98)';
            navLinks.style.padding = '2rem';
            navLinks.style.borderTop = '1px solid rgba(74, 144, 226, 0.2)';
            navLinks.style.gap = '1.5rem';
        }
    });
}

// Add scroll effect to header
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        header.style.boxShadow = '0 5px 20px rgba(0,0,0,0.5)';
    } else {
        header.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// Animate contact items on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.contact-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Contact form handling
const contactForm = document.getElementById('contactForm');
const successMessage = document.getElementById('successMessage');

if (contactForm) {
    // File upload handling
    const supportingDocs = document.getElementById('supportingDocs');

    // Update file name display for Supporting Docs
    if (supportingDocs) {
        supportingDocs.addEventListener('change', function() {
            const label = this.parentElement.querySelector('.file-name');
            if (this.files.length > 0) {
                let totalSize = 0;
                let fileNames = [];
                let validFiles = true;
                
                for (let i = 0; i < this.files.length; i++) {
                    const file = this.files[i];
                    totalSize += file.size;
                    
                    // Check individual file size
                    if (file.size > 5 * 1024 * 1024) {
                        alert('Each file must be less than 5MB: ' + file.name);
                        validFiles = false;
                        break;
                    }
                    
                    // Check file type
                    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
                    if (!allowedTypes.includes(file.type)) {
                        alert('Only JPG, PNG, and PDF files are allowed: ' + file.name);
                        validFiles = false;
                        break;
                    }
                    
                    fileNames.push(file.name);
                }
                
                if (!validFiles) {
                    this.value = '';
                    label.textContent = 'No files chosen';
                    return;
                }
                
                const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
                label.textContent = this.files.length + ' file(s) selected (' + totalSizeMB + ' MB)';
                label.style.color = 'var(--primary-blue)';
            } else {
                label.textContent = 'No files chosen';
                label.style.color = '';
            }
        });

        // Drag and drop functionality
        const dragDropArea = supportingDocs.parentElement;
        
        dragDropArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });
        
        dragDropArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
        });
        
        dragDropArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            supportingDocs.files = files;
            
            // Trigger change event
            const event = new Event('change');
            supportingDocs.dispatchEvent(event);
        });
    }
    
    // Form validation
    const inputs = contactForm.querySelectorAll('input[required], textarea[required], select[required]');

    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                validateField(this);
            }
        });
    });

    // Email validation
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            validateEmail(this);
        });
    }

    // Phone number formatting (optional)
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 0) {
                if (value.startsWith('27')) {
                    value = '+' + value;
                } else if (!value.startsWith('+')) {
                    value = '+27' + value;
                }
            }
            e.target.value = value;
        });
    }

    // Form submission
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate all fields
        let isValid = true;
        inputs.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });

        if (!validateEmail(emailInput)) {
            isValid = false;
        }

        if (!isValid) {
            showNotification('Please fill in all required fields correctly', 'error');
            return;
        }

        // Get submit button
        const submitBtn = contactForm.querySelector('.submit-btn');
        const originalHTML = submitBtn.innerHTML;
        
        // Show loading state
        submitBtn.innerHTML = '<span class="btn-text">Sending...</span><span class="btn-icon">⏳</span>';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';

        try {
            // Submit form using Formspree or your preferred service
            const formData = new FormData(contactForm);
            
            // If using Formspree, the form will submit automatically
            // For demo purposes, we'll simulate the submission
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // Show success message
                submitBtn.innerHTML = '<span class="btn-text">Message Sent!</span><span class="btn-icon">✅</span>';
                submitBtn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
                
                // Hide form and show success message
                setTimeout(() => {
                    contactForm.style.display = 'none';
                    successMessage.style.display = 'block';
                    successMessage.style.animation = 'fadeInUp 0.6s ease-out';
                }, 1000);

                // Reset form
                contactForm.reset();
                
                // Track conversion (if using analytics)
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'form_submit', {
                        'event_category': 'Contact',
                        'event_label': 'Contact Form Submission'
                    });
                }
            } else {
                throw new Error('Form submission failed');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            
            // Show error message
            submitBtn.innerHTML = '<span class="btn-text">Failed to Send</span><span class="btn-icon">❌</span>';
            submitBtn.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
            
            showNotification('Oops! Something went wrong. Please try again or email us directly at hello@vibezandviews.com', 'error');
            
            // Reset button after 3 seconds
            setTimeout(() => {
                submitBtn.innerHTML = originalHTML;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
                submitBtn.style.opacity = '';
            }, 3000);
        }
    });
}

// Field validation function
function validateField(field) {
    if (field.value.trim() === '' && field.hasAttribute('required')) {
        field.classList.add('error');
        field.classList.remove('success');
        field.style.borderColor = '#cd3232';
        return false;
    } else {
        field.classList.remove('error');
        field.classList.add('success');
        field.style.borderColor = 'var(--primary-blue)';
        return true;
    }
}

// Email validation function
function validateEmail(emailField) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const errorMsg = document.querySelector('.email-error');
    
    if (!emailPattern.test(emailField.value) && emailField.value !== '') {
        emailField.style.borderColor = '#cd3232';
        emailField.classList.add('error');
        
        if (!errorMsg) {
            const error = document.createElement('span');
            error.className = 'email-error';
            error.style.color = '#cd3232';
            error.style.fontSize = '0.85rem';
            error.style.marginTop = '0.3rem';
            error.style.display = 'block';
            error.textContent = 'Please enter a valid email address';
            emailField.parentElement.appendChild(error);
        }
        return false;
    } else if (emailField.value === '') {
        emailField.style.borderColor = '#cd3232';
        return false;
    } else {
        emailField.style.borderColor = 'var(--primary-blue)';
        emailField.classList.remove('error');
        if (errorMsg) errorMsg.remove();
        return true;
    }
}

// Show notification function
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.position = 'fixed';
    notification.style.top = '100px';
    notification.style.right = '20px';
    notification.style.background = type === 'success' ? 'linear-gradient(135deg, #4CAF50, #45a049)' : 'linear-gradient(135deg, #f44336, #d32f2f)';
    notification.style.color = '#fff';
    notification.style.padding = '1rem 1.5rem';
    notification.style.borderRadius = '12px';
    notification.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
    notification.style.zIndex = '10000';
    notification.style.maxWidth = '400px';
    notification.style.animation = 'slideInRight 0.4s ease-out';
    notification.style.fontWeight = '600';
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 400);
    }, 5000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);