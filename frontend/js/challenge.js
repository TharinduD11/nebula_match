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

  function createLocalFishPuzzle() {
    const count = Math.floor(Math.random() * 5) + 3; // 3 to 7 fish
    const width = 640;
    const height = 340;
    const positions = [];
    const minDistance = 110;

    for (let i = 0; i < count; i++) {
      let placed = false;
      let tries = 0;
      while (!placed && tries < 100) {
        tries++;
        const x = Math.floor(Math.random() * (width - 180)) + 90;
        const y = Math.floor(Math.random() * (height - 120)) + 60;
        const scale = 0.92 + Math.random() * 0.18;
        const flip = Math.random() > 0.4 ? 1 : -1;

        const tooClose = positions.some(p => {
          const dx = p.x - x;
          const dy = p.y - y;
          return Math.sqrt(dx * dx + dy * dy) < minDistance;
        });

        if (!tooClose) {
          positions.push({ x, y, scale, flip });
          placed = true;
        }
      }
      if (!placed) {
        const col = i % 3;
        const row = Math.floor(i / 3);
        positions.push({ x: 120 + col * 180, y: 80 + row * 110, scale: 1, flip: 1 });
      }
    }

    const fishNodes = positions.map((p, idx) => {
      const sx = (p.scale * p.flip).toFixed(2);
      const sy = p.scale.toFixed(2);
      return `
      <!-- Fish #${idx + 1} -->
      <g transform="translate(${p.x}, ${p.y}) scale(${sx}, ${sy})">
        <!-- Fish Body matching Image 3 -->
        <path d="M -38,0 C -24,-20 20,-20 34,0 C 20,20 -24,20 -38,0 Z" fill="#ffffff" stroke="#0f172a" stroke-width="3" stroke-linejoin="round" />
        <!-- Fish Tail matching Image 3 -->
        <path d="M 30,-2 L 50,-16 L 46,0 L 50,16 L 30,2 Z" fill="#ffffff" stroke="#0f172a" stroke-width="3" stroke-linejoin="round" />
        <!-- Eye matching Image 3 -->
        <circle cx="-18" cy="-5" r="3.2" fill="#0f172a" />
      </g>
      `;
    }).join('\n');

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
        <rect width="${width}" height="${height}" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2.5" />
        ${fishNodes}
      </svg>
    `.trim();

    return {
      question: `data:image/svg+xml;base64,${btoa(svg)}`,
      solution: positions.length,
      source: 'local-fish-engine'
    };
  }

  async function loadFishQuest() {
    if (!fishLoading || !fishImg) return;

    fishLoading.style.display = 'flex';
    fishImg.style.display = 'none';
    if (fishFeedback) fishFeedback.innerHTML = '';
    if (fishTryAgainBtn) fishTryAgainBtn.style.display = 'none';
    if (fishCountInput) {
      fishCountInput.value = '0';
      fishCountInput.disabled = false;
    }
    if (fishSubmitBtn) fishSubmitBtn.disabled = false;
    if (fishQuestStatus) fishQuestStatus.textContent = 'Contacting Fish Game API...';

    let puzzle = null;

    // 1. Try Express backend proxy
    try {
      const apiBase = (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '4000'))
        ? 'http://localhost:4000'
        : '';
      const res = await fetch(`${apiBase}/api/fish/challenge`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.question && data.solution !== undefined) {
          puzzle = data;
        }
      }
    } catch (e) {
      // Backend not reached
    }

    // 2. Direct clean fallback
    if (!puzzle) {
      puzzle = createLocalFishPuzzle();
    }

    activeFishSolution = Number(puzzle.solution);

    fishImg.onload = () => {
      fishLoading.style.display = 'none';
      fishImg.style.display = 'block';
      if (fishQuestStatus) {
        const sourceLabel = puzzle.source === 'marcconrad-fish-api' ? 'Live API Feed • Quest Ready' : 'Quest is ready.';
        fishQuestStatus.textContent = sourceLabel;
      }
      if (fishCountInput) fishCountInput.focus();
    };
    fishImg.onerror = () => {
      const fallback = createLocalFishPuzzle();
      activeFishSolution = fallback.solution;
      fishImg.src = fallback.question;
      fishLoading.style.display = 'none';
      fishImg.style.display = 'block';
      if (fishQuestStatus) fishQuestStatus.textContent = 'Quest is ready.';
    };
    fishImg.src = puzzle.question;

    // Safety check for cached data URL
    if (fishImg.complete && fishImg.naturalWidth > 0) {
      fishLoading.style.display = 'none';
      fishImg.style.display = 'block';
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
