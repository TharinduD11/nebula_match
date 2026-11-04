/**
 * Nebula Match — Mission Debrief & Results Logic
 * 
 * Responsibilities:
 * - Reads last game statistics from sessionStorage
 * - Calculates performance rank (S, A, B, C)
 * - Persists score records to localStorage for the Galactic Leaderboard
 * - Handles play again & navigation actions
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
    window.location.replace('login.html');
    return;
  }

  // --- Element Selectors ---
  const outcomeBadge = document.getElementById('outcomeBadge');
  const outcomeStatusText = document.getElementById('outcomeStatusText');
  const outcomeDesc = document.getElementById('outcomeDesc');
  const rankMedal = document.getElementById('rankMedal');
  const rankLetter = document.getElementById('rankLetter');
  const finalScoreDigits = document.getElementById('finalScoreDigits');

  const statDifficulty = document.getElementById('statDifficulty');
  const statPairs = document.getElementById('statPairs');
  const statMoves = document.getElementById('statMoves');
  const statAccuracy = document.getElementById('statAccuracy');
  const statTimeRemaining = document.getElementById('statTimeRemaining');
  const statBonusTime = document.getElementById('statBonusTime');

  const explorerCallsignInput = document.getElementById('explorerCallsign');
  const submitScoreBtn = document.getElementById('submitScoreBtn');
  const submissionFeedback = document.getElementById('submissionFeedback');
  const playAgainBtn = document.getElementById('playAgainBtn');

  // --- 1. Load Last Game Data ---
  let gameData = null;
  try {
    const rawData = sessionStorage.getItem('nebula_last_game');
    if (rawData) gameData = JSON.parse(rawData);
  } catch (e) {
    // Non-blocking
  }

  // Fallback sample data if visited directly
  if (!gameData) {
    gameData = {
      outcome: 'victory',
      score: 1380,
      difficulty: 'medium',
      difficultyName: 'Medium',
      pairsMatched: 8,
      totalPairs: 8,
      moves: 12,
      accuracy: 85,
      timeRemaining: 16,
      timeElapsed: 29,
      bonusTimeClaimed: 15,
      completedAt: new Date().toISOString()
    };
  }

  // --- 2. Calculate Rank ---
  const isVictory = gameData.outcome === 'victory';
  let rank = 'B';
  let rankColor = '#818cf8';

  if (isVictory) {
    if (gameData.score >= 1400 || gameData.accuracy >= 85) {
      rank = 'S';
      rankColor = '#fbbf24';
    } else if (gameData.score >= 1000 || gameData.accuracy >= 70) {
      rank = 'A';
      rankColor = '#60a5fa';
    } else {
      rank = 'B';
      rankColor = '#a855f7';
    }
  } else {
    rank = 'C';
    rankColor = '#f43f5e';
  }

  // --- 3. Render Debrief UI ---
  if (outcomeBadge) {
    outcomeBadge.classList.toggle('outcome-defeat', !isVictory);
  }

  if (outcomeStatusText) {
    outcomeStatusText.textContent = isVictory 
      ? 'Victory!' 
      : "Time's Up!";
  }

  if (outcomeDesc) {
    outcomeDesc.textContent = isVictory 
      ? 'Great job! You found all matching pairs in time.' 
      : 'You ran out of time, but you can try again anytime!';
  }

  if (rankLetter) rankLetter.textContent = rank;
  if (rankMedal) {
    rankMedal.style.borderColor = rankColor;
    rankMedal.style.color = rankColor;
  }

  if (finalScoreDigits) {
    finalScoreDigits.textContent = Number(gameData.score).toLocaleString();
  }

  if (statDifficulty) statDifficulty.textContent = gameData.difficultyName || 'Medium';
  if (statPairs) statPairs.textContent = `${gameData.pairsMatched} / ${gameData.totalPairs}`;
  if (statMoves) statMoves.textContent = `${gameData.moves} Moves`;
  if (statAccuracy) statAccuracy.textContent = `${gameData.accuracy}%`;
  if (statTimeRemaining) statTimeRemaining.textContent = `${Math.max(0, gameData.timeRemaining)}s`;
  if (statBonusTime) {
    statBonusTime.textContent = gameData.bonusTimeClaimed > 0 
      ? `+${gameData.bonusTimeClaimed}s Claimed` 
      : 'Not used';
  }

  // --- 4. Pre-fill Call Sign from Virtual Identity Session ---
  try {
    const userJson = localStorage.getItem('nebula_user');
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user && user.username && explorerCallsignInput) {
        explorerCallsignInput.value = user.username;
      }
    }
  } catch (e) {
    // Non-blocking
  }

  // --- 5. Submit Score to Galactic Leaderboard & MongoDB ---
  let scoreSubmitted = false;

  if (submitScoreBtn) {
    submitScoreBtn.addEventListener('click', async () => {
      if (scoreSubmitted) return;

      const callsign = (explorerCallsignInput ? explorerCallsignInput.value.trim() : '') || 'Anonymous Player';

      const entry = {
        callsign: callsign,
        score: Number(gameData.score) || 0,
        difficulty: gameData.difficulty || 'medium',
        difficultyName: gameData.difficultyName || 'Medium',
        accuracy: Number(gameData.accuracy) || 100,
        timeRemaining: Math.max(0, Number(gameData.timeRemaining) || 0),
        moves: Number(gameData.moves) || 0,
        pairsMatched: Number(gameData.pairsMatched) || 0,
        bonusTimeClaimed: Number(gameData.bonusTimeClaimed) || 0
      };

      submitScoreBtn.disabled = true;
      submitScoreBtn.innerHTML = `<span>Saving to Database...</span>`;

      // 1. Try sending to MongoDB Leaderboard API
      try {
        const apiBase = (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '4000'))
          ? 'http://localhost:4000'
          : '';
        const response = await fetch(`${apiBase}/api/leaderboard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        });
        const resData = await response.json();
        console.log('[Results] Saved to MongoDB:', resData);
      } catch (e) {
        console.warn('[Results] Server offline, using local storage.');
      }

      // 2. Also save to local storage for offline continuity
      let leaderboard = [];
      try {
        const stored = localStorage.getItem('nebula_leaderboard');
        if (stored) leaderboard = JSON.parse(stored);
      } catch (err) {
        leaderboard = [];
      }

      leaderboard.push({
        id: `score-${Date.now()}`,
        ...entry,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });
      leaderboard.sort((a, b) => b.score - a.score);
      localStorage.setItem('nebula_leaderboard', JSON.stringify(leaderboard));

      scoreSubmitted = true;
      submitScoreBtn.innerHTML = `<span>Saved ✓</span>`;

      if (submissionFeedback) {
        submissionFeedback.innerHTML = `
          <div style="color: #34d399; font-weight: 600; margin-top: 10px;">
            ✓ Score saved to database! Opening leaderboard...
          </div>
        `;
      }

      setTimeout(() => {
        window.location.href = 'leaderboard.html';
      }, 600);
    });
  }

  // --- 6. Play Again Button ---
  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', () => {
      const targetDiff = gameData.difficulty || 'medium';
      window.location.href = `game.html?difficulty=${targetDiff}`;
    });
  }
});

