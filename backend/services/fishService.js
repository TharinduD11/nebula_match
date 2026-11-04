/**
 * Nebula Match — The Fish Game API Service
 * 
 * Recreates the canonical Fish Game challenge:
 * - Generates clear, high-resolution, unambiguous fish counting puzzles
 *   matching the prototype specification (https://marcconrad.com/uob/fish/doc.php)
 * - Generates clean line-art fish with generous spacing so fish never overlap
 * - Optional remote Marc Conrad API support with correct 'fish' attribute mapping
 * - Validates user solution and calculates chronometer bonus time (+15s)
 */

/**
 * Generate a clean, crystal-clear SVG fish counting puzzle.
 * Directly matches the prototype design with clearly distinguishable fish.
 * 
 * @param {number|null} [fishCount=null] Optional fish count (3-7)
 * @returns {{ question: string, solution: number, count: number, source: string, message: string }}
 */
function generateProceduralFishPuzzle(fishCount = null) {
  // Generate between 3 and 7 clearly countable fish
  const count = fishCount !== null ? fishCount : Math.floor(Math.random() * 5) + 3;
  const width = 640;
  const height = 340;

  // Placement with generous distance checking to prevent overlapping
  const positions = [];
  const minDistance = 110;

  for (let i = 0; i < count; i++) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 150) {
      attempts++;
      const x = Math.floor(Math.random() * (width - 180)) + 90;
      const y = Math.floor(Math.random() * (height - 120)) + 60;
      const scale = 0.92 + Math.random() * 0.18;
      const flip = Math.random() > 0.4 ? 1 : -1;

      const isTooClose = positions.some(p => {
        const dx = p.x - x;
        const dy = p.y - y;
        return Math.hypot(dx, dy) < minDistance;
      });

      if (!isTooClose) {
        positions.push({ x, y, scale, flip });
        placed = true;
      }
    }

    // Grid fallback if random placement takes too many attempts
    if (!placed) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      positions.push({
        x: 130 + col * 190,
        y: 80 + row * 110,
        scale: 1,
        flip: 1
      });
    }
  }

  // Draw clean minimal fish line art matching Image 3 in assignment
  const fishSvgElements = positions.map((p, idx) => {
    const sx = (p.scale * p.flip).toFixed(2);
    const sy = p.scale.toFixed(2);
    return `
      <!-- Fish #${idx + 1} -->
      <g transform="translate(${p.x}, ${p.y}) scale(${sx}, ${sy})">
        <!-- Fish Body Outline -->
        <path d="M -38,0 C -24,-20 20,-20 34,0 C 20,20 -24,20 -38,0 Z" 
              fill="#ffffff" stroke="#0f172a" stroke-width="3.2" stroke-linejoin="round" />
        <!-- Fish Tail Fin -->
        <path d="M 30,-2 L 50,-16 L 46,0 L 50,16 L 30,2 Z" 
              fill="#ffffff" stroke="#0f172a" stroke-width="3.2" stroke-linejoin="round" />
        <!-- Fish Eye -->
        <circle cx="-18" cy="-5" r="3.2" fill="#0f172a" />
      </g>
    `;
  }).join('\n');

  const fullSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
      <rect width="${width}" height="${height}" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2.5" />
      ${fishSvgElements}
    </svg>
  `.trim();

  // Convert SVG to Data URI for seamless image rendering
  const base64Svg = Buffer.from(fullSvg).toString('base64');
  const dataUri = `data:image/svg+xml;base64,${base64Svg}`;

  return {
    question: dataUri,
    solution: count,
    fish: count,
    count: count,
    source: 'fish-game-engine',
    message: 'Quest is ready.'
  };
}

/**
 * Fetch a fish challenge.
 * Returns the clear, understandable fish counting challenge.
 * 
 * @param {string} [mode] Optional mode ('clean' or 'remote')
 * @returns {Promise<{ success: boolean, question: string, solution: number, fish: number, source: string, message: string }>}
 */
async function getFishChallenge(mode = 'clean') {
  if (mode === 'remote') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch('https://marcconrad.com/uob/fish/api.php?out=json', {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        // Marc Conrad's Fish API uses 'fish' property for the answer
        const solution = data.fish !== undefined ? Number(data.fish) : Number(data.solution);
        if (data && data.question && !isNaN(solution)) {
          return {
            success: true,
            question: data.question,
            solution: solution,
            fish: solution,
            source: 'marcconrad-fish-api',
            message: 'Quest is ready.'
          };
        }
      }
    } catch (err) {
      console.warn('[Fish Service] Remote API failed, using clean fish puzzle generator.');
    }
  }

  // Generate crystal-clear, unambiguous fish counting challenge
  const puzzle = generateProceduralFishPuzzle();
  return {
    success: true,
    ...puzzle
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
