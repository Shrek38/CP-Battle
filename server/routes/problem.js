// server/routes/problem.js
// Fetches real problems from Codeforces and LeetCode APIs.
// Falls back to hardcoded data for GeeksforGeeks.

const express  = require('express')
const router   = express.Router()
const fetch    = require('node-fetch')
const GFG_PROBLEMS = require('../data/gfg_problems')
const LC_FALLBACK = require('../data/leetcode_fallback')

// ── In-memory cache ───────────────────────────────────────────────────────────
// Codeforces returns ~9000 problems in one big response (~2MB).
// We cache it so we only fetch it ONCE per server restart, not on every request.
// On Day 12 you could move this to MongoDB/Redis for persistence across restarts.

const cache = {
  codeforces: null,          // will hold the full problems array
  cfFetchedAt: null,         // timestamp of last fetch
  CF_TTL: 60 * 60 * 1000,   // 1 hour in milliseconds — re-fetch after this
}

// ── Helper: pick a random element from an array ───────────────────────────────
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ── Helper: shuffle and pick N items (for variety) ───────────────────────────
function pickRandomN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

// ── Codeforces fetcher ────────────────────────────────────────────────────────
async function getCodeforcesProblems(minRating, maxRating) {
  const now = Date.now()

  // Use cache if it exists and hasn't expired
  if (cache.codeforces && (now - cache.cfFetchedAt) < cache.CF_TTL) {
    console.log('CF: using cached problems')
  } else {
    // Fetch fresh from Codeforces API
    console.log('CF: fetching fresh from API...')

    const response = await fetch('https://codeforces.com/api/problemset.problems')

    if (!response.ok) {
    throw new Error(`Codeforces API returned ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== 'OK') {
    throw new Error(`Codeforces API error: ${data.comment}`)
    }

    cache.codeforces = data.result.problems
    cache.cfFetchedAt = now
    console.log(`CF: cached ${cache.codeforces.length} problems`)
  }

  // Filter by rating range
  // Also filter out problems with no rating (some educational problems)
  const filtered = cache.codeforces.filter(p =>
    p.rating >= minRating &&
    p.rating <= maxRating &&
    p.rating !== undefined
  )

  if (filtered.length === 0) {
    throw new Error(`No Codeforces problems found between rating ${minRating}–${maxRating}`)
  }

  // Pick one random problem from the filtered pool
  const raw = pickRandom(filtered)

  return {
    title:      raw.name,
    link:       `https://codeforces.com/problemset/problem/${raw.contestId}/${raw.index}`,
    difficulty: `Rating ${raw.rating}`,
    platform:   'Codeforces',
    tags:       raw.tags || [],   // bonus: problem tags like "dp", "greedy"
  }
}

// ── LeetCode fetcher ──────────────────────────────────────────────────────────
async function getLeetCodeProblem(difficulty) {
  const diffUpper = difficulty.toUpperCase()
  const url = `https://alfa-leetcode-api.onrender.com/problems?limit=50&difficulty=${diffUpper}`
  console.log(`LC: fetching difficulty=${diffUpper}`)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)

    if (!response.ok) throw new Error(`LeetCode API returned ${response.status}`)

    const data = await response.json()
    const problems = data.problemsetQuestionList

    if (!problems || problems.length === 0) throw new Error('LeetCode API returned no problems')

    const raw = pickRandom(problems)
    return {
      title: raw.title,
      link: `https://leetcode.com/problems/${raw.titleSlug}`,
      difficulty: raw.difficulty,
      platform: 'LeetCode',
    }
  } catch (err) {
    console.warn(`LC API failed (${err.message}), using fallback problems`)
    const pool = LC_FALLBACK.filter(p => p.difficulty === difficulty)
    if (pool.length === 0) throw new Error('No fallback LeetCode problems for that difficulty')
    return { ...pickRandom(pool), fallback: true }
  }
}

// ── GET /api/problem/random ───────────────────────────────────────────────────
// Query params:
//   platform=LeetCode   &difficulty=Easy
//   platform=Codeforces &minRating=800&maxRating=1200
//   platform=GeeksforGeeks &difficulty=Medium

router.get('/random', async (req, res) => {
  const { platform, difficulty, minRating, maxRating } = req.query

  if (!platform) {
    return res.status(400).json({ error: 'platform query param is required' })
  }

  try {
    let problem = null

    // ── LeetCode ────────────────────────────────────────────────────────────
    if (platform === 'LeetCode') {
      const validDifficulties = ['Easy', 'Medium', 'Hard']
      if (!validDifficulties.includes(difficulty)) {
        return res.status(400).json({ error: 'difficulty must be Easy, Medium, or Hard' })
      }
      problem = await getLeetCodeProblem(difficulty)
    }

    // ── Codeforces ──────────────────────────────────────────────────────────
    else if (platform === 'Codeforces') {
      const min = parseInt(minRating) || 800
      const max = parseInt(maxRating) || 1200

      if (min > max) {
        return res.status(400).json({ error: 'minRating cannot be greater than maxRating' })
      }

      problem = await getCodeforcesProblems(min, max)
    }

    // ── GeeksforGeeks ───────────────────────────────────────────────────────
    else if (platform === 'GeeksforGeeks') {
      const validDifficulties = ['Easy', 'Medium', 'Hard']
      if (!validDifficulties.includes(difficulty)) {
        return res.status(400).json({ error: 'difficulty must be Easy, Medium, or Hard' })
      }
      const pool = GFG_PROBLEMS.filter(p => p.difficulty === difficulty)
      if (pool.length === 0) {
        return res.status(404).json({ error: 'No GFG problems for that difficulty' })
      }
      problem = pickRandom(pool)
    }

    else {
      return res.status(400).json({ error: `Unknown platform: ${platform}` })
    }

    res.json({ problem })

  } catch (err) {
    // This catches network errors, API errors, etc.
    console.error('Problem fetch error:', err.message)
    res.status(502).json({
      error: 'Failed to fetch problem from external API',
      detail: err.message,
    })
  }
})

// ── GET /api/problem/cache-status ─────────────────────────────────────────────
// Useful for debugging — see if the CF cache is populated
router.get('/cache-status', (req, res) => {
  res.json({
    codeforces: {
      cached:    !!cache.codeforces,
      count:     cache.codeforces?.length ?? 0,
      fetchedAt: cache.cfFetchedAt
        ? new Date(cache.cfFetchedAt).toISOString()
        : null,
    }
  })
})

module.exports = router