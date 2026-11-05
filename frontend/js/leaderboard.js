/**
 * Nebula Match — Galactic Leaderboard Engine
 * 
 * Responsibilities:
 * - Reads & persists high score records in localStorage
 * - Filters by difficulty tier (All, Easy, Medium, Hard)
 * - Renders Apple-style ranks with gold/silver/bronze medals
 * - Shows only the signed-in player's own score records
 */

document.addEventListener('DOMContentLoaded', () => {
  const leaderboardBody = document.getElementById('leaderboardBody');
  const emptyState = document.getElementById('emptyState');
  const tabBtns = document.querySelectorAll('.tab-btn');
  let currentFilter = 'all';

  function getCurrentUsername() {
    try {
      const user = JSON.parse(localStorage.getItem('nebula_user') || 'null');
      return user && user.isAuthenticated && user.username ? user.username : '';
    } catch (e) {
      return '';
    }
  }

  function getStoredLeaderboard() {
    try {
      const raw = localStorage.getItem('nebula_leaderboard');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      // Fallback
    }

    return [];
  }

  function filterRecordsForUser(records, username) {
    const normalizedUsername = username.trim().toLowerCase();
    return records.filter((record) => {
      const owner = record.ownerUsername || record.callsign;
      return String(owner || '').trim().toLowerCase() === normalizedUsername;
    });
  }

  async function fetchLeaderboardRecords() {
    const username = getCurrentUsername();
    if (!username) return [];

    try {
      const apiBase = (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '4000'))
        ? 'http://localhost:4000'
        : '';
      const query = new URLSearchParams({ username });
      if (currentFilter !== 'all') query.set('difficulty', currentFilter);
      const url = `${apiBase}/api/leaderboard?${query.toString()}`;

      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          return filterRecordsForUser(json.data, username);
        }
      }
    } catch (err) {
      console.warn('[Leaderboard] Backend offline, reading from local records.');
    }

    return filterRecordsForUser(getStoredLeaderboard(), username).filter((record) => {
      const matchesDifficulty = currentFilter === 'all' || record.difficulty === currentFilter;
      return matchesDifficulty;
    });
  }

  async function renderLeaderboard() {
    if (!leaderboardBody) return;

    leaderboardBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 24px; color: #94a3b8;">Loading your scores...</td></tr>`;

    const filtered = await fetchLeaderboardRecords();

    // Sort by score descending
    filtered.sort((a, b) => b.score - a.score);

    leaderboardBody.innerHTML = '';

    if (filtered.length === 0) {
      if (emptyState) {
        emptyState.style.display = 'block';
        const message = emptyState.querySelector('p');
        if (message) {
          message.textContent = getCurrentUsername()
            ? 'No scores saved for this difficulty yet. Play a game and save your score to see it here.'
            : 'Sign in to see your personal scores. Scores from other players are not shown here.';
        }
      }
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    filtered.forEach((entry) => {
      const row = document.createElement('tr');
      row.className = 'leaderboard-row';

      // Difficulty Badge Class
      let tierClass = 'tier-pill--medium';
      if (entry.difficulty === 'easy') tierClass = 'tier-pill--easy';
      if (entry.difficulty === 'hard') tierClass = 'tier-pill--hard';

      const initial = (entry.callsign || 'E').charAt(0).toUpperCase();
      const displayTierName = {
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard'
      }[entry.difficulty] || entry.difficultyName || entry.difficulty;

      const totalPairsByDifficulty = { easy: 6, medium: 8, hard: 10 };
      const totalPairs = totalPairsByDifficulty[entry.difficulty] || 0;
      const didWin = entry.outcome
        ? entry.outcome === 'win' || entry.outcome === 'victory'
        : totalPairs > 0 && Number(entry.pairsMatched) >= totalPairs;
      const outcomeLabel = didWin ? 'Win' : 'Lose';
      const outcomeClass = didWin ? 'outcome-pill--win' : 'outcome-pill--lose';

      row.innerHTML = `
        <td class="td-explorer">
          <div class="explorer-cell">
            <span class="user-badge-avatar" aria-hidden="true">${initial}</span>
            <span class="explorer-name">${escapeHtml(entry.callsign)}</span>
          </div>
        </td>
        <td class="td-tier">
          <span class="tier-pill ${tierClass}">${displayTierName}</span>
        </td>
        <td class="td-outcome">
          <span class="outcome-pill ${outcomeClass}">${outcomeLabel}</span>
        </td>
        <td class="td-score">
          <span class="score-display">${Number(entry.score).toLocaleString()}</span>
        </td>
      `;

      leaderboardBody.appendChild(row);
    });
  }

  function escapeHtml(str) {
    if (!str) return 'Explorer';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Filter Tabs ---
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });

      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      currentFilter = btn.dataset.filter;
      renderLeaderboard();
    });
  });

  renderLeaderboard();
});

