/**
 * Nebula Match — Difficulty Selector Interactions & Auth Guard
 * 
 * Handles:
 * - Strict auth protection (redirects to login.html if not signed in)
 * - Dynamic card selection with keyboard & click navigation
 * - Updating the launch button label
 * - Navigating to game.html?difficulty=<tier>
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Strict Auth Guard ---
  const userJson = localStorage.getItem('nebula_user');
  let authUser = null;
  try {
    if (userJson) authUser = JSON.parse(userJson);
  } catch (e) {
    localStorage.removeItem('nebula_user');
  }

  if (!authUser || !authUser.username || !authUser.isAuthenticated) {
    window.location.replace('login.html?redirect=difficulty.html');
    return;
  }

  const tierCards = document.querySelectorAll('.tier-card');
  const launchGameBtn = document.getElementById('launchGameBtn');
  const launchBtnText = document.getElementById('launchBtnText');

  let selectedTier = 'medium';

  const TIER_DETAILS = {
    easy: { name: 'Easy', time: '60s', desc: 'Start Easy Game (60s)' },
    medium: { name: 'Medium', time: '45s', desc: 'Start Medium Game (45s)' },
    hard: { name: 'Hard', time: '35s', desc: 'Start Hard Game (35s)' }
  };

  function selectTier(tierKey) {
    if (!TIER_DETAILS[tierKey]) return;
    selectedTier = tierKey;

    tierCards.forEach((card) => {
      const isCurrent = card.dataset.tier === tierKey;
      card.classList.toggle('is-selected', isCurrent);
      card.setAttribute('aria-checked', isCurrent ? 'true' : 'false');

      const indicatorLabel = card.querySelector('.indicator-label');
      if (indicatorLabel) {
        indicatorLabel.textContent = isCurrent 
          ? `Selected ${TIER_DETAILS[tierKey].name}` 
          : `Select ${TIER_DETAILS[card.dataset.tier]?.name || ''}`;
      }
    });

    if (launchBtnText) {
      launchBtnText.textContent = TIER_DETAILS[tierKey].desc;
    }
  }

  // Setup click & keyboard selection
  tierCards.forEach((card) => {
    card.addEventListener('click', () => {
      selectTier(card.dataset.tier);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectTier(card.dataset.tier);
      }
    });
  });

  // Launch button click
  if (launchGameBtn) {
    launchGameBtn.addEventListener('click', () => {
      // Save chosen difficulty in sessionStorage for robust fallback
      sessionStorage.setItem('nebula_current_difficulty', selectedTier);
      window.location.href = `game.html?difficulty=${selectedTier}`;
    });
  }
});
