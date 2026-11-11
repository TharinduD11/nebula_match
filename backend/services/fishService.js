/**
 * Nebula Match — Marc Conrad Fish Game API client.
 * Fetches the official puzzle image and its fish-count solution.
 */

const FISH_API_URL = 'https://marcconrad.com/uob/fish/api.php?out=json';

async function getFishChallenge() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(FISH_API_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Fish Game API returned HTTP ${response.status}.`);
    }

    const data = await response.json();
    const solution = Number(data?.fish ?? data?.solution);

    if (typeof data?.question !== 'string' || !data.question.trim() || !Number.isInteger(solution) || solution < 0) {
      throw new Error('Fish Game API returned an invalid puzzle.');
    }

    return {
      success: true,
      question: data.question,
      solution,
      fish: solution,
      source: 'marcconrad-fish-api',
      message: 'Quest is ready.'
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Fish Game API request timed out.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

function verifyFishAnswer(userAnswer, expectedSolution) {
  return Number(userAnswer) === Number(expectedSolution);
}

module.exports = {
  getFishChallenge,
  verifyFishAnswer
};
