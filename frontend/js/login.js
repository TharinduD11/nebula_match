/**
 * Nebula Match — Stage 1: Login UI Interactions & Frontend Validation
 * 
 * Responsibilities:
 * - Accessible password visibility toggle
 * - Client-side validation for email/username and password
 * - Real-time error feedback and focus handling
 * - Visual loading and submission simulation
 * - Stage 2 (Sign Up) placeholder guidance
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Element Selectors ---
  const loginForm = document.getElementById('loginForm');
  const identifierInput = document.getElementById('identifier');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const eyeIcon = document.getElementById('eyeIcon');
  const eyeOffIcon = document.getElementById('eyeOffIcon');
  const submitBtn = document.getElementById('submitBtn');
  
  const identifierGroup = document.getElementById('identifierGroup');
  const passwordGroup = document.getElementById('passwordGroup');
  const identifierError = document.getElementById('identifierError');
  const passwordError = document.getElementById('passwordError');
  
  const authAlert = document.getElementById('authAlert');
  const alertIcon = document.getElementById('alertIcon');
  const alertMessage = document.getElementById('alertMessage');
  
  const signupPlaceholderLink = document.getElementById('signupPlaceholderLink');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');

  // --- Alert Banner Icons (Inline SVGs) ---
  const ALERT_ICONS = {
    error: `
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    `,
    success: `
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    `,
    info: `
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    `
  };

  /**
   * Display an accessible status alert banner above the form.
   * @param {'error' | 'success' | 'info'} type 
   * @param {string} message 
   */
  function showAlert(type, message) {
    if (!authAlert) return;
    
    authAlert.className = `auth-alert alert-${type}`;
    authAlert.removeAttribute('hidden');
    
    if (alertIcon && ALERT_ICONS[type]) {
      alertIcon.innerHTML = ALERT_ICONS[type];
    }
    
    if (alertMessage) {
      alertMessage.textContent = message;
    }
  }

  /**
   * Hide the status alert banner.
   */
  function hideAlert() {
    if (!authAlert) return;
    authAlert.setAttribute('hidden', '');
  }

  // --- Show / Hide Password Accessible Toggle ---
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      
      if (isPassword) {
        passwordInput.setAttribute('type', 'text');
        togglePasswordBtn.setAttribute('aria-label', 'Hide password');
        togglePasswordBtn.setAttribute('aria-pressed', 'true');
        togglePasswordBtn.title = 'Hide password';
        eyeIcon.style.display = 'none';
        eyeOffIcon.style.display = 'block';
      } else {
        passwordInput.setAttribute('type', 'password');
        togglePasswordBtn.setAttribute('aria-label', 'Show password');
        togglePasswordBtn.setAttribute('aria-pressed', 'false');
        togglePasswordBtn.title = 'Show password';
        eyeIcon.style.display = 'block';
        eyeOffIcon.style.display = 'none';
      }

      // Return focus to input for smooth keyboard navigation
      passwordInput.focus();
    });
  }

  // --- Field Validation Functions ---

  /**
   * Validate Email or Username field.
   * @param {string} value 
   * @returns {string | null} Error message or null if valid
   */
  function validateIdentifier(value) {
    const trimmed = value.trim();
    if (!trimmed) {
      return 'Please enter your email address or username.';
    }
    if (trimmed.length < 3) {
      return 'Identifier must be at least 3 characters.';
    }
    // If user entered an '@', validate email format
    if (trimmed.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        return 'Please enter a valid email address (e.g., explorer@nebula.io).';
      }
    }
    return null;
  }

  /**
   * Validate Password field.
   * @param {string} value 
   * @returns {string | null} Error message or null if valid
   */
  function validatePassword(value) {
    if (!value) {
      return 'Please enter your password.';
    }
    if (value.length < 6) {
      return 'Password must be at least 6 characters long.';
    }
    return null;
  }

  /**
   * Render or clear field error state.
   * @param {HTMLElement} groupEl 
   * @param {HTMLElement} errorEl 
   * @param {string | null} errorMsg 
   */
  function setFieldError(groupEl, errorEl, errorMsg) {
    if (!groupEl || !errorEl) return;
    
    if (errorMsg) {
      groupEl.classList.add('has-error');
      errorEl.textContent = errorMsg;
    } else {
      groupEl.classList.remove('has-error');
      errorEl.textContent = '';
    }
  }

  // --- Real-time Input Listeners (Clear errors on correction) ---
  if (identifierInput) {
    identifierInput.addEventListener('input', () => {
      if (identifierGroup.classList.contains('has-error')) {
        const error = validateIdentifier(identifierInput.value);
        setFieldError(identifierGroup, identifierError, error);
      }
    });

    identifierInput.addEventListener('blur', () => {
      // Validate on blur if user has entered content
      if (identifierInput.value.trim().length > 0) {
        const error = validateIdentifier(identifierInput.value);
        setFieldError(identifierGroup, identifierError, error);
      }
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      if (passwordGroup.classList.contains('has-error')) {
        const error = validatePassword(passwordInput.value);
        setFieldError(passwordGroup, passwordError, error);
      }
    });

    passwordInput.addEventListener('blur', () => {
      // Validate on blur if user has entered content
      if (passwordInput.value.length > 0) {
        const error = validatePassword(passwordInput.value);
        setFieldError(passwordGroup, passwordError, error);
      }
    });
  }

  // --- Form Submission & Validation ---
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      hideAlert();

      const identifierValue = identifierInput ? identifierInput.value : '';
      const passwordValue = passwordInput ? passwordInput.value : '';

      const idError = validateIdentifier(identifierValue);
      const passError = validatePassword(passwordValue);

      setFieldError(identifierGroup, identifierError, idError);
      setFieldError(passwordGroup, passwordError, passError);

      if (idError || passError) {
        showAlert('error', 'Please resolve the highlighted fields to continue.');
        
        // Focus the first invalid field
        if (idError && identifierInput) {
          identifierInput.focus();
        } else if (passError && passwordInput) {
          passwordInput.focus();
        }
        return;
      }

      // --- Authentication & Virtual Identity Session Creation ---
      submitBtn.classList.add('btn-loading');
      submitBtn.disabled = true;
      const btnText = submitBtn.querySelector('.btn-text-content');
      if (btnText) btnText.textContent = 'Verifying credentials...';

      const trimmedId = identifierValue.trim();
      let username = trimmedId;
      let email = '';
      let bestScore = 0;
      let gamesPlayed = 0;

      // 1. Attempt real MongoDB Backend Authentication
      try {
        const apiBase = (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '4000'))
          ? 'http://localhost:4000'
          : '';
        const response = await fetch(`${apiBase}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: trimmedId, password: passwordValue })
        });

        const data = await response.json();

        if (response.ok && data.success && data.user) {
          username = data.user.username;
          email = data.user.email;
          bestScore = data.user.bestScore || 0;
          gamesPlayed = data.user.gamesPlayed || 0;
        } else {
          // Authentication rejected by MongoDB
          submitBtn.classList.remove('btn-loading');
          submitBtn.disabled = false;
          if (btnText) btnText.textContent = 'Sign In';
          showAlert('error', data.message || 'Invalid username or password.');
          return;
        }
      } catch (networkErr) {
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Sign In';
        showAlert('error', 'Cannot connect to database server. Please ensure the backend is running.');
        return;
      }

      // Construct Virtual Identity session object
      const explorerSession = {
        username: username,
        email: email,
        bestScore: bestScore,
        gamesPlayed: gamesPlayed,
        isAuthenticated: true,
        loginTime: new Date().toISOString()
      };

      // Persist active session to client storage
      localStorage.setItem('nebula_user', JSON.stringify(explorerSession));

      // Always send signed-in players to the Home page first.
      const redirectTarget = 'index.html';

      // Provide smooth visual feedback before navigating
      setTimeout(() => {
        if (btnText) btnText.textContent = 'Access Granted ✓';
        showAlert(
          'success', 
          `Welcome, ${username}! Logging in to Nebula Match...`
        );

        setTimeout(() => {
          window.location.href = redirectTarget;
        }, 500);
      }, 350);
    });
  }

  // --- Registration Callback & Active Session Detection ---
  const urlParams = new URLSearchParams(window.location.search);
  const registeredParam = urlParams.get('registered');
  const userParam = urlParams.get('user');

  if (registeredParam && userParam) {
    if (identifierInput) {
      identifierInput.value = userParam;
    }
    showAlert('success', `Account created! Please enter your password to sign in as ${userParam}.`);
    if (passwordInput) {
      passwordInput.focus();
    }
  } else {
    try {
      const existingSession = localStorage.getItem('nebula_user');
      if (existingSession) {
        const activeUser = JSON.parse(existingSession);
        if (activeUser && activeUser.username) {
          showAlert(
            'info',
            `Currently signed in as ${activeUser.username}. Enter credentials to switch accounts.`
          );
        }
      }
    } catch (err) {
      // Non-blocking catch
    }
  }

  // --- Password Help Link ---
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      showAlert(
        'info', 
        'To reset your password, please sign up for a new account or contact support.'
      );
    });
  }
});

