// assets/js/auth.js

// သင်မှတ်ထားတဲ့ Supabase Project URL နဲ့ Anon Key ကို ဒီနေရာမှာ အစားထိုးထည့်ပါ
const SUPABASE_URL = 'https://cpfkrqypdfwjvlecurcp.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwZmtycXlwZGZ3anZsZWN1cmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTA2MzEsImV4cCI6MjA3Mzc4NjYzMX0.U_IBMGjeKDbSuKw7zOaKi-TBQUlF3fxNXWgjlGMQ2rw';

// Supabase client ကို initialize လုပ်ခြင်း
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================================
// ============ Dynamic UI Update Functions =================
// ==========================================================

/**
 * Updates the navigation UI to show the "logged in" state.
 * @param {object} user - The Supabase user object.
 */
function updateUIToLoggedInState(user) {
    const userAuthLinksDesktop = document.querySelector('#user-auth-links-desktop');
    const userAuthLinksMobile = document.querySelector('#user-auth-links-mobile');

    const loggedInHTML = `
        <button id="show-account-overlay-desktop" class="nav-link text-gray-300 transition duration-300" title="My Account">
            <i data-feather="user" class="w-6 h-6"></i>
        </button>
        <button id="logout-btn-desktop" class="nav-link text-red-400 transition duration-300" title="Sign Out">
             <i data-feather="log-out" class="w-6 h-6"></i>
        </button>
    `;
    const loggedInMobileHTML = `
        <button id="show-account-overlay-mobile" class="nav-link-mobile text-gray-300 hover:text-cyan-400 w-full text-left flex items-center space-x-3">
            <i data-feather="user" class="w-5 h-5"></i>
            <span>My Account</span>
        </button>
        <button id="logout-btn-mobile" class="nav-link-mobile text-red-400 hover:text-red-300 w-full text-left flex items-center space-x-3">
            <i data-feather="log-out" class="w-5 h-5"></i>
            <span>Sign Out</span>
        </button>
    `;

    if (userAuthLinksDesktop) {
        userAuthLinksDesktop.innerHTML = loggedInHTML;
        userAuthLinksDesktop.classList.add('flex', 'items-center', 'space-x-8');
    }
    if (userAuthLinksMobile) {
        userAuthLinksMobile.innerHTML = loggedInMobileHTML;
    }

    // Add event listeners for the new buttons
    document.getElementById('show-account-overlay-desktop')?.addEventListener('click', () => toggleAccountOverlay(true));
    document.getElementById('show-account-overlay-mobile')?.addEventListener('click', () => {
        if (typeof closeMobileMenu === 'function') closeMobileMenu(); 
        toggleAccountOverlay(true);
    });
    document.getElementById('logout-btn-desktop')?.addEventListener('click', handleLogout);
    document.getElementById('logout-btn-mobile')?.addEventListener('click', handleLogout);
    
    if (typeof feather !== 'undefined') feather.replace();
    loadUserDataAndDiscounts(user);
}

/**
 * Updates the navigation UI to show the "logged out" state.
 */
function updateUIToLoggedOutState() {
    const userAuthLinksDesktop = document.querySelector('#user-auth-links-desktop');
    const userAuthLinksMobile = document.querySelector('#user-auth-links-mobile');

    const loggedOutHTML = `<button data-modal-trigger="login" class="nav-link text-gray-300 transition duration-300" title="Sign In / Sign Up"><i data-feather="user" class="w-6 h-6"></i></button>`;
    const loggedOutMobileHTML = `<button data-modal-trigger="login" class="nav-link-mobile text-gray-300 hover:text-cyan-400 w-full text-left flex items-center space-x-3">
        <i data-feather="log-in" class="w-5 h-5"></i>
        <span>Sign In</span>
    </button>`;

    if (userAuthLinksDesktop) {
        userAuthLinksDesktop.innerHTML = loggedOutHTML;
        userAuthLinksDesktop.classList.remove('flex', 'items-center', 'space-x-8');
    }
    if (userAuthLinksMobile) userAuthLinksMobile.innerHTML = loggedOutMobileHTML;

    if (typeof feather !== 'undefined') feather.replace();
}


// ==========================================================
// ================= Account Overlay Logic ==================
// ==========================================================

function toggleAccountOverlay(show) {
    const overlay = document.getElementById('account-overlay');
    const body = document.body;
    const htmlEl = document.documentElement;

    if (overlay) {
        if (show) {
            overlay.classList.add('is-visible');
            body.classList.add('modal-open');
            htmlEl.classList.add('modal-open');
        } else {
            overlay.classList.remove('is-visible');
            if (!document.querySelector('.modal.is-open')) {
                 body.classList.remove('modal-open');
                 htmlEl.classList.remove('modal-open');
            }
        }
    }
    document.getElementById('close-account-overlay')?.addEventListener('click', () => toggleAccountOverlay(false));
}

// ==========================================================
// ================== Main Initialization ===================
// ==========================================================

document.addEventListener('DOMContentLoaded', async () => {
    // --- Sign Up Form Listener ---
    const signupForm = document.querySelector('#signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(signupForm);
            const token = formData.get('cf-turnstile-response');
            if (!token) {
                // We'll replace this with an inline error later if requested.
                alert('Please complete the human verification check.');
                return;
            }

            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const fullName = document.getElementById('signup-full-name').value;
            
            const { error } = await supabaseClient.auth.signUp({
                email, password, options: { data: { full_name: fullName } }
            });

            if (error) {
                // We can implement inline error handling here too if needed.
                alert('Error signing up: ' + error.message);
            } else {
                alert('Sign up successful! Please check your email for verification.');
                if (typeof closeModal === 'function') {
                    closeModal(document.getElementById('signup-modal'));
                }
            }
            if (typeof turnstile !== 'undefined') turnstile.reset();
        });
    }

    // --- Login Form Listener ---
    const loginForm = document.querySelector('#login-form');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const errorMessageContainer = document.getElementById('login-error-message');

    // Function to clear error when user starts typing again
    const clearLoginError = () => {
        if (errorMessageContainer) errorMessageContainer.innerHTML = '';
    };

    if (loginEmailInput) loginEmailInput.addEventListener('input', clearLoginError);
    if (loginPasswordInput) loginPasswordInput.addEventListener('input', clearLoginError);

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const btn = document.getElementById('login-submit-btn');
            const btnText = btn.querySelector('.btn-text');
            const btnSpinner = btn.querySelector('.btn-spinner');
            const loginModal = document.getElementById('login-modal');

            // --- START: Interactive Button & Logic ---
            btn.disabled = true;
            btnText.textContent = 'Signing In...';
            btnSpinner.classList.remove('hidden');
            clearLoginError(); // Clear previous errors

            const email = loginEmailInput.value;
            const password = loginPasswordInput.value;
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            
            if (error) {
                // START: NEW Inline Error Handling
                if (errorMessageContainer) {
                    errorMessageContainer.innerHTML = `<p class="error-message">Invalid email or password.</p>`;
                }
                
                // Reset button on error
                btn.disabled = false;
                btnText.textContent = 'Sign In';
                btnSpinner.classList.add('hidden');
                
                // Shake animation
                btn.classList.add('shake-animation');
                setTimeout(() => {
                    btn.classList.remove('shake-animation');
                }, 500); // Duration should match CSS animation
                // END: NEW Inline Error Handling
            } else if (data.user) {
                // Login successful!
                btn.classList.add('btn-success');
                btnSpinner.classList.add('hidden');
                btnText.innerHTML = 'Success! <i data-feather="check" class="inline-block"></i>';
                if (typeof feather !== 'undefined') feather.replace();

                setTimeout(() => {
                    if (typeof closeModal === 'function') {
                        closeModal(loginModal);
                    }
                    updateUIToLoggedInState(data.user);

                    // Reset button state after a delay for next time
                    setTimeout(() => {
                        btn.disabled = false;
                        btn.classList.remove('btn-success');
                        btnText.textContent = 'Sign In';
                    }, 500);
                    
                }, 1500); // 1.5 second delay to show success state
            }
            // --- END: Interactive Button & Logic ---
        });
    }

    // --- Check User Session on Initial Page Load ---
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
        updateUIToLoggedInState(user);
    } else {
        updateUIToLoggedOutState();
    }
});

// ==========================================================
// ================= Global Functions =====================
// ==========================================================

async function handleLogout() {
  if (typeof closeMobileMenu === 'function') closeMobileMenu();
  toggleAccountOverlay(false);
  
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    console.error('Error logging out:', error);
  } else {
    updateUIToLoggedOutState();
  }
}

async function loadUserDataAndDiscounts(user) {
    if (!user) return; 

    const welcomeMessageElement = document.querySelector('#welcome-message');
    const discountsListElement = document.querySelector('#discounts-list');
    const loadingStateElement = document.querySelector('#loading-state');

    if(loadingStateElement) {
        loadingStateElement.style.display = 'block';
        loadingStateElement.textContent = 'Loading your discounts...';
    }
    if(discountsListElement) discountsListElement.innerHTML = '';

    const { data: profile, error: profileError } = await supabaseClient
        .from('profiles').select('full_name').eq('id', user.id).single();
    
    if (profileError) console.error('Error fetching profile:', profileError);

    if (welcomeMessageElement) {
        welcomeMessageElement.innerHTML = (profile && profile.full_name)
            ? `Welcome, <strong>${profile.full_name}</strong>!`
            : `Welcome, <strong>${user.email}</strong>!`;
    }

    const { data: discounts, error: discountsError } = await supabaseClient
        .from('discounts').select('*').eq('user_id', user.id);
    
    if (discountsError) {
        console.error('Error fetching discounts:', discountsError);
        if (loadingStateElement) loadingStateElement.textContent = 'Could not load discounts.';
        return;
    }

    if (discountsListElement) {
        if (discounts && discounts.length > 0) {
            discountsListElement.innerHTML = discounts.map(discount => `
                <div class="discount-card">
                    <p>${discount.description}</p>
                    <h3>Your Code: <span class="discount-code">${discount.discount_code}</span></h3>
                </div>
            `).join('');
            if (loadingStateElement) loadingStateElement.style.display = 'none';
        } else {
            if (loadingStateElement) loadingStateElement.textContent = 'You have no available discounts at the moment.';
        }
    }
}