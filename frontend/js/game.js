/**
 * Nebula Match — Stage 8 & 9: Core Memory Matrix & Star Protocol Engine
 * 
 * Responsibilities:
 * - Dynamic card matrix generation ($4\times3$, $4\times4$, $5\times4$)
 * - 3D CSS perspective card flip mechanics & match validation
 * - Chronometer countdown with low-time warning & progress bar
 * - Streak combo multipliers & score tracking
 * - Fish Game API Star Challenge simulation (+15s bonus time)
 * - Synthesized Web Audio API sound effects (zero external asset dependencies)
 * - Game pause/resume and victory/defeat state handling
 * - Result packaging & transition to results.html
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Audio Synthesizer (Web Audio API) ---
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;
  let soundEnabled = true;

  function initAudio() {
    if (!audioCtx && AudioCtx) {
      audioCtx = new AudioCtx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, duration = 0.1, type = 'sine', gainVal = 0.15) {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio not permitted or supported
    }
  }

  function playSoundFlip() {
    playTone(480, 0.08, 'triangle', 0.1);
  }

  function playSoundMatch() {
    playTone(523.25, 0.12, 'sine', 0.15); // C5
    setTimeout(() => playTone(659.25, 0.12, 'sine', 0.15), 100); // E5
    setTimeout(() => playTone(783.99, 0.22, 'sine', 0.18), 200); // G5
  }

  function playSoundMismatch() {
    playTone(260, 0.15, 'sawtooth', 0.08);
    setTimeout(() => playTone(220, 0.2, 'sawtooth', 0.08), 100);
  }

  function playSoundBonus() {
    playTone(600, 0.1, 'sine', 0.15);
    setTimeout(() => playTone(800, 0.12, 'sine', 0.18), 120);
    setTimeout(() => playTone(1000, 0.25, 'sine', 0.2), 240);
  }

  function playSoundVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, idx) => {
      setTimeout(() => playTone(f, 0.2, 'triangle', 0.2), idx * 140);
    });
  }

  // --- 2. Element Selectors ---
  const memoryGrid = document.getElementById('memoryGrid');
  const timerDigits = document.getElementById('timerDigits');
  const timerFill = document.getElementById('timerFill');
  const hudTimerCard = document.getElementById('hudTimerCard');
  const scoreValue = document.getElementById('scoreValue');
  const streakBadge = document.getElementById('streakBadge');
  const streakCount = document.getElementById('streakCount');
  const pairsMatchedEl = document.getElementById('pairsMatched');
  const pairsTotalEl = document.getElementById('pairsTotal');
  const flipsCountEl = document.getElementById('flipsCount');
  const tierDisplayPill = document.getElementById('tierDisplayPill');
  const starTriggerBtn = document.getElementById('starTriggerBtn');

  // Header controls & badges
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const hudUserBadge = document.getElementById('hudUserBadge');
  const hudUserAvatar = document.getElementById('hudUserAvatar');
  const hudUsername = document.getElementById('hudUsername');

  // Modals & Fish Game API Elements
  const pauseModal = document.getElementById('pauseModal');
  const resumeBtn = document.getElementById('resumeBtn');
  const restartBtn = document.getElementById('restartBtn');
  const bottomPauseBtn = document.getElementById('bottomPauseBtn');
  const bottomRestartBtn = document.getElementById('bottomRestartBtn');
  const bottomBonusTimeBtn = document.getElementById('bottomBonusTimeBtn');

  const starChallengeModal = document.getElementById('starChallengeModal');
  const fishPictureCard = document.getElementById('fishPictureCard');
  const fishLoading = document.getElementById('fishLoading');
  const fishImg = document.getElementById('fishImg');
  const fishQuestStatus = document.getElementById('fishQuestStatus');
  const fishGameForm = document.getElementById('fishGameForm');
  const fishCountInput = document.getElementById('fishCountInput');
  const fishSubmitBtn = document.getElementById('fishSubmitBtn');
  const fishFeedback = document.getElementById('fishFeedback');
  const fishTryAgainBtn = document.getElementById('fishTryAgainBtn');
  const closeChallengeBtn = document.getElementById('closeChallengeBtn');

  // --- 3. Parse Difficulty Configuration ---
  const urlParams = new URLSearchParams(window.location.search);
  const selectedDifficulty = urlParams.get('difficulty') || sessionStorage.getItem('nebula_current_difficulty') || 'medium';

  const DIFFICULTY_MAP = {
    easy: {
      key: 'easy',
      name: 'Cadet Tier',
      cols: 4,
      totalPairs: 6,
      timeLimit: 60,
      multiplier: 1.0
    },
    medium: {
      key: 'medium',
      name: 'Commander Tier',
      cols: 4,
      totalPairs: 8,
      timeLimit: 45,
      multiplier: 1.5
    },
    hard: {
      key: 'hard',
      name: 'Cosmic Ace Tier',
      cols: 5,
      totalPairs: 10,
      timeLimit: 35,
      multiplier: 2.0
    }
  };

  const config = DIFFICULTY_MAP[selectedDifficulty] || DIFFICULTY_MAP.medium;
  if (tierDisplayPill) {
    tierDisplayPill.querySelector('span').textContent = config.name;
  }

  // --- 4. Celestial Objects Catalog (Distinctive SVGs) ---
  const CELESTIAL_OBJECTS = [
    {
      id: 'terra',
      name: 'Terra',
      color: '#60a5fa',
      svg: `
        <svg viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M3.6 9h16.8M3.6 15h16.8"></path>
          <path d="M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18"></path>
        </svg>
      `
    },
    {
      id: 'solar',
      name: 'Solar Star',
      color: '#fbbf24',
      svg: `
        <svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      `
    },
    {
      id: 'saturn',
      name: 'Saturn',
      color: '#c084fc',
      svg: `
        <svg viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="6"></circle>
          <path d="M2.5 14.5c3.5 3.5 12.5 2 17-2.5s3-9.5-0.5-9.5c-3.5 0-9 4-13 8.5"></path>
        </svg>
      `
    },
    {
      id: 'lunar',
      name: 'Lunar',
      color: '#e2e8f0',
      svg: `
        <svg viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      `
    },
    {
      id: 'mars',
      name: 'Mars',
      color: '#f87171',
      svg: `
        <svg viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="10" cy="14" r="6"></circle>
          <line x1="14.5" y1="9.5" x2="20" y2="4"></line>
          <polyline points="15 4 20 4 20 9"></polyline>
        </svg>
      `
    },
    {
      id: 'jupiter',
      name: 'Jupiter',
      color: '#fb923c',
      svg: `
        <svg viewBox="0 0 24 24" fill="none" stroke="#fb923c" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="8"></circle>
          <path d="M5 10c3 1.5 11 1.5 14 0M4 14c4 1.5 12 1.5 16 0"></path>
          <circle cx="15.5" cy="15.5" r="1.5" fill="#fb923c"></circle>
        </svg>
      `
    },
    {
      id: 'comet',
      name: 'Comet',
      color: '#38bdf8',
      svg: `
        <svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="6" cy="18" r="3"></circle>
          <line x1="8.5" y1="15.5" x2="21" y2="3"></line>
          <line x1="6" y1="13" x2="17" y2="2"></line>
          <line x1="11" y1="18" x2="22" y2="7"></line>
        </svg>
      `
    },
    {
      id: 'galaxy',
      name: 'Galaxy',
      color: '#a855f7',
      svg: `
        <svg viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 2a10 10 0 0 1 10 10c0 4-3 6-5 6-3 0-5-2-5-6M12 22a10 10 0 0 1-10-10c0-4 3-6 5-6 3 0 5 2 5 6"></path>
        </svg>
      `
    },
    {
      id: 'blackhole',
      name: 'Singularity',
      color: '#ec4899',
      svg: `
        <svg viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4" fill="#000"></circle>
          <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-30 12 12)"></ellipse>
        </svg>
      `
    },
    {
      id: 'astronaut',
      name: 'Explorer',
      color: '#34d399',
      svg: `
        <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a8 8 0 0 0-8 8v3a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-3a8 8 0 0 0-8-8z"></path>
          <rect x="7" y="7" width="10" height="6" rx="3" ry="3"></rect>
          <line x1="12" y1="17" x2="12" y2="22"></line>
        </svg>
      `
    }
  ];

  // --- 5. Virtual Identity Session Display ---
  try {
    const userJson = localStorage.getItem('nebula_user');
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user && user.username) {
        if (hudUsername) hudUsername.textContent = user.username;
        if (hudUserAvatar) hudUserAvatar.textContent = user.username.charAt(0).toUpperCase();
      }
    }
  } catch (e) {
    // Non-blocking
  }

  // --- 6. Game State Variables ---
  let timeRemaining = config.timeLimit;
  let maxTime = config.timeLimit;
  let timerInterval = null;
  let isGameActive = false;
  let isPaused = false;

  let currentScore = 0;
  let streakMultiplier = 1;
  let movesCount = 0;
  let pairsMatched = 0;
  let bonusTimeClaimed = 0;
  let starChallengeUsed = false;

  let flippedCards = [];
  let isBoardLocked = false;

  // --- 7. Board Initialization & Shuffling ---
  function initBoard() {
    if (!memoryGrid) return;
    memoryGrid.innerHTML = '';
    
    // Set grid columns
    memoryGrid.style.gridTemplateColumns = `repeat(${config.cols}, minmax(0, 1fr))`;

    // Select subset of celestial objects for current difficulty
    const chosenObjects = CELESTIAL_OBJECTS.slice(0, config.totalPairs);
    
    // Duplicate each object to make pairs
    const deck = [];
    chosenObjects.forEach(obj => {
      deck.push({ ...obj, uniqueKey: `${obj.id}-a` });
      deck.push({ ...obj, uniqueKey: `${obj.id}-b` });
    });

    // Fisher-Yates Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Render cards
    deck.forEach(cardData => {
      const cardEl = document.createElement('div');
      cardEl.className = 'game-card';
      cardEl.dataset.id = cardData.id;
      cardEl.dataset.name = cardData.name;
      cardEl.tabIndex = 0;
      cardEl.setAttribute('role', 'button');
      cardEl.setAttribute('aria-label', `Memory card`);

      cardEl.innerHTML = `
        <div class="game-card-face game-card-front">
          <svg class="card-back-pattern" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14"></path>
          </svg>
          <span class="card-back-label">Nebula</span>
        </div>
        <div class="game-card-face game-card-back">
          <div class="card-glyph-wrapper" style="color: ${cardData.color};">
            ${cardData.svg}
          </div>
          <span class="card-target-name">${cardData.name}</span>
        </div>
      `;

      // Event listeners
      cardEl.addEventListener('click', () => handleCardFlip(cardEl));
      cardEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardFlip(cardEl);
        }
      });

      memoryGrid.appendChild(cardEl);
    });

    // Update initial counters
    if (pairsTotalEl) pairsTotalEl.textContent = config.totalPairs;
    if (pairsMatchedEl) pairsMatchedEl.textContent = '0';
    if (flipsCountEl) flipsCountEl.textContent = 'Moves: 0';
    if (scoreValue) scoreValue.textContent = '0';
    updateTimerDisplay();
  }

  // --- 8. Card Flip Logic ---
  function handleCardFlip(cardEl) {
    if (!isGameActive || isPaused || isBoardLocked) return;
    if (cardEl.classList.contains('is-flipped') || cardEl.classList.contains('is-matched')) return;

    // Flip card
    playSoundFlip();
    cardEl.classList.add('is-flipped');
    cardEl.setAttribute('aria-label', `Flipped: ${cardEl.dataset.name}`);
    flippedCards.push(cardEl);

    if (flippedCards.length === 2) {
      movesCount++;
      if (flipsCountEl) flipsCountEl.textContent = `Moves: ${movesCount}`;
      checkPairMatch();
    }
  }

  // --- 9. Check Pair Match ---
  function checkPairMatch() {
    const [card1, card2] = flippedCards;
    isBoardLocked = true;

    const isMatch = card1.dataset.id === card2.dataset.id;

    if (isMatch) {
      // Pair Matched!
      setTimeout(() => {
        playSoundMatch();
        card1.classList.add('is-matched');
        card2.classList.add('is-matched');

        pairsMatched++;
        if (pairsMatchedEl) pairsMatchedEl.textContent = pairsMatched;

        // Points calculation with streak multiplier
        const basePoints = 120;
        const awardedPoints = Math.round(basePoints * streakMultiplier * config.multiplier);
        currentScore += awardedPoints;
        if (scoreValue) scoreValue.textContent = currentScore;

        // Streak update
        streakMultiplier++;
        if (streakBadge && streakCount) {
          streakBadge.style.display = 'inline-flex';
          streakCount.textContent = `${streakMultiplier}×`;
        }

        flippedCards = [];
        isBoardLocked = false;

        // Check victory condition
        if (pairsMatched === config.totalPairs) {
          endMission(true);
        }
      }, 350);

    } else {
      // Mismatch
      setTimeout(() => {
        playSoundMismatch();
        card1.classList.add('is-mismatch-shake');
        card2.classList.add('is-mismatch-shake');

        // Reset streak
        streakMultiplier = 1;
        if (streakBadge) streakBadge.style.display = 'none';

        setTimeout(() => {
          card1.classList.remove('is-flipped', 'is-mismatch-shake');
          card2.classList.remove('is-flipped', 'is-mismatch-shake');
          card1.setAttribute('aria-label', 'Memory card');
          card2.setAttribute('aria-label', 'Memory card');
          flippedCards = [];
          isBoardLocked = false;
        }, 600);
      }, 500);
    }
  }

  // --- 10. Chronometer Timer Engine ---
  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    isGameActive = true;

    timerInterval = setInterval(() => {
      if (!isPaused && isGameActive) {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
          clearInterval(timerInterval);
          endMission(false);
        }
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    if (!timerDigits) return;
    timerDigits.textContent = Math.max(0, timeRemaining);

    // Percentage for progress bar
    const pct = Math.max(0, Math.min(100, (timeRemaining / maxTime) * 100));
    if (timerFill) {
      timerFill.style.width = `${pct}%`;
    }

    // Danger state (less than 15s)
    if (timeRemaining <= 15) {
      hudTimerCard?.classList.add('is-danger');
      if (timeRemaining <= 5 && isGameActive) {
        playTone(330, 0.08, 'square', 0.05); // Pulsing warning beep
      }
    } else {
      hudTimerCard?.classList.remove('is-danger');
    }
  }

  // --- 11. Mission Termination & Score Aggregation ---
  function endMission(isVictory) {
    isGameActive = false;
    if (timerInterval) clearInterval(timerInterval);

    if (isVictory) {
      playSoundVictory();
      // Time bonus: 25 points per second left
      const timeBonus = Math.round(timeRemaining * 25 * config.multiplier);
      currentScore += timeBonus;
      if (scoreValue) scoreValue.textContent = currentScore;
    }

    // Accuracy calculation
    const accuracy = movesCount > 0 ? Math.min(100, Math.round((pairsMatched / movesCount) * 100)) : 100;

    // Package mission results
    const missionSummary = {
      outcome: isVictory ? 'victory' : 'defeat',
      score: currentScore,
      difficulty: config.key,
      difficultyName: config.name,
      pairsMatched: pairsMatched,
      totalPairs: config.totalPairs,
      moves: movesCount,
      accuracy: accuracy,
      timeRemaining: timeRemaining,
      timeElapsed: config.timeLimit - timeRemaining + bonusTimeClaimed,
      bonusTimeClaimed: bonusTimeClaimed,
      completedAt: new Date().toISOString()
    };

    sessionStorage.setItem('nebula_last_game', JSON.stringify(missionSummary));

    // Smooth navigation after short pause
    setTimeout(() => {
      window.location.href = 'results.html';
    }, isVictory ? 1200 : 800);
  }

  // --- 12. Fish Game API Interoperability (Bonus Time Quest) ---
  let activeFishSolution = null;

  /**
   * Client-side procedural SVG fish generator matching Image 3
   * Ensures the puzzle works seamlessly offline or when API is unreachable.
   */
  function createLocalFishPuzzle() {
    const count = Math.floor(Math.random() * 6) + 3; // 3 to 8 fish
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

  /**
   * Fetch a fish puzzle from backend proxy or direct API with fallback
   */
  async function loadFishChallenge() {
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

    // 1. Try backend proxy route first
    try {
      const res = await fetch('/api/fish/challenge');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.question && data.solution !== undefined) {
          puzzle = data;
        }
      }
    } catch (err) {
      // Backend not running or unreachable
    }

    // 2. Try direct Marc Conrad API if running static frontend
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
      } catch (err) {
        // CORS or offline
      }
    }

    // 3. Fallback to client-side procedural engine
    if (!puzzle) {
      puzzle = createLocalFishPuzzle();
    }

    activeFishSolution = Number(puzzle.solution);

    // Render image
    fishImg.onload = () => {
      fishLoading.style.display = 'none';
      fishImg.style.display = 'block';
      if (fishQuestStatus) {
        fishQuestStatus.textContent = 'Quest is ready.';
      }
      if (fishCountInput) fishCountInput.focus();
    };
    fishImg.onerror = () => {
      // In case image URL fails to load, use SVG fallback
      const fallback = createLocalFishPuzzle();
      activeFishSolution = fallback.solution;
      fishImg.src = fallback.question;
      fishLoading.style.display = 'none';
      fishImg.style.display = 'block';
    };
    fishImg.src = puzzle.question;
  }

  function openStarChallenge() {
    if (!isGameActive) return;
    isPaused = true;

    if (starChallengeModal) {
      starChallengeModal.removeAttribute('hidden');
      starChallengeModal.setAttribute('aria-hidden', 'false');
    }

    loadFishChallenge();
  }

  // Handle Form Submission for Fish Game
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
        playSoundBonus();
        if (fishFeedback) {
          fishFeedback.innerHTML = `
            <div class="fish-alert-success">
              ✓ Correct! The picture has ${activeFishSolution} fish. +15s Extra Time Awarded!
            </div>
          `;
        }
        if (fishSubmitBtn) fishSubmitBtn.disabled = true;
        if (fishCountInput) fishCountInput.disabled = true;

        // Award Extra Time
        timeRemaining += 15;
        maxTime += 15;
        bonusTimeClaimed += 15;
        updateTimerDisplay();

        // Highlight bonus time button
        if (bottomBonusTimeBtn) {
          bottomBonusTimeBtn.classList.add('btn-bonus-awarded');
        }

        setTimeout(() => {
          closeStarChallengeModal();
        }, 1300);

      } else {
        // Incorrect Solution
        playSoundMismatch();
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

  // Try Again Button
  if (fishTryAgainBtn) {
    fishTryAgainBtn.addEventListener('click', () => {
      loadFishChallenge();
    });
  }

  // Connect In-game Bonus Time buttons
  if (bottomBonusTimeBtn) {
    bottomBonusTimeBtn.addEventListener('click', openStarChallenge);
  }
  if (bottomPauseBtn) {
    bottomPauseBtn.addEventListener('click', togglePause);
  }
  if (bottomRestartBtn) {
    bottomRestartBtn.addEventListener('click', () => {
      if (confirm('Restart mission from beginning?')) {
        restartBtn?.click();
      }
    });
  }

  function closeStarChallengeModal() {
    if (starChallengeModal) {
      starChallengeModal.setAttribute('hidden', '');
      starChallengeModal.setAttribute('aria-hidden', 'true');
    }
    isPaused = false;
  }

  if (starTriggerBtn) {
    starTriggerBtn.addEventListener('click', openStarChallenge);
  }

  if (closeChallengeBtn) {
    closeChallengeBtn.addEventListener('click', closeStarChallengeModal);
  }

  // --- 13. Pause & Resume Controls ---
  function togglePause() {
    if (!isGameActive) return;
    isPaused = !isPaused;

    if (pauseModal) {
      if (isPaused) {
        pauseModal.removeAttribute('hidden');
        pauseModal.setAttribute('aria-hidden', 'false');
      } else {
        pauseModal.setAttribute('hidden', '');
        pauseModal.setAttribute('aria-hidden', 'true');
      }
    }
  }

  if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
  if (resumeBtn) resumeBtn.addEventListener('click', togglePause);

  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      togglePause();
      timeRemaining = config.timeLimit;
      maxTime = config.timeLimit;
      currentScore = 0;
      streakMultiplier = 1;
      movesCount = 0;
      pairsMatched = 0;
      bonusTimeClaimed = 0;
      starChallengeUsed = false;
      flippedCards = [];
      isBoardLocked = false;
      if (starTriggerBtn) {
        starTriggerBtn.classList.remove('is-exhausted');
        starTriggerBtn.disabled = false;
        starTriggerBtn.querySelector('.star-btn-sub').textContent = '+15s Math Decryption';
      }
      initBoard();
      startTimer();
    });
  }

  // --- 14. Audio Toggle Button ---
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      soundToggleBtn.classList.toggle('is-muted', !soundEnabled);
      soundToggleBtn.title = soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects';
    });
  }

  // Keyboard shortcut: Escape or 'P' pauses
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      if (starChallengeModal && !starChallengeModal.hasAttribute('hidden')) {
        closeStarChallengeModal();
      } else {
        togglePause();
      }
    }
  });

  // --- 15. Check for Claimed Bonus Time (from standalone challenge.html) ---
  const claimedBonus = sessionStorage.getItem('nebula_bonus_claimed');
  if (claimedBonus) {
    const extraSeconds = Number(claimedBonus) || 15;
    timeRemaining += extraSeconds;
    maxTime += extraSeconds;
    bonusTimeClaimed += extraSeconds;
    sessionStorage.removeItem('nebula_bonus_claimed');
  }

  // --- 16. Launch Game ---
  initBoard();
  startTimer();
});

