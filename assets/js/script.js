// ==============================================================
// ================ GLOBAL UTILITY FUNCTIONS ==================
// ==============================================================

// This function handles shifting the contact modal when the virtual keyboard appears on mobile
const handleKeyboardShift = () => {
    const contactModalContent = document.querySelector('#contact-modal .modal-content');
    if (!contactModalContent || window.innerWidth >= 768) return;

    const layoutViewportHeight = window.innerHeight;
    const visualViewportHeight = window.visualViewport.height;
    const keyboardHeight = layoutViewportHeight - visualViewportHeight;

    if (keyboardHeight > 100) {
        // Keyboard is open, move the modal up to re-center it in the visible area
        contactModalContent.style.transform = `translateY(-${keyboardHeight / 2}px)`;
    } else {
        // Keyboard is closed, reset position
        contactModalContent.style.transform = '';
    }
};


/**
 * Opens a specified modal element and handles layout shift robustly for all fixed elements.
 * This function is GLOBAL and can be accessed from auth.js.
 * @param {HTMLElement} modal - The modal element to open.
 */
function openModal(modal) {
    if (!modal) return;

    const htmlEl = document.documentElement;
    const body = document.body;
    const header = document.getElementById('main-header');
    const fabContainer = document.getElementById('fab-container');

    const currentlyOpenModal = document.querySelector('.modal.is-open');
    if (currentlyOpenModal && currentlyOpenModal !== modal) {
        currentlyOpenModal.classList.remove('is-open');
    }
    
    const scrollbarWidth = window.innerWidth - htmlEl.clientWidth;
    
    body.style.paddingRight = `${scrollbarWidth}px`;
    if (header) {
        // DEFINITIVE FIX: Temporarily disable transition, apply padding, force reflow, then re-enable transition.
        header.style.transition = 'none';
        header.style.paddingRight = `${scrollbarWidth}px`;
        header.offsetHeight; // Force browser reflow
        header.style.transition = '';
    }
    if (fabContainer) {
        fabContainer.style.right = `calc(1.5rem + ${scrollbarWidth}px)`;
    }

    modal.classList.add('is-open');
    htmlEl.classList.add('modal-open');

    if (modal.id === 'contact-modal' && window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleKeyboardShift);
    }

    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
        document.getElementById('mobile-menu-button')?.classList.remove('open');
        mobileMenu.classList.add('hidden');
    }
}

/**
 * Closes a specified modal element and resets layout.
 * This function is GLOBAL and can be accessed from auth.js.
 * @param {HTMLElement} modal - The modal element to close.
 */
function closeModal(modal) {
    if (!modal) return;

    const htmlEl = document.documentElement;
    const body = document.body;
    const header = document.getElementById('main-header');
    const fabContainer = document.getElementById('fab-container');
    
    modal.classList.remove('is-open');

    if (modal.id === 'contact-modal' && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleKeyboardShift);
        const contactModalContent = modal.querySelector('.modal-content');
        if (contactModalContent) {
            contactModalContent.style.transform = ''; // Reset position
        }
    }

    const anyOtherModalIsOpen = document.querySelector('.modal.is-open');
    
    if (!anyOtherModalIsOpen) {
        body.style.paddingRight = '';
        if (header) {
             // DEFINITIVE FIX: Temporarily disable transition, remove padding, force reflow, then re-enable transition.
            header.style.transition = 'none';
            header.style.paddingRight = '';
            header.offsetHeight; // Force browser reflow
            header.style.transition = '';
        }
        if (fabContainer) {
            fabContainer.style.right = '';
        }
        htmlEl.classList.remove('modal-open');
    }
}


// ==============================================================
// ============ DOM-DEPENDENT SCRIPT INITIALIZATION ===========
// ==============================================================

document.addEventListener('DOMContentLoaded', () => {
    const throttle = (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    const debounce = (func, delay) => {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    };

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const body = document.body;
    const htmlEl = document.documentElement;

// ===================================================================
// ======================= THREE.JS OPTIMIZATIONS ====================
// ===================================================================

    const canvas = document.getElementById('bg-canvas');
    let animationFrameId;
    let isAnimationRunning = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        powerPreference: "low-power",
        antialias: false
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 50;

    const particlesCount = 1200;
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 200;
    }
    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        color: 0x06b6d4,
        size: 0.15,
        transparent: true,
        opacity: 0.7
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    let mouseX = 0, mouseY = 0;
    if (!isTouchDevice) {
        document.addEventListener('mousemove', (event) => {
            if (body.classList.contains('slider-dragging')) return;
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        });
    }

    const clock = new THREE.Clock();
    function animate() {
        animationFrameId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();
        particles.rotation.y = elapsedTime * 0.05;

        if (!isTouchDevice) {
            camera.position.x += (mouseX * 5 - camera.position.x) * 0.05;
            camera.position.y += (mouseY * 5 - camera.position.y) * 0.05;
        }
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
    }

    function startAnimation() {
        if (!isAnimationRunning) {
            isAnimationRunning = true;
            animate();
        }
    }

    function stopAnimation() {
        if (isAnimationRunning) {
            cancelAnimationFrame(animationFrameId);
            isAnimationRunning = false;
        }
    }

    const canvasObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startAnimation();
            } else {
                stopAnimation();
            }
        });
    }, { threshold: 0.01 });
    canvasObserver.observe(canvas);

    const handleResize = debounce(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }, 250);
    window.addEventListener('resize', handleResize);

// ===================================================
// =============== CUSTOM CURSOR  ====================
// ===================================================

    if (!isTouchDevice) {
        const cursor = document.querySelector('.custom-cursor');
        
        let cursorX = 0;
        let cursorY = 0;
        let isCursorVisible = true;

        window.addEventListener('mousemove', e => {
            cursorX = e.clientX;
            cursorY = e.clientY;
        });
        
        const updateCursorPosition = () => {
            if(isCursorVisible) {
                cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
            }
            requestAnimationFrame(updateCursorPosition);
        };
        requestAnimationFrame(updateCursorPosition);
        
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('a, button')) {
                cursor.classList.add('link-hover');
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('a, button')) {
                cursor.classList.remove('link-hover');
            }
        });

        htmlEl.addEventListener('mouseleave', () => {
            cursor.classList.add('hidden');
            isCursorVisible = false;
        });

        htmlEl.addEventListener('mouseenter', () => {
            cursor.classList.remove('hidden');
            isCursorVisible = true;
        });
    }

    // --- HEADER SCROLL BEHAVIOR ---
    const header = document.getElementById('main-header');
    let ticking = false;
    function updateHeaderOnScroll() {
        const isScrolled = window.scrollY > 50;
        header.classList.toggle('glass-card', isScrolled);
        header.classList.toggle('m-4', isScrolled);
        ticking = false;
    }
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateHeaderOnScroll);
            ticking = true;
        }
    });
    updateHeaderOnScroll();

    // --- LOGO SCRAMBLE OPTIMIZATION ---
    const logo = document.getElementById('brand-logo');
    const originalText = logo.innerText;
    const chars = '!<>-_\\/[]{}—=+*^?#';
    let scrambleAnimationId = null;

    const triggerScramble = (target) => {
        let startTime = null;
        const duration = 500;

        if (scrambleAnimationId) cancelAnimationFrame(scrambleAnimationId);

        const scrambleStep = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const newText = originalText.split("").map((letter, index) => {
                if (progress / duration > index / originalText.length) {
                    return originalText[index];
                }
                return chars[Math.floor(Math.random() * chars.length)];
            }).join("");
            target.innerText = newText;
            if (progress < duration) {
                scrambleAnimationId = requestAnimationFrame(scrambleStep);
            } else {
                target.innerText = originalText;
            }
        };
        scrambleAnimationId = requestAnimationFrame(scrambleStep);
    };
    
    if (!isTouchDevice) {
        logo.addEventListener('mouseenter', (event) => triggerScramble(event.currentTarget));
        logo.addEventListener('mouseleave', () => {
            cancelAnimationFrame(scrambleAnimationId);
            logo.innerText = originalText;
        });
    }
    logo.addEventListener('click', (event) => triggerScramble(event.currentTarget));

// ========================================================
// ======================= MOBILE MENU ====================
// ========================================================

    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinksMobile = mobileMenu.querySelectorAll('.nav-link-mobile, .faq-trigger, button');

    function localCloseMobileMenu() {
        if (mobileMenu.classList.contains('hidden')) return;
        mobileMenuButton.classList.remove('open');
        mobileMenu.classList.add('hidden');
        if (!document.querySelector('.modal.is-open')) {
             htmlEl.classList.remove('modal-open');
        }
    }

    mobileMenuButton.addEventListener('click', (e) => {
        e.stopPropagation(); 
        if (mobileMenu.classList.contains('hidden')) {
            mobileMenuButton.classList.add('open');
            mobileMenu.classList.remove('hidden');
            htmlEl.classList.add('modal-open');
        } else {
            localCloseMobileMenu();
        }
    });
    
    navLinksMobile.forEach(link => {
        link.addEventListener('click', localCloseMobileMenu);
    });

    document.addEventListener('click', (event) => {
        if (mobileMenu && !mobileMenu.classList.contains('hidden') && !mobileMenu.contains(event.target) && !mobileMenuButton.contains(event.target)) {
            localCloseMobileMenu();
        }
    });
    window.addEventListener('scroll', localCloseMobileMenu, { passive: true });


// ==============================================================
// ======================= FADE-IN SECTIONS ====================
// ==============================================================
    
    const sections = document.querySelectorAll('.fade-in-section');
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                sectionObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    sections.forEach(section => sectionObserver.observe(section));
    
// ==============================================================
// ======================= MODAL SYSTEM SETUP ===================
// ==============================================================

    function setupModalSystem() {
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('[data-modal-trigger]');
            if (!trigger) return;

            e.preventDefault();
            const modalId = trigger.getAttribute('data-modal-trigger');
            const modal = document.getElementById(`${modalId}-modal`);
            
            // START: New logic for package selection
            if (modalId === 'contact') {
                const selectedPackageInput = document.getElementById('selected-package-input');
                if (selectedPackageInput) {
                    const packageName = trigger.getAttribute('data-package') || 'Not Specified';
                    selectedPackageInput.value = packageName;
                }
            }
            // END: New logic for package selection

            if (modal) {
                 if (trigger.closest('#mobile-menu')) {
                    localCloseMobileMenu();
                }
                openModal(modal); // Call the global function
            }
        });

        const closeButtons = document.querySelectorAll('[data-modal-close]');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const modalId = button.getAttribute('data-modal-close');
                const modal = document.getElementById(`${modalId}-modal`);
                if (modal) closeModal(modal); // Call the global function
            });
        });

        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(modal); // Call the global function
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModalEl = document.querySelector('.modal.is-open');
                if (openModalEl) closeModal(openModalEl); // Call the global function
            }
        });
    }
    
    setupModalSystem();

// ========================================================
// ================ AUTH MODAL SWITCHING ==================
// ========================================================
    const showSignupBtn = document.getElementById('show-signup-modal');
    const showLoginBtn = document.getElementById('show-login-modal');
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');

    if (showSignupBtn && showLoginBtn && loginModal && signupModal) {
        showSignupBtn.addEventListener('click', () => {
            closeModal(loginModal);
            setTimeout(() => {
                openModal(signupModal);
                if (typeof turnstile !== 'undefined') {
                    turnstile.reset();
                }
            }, 150);
        });

        showLoginBtn.addEventListener('click', () => {
            closeModal(signupModal);
            setTimeout(() => openModal(loginModal), 150);
        });
    }

    const faqTriggers = document.querySelectorAll('.faq-trigger');
    faqTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(document.getElementById('faq-modal'));
        });
    });
    document.getElementById('close-faq-modal-btn')?.addEventListener('click', () => closeModal(document.getElementById('faq-modal')));
    document.getElementById('close-contact-modal-btn')?.addEventListener('click', () => closeModal(document.getElementById('contact-modal')));

// ========================================================
// ===================== DEMO MODAL LOGIC =================
// ========================================================
    const demoModal = document.getElementById('demo-modal');
    if (demoModal) {
        const demoModalTitle = document.getElementById('demo-modal-title');
        const demoIframe = document.getElementById('demo-modal-iframe');
        const demoSpinner = document.getElementById('demo-spinner');
        const closeDemoBtn = document.getElementById('close-demo-modal-btn');

        // Event listener for all demo trigger buttons
        document.body.addEventListener('click', (e) => {
            const trigger = e.target.closest('[data-demo-trigger]');
            if (!trigger) return;

            const url = trigger.dataset.demoUrl;
            const title = trigger.dataset.demoTitle;

            // Prepare modal content before opening
            demoModalTitle.textContent = title || 'Live Demo';
            demoSpinner.classList.remove('hidden');
            demoIframe.classList.remove('loaded');
            
            // Set iframe src to start loading
            demoIframe.src = url;
            
            openModal(demoModal);
        });

        // Hide spinner and show iframe once content is loaded
        demoIframe.addEventListener('load', () => {
            demoSpinner.classList.add('hidden');
            demoIframe.classList.add('loaded');
        });

        // Function to close and clean up the demo modal
        const closeDemoModal = () => {
            closeModal(demoModal);
            // Delay cleanup to allow for closing animation
            setTimeout(() => {
                demoIframe.src = 'about:blank'; // Stop iframe loading/scripts
                demoSpinner.classList.remove('hidden'); // Reset spinner for next time
                demoIframe.classList.remove('loaded');
            }, 300);
        };

        closeDemoBtn.addEventListener('click', closeDemoModal);
        
        // Also close if the background overlay is clicked
        demoModal.addEventListener('click', (e) => {
            if (e.target === demoModal) {
                closeDemoModal();
            }
        });
    }

// ========================================================
// ====================== CONTACT FORM ====================
// ========================================================
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        const messageInput = document.getElementById('modal-message');
        const charCounterEn = document.getElementById('char-counter-en');
        const charCounterMy = document.getElementById('char-counter-my');
        const submitButton = document.getElementById('contact-submit-btn');
        const statusMessage = document.getElementById('contact-form-status');

        if (messageInput && charCounterEn && charCounterMy) {
            const maxLength = messageInput.getAttribute('maxlength');
            const myanmarNumerals = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
            const maxLengthMy = String(maxLength).split('').map(n => myanmarNumerals[n]).join('');

            messageInput.addEventListener('input', () => {
                const currentLength = messageInput.value.length;
                const currentLengthMy = String(currentLength).split('').map(n => myanmarNumerals[n]).join('');
                charCounterEn.textContent = `${currentLength} / ${maxLength}`;
                charCounterMy.textContent = `${currentLengthMy} / ${maxLengthMy}`;
            });
        }
        
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const originalButtonTextEn = submitButton.querySelector('.lang-en').textContent;
            const originalButtonTextMy = submitButton.querySelector('.lang-my').textContent;
            
            submitButton.disabled = true;
            submitButton.querySelector('.lang-en').textContent = 'Sending...';
            submitButton.querySelector('.lang-my').textContent = 'ပေးပို့နေသည်...';
            statusMessage.textContent = '';
            
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch('/.netlify/functions/submit-contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    statusMessage.textContent = 'Message sent successfully!';
                    statusMessage.style.color = '#34d399'; // Green color
                    contactForm.reset();
                    // Reset character counter
                    if (charCounterEn) charCounterEn.textContent = `0 / ${messageInput.getAttribute('maxlength')}`;
                    if (charCounterMy) charCounterMy.textContent = `၀ / ${String(messageInput.getAttribute('maxlength')).split('').map(n => myanmarNumerals[n]).join('')}`;
                } else {
                    throw new Error(result.error || 'An unknown error occurred.');
                }
                
            } catch (error) {
                statusMessage.textContent = `Error: ${error.message}`;
                statusMessage.style.color = '#f87171'; // Red color
            } finally {
                // Reset Turnstile widget regardless of success or failure
                if (typeof turnstile !== 'undefined') {
                    try {
                        turnstile.reset();
                    } catch (e) {
                        console.error('Error resetting Turnstile:', e);
                    }
                }
                
                submitButton.disabled = false;
                submitButton.querySelector('.lang-en').textContent = originalButtonTextEn;
                submitButton.querySelector('.lang-my').textContent = originalButtonTextMy;
            }
        });
    }

    // --- FAQ ACCORDION ---
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            faqItems.forEach(otherItem => {
                if (otherItem !== item) otherItem.classList.remove('active');
            });
            item.classList.toggle('active', !isActive);
        });
    });

    // ========================================================
// ============= PASSWORD VISIBILITY TOGGLE ===============
// ========================================================
    function setupPasswordToggles() {
        document.querySelectorAll('.password-toggle-btn').forEach(button => {
            button.addEventListener('click', () => {
                const parent = button.parentElement;
                if (!parent) return;

                const passwordInput = parent.querySelector('input');
                if (!passwordInput) return;

                const isPassword = passwordInput.type === 'password';
                passwordInput.type = isPassword ? 'text' : 'password';

                const eyeIcon = button.querySelector('.eye-icon');
                const eyeOffIcon = button.querySelector('.eye-off-icon');

                if(eyeIcon && eyeOffIcon) {
                    eyeIcon.classList.toggle('hidden', isPassword);
                    eyeOffIcon.classList.toggle('hidden', !isPassword);
                }
                
                // Focus back on the input after clicking the button
                passwordInput.focus();
            });
        });
    }
    setupPasswordToggles();
    
// ==============================================================
// ======================= LANGUAGE SWITCHER ====================
// ==============================================================

    const switcherButtons = document.querySelectorAll('.lang-switcher');
    const langKey = 'wemarz_lang';

    function setLanguage(lang) {
        if (lang !== 'en' && lang !== 'my') {
            lang = 'en';
        }
        document.querySelectorAll('.lang-en').forEach(el => el.classList.toggle('hidden', lang === 'my'));
        document.querySelectorAll('.lang-my').forEach(el => el.classList.toggle('hidden', lang !== 'my'));
        body.classList.toggle('lang-en-active', lang === 'en');
        body.classList.toggle('lang-my-active', lang === 'my');
        localStorage.setItem(langKey, lang);
    }

    switcherButtons.forEach(button => {
        button.addEventListener('click', () => {
            const currentLang = localStorage.getItem(langKey) || 'en';
            const newLang = currentLang === 'en' ? 'my' : 'en';
            setLanguage(newLang);
            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                localCloseMobileMenu();
            }
        });
    });

    const savedLang = localStorage.getItem(langKey);
    setLanguage(savedLang || 'en');
    
    document.getElementById('year').textContent = new Date().getFullYear();
    feather.replace();

// ==============================================================
// ================== FLOATING ACTION BUTTON ====================
// ==============================================================

    const fabContainer = document.getElementById('fab-container');
    const fabButton = document.getElementById('floating-contact-btn');
    const fabLiveChatOption = document.getElementById('fab-live-chat');
    const fabContactOption = document.getElementById('fab-contact');
    const fabOverlay = document.getElementById('fab-overlay');
    
    const closeFabMenu = () => {
        fabContainer.classList.remove('active');
        if (window.innerWidth < 768) {
            fabOverlay.classList.remove('active');
            if (!document.querySelector('.modal.is-open')) {
                htmlEl.classList.remove('modal-open');
            }
        }
    };

    fabButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (fabContainer.classList.contains('active')) {
            closeFabMenu();
        } else {
            fabContainer.classList.add('active');
            if (window.innerWidth < 768) {
                fabOverlay.classList.add('active');
                htmlEl.classList.add('modal-open');
            }
        }
    });
    
    document.addEventListener('click', (e) => {
        if (fabContainer.classList.contains('active') && !fabContainer.contains(e.target)) {
            closeFabMenu();
        }
    });

    fabContactOption.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeFabMenu();
        setTimeout(() => openModal(document.getElementById('contact-modal')), 100);
    });
    
    fabLiveChatOption.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Live Chat clicked! (Placeholder)');
        closeFabMenu();
    });
    
// ==============================================================
// ===================== PORTFOLIO FILTERING ====================
// ==============================================================

    const filterContainer = document.getElementById('filter-container');
    if (filterContainer) {
        const projectCards = document.querySelectorAll('#portfolio-grid .project-card');
        let filteringTimeout;

        filterContainer.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;
            
            const filterValue = button.dataset.filter;
            filterContainer.querySelector('.active').classList.remove('active');
            button.classList.add('active');
            clearTimeout(filteringTimeout);

            projectCards.forEach(card => {
                // Get all categories from the data attribute, split by comma, and trim whitespace
                const cardCategories = card.dataset.category.split(',').map(cat => cat.trim());
                // Check if the selected filter is 'all' OR if the card's categories array includes the filter value
                const shouldShow = filterValue === 'all' || cardCategories.includes(filterValue);
                
                if (shouldShow) {
                    card.style.display = 'block';
                    setTimeout(() => card.classList.remove('hidden-visual'), 10);
                } else {
                    card.classList.add('hidden-visual');
                    filteringTimeout = setTimeout(() => {
                       card.style.display = 'none';
                    }, 400); 
                }
            });
        });
    }

// ==============================================================
// ================ ANIMATE PERFORMANCE BARS ====================
// ==============================================================

    const techSection = document.getElementById('tech-approach');
    const animateCounter = (el, goal) => {
        const duration = 1500;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            el.textContent = Math.floor(progress * goal) + '%';
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    };

    const techObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const performanceBars = document.querySelectorAll('.performance-bar-inner');
                performanceBars.forEach(bar => bar.style.width = bar.dataset.width);
                
                const performanceScore = document.getElementById('performance-score');
                const accessibilityScore = document.getElementById('accessibility-score');
                const seoScore = document.getElementById('seo-score');

                if(performanceScore) animateCounter(performanceScore, 98);
                if(accessibilityScore) animateCounter(accessibilityScore, 95);
                if(seoScore) animateCounter(seoScore, 92);

                techObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    if(techSection) techObserver.observe(techSection);

// ==============================================================
// ================== BEFORE/AFTER SLIDER =====================
// ==============================================================

    const sliderContainer = document.getElementById('comparison-container');
    if (sliderContainer) {
        const afterImage = document.getElementById('after-image');
        const sliderHandle = document.getElementById('slider-handle');
        let isDragging = false;

        const moveSlider = (x) => {
            const rect = sliderContainer.getBoundingClientRect();
            let pos = (x - rect.left) / rect.width;
            pos = Math.max(0, Math.min(1, pos));
            afterImage.style.clipPath = `inset(0 0 0 ${pos * 100}%)`;
            sliderHandle.style.left = `${pos * 100}%`;
        };

        const startDrag = (e) => {
            isDragging = true;
            body.classList.add('slider-dragging');
            if (e.touches) e.preventDefault();
        };

        const stopDrag = () => {
            isDragging = false;
            body.classList.remove('slider-dragging');
        };

        const doDrag = (e) => {
            if (!isDragging) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            moveSlider(clientX);
        };

        sliderHandle.addEventListener('mousedown', startDrag);
        sliderHandle.addEventListener('touchstart', startDrag, { passive: false });
        window.addEventListener('mouseup', stopDrag);
        window.addEventListener('touchend', stopDrag);
        window.addEventListener('mousemove', doDrag);
        window.addEventListener('touchmove', doDrag);
    }

// =====================================================
// ================ CURRENCY TICKER ====================
// =====================================================

    const tickerContainer = document.getElementById('currency-ticker');
    if (tickerContainer) {
        // --- START: REAL-TIME API SETUP ---
        const API_KEY = 'a04732e3b0c430449cc5df5d'; // <-- ကျေးဇူးပြု၍ သင်၏ API Key ကို ဤနေရာတွင် အစားထိုးထည့်ပါ
        const baseCurrency = 'USD';
        // --- END: REAL-TIME API SETUP ---

        const targetCurrencies = ['EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'SGD', 'THB', 'VND', 'MMK'];
        let previousRates = {};
        let currencyInterval;

        function showSkeletonLoader() {
            let skeletons = '';
            for (let i = 0; i < 10; i++) {
                skeletons += `
                    <div class="grid grid-cols-3 gap-4 items-center p-4">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 rounded-full skeleton-loader"></div>
                            <div class="w-20 h-4 skeleton-loader"></div>
                        </div>
                        <div class="w-24 h-4 skeleton-loader ml-auto"></div>
                        <div class="w-16 h-4 skeleton-loader ml-auto"></div>
                    </div>
                `;
            }
            tickerContainer.innerHTML = skeletons;
        }

        async function fetchCurrencyRates() {
            // Check if the API key has been replaced
            if (API_KEY === 'YOUR_API_KEY_HERE' || !API_KEY) {
                tickerContainer.innerHTML = `<p class="p-4 text-center text-yellow-400">Please add a valid API key in script.js to fetch real-time data.</p>`;
                return;
            }

            const apiUrl = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${baseCurrency}`;
            
            try {
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`);
                }
                const data = await response.json();

                if (data.result === 'success') {
                    updateTicker(data.conversion_rates);
                    // Only update previousRates after the ticker has been rendered
                    previousRates = data.conversion_rates; 
                } else {
                    // Handle API-specific errors (e.g., invalid key)
                    tickerContainer.innerHTML = `<p class="p-4 text-center text-red-400">Error: ${data['error-type'] || 'Could not fetch currency data.'}</p>`;
                }
            } catch (error) {
                console.error("Error fetching currency rates:", error);
                tickerContainer.innerHTML = `<p class="p-4 text-center text-red-400">An error occurred while fetching data.</p>`;
            }
        }

        function updateTicker(currentRates) {
            tickerContainer.innerHTML = '';
            const isFirstLoad = Object.keys(previousRates).length === 0;

            targetCurrencies.forEach(currency => {
                const rate = currentRates[currency];
                if (rate === undefined) return; // Skip if a currency is not in the API response

                // If it's the first load, create a small fake change. Otherwise, use the real previous rate.
                const prevRate = isFirstLoad ? (rate * 0.9995) : (previousRates[currency] || rate);
                const change = rate - prevRate;
                
                let changeColor = 'text-gray-400';
                if (change > 0) changeColor = 'text-green-400';
                if (change < 0) changeColor = 'text-red-400';

                const tickerItem = `
                    <div class="grid grid-cols-3 gap-4 items-center p-4 hover:bg-white/5 rounded-lg transition-colors duration-200">
                        <div class="flex items-center space-x-3 font-semibold text-white">
                             <img src="https://flagcdn.com/32x24/${currency.slice(0, 2).toLowerCase()}.png" alt="${currency}" class="w-8 h-6 object-cover rounded-sm" onerror="this.style.display='none'">
                            <span>${baseCurrency}/${currency}</span>
                        </div>
                        <div class="text-right font-mono">${rate.toFixed(4)}</div>
                        <div class="text-right font-mono ${changeColor}">${change > 0 ? '+' : ''}${change.toFixed(4)}</div>
                    </div>
                `;
                tickerContainer.insertAdjacentHTML('beforeend', tickerItem);
            });
        }

        const marketSection = document.getElementById('market');
        const marketObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    showSkeletonLoader();
                    fetchCurrencyRates();
                    if(currencyInterval) clearInterval(currencyInterval);
                    // Update every 15 minutes (900000ms). Free plans often have update limits.
                    currencyInterval = setInterval(fetchCurrencyRates, 900000); 
                    marketObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        if(marketSection) marketObserver.observe(marketSection);
    }
    
// ============================================
// =========== AUTO-OPEN MODAL ================
// ============================================

    window.addEventListener('load', () => {
        const params = new URLSearchParams(window.location.search);
        const modalToOpen = params.get('modal');

        if (modalToOpen) {
            htmlEl.classList.remove('scroll-smooth');
            const modalElement = document.getElementById(`${modalToOpen}-modal`);
            if (modalElement) {
                setTimeout(() => {
                    openModal(modalElement);
                    const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + window.location.hash;
                    window.history.replaceState({path: cleanUrl}, '', cleanUrl);
                    setTimeout(() => htmlEl.classList.add('scroll-smooth'), 50);
                }, 150);
            } else {
                setTimeout(() => htmlEl.classList.add('scroll-smooth'), 50);
            }
        }
    });

// ==========================================
// =========== SMOOTH SCROLL ================
// ==========================================

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href.length > 1 && document.querySelector(href)) {
                e.preventDefault();
                document.querySelector(href).scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});