/**
 * Forms handling for Raphael's Horizon
 * Handles Contact Us and Speaking Request forms via the backend API
 */

document.addEventListener('DOMContentLoaded', () => {
    // Contact Form Handling
    const contactForm = document.getElementById('professional-contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const responseMsg = document.getElementById('response-message');
            const originalBtnText = submitBtn.innerText;
            
            // Get form data
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());
            
            try {
                // Set loading state
                submitBtn.disabled = true;
                submitBtn.innerText = 'Sending...';
                if (responseMsg) responseMsg.className = '';
                if (responseMsg) responseMsg.innerText = '';

                // Determine API URL
                const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://localhost:5002/api/contact'
                    : '/api/contact';

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    if (responseMsg) {
                        responseMsg.innerText = 'Thank you! Your message has been sent successfully.';
                        responseMsg.className = 'success-message';
                        responseMsg.style.color = 'green';
                        responseMsg.style.marginTop = '10px';
                    }
                    contactForm.reset();
                } else {
                    throw new Error(result.message || 'Failed to send message');
                }
            } catch (error) {
                console.error('Error submitting contact form:', error);
                if (responseMsg) {
                    responseMsg.innerText = 'Sorry, there was an error sending your message. Please try again later.';
                    responseMsg.className = 'error-message';
                    responseMsg.style.color = 'red';
                    responseMsg.style.marginTop = '10px';
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
            }
        });
    }

    // Speaking Request Form Handling
    const speakingForm = document.getElementById('speaking-request-form');
    if (speakingForm) {
        speakingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = speakingForm.querySelector('button[type="submit"]');
            const responseMsg = document.createElement('div');
            responseMsg.id = 'speaking-response-message';
            const originalBtnText = submitBtn.innerText;
            
            // Append response message after form if it doesn't exist
            if (!document.getElementById('speaking-response-message')) {
                speakingForm.appendChild(responseMsg);
            }
            
            // Get form data
            const formData = new FormData(speakingForm);
            const data = Object.fromEntries(formData.entries());
            
            // Add additional details if needed
            if (data.message && !data.details) {
                data.details = data.message;
            }
            
            try {
                // Set loading state
                submitBtn.disabled = true;
                submitBtn.innerText = 'Submitting...';
                
                const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://localhost:5002/api/contact/speaking'
                    : '/api/contact/speaking';

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    responseMsg.innerText = 'Thank you! Your speaking request has been submitted successfully.';
                    responseMsg.style.color = 'green';
                    responseMsg.style.padding = '15px';
                    responseMsg.style.marginTop = '20px';
                    responseMsg.style.backgroundColor = '#e8f5e9';
                    responseMsg.style.borderRadius = '5px';
                    speakingForm.reset();
                    
                    // Scroll to message
                    responseMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    throw new Error(result.message || 'Failed to submit request');
                }
            } catch (error) {
                console.error('Error submitting speaking request:', error);
                responseMsg.innerText = 'Sorry, there was an error submitting your request. Please email us directly.';
                responseMsg.style.color = 'red';
                responseMsg.style.padding = '15px';
                responseMsg.style.marginTop = '20px';
                responseMsg.style.backgroundColor = '#ffebee';
                responseMsg.style.borderRadius = '5px';
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
            }
        });
    }
});
