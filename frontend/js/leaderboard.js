/**
 * Nebula Match — Galactic Leaderboard Engine
 * 
 * Responsibilities:
 * - Reads & persists high score records in localStorage
 * - Filters by difficulty tier (All, Cadet, Commander, Cosmic Ace)
 * - Renders Apple-style ranks with gold/silver/bronze medals
 * - Seeds default historical space pioneers if empty
 */

document.addEventListener('DOMContentLoaded', () => {
  const leaderboardBody = document.getElementById('leaderboardBody');
  const emptyState = document.getElementById('emptyState');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const resetBtn = document.getElementById('resetLeaderboardBtn');

  // Default historical space pioneer records
  const DEFAULT_LEADERBOARD = [
    {
      id: 'seed-1',
      callsign: 'Neil_Armstrong',
      score: 2180,
      difficulty: 'hard',
      difficultyName: 'Cosmic Ace',
      accuracy: 94,
      timeRemaining: 14,
      date: 'Oct 28, 2026'
    },
    {
      id: 'seed-2',
      callsign: 'Valentina_Tereshkova',
      score: 1890,
      difficulty: 'medium',
      difficultyName: 'Commander',
      accuracy: 91,
      timeRemaining: 21,
      date: 'Oct 29, 2026'
    },
    {
      id: 'seed-3',
      callsign: 'Carl_Sagan',
      score: 1740,
      difficulty: 'hard',
      difficultyName: 'Cosmic Ace',
      accuracy: 86,
      timeRemaining: 9,
      date: 'Oct 30, 2026'
    },
    {
      id: 'seed-4',
      callsign: 'Mae_Jemison',
      score: 1560,
      difficulty: 'medium',
      difficultyName: 'Commander',
      accuracy: 88,
      timeRemaining: 18,
      date: 'Oct 31, 2026'
    },
    {
      id: 'seed-5',
      callsign: 'Yuri_Gagarin',
      score: 1420,
      difficulty: 'easy',
      difficultyName: 'Cadet',
      accuracy: 95,
      timeRemaining: 32,
      date: 'Nov 01, 2026'
    }
  ];

  let currentFilter = 'all';

  function getStoredLeaderboard() {
    try {
      const raw = localStorage.getItem('nebula_leaderboard');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      // Fallback
    }

    // Initialize with default pioneers
    localStorage.setItem('nebula_leaderboard', JSON.stringify(DEFAULT_LEADERBOARD));
    return DEFAULT_LEADERBOARD;
  }

  function renderLeaderboard() {
    if (!leaderboardBody) return;
    const records = getStoredLeaderboard();

    // Filter
    const filtered = currentFilter === 'all'
      ? records
      : records.filter(r => r.difficulty === currentFilter);

    // Sort by score descending
    filtered.sort((a, b) => b.score - a.score);

    leaderboardBody.innerHTML = '';

    if (filtered.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    filtered.forEach((entry, idx) => {
      const rankNum = idx + 1;
      const row = document.createElement('tr');
      row.className = 'leaderboard-row';

      // Rank Medal Styling
      let rankBadgeHtml = `<span class="rank-num">${rankNum}</span>`;
      if (rankNum === 1) {
        rankBadgeHtml = `<span class="rank-medal-badge rank-gold" title="1st Place (Gold)">🥇 1</span>`;
      } else if (rankNum === 2) {
        rankBadgeHtml = `<span class="rank-medal-badge rank-silver" title="2nd Place (Silver)">🥈 2</span>`;
      } else if (rankNum === 3) {
        rankBadgeHtml = `<span class="rank-medal-badge rank-bronze" title="3rd Place (Bronze)">🥉 3</span>`;
      }

      // Difficulty Badge Class
      let tierClass = 'tier-pill--medium';
      if (entry.difficulty === 'easy') tierClass = 'tier-pill--easy';
      if (entry.difficulty === 'hard') tierClass = 'tier-pill--hard';

      const initial = (entry.callsign || 'E').charAt(0).toUpperCase();

      row.innerHTML = `
        <td class="td-rank">${rankBadgeHtml}</td>
        <td class="td-explorer">
          <div class="explorer-cell">
            <span class="user-badge-avatar" aria-hidden="true">${initial}</span>
            <span class="explorer-name">${escapeHtml(entry.callsign)}</span>
          </div>
        </td>
        <td class="td-tier">
          <span class="tier-pill ${tierClass}">${entry.difficultyName || entry.difficulty}</span>
        </td>
        <td class="td-score">
          <span class="score-display">${Number(entry.score).toLocaleString()}</span>
        </td>
        <td class="td-accuracy">${entry.accuracy || 100}%</td>
        <td class="td-time">${entry.timeRemaining || 0}s</td>
        <td class="td-date">${entry.date || 'Recent'}</td>
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

  // --- Reset Leaderboard Button ---
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset leaderboard to default Galactic Pioneers?')) {
        localStorage.setItem('nebula_leaderboard', JSON.stringify(DEFAULT_LEADERBOARD));
        renderLeaderboard();
      }
    });
  }

  renderLeaderboard();
});

