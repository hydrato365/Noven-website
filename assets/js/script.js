document.addEventListener('DOMContentLoaded', () => {
    // --- UTILITY FUNCTIONS (GOOD PRACTICE) ---
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

    // --- GLOBAL VARIABLES ---
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const body = document.body;
    const htmlEl = document.documentElement;

    // ===================================================================
    // ======================= THREE.JS OPTIMIZATIONS ====================
    // ===================================================================
    const canvas = document.getElementById('bg-canvas');
    let animationFrameId; // To control the animation loop
    let isAnimationRunning = false; // State to prevent multiple loops

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

    // ===================================================================
    // ================= CUSTOM CURSOR OPTIMIZATION ======================
    // ===================================================================
    if (!isTouchDevice) {
        const cursor = document.querySelector('.custom-cursor');
        const links = document.querySelectorAll('a, button');
        
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
        
        links.forEach(link => {
            link.addEventListener('mouseenter', () => cursor.classList.add('link-hover'));
            link.addEventListener('mouseleave', () => cursor.classList.remove('link-hover'));
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

    // --- MOBILE MENU ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinksMobile = mobileMenu.querySelectorAll('.nav-link-mobile, .faq-trigger');
    
    function closeMobileMenu() {
        mobileMenuButton.classList.remove('open');
        mobileMenu.classList.add('hidden');
    }

    mobileMenuButton.addEventListener('click', () => {
        mobileMenuButton.classList.toggle('open');
        mobileMenu.classList.toggle('hidden');
    });
    
    navLinksMobile.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // --- FADE-IN SECTIONS ---
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
    
    // --- MODAL SYSTEM ---
    const contactModalForKeyboard = document.getElementById('contact-modal');
    const contactModalContentForKeyboard = contactModalForKeyboard ? contactModalForKeyboard.querySelector('.modal-content') : null;

    // This function handles shifting the contact modal when the virtual keyboard appears
    const handleKeyboardShift = () => {
        if (!contactModalContentForKeyboard || window.innerWidth >= 768) return;

        const layoutViewportHeight = window.innerHeight;
        const visualViewportHeight = window.visualViewport.height;
        const keyboardHeight = layoutViewportHeight - visualViewportHeight;

        if (keyboardHeight > 100) {
            // Keyboard is open, move the modal up to re-center it in the visible area
            contactModalContentForKeyboard.style.transform = `translateY(-${keyboardHeight / 2}px)`;
        } else {
            // Keyboard is closed, reset position
            contactModalContentForKeyboard.style.transform = '';
        }
    };

    function setupModalSystem() {
        const triggers = document.querySelectorAll('[data-modal-trigger]');
        triggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const modalId = trigger.getAttribute('data-modal-trigger');
                const modal = document.getElementById(`${modalId}-modal`);
                if (modal) openModal(modal);
            });
        });

        const closeButtons = document.querySelectorAll('[data-modal-close]');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const modalId = button.getAttribute('data-modal-close');
                const modal = document.getElementById(`${modalId}-modal`);
                if (modal) closeModal(modal);
            });
        });

        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(modal);
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModalEl = document.querySelector('.modal.is-open');
                if (openModalEl) closeModal(openModalEl);
            }
        });
    }

    function openModal(modal) {
        modal.classList.add('is-open');
        htmlEl.classList.add('modal-open');
        body.classList.add('modal-open'); 
        closeMobileMenu(); 
        // Add listener for the contact modal when it opens
        if (modal.id === 'contact-modal' && window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleKeyboardShift);
        }
    }

    function closeModal(modal) {
        modal.classList.remove('is-open');
        if (!document.querySelector('.modal.is-open') && !document.getElementById('fab-container').classList.contains('active')) {
            htmlEl.classList.remove('modal-open');
            body.classList.remove('modal-open'); 
        }
        // Remove listener and reset style when the contact modal closes
        if (modal.id === 'contact-modal' && window.visualViewport) {
            window.visualViewport.removeEventListener('resize', handleKeyboardShift);
            if (contactModalContentForKeyboard) {
                contactModalContentForKeyboard.style.transform = '';
            }
        }
    }
    
    setupModalSystem();

    const faqTriggers = document.querySelectorAll('.faq-trigger');
    faqTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(document.getElementById('faq-modal'));
        });
    });
    document.getElementById('close-faq-modal-btn')?.addEventListener('click', () => closeModal(document.getElementById('faq-modal')));

    document.getElementById('fab-contact')?.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(document.getElementById('contact-modal'));
    });
    document.getElementById('close-contact-modal-btn')?.addEventListener('click', () => closeModal(document.getElementById('contact-modal')));

    // --- CONTACT FORM ---
    const contactModal = document.getElementById('contact-modal');
    const messageInput = document.getElementById('modal-message');
    const contactForm = contactModal ? contactModal.querySelector('form') : null;

    // Character counters for both languages
    const charCounterEn = document.getElementById('char-counter-en');
    const charCounterMy = document.getElementById('char-counter-my');

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

        // Add keydown listener for Ctrl+Enter submission
        messageInput.addEventListener('keydown', (event) => {
            // Check if Ctrl key is pressed and the key is Enter
            if (event.key === 'Enter' && event.ctrlKey) {
                // Prevent the default action (which is to insert a new line)
                event.preventDefault();
                
                // Find the parent form and its submit button, then click it
                if (contactForm) {
                    const submitButton = contactForm.querySelector('button[type="submit"]');
                    if (submitButton) {
                        submitButton.click();
                    }
                }
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

    // --- LANGUAGE SWITCHER (MODIFIED FOR CONSISTENCY) ---
    const switcherButtons = document.querySelectorAll('.lang-switcher');
    const langKey = 'wemarz_lang'; // Use a consistent key across all pages

    function setLanguage(lang) {
        if (lang !== 'en' && lang !== 'my') {
            lang = 'en'; // Default to English if invalid value
        }
        document.querySelectorAll('.lang-en').forEach(el => el.classList.toggle('hidden', lang === 'my'));
        document.querySelectorAll('.lang-my').forEach(el => el.classList.toggle('hidden', lang !== 'my'));
        body.classList.toggle('lang-en-active', lang === 'en');
        body.classList.toggle('lang-my-active', lang === 'my');
        localStorage.setItem(langKey, lang); // Save the choice
    }

    switcherButtons.forEach(button => {
        button.addEventListener('click', () => {
            const currentLang = localStorage.getItem(langKey) || 'en';
            const newLang = currentLang === 'en' ? 'my' : 'en';
            setLanguage(newLang);
            
            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                closeMobileMenu();
            }
        });
    });

    // On page load, apply the saved language
    const savedLang = localStorage.getItem(langKey);
    setLanguage(savedLang || 'en');
    
    // --- FOOTER YEAR & ICONS ---
    document.getElementById('year').textContent = new Date().getFullYear();
    feather.replace();

    // --- FLOATING ACTION BUTTON ---
    const fabContainer = document.getElementById('fab-container');
    const fabButton = document.getElementById('floating-contact-btn');
    const fabLiveChatOption = document.getElementById('fab-live-chat');
    const fabOverlay = document.getElementById('fab-overlay');
    
    const openFabMenu = () => {
        fabContainer.classList.add('active');
        if (window.innerWidth < 768) {
            fabOverlay.classList.add('active');
            htmlEl.classList.add('modal-open');
            body.classList.add('modal-open');
        }
    };

    const closeFabMenu = () => {
        fabContainer.classList.remove('active');
        if (window.innerWidth < 768) {
            fabOverlay.classList.remove('active');
            if (!document.querySelector('.modal.is-open')) {
                htmlEl.classList.remove('modal-open');
                body.classList.remove('modal-open');
            }
        }
    };

    fabButton.addEventListener('click', (e) => {
        e.stopPropagation();
        fabContainer.classList.contains('active') ? closeFabMenu() : openFabMenu();
    });
    
    document.addEventListener('click', (e) => {
        if (fabContainer.classList.contains('active') && !fabContainer.contains(e.target)) {
            closeFabMenu();
        }
    });
    
    fabLiveChatOption.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Live Chat clicked! (Placeholder)');
        closeFabMenu();
    });
    
    // --- PORTFOLIO FILTERING ---
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
                const cardCategory = card.dataset.category;
                const shouldShow = filterValue === 'all' || cardCategory === filterValue;
                
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

    // --- ANIMATE PERFORMANCE BARS ---
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
                performanceBars.forEach(bar => {
                    bar.style.width = bar.dataset.width;
                });
                
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

    if(techSection) {
        techObserver.observe(techSection);
    }

    // --- BEFORE/AFTER SLIDER ---
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

    // --- CURRENCY TICKER ---
    const tickerContainer = document.getElementById('currency-ticker');
    const baseCurrency = 'USD';
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
        const mockApiCall = () => {
             return new Promise(resolve => {
                 setTimeout(() => {
                     const rates = {};
                     targetCurrencies.forEach(currency => {
                         let rate = Math.random() * 2;
                         if(currency === 'JPY') rate = Math.random() * 30 + 120;
                         if(currency === 'MMK') rate = Math.random() * 200 + 4400;
                         if(currency === 'THB') rate = Math.random() * 5 + 30;
                         if(currency === 'SGD') rate = Math.random() * 0.2 + 1.2;
                         rates[currency] = rate;
                     });
                     resolve({ result: 'success', conversion_rates: rates });
                 }, 1000);
             });
        };
        
        try {
            const data = await mockApiCall();
            if (data.result === 'success') {
                const rates = data.conversion_rates;
                updateTicker(rates);
                previousRates = rates;
            } else {
                tickerContainer.innerHTML = `<p class="p-4 text-center text-red-400">Could not fetch currency data.</p>`;
            }
        } catch (error) {
            console.error("Error fetching currency rates:", error);
            tickerContainer.innerHTML = `<p class="p-4 text-center text-red-400">An error occurred.</p>`;
        }
    }

    function updateTicker(currentRates) {
        tickerContainer.innerHTML = '';
        targetCurrencies.forEach(currency => {
            const rate = currentRates[currency];
            const prevRate = previousRates[currency] || rate;
            const change = rate - prevRate;

            let changeColor = 'text-gray-400';
            if (change > 0.0001) changeColor = 'text-green-400';
            if (change < -0.0001) changeColor = 'text-red-400';

            const tickerItem = `
                <div class="grid grid-cols-3 gap-4 items-center p-4 hover:bg-white/5 rounded-lg transition-colors duration-200">
                    <div class="flex items-center space-x-3 font-semibold text-white">
                         <img src="https://flagcdn.com/32x24/${currency.slice(0, 2).toLowerCase()}.png" alt="${currency}" class="w-8 h-6 object-cover rounded-sm" onerror="this.style.display='none'">
                        <span>${baseCurrency}/${currency}</span>
                    </div>
                    <div class="text-right font-mono">${rate.toFixed(4)}</div>
                    <div class="text-right font-mono ${changeColor}">${change.toFixed(4)}</div>
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
                currencyInterval = setInterval(fetchCurrencyRates, 30000);
                marketObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    if(marketSection) {
        marketObserver.observe(marketSection);
    }
    
    // ===================================================================
    // ================== AUTO-OPEN MODAL ON LOAD & INSTANT JUMP ===================
    // ===================================================================
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

                    setTimeout(() => {
                        htmlEl.classList.add('scroll-smooth');
                    }, 50);
                }, 150);
            } else {
                setTimeout(() => {
                    htmlEl.classList.add('scroll-smooth');
                }, 50);
            }
        }
    });
    // --- SMOOTH SCROLL WITHOUT HISTORY CHANGE ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // Check if it's a real navigation link and not a modal trigger etc.
            const href = this.getAttribute('href');
            if (href.length > 1 && document.querySelector(href)) {
                e.preventDefault(); // Stop the default browser action (changing URL)

                document.querySelector(href).scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});
