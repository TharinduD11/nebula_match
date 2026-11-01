/**
 * Nebula Match — Home Page Interactions & Virtual Identity Preview
 * 
 * Responsibilities:
 * - Interactive 3D card showcase flip handlers (click & keyboard)
 * - Virtual Identity detection (reads stored session to update navigation badge)
 * - Smooth sign-out capability
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Element Selectors ---
  const showcaseCards = document.querySelectorAll('.showcase-card');
  const headerAuthGroup = document.getElementById('headerAuthGroup');
  const playBtn = document.getElementById('playBtn');

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

  // --- 2. Virtual Identity & Session Handling ---
  function updateAuthUI() {
    if (!headerAuthGroup) return;

    // Check localStorage for logged-in explorer identity (simulated or real)
    const storedUserJson = localStorage.getItem('nebula_user');
    let currentUser = null;

    if (storedUserJson) {
      try {
        currentUser = JSON.parse(storedUserJson);
      } catch (e) {
        localStorage.removeItem('nebula_user');
      }
    }

    if (currentUser && currentUser.username) {
      const initial = currentUser.username.charAt(0).toUpperCase();
      headerAuthGroup.innerHTML = `
        <div class="user-badge" title="Authenticated Explorer: ${currentUser.username}">
          <span class="user-badge-avatar" aria-hidden="true">${initial}</span>
          <span>${currentUser.username}</span>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" id="signOutBtn" title="Sign out of virtual identity">
          Sign Out
        </button>
      `;

      const signOutBtn = document.getElementById('signOutBtn');
      if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
          localStorage.removeItem('nebula_user');
          updateAuthUI();
        });
      }
    } else {
      headerAuthGroup.innerHTML = `
        <a href="login.html" class="btn btn-secondary btn-sm" id="authBtn">Sign In</a>
      `;
    }
  }

  updateAuthUI();
});

