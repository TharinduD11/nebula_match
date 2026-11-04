/**
 * Nebula Match — Stage 2: Sign Up UI Interactions & Frontend Validation
 * 
 * Responsibilities:
 * - Real-time password strength calculation and visual meter
 * - Accessible password visibility toggles for password & confirmation
 * - Client-side validation for Call Sign (Username), Email, and Password Matching
 * - Inline error feedback with accessible live regions
 * - Interactive submission simulation signaling readiness for Stage 3 (MongoDB & Backend API)
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Element Selectors ---
  const signupForm = document.getElementById('signupForm');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  
  const usernameGroup = document.getElementById('usernameGroup');
  const emailGroup = document.getElementById('emailGroup');
  const passwordGroup = document.getElementById('passwordGroup');
  const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');

  const usernameError = document.getElementById('usernameError');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const confirmPasswordError = document.getElementById('confirmPasswordError');

  // Password Toggles
  const togglePasswordBtn = document.getElementById('togglePassword');
  const eyeIcon = document.getElementById('eyeIcon');
  const eyeOffIcon = document.getElementById('eyeOffIcon');

  const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
  const eyeConfirmIcon = document.getElementById('eyeConfirmIcon');
  const eyeOffConfirmIcon = document.getElementById('eyeOffConfirmIcon');

  // Password Strength Elements
  const strengthSeg1 = document.getElementById('strengthSeg1');
  const strengthSeg2 = document.getElementById('strengthSeg2');
  const strengthSeg3 = document.getElementById('strengthSeg3');
  const strengthLevel = document.getElementById('strengthLevel');
  const strengthHint = document.getElementById('strengthHint');

  // Submit and Alert Elements
  const submitBtn = document.getElementById('submitBtn');
  const authAlert = document.getElementById('authAlert');
  const alertIcon = document.getElementById('alertIcon');
  const alertMessage = document.getElementById('alertMessage');

  // --- Alert Banner Icons ---
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
   * Display an accessible status alert banner.
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

  // --- Accessible Password Toggle Helper ---
  function setupPasswordToggle(button, input, iconShow, iconHide) {
    if (!button || !input) return;

    button.addEventListener('click', () => {
      const isPassword = input.getAttribute('type') === 'password';
      
      if (isPassword) {
        input.setAttribute('type', 'text');
        button.setAttribute('aria-label', 'Hide password');
        button.setAttribute('aria-pressed', 'true');
        button.title = 'Hide password';
        if (iconShow) iconShow.style.display = 'none';
        if (iconHide) iconHide.style.display = 'block';
      } else {
        input.setAttribute('type', 'password');
        button.setAttribute('aria-label', 'Show password');
        button.setAttribute('aria-pressed', 'false');
        button.title = 'Show password';
        if (iconShow) iconShow.style.display = 'block';
        if (iconHide) iconHide.style.display = 'none';
      }

      input.focus();
    });
  }

  setupPasswordToggle(togglePasswordBtn, passwordInput, eyeIcon, eyeOffIcon);
  setupPasswordToggle(toggleConfirmPasswordBtn, confirmPasswordInput, eyeConfirmIcon, eyeOffConfirmIcon);

  // --- Dynamic Password Strength Evaluation ---
  function evaluatePasswordStrength(password) {
    if (!password) {
      return { score: 0, label: '', hint: 'Min. 6 characters', class: '' };
    }

    if (password.length < 6) {
      return { score: 1, label: 'Too short', hint: `${6 - password.length} more char${6 - password.length > 1 ? 's' : ''}`, class: 'weak' };
    }

    let score = 1;
    const hasNumbers = /\d/.test(password);
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    if (password.length >= 8 && hasLetters && (hasNumbers || hasSpecial)) {
      score = 2;
    }

    if (password.length >= 10 && hasLetters && hasNumbers && hasSpecial) {
      score = 3;
    }

    if (score === 1) {
      return { score: 1, label: 'Weak', hint: 'Add numbers or symbols', class: 'weak' };
    } else if (score === 2) {
      return { score: 2, label: 'Good', hint: 'Add special characters', class: 'medium' };
    } else {
      return { score: 3, label: 'Strong', hint: 'Excellent cosmic defense', class: 'strong' };
    }
  }

  function updateStrengthUI(result) {
    if (!strengthSeg1 || !strengthSeg2 || !strengthSeg3) return;

    // Reset classes
    strengthSeg1.className = 'strength-segment';
    strengthSeg2.className = 'strength-segment';
    strengthSeg3.className = 'strength-segment';

    if (result.score >= 1) strengthSeg1.classList.add(`is-${result.class}`);
    if (result.score >= 2) strengthSeg2.classList.add(`is-${result.class}`);
    if (result.score >= 3) strengthSeg3.classList.add(`is-${result.class}`);

    if (strengthLevel) {
      strengthLevel.textContent = result.label;
      strengthLevel.className = `strength-text ${result.class}`;
    }

    if (strengthHint) {
      strengthHint.textContent = result.hint;
    }
  }

  // --- Field Validation Functions ---

  function validateUsername(value) {
    const trimmed = value.trim();
    if (!trimmed) {
      return 'Please choose an explorer call sign.';
    }
    if (trimmed.length < 3) {
      return 'Call sign must be at least 3 characters.';
    }
    if (trimmed.length > 20) {
      return 'Call sign cannot exceed 20 characters.';
    }
    const validCharsRegex = /^[a-zA-Z0-9_-]+$/;
    if (!validCharsRegex.test(trimmed)) {
      return 'Call sign can only contain letters, numbers, hyphens, and underscores.';
    }
    return null;
  }

  function validateEmail(value) {
    const trimmed = value.trim();
    if (!trimmed) {
      return 'Please enter your email address.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return 'Please enter a valid email address (e.g. explorer@nebula.io).';
    }
    return null;
  }

  function validatePassword(value) {
    if (!value) {
      return 'Please create a password.';
    }
    if (value.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    return null;
  }

  function validateConfirmPassword(confirmVal, passVal) {
    if (!confirmVal) {
      return 'Please confirm your password.';
    }
    if (confirmVal !== passVal) {
      return 'Passwords do not match.';
    }
    return null;
  }

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

  // --- Event Listeners for Real-Time Validation ---

  if (usernameInput) {
    usernameInput.addEventListener('input', () => {
      if (usernameGroup.classList.contains('has-error')) {
        setFieldError(usernameGroup, usernameError, validateUsername(usernameInput.value));
      }
    });

    usernameInput.addEventListener('blur', () => {
      if (usernameInput.value.trim().length > 0) {
        setFieldError(usernameGroup, usernameError, validateUsername(usernameInput.value));
      }
    });
  }

  if (emailInput) {
    emailInput.addEventListener('input', () => {
      if (emailGroup.classList.contains('has-error')) {
        setFieldError(emailGroup, emailError, validateEmail(emailInput.value));
      }
    });

    emailInput.addEventListener('blur', () => {
      if (emailInput.value.trim().length > 0) {
        setFieldError(emailGroup, emailError, validateEmail(emailInput.value));
      }
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      const val = passwordInput.value;
      const strength = evaluatePasswordStrength(val);
      updateStrengthUI(strength);

      if (passwordGroup.classList.contains('has-error')) {
        setFieldError(passwordGroup, passwordError, validatePassword(val));
      }

      // If confirm password already has a value, re-check match
      if (confirmPasswordInput && confirmPasswordInput.value) {
        setFieldError(confirmPasswordGroup, confirmPasswordError, validateConfirmPassword(confirmPasswordInput.value, val));
      }
    });

    passwordInput.addEventListener('blur', () => {
      if (passwordInput.value.length > 0) {
        setFieldError(passwordGroup, passwordError, validatePassword(passwordInput.value));
      }
    });
  }

  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', () => {
      if (confirmPasswordGroup.classList.contains('has-error')) {
        setFieldError(confirmPasswordGroup, confirmPasswordError, validateConfirmPassword(confirmPasswordInput.value, passwordInput.value));
      }
    });

    confirmPasswordInput.addEventListener('blur', () => {
      if (confirmPasswordInput.value.length > 0) {
        setFieldError(confirmPasswordGroup, confirmPasswordError, validateConfirmPassword(confirmPasswordInput.value, passwordInput.value));
      }
    });
  }

  // --- Form Submission ---
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      const userVal = usernameInput ? usernameInput.value : '';
      const emailVal = emailInput ? emailInput.value : '';
      const passVal = passwordInput ? passwordInput.value : '';
      const confirmVal = confirmPasswordInput ? confirmPasswordInput.value : '';

      const uError = validateUsername(userVal);
      const eError = validateEmail(emailVal);
      const pError = validatePassword(passVal);
      const cError = validateConfirmPassword(confirmVal, passVal);

      setFieldError(usernameGroup, usernameError, uError);
      setFieldError(emailGroup, emailError, eError);
      setFieldError(passwordGroup, passwordError, pError);
      setFieldError(confirmPasswordGroup, confirmPasswordError, cError);

      if (uError || eError || pError || cError) {
        showAlert('error', 'Please resolve the highlighted fields to continue.');

        if (uError && usernameInput) usernameInput.focus();
        else if (eError && emailInput) emailInput.focus();
        else if (pError && passwordInput) passwordInput.focus();
        else if (cError && confirmPasswordInput) confirmPasswordInput.focus();
        return;
      }

      // --- Account Creation & Virtual Identity Session (MongoDB Backend) ---
      submitBtn.classList.add('btn-loading');
      submitBtn.disabled = true;
      const btnText = submitBtn.querySelector('.btn-text-content');
      if (btnText) btnText.textContent = 'Creating account in database...';

      let registeredUser = null;

      // 1. Send registration request to real MongoDB Backend
      try {
        const apiBase = (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '4000'))
          ? 'http://localhost:4000'
          : '';
        const response = await fetch(`${apiBase}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: userVal.trim(),
            email: emailVal.trim(),
            password: passVal
          })
        });

        const data = await response.json();

        if (response.ok && data.success && data.user) {
          registeredUser = data.user;
        } else {
          // Rejection or duplicate error from MongoDB
          submitBtn.classList.remove('btn-loading');
          submitBtn.disabled = false;
          if (btnText) btnText.textContent = 'Create Account';
          showAlert('error', data.message || 'Error creating account.');
          return;
        }
      } catch (networkErr) {
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Create Account';
        showAlert('error', 'Cannot reach database server. Please ensure the backend is running.');
        return;
      }

      // Require player to log in with correct credentials
      setTimeout(() => {
        if (btnText) btnText.textContent = 'Account Created ✓';
        showAlert(
          'success',
          `Account created for ${registeredUser.username}! Redirecting to Sign In...`
        );

        setTimeout(() => {
          window.location.href = `login.html?registered=true&user=${encodeURIComponent(registeredUser.username)}`;
        }, 650);
      }, 350);
    });
  }
});

