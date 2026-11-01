/**
 * Nebula Match — The Fish Game API Terminal Logic
 * Reference: https://marcconrad.com/uob/fish/doc.php
 */

document.addEventListener('DOMContentLoaded', () => {
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
    const count = Math.floor(Math.random() * 6) + 3; // 3 to 8
    const width = 640;
    const height = 340;
    const positions = [];
    const minDistance = 85;

    for (let i = 0; i < count; i++) {
      let placed = false;
      let tries = 0;
      while (!placed && tries < 80) {
        tries++;
        const x = Math.floor(Math.random() * (width - 160)) + 80;
        const y = Math.floor(Math.random() * (height - 110)) + 55;
        const scale = 0.85 + Math.random() * 0.25;

        const tooClose = positions.some(p => {
          const dx = p.x - x;
          const dy = p.y - y;
          return Math.sqrt(dx * dx + dy * dy) < minDistance;
        });

        if (!tooClose) {
          positions.push({ x, y, scale });
          placed = true;
        }
      }
      if (!placed) {
        positions.push({ x: 80 + (i % 3) * 170, y: 70 + Math.floor(i / 3) * 90, scale: 0.9 });
      }
    }

    const fishNodes = positions.map(p => `
      <g transform="translate(${p.x}, ${p.y}) scale(${p.scale.toFixed(2)})">
        <path d="M -38,0 C -24,-20 18,-20 32,0 C 18,20 -24,20 -38,0 Z" fill="#ffffff" stroke="#1e293b" stroke-width="3" stroke-linejoin="round" />
        <path d="M 30,-2 L 48,-16 L 45,0 L 48,16 L 30,2 Z" fill="#ffffff" stroke="#1e293b" stroke-width="3" stroke-linejoin="round" />
        <circle cx="-20" cy="-5" r="3" fill="#1e293b" />
      </g>
    `).join('\n');

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
        <rect width="${width}" height="${height}" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2.5" />
        ${fishNodes}
      </svg>
    `.trim();

    return {
      question: `data:image/svg+xml;base64,${btoa(svg)}`,
      solution: count,
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
      fishCountInput.value = '';
      fishCountInput.disabled = false;
    }
    if (fishSubmitBtn) fishSubmitBtn.disabled = false;
    if (fishQuestStatus) fishQuestStatus.textContent = 'Contacting Fish Game API...';

    let puzzle = null;

    // 1. Try Express backend proxy
    try {
      const res = await fetch('/api/fish/challenge');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.question && data.solution !== undefined) {
          puzzle = data;
        }
      }
    } catch (e) {
      // Backend not reached
    }

    // 2. Try direct Fish API
    if (!puzzle) {
      try {
        const res = await fetch('https://marcconrad.com/uob/fish/api.php?out=json');
        if (res.ok) {
          const data = await res.json();
          if (data && data.question && data.solution !== undefined) {
            puzzle = {
              question: data.question,
              solution: Number(data.solution),
              source: 'marcconrad-fish-api'
            };
          }
        }
      } catch (e) {
        // CORS or offline
      }
    }

    // 3. Fallback to procedural fish quest generator
    if (!puzzle) {
      puzzle = createLocalFishPuzzle();
    }

    activeFishSolution = Number(puzzle.solution);

    fishImg.onload = () => {
      fishLoading.style.display = 'none';
      fishImg.style.display = 'block';
      if (fishQuestStatus) fishQuestStatus.textContent = 'Quest is ready.';
      if (fishCountInput) fishCountInput.focus();
    };
    fishImg.onerror = () => {
      const fallback = createLocalFishPuzzle();
      activeFishSolution = fallback.solution;
      fishImg.src = fallback.question;
      fishLoading.style.display = 'none';
      fishImg.style.display = 'block';
    };
    fishImg.src = puzzle.question;
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

  loadFishQuest();
});
