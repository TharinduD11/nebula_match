/**
 * Nebula Match — Home Page & Session Navigation Controller
 * 
 * Responsibilities:
 * - Interactive 3D card showcase flip handlers (click & keyboard)
 * - Strict authentication check:
 *   - Only authenticated users can access the game arena.
 *   - Clicking 'Play Game' redirects unauthenticated users to login.html.
 *   - Clicking 'Sign Out' clears the session and immediately redirects to login.html.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Element Selectors ---
  const showcaseCards = document.querySelectorAll('.showcase-card');
  const headerAuthGroup = document.getElementById('headerAuthGroup');
  const playBtn = document.getElementById('playBtn');
  const playBtnLabel = document.getElementById('playBtnLabel');

  // --- 1. Interactive 3D Card Showcase ---
  showcaseCards.forEach((card) => {
    // Click toggle
    card.addEventListener('click', () => {
      card.classList.toggle('is-flipped');
    });

    // Keyboard accessibility: Enter or Space flips the card
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.classList.toggle('is-flipped');
      }
    });
  });

  // --- 2. Check Stored User Session ---
  function getAuthenticatedUser() {
    const storedUserJson = localStorage.getItem('nebula_user');
    if (!storedUserJson) return null;

    try {
      const user = JSON.parse(storedUserJson);
      if (user && user.username && user.isAuthenticated) {
        return user;
      }
    } catch (e) {
      localStorage.removeItem('nebula_user');
    }
    return null;
  }

  // --- 3. Dynamic Header & CTA Update ---
  function updateAuthUI() {
    const currentUser = getAuthenticatedUser();

    if (headerAuthGroup) {
      if (currentUser) {
        const initial = currentUser.username.charAt(0).toUpperCase();
        headerAuthGroup.innerHTML = `
          <div class="user-badge" title="Signed in as: ${currentUser.username}">
            <span class="user-badge-avatar" aria-hidden="true">${initial}</span>
            <span>${currentUser.username}</span>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" id="signOutBtn" title="Sign out of your account">
            Sign Out
          </button>
        `;

        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
          signOutBtn.addEventListener('click', () => {
            // Clear player session from storage
            localStorage.removeItem('nebula_user');
            // Immediately navigate from home page to sign in page
            window.location.href = 'login.html';
          });
        }
      } else {
        headerAuthGroup.innerHTML = `
          <a href="login.html" class="btn btn-secondary btn-sm" id="authBtn">Sign In</a>
        `;
      }
    }

    // Update CTA button state
    if (playBtnLabel) {
      playBtnLabel.textContent = currentUser ? 'Play Game' : 'Sign In to Play';
    }
  }

  // --- 4. Enforce Login on Play Button Click ---
  if (playBtn) {
    playBtn.addEventListener('click', (e) => {
      const currentUser = getAuthenticatedUser();
      if (!currentUser) {
        e.preventDefault();
        // Redirect to login page with target
        window.location.href = 'login.html?redirect=difficulty.html';
      }
    });
  }

  updateAuthUI();
});
