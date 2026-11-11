/**
 * Nebula Match — The Fish Game API Terminal Logic
 * Reference: https://marcconrad.com/uob/fish/doc.php
 */

document.addEventListener('DOMContentLoaded', () => {
  // Strict Auth Guard
  const userJson = localStorage.getItem('nebula_user');
  let authUser = null;
  try {
    if (userJson) authUser = JSON.parse(userJson);
  } catch (e) {
    localStorage.removeItem('nebula_user');
  }
  if (!authUser || !authUser.username || !authUser.isAuthenticated) {
    window.location.replace('login.html?redirect=challenge.html');
    return;
  }

  const fishLoading = document.getElementById('fishLoading');
  const fishImg = document.getElementById('fishImg');
  const fishQuestStatus = document.getElementById('fishQuestStatus');
  const fishGameForm = document.getElementById('fishGameForm');
  const fishCountInput = document.getElementById('fishCountInput');
  const fishSubmitBtn = document.getElementById('fishSubmitBtn');
  const fishFeedback = document.getElementById('fishFeedback');
  const fishTryAgainBtn = document.getElementById('fishTryAgainBtn');

  let activeFishSolution = null;

  async function loadFishQuest() {
    if (!fishLoading || !fishImg) return;

    fishLoading.style.display = 'flex';
    fishImg.style.display = 'none';
    if (fishFeedback) fishFeedback.innerHTML = '';
    if (fishTryAgainBtn) fishTryAgainBtn.style.display = 'none';
    if (fishCountInput) {
      fishCountInput.value = '0';
      fishCountInput.disabled = true;
    }
    if (fishSubmitBtn) fishSubmitBtn.disabled = true;
    if (fishQuestStatus) fishQuestStatus.textContent = 'Contacting Fish Game API...';

    try {
      const apiBase = (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '4000'))
        ? 'http://localhost:4000'
        : '';
      const res = await fetch(`${apiBase}/api/fish/challenge`);
      const puzzle = await res.json();
      const solution = Number(puzzle.solution);
      if (!res.ok || !puzzle.success || !puzzle.question || !Number.isInteger(solution)) {
        throw new Error(puzzle.message || 'Could not load a Fish Game puzzle.');
      }

      activeFishSolution = solution;

      fishImg.onload = () => {
        fishLoading.style.display = 'none';
        fishImg.style.display = 'block';
        if (fishQuestStatus) fishQuestStatus.textContent = 'Live API Feed • Quest Ready';
        if (fishCountInput) {
          fishCountInput.disabled = false;
          fishCountInput.focus();
        }
        if (fishSubmitBtn) fishSubmitBtn.disabled = false;
      };
      fishImg.onerror = () => {
        activeFishSolution = null;
        fishLoading.style.display = 'none';
        if (fishQuestStatus) fishQuestStatus.textContent = 'Puzzle image could not load';
        if (fishFeedback) fishFeedback.innerHTML = '<div class="fish-alert-error">Puzzle image could not load. Please try again.</div>';
        if (fishTryAgainBtn) fishTryAgainBtn.style.display = 'inline-flex';
      };
      fishImg.src = puzzle.question;

      if (fishImg.complete && fishImg.naturalWidth > 0) fishImg.onload();
    } catch (err) {
      activeFishSolution = null;
      fishLoading.style.display = 'none';
      if (fishQuestStatus) fishQuestStatus.textContent = 'Fish Game API unavailable';
      if (fishFeedback) fishFeedback.innerHTML = '<div class="fish-alert-error">Could not connect to the Fish Game API. Check your connection and try again.</div>';
      if (fishTryAgainBtn) fishTryAgainBtn.style.display = 'inline-flex';
    }
  }

  // Handle Form Submission
  if (fishGameForm) {
    fishGameForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!fishCountInput || activeFishSolution === null) return;

      const userVal = Number(fishCountInput.value.trim());

      if (isNaN(userVal) || fishCountInput.value.trim() === '') {
        if (fishFeedback) {
          fishFeedback.innerHTML = `<span style="color: #f87171;">Please enter a number.</span>`;
        }
        return;
      }

      if (userVal === activeFishSolution) {
        // Correct Solution!
        if (fishFeedback) {
          fishFeedback.innerHTML = `
            <div class="fish-alert-success">
              ✓ Correct! The picture has ${activeFishSolution} fish. +15s Extra Time Awarded!
            </div>
          `;
        }
        if (fishSubmitBtn) fishSubmitBtn.disabled = true;
        if (fishCountInput) fishCountInput.disabled = true;

        // Save bonus time in session so game.html picks it up
        sessionStorage.setItem('nebula_bonus_claimed', '15');

      } else {
        // Incorrect Solution
        if (fishFeedback) {
          fishFeedback.innerHTML = `
            <div class="fish-alert-error">
              ✕ Incorrect count (${userVal}). The picture does not contain that many fish.
            </div>
          `;
        }
        if (fishTryAgainBtn) fishTryAgainBtn.style.display = 'inline-block';
      }
    });
  }

  if (fishTryAgainBtn) {
    fishTryAgainBtn.addEventListener('click', loadFishQuest);
  }

  // Interactive Stepper Buttons (- and +)
  const fishMinusBtn = document.getElementById('fishMinusBtn');
  const fishPlusBtn = document.getElementById('fishPlusBtn');

  if (fishMinusBtn && fishCountInput) {
    fishMinusBtn.addEventListener('click', (e) => {
      e.preventDefault();
      let val = parseInt(fishCountInput.value, 10);
      if (isNaN(val) || val <= 0) val = 0;
      else val -= 1;
      fishCountInput.value = val;
    });
  }
  if (fishPlusBtn && fishCountInput) {
    fishPlusBtn.addEventListener('click', (e) => {
      e.preventDefault();
      let val = parseInt(fishCountInput.value, 10);
      if (isNaN(val) || val < 0) val = 0;
      if (val < 25) val += 1;
      fishCountInput.value = val;
    });
  }

  loadFishQuest();
});
