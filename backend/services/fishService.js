/**
 * Nebula Match — Fish Game API Service
 * 
 * Interoperability service for the 'Fish Game' API:
 * Reference: https://marcconrad.com/uob/fish/doc.php
 * 
 * Responsibilities:
 * - Queries the external Fish Game API (https://marcconrad.com/uob/fish/api.php)
 * - Implements graceful fallback to autonomous Fish Quest generator if API is offline
 * - Validates explorer puzzle answers
 */

const FISH_API_ENDPOINTS = [
  'https://marcconrad.com/uob/fish/api.php?out=json',
  'https://marcconrad.com/uob/fish/api.php',
  'https://marcconrad.com/uob/banana/api.php?out=json'
];

/**
 * Generate a procedural high-resolution SVG fish puzzle matching the
 * canonical Fish Game API image structure when offline or in sandbox mode.
 * 
 * @param {number} fishCount Optional count (2-8)
 * @returns {{ question: string, solution: number }}
 */
function generateProceduralFishPuzzle(fishCount = null) {
  const count = fishCount !== null ? fishCount : Math.floor(Math.random() * 7) + 2; // 2 to 8 fish
  const width = 640;
  const height = 360;

  // Generate non-overlapping positions
  const positions = [];
  const minDistance = 90;

  for (let i = 0; i < count; i++) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 100) {
      attempts++;
      const x = Math.floor(Math.random() * (width - 160)) + 80;
      const y = Math.floor(Math.random() * (height - 120)) + 60;
      const scale = 0.85 + Math.random() * 0.3; // subtle size variety

      const isTooClose = positions.some(p => {
        const dx = p.x - x;
        const dy = p.y - y;
        return Math.sqrt(dx * dx + dy * dy) < minDistance;
      });

      if (!isTooClose) {
        positions.push({ x, y, scale });
        placed = true;
      }
    }
    // Fallback if space is crowded
    if (!placed) {
      positions.push({
        x: 80 + (i % 3) * 180,
        y: 80 + Math.floor(i / 3) * 100,
        scale: 0.9
      });
    }
  }

  // Generate SVG fish elements (clean minimal line art matching Image 3)
  const fishSvgElements = positions.map((p, idx) => {
    return `
      <g transform="translate(${p.x}, ${p.y}) scale(${p.scale.toFixed(2)})">
        <!-- Fish Body Outline -->
        <path d="M -40,0 C -25,-22 20,-22 35,0 C 20,22 -25,22 -40,0 Z" 
              fill="#ffffff" stroke="#1e293b" stroke-width="3.5" stroke-linejoin="round" />
        <!-- Fish Tail Fin -->
        <path d="M 33,-2 L 52,-18 L 48,0 L 52,18 L 33,2 Z" 
              fill="#ffffff" stroke="#1e293b" stroke-width="3.5" stroke-linejoin="round" />
        <!-- Fish Eye -->
        <circle cx="-22" cy="-5" r="3.2" fill="#1e293b" />
      </g>
    `;
  }).join('\n');

  const fullSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
      <rect width="${width}" height="${height}" rx="16" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3" />
      ${fishSvgElements}
    </svg>
  `.trim();

  // Convert SVG to Data URI for seamless image rendering
  const base64Svg = Buffer.from(fullSvg).toString('base64');
  const dataUri = `data:image/svg+xml;base64,${base64Svg}`;

  return {
    question: dataUri,
    solution: count,
    source: 'autonomous-fish-engine'
  };
}

/**
 * Fetch a new Fish Game challenge from the live API or generate one offline.
 * @returns {Promise<{ success: boolean, question: string, solution: number, source: string }>}
 */
async function getFishChallenge() {
  // Try remote Fish API endpoints first
  for (const endpoint of FISH_API_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(endpoint, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const text = await response.text();
        let data = null;
        try {
          data = JSON.parse(text);
        } catch (e) {
          // If returned CSV format (e.g. url,solution)
          const parts = text.trim().split(',');
          if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
            data = { question: parts[0], solution: Number(parts[1]) };
          }
        }

        if (data && data.question && (data.solution !== undefined && data.solution !== null)) {
          return {
            success: true,
            question: data.question,
            solution: Number(data.solution),
            source: 'marcconrad-fish-api'
          };
        }
      }
    } catch (err) {
      // Continue to next endpoint or fallback
    }
  }

  // Graceful fallback to built-in procedural engine
  const fallback = generateProceduralFishPuzzle();
  return {
    success: true,
    ...fallback
  };
}

/**
 * Validate a user's answer against the active quest solution.
 * @param {number|string} userAnswer 
 * @param {number|string} expectedSolution 
 * @returns {boolean}
 */
function verifyFishAnswer(userAnswer, expectedSolution) {
  return Number(userAnswer) === Number(expectedSolution);
}

module.exports = {
  getFishChallenge,
  generateProceduralFishPuzzle,
  verifyFishAnswer
};

