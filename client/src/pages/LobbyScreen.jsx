// pages/LobbyScreen.jsx
// Two modes depending on isHost:
//   Host:  sees problem selector, Search Again, Start Battle
//   Guest: sees problem details, waits for host

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = 'http://localhost:5000'

// Dummy problems — Day 4 replaces this with real API calls
const DUMMY_PROBLEMS = [
  { title: 'Two Sum',              link: 'https://leetcode.com/problems/two-sum',               difficulty: 'Easy',   platform: 'LeetCode'   },
  { title: 'Best Time to Buy',     link: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock', difficulty: 'Easy', platform: 'LeetCode' },
  { title: 'Merge Intervals',      link: 'https://leetcode.com/problems/merge-intervals',        difficulty: 'Medium', platform: 'LeetCode'   },
  { title: 'Div2 A - Watermelon',  link: 'https://codeforces.com/problemset/problem/4/A',        difficulty: '800',    platform: 'Codeforces' },
  { title: 'Div2 B - Queue',       link: 'https://codeforces.com/problemset/problem/141/C',      difficulty: '1200',   platform: 'Codeforces' },
]

function LobbyScreen({ state, actions }) {
  const { username, roomCode, isHost, problem, players } = state
  const { setProblem } = actions

  const navigate = useNavigate()

  const [platform,   setPlatform]   = useState('LeetCode')
  const [difficulty, setDifficulty] = useState('Easy')
  const [minRating,  setMinRating]  = useState('800')
  const [maxRating,  setMaxRating]  = useState('1200')
  const [copied,     setCopied]     = useState(false)

  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')

  async function handleSearchAgain() {
    setLoading(true)
    setFetchError('')

    try {
      let params = ''

      if (platform === 'Codeforces') {
        params = `platform=Codeforces&minRating=${minRating}&maxRating=${maxRating}`
      } else {
        // LeetCode and GeeksforGeeks use difficulty
        params = `platform=${platform}&difficulty=${difficulty}`
      }

      const response = await fetch(`${API_BASE}/api/problem/random?${params}`)

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to fetch problem')
      }

      const data = await response.json()
      actions.setProblem(data.problem)

    } catch (err) {
      setFetchError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)  // reset after 2 seconds
  }

  function handleStartBattle() {
    // Day 5: this will emit a Socket.io event to the server
    // For now, just navigate
    navigate('/battle')
  }

  return (
    <div className="screen">
      <h1>⚔️ DSA Battle</h1>

      {/* Room code display */}
      <div className="card">
        <p className="label">ROOM CODE</p>
        <div className="room-code-row">
          <span className="room-code">{roomCode}</span>
          <button className="btn-ghost" onClick={handleCopyCode}>
            {copied ? '✅ Copied!' : '📋 Copy'}
          </button>
        </div>
        <p className="hint">Share this code with friends to join</p>
      </div>

      {/* Players in room */}
      <div className="card">
        <p className="label">PLAYERS ({players.length})</p>
        {players.map(p => (
          <div key={p.id} className="player-row">
            <span>{p.name}</span>
            {p.name === username && <span className="badge">You</span>}
            {isHost && p.name === username && <span className="badge host">Host</span>}
          </div>
        ))}
      </div>

      {/* Problem section — host can configure, guest just sees */}
      <div className="card">
        <p className="label">PROBLEM</p>

        {isHost && (
          <div className="selector-row">
            {/* Platform selector */}
            <select
              className="select"
              value={platform}
              onChange={e => setPlatform(e.target.value)}
            >
              <option>LeetCode</option>
              <option>Codeforces</option>
              <option>GeeksforGeeks</option>
            </select>

      {/* Difficulty selector — changes options based on platform */}
      {/* Difficulty / Rating selector — changes based on platform */}
      {platform === 'Codeforces' ? (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            className="select"
            value={minRating}
            onChange={e => setMinRating(e.target.value)}
          >
            {['800','900','1000','1100','1200','1300','1400','1500'].map(r =>
              <option key={r}>{r}</option>
            )}
          </select>
          <span style={{ color: '#6b7280' }}>to</span>
          <select
            className="select"
            value={maxRating}
            onChange={e => setMaxRating(e.target.value)}
          >
            {['900','1000','1100','1200','1300','1400','1500','1600'].map(r =>
              <option key={r}>{r}</option>
            )}
          </select>
        </div>
      ) : (
        <select
          className="select"
          value={difficulty}
          onChange={e => setDifficulty(e.target.value)}
        >
          {['Easy', 'Medium', 'Hard'].map(d =>
            <option key={d}>{d}</option>
          )}
        </select>
      )}

            <button
              className="btn-ghost"
              onClick={handleSearchAgain}
              disabled={loading}
            >
              {loading ? '⏳ Fetching...' : '🔄 Search Again'}
            </button>

            {fetchError && <p className="error">{fetchError}</p>}
          </div>
        )}

        {/* Problem details — both host and guest see this */}
        <div className="problem-card">
          <p className="problem-title">{problem.title}</p>
          <p className="problem-meta">
            {problem.platform} · {problem.difficulty}
          </p>
          
            href={problem.link}
            target="_blank"
            rel="noreferrer"
            className="problem-link"
          <a>
            View Problem ↗
          </a>
        </div>
      </div>

      {/* Only host sees Start Battle */}
      {isHost
        ? (
          <button className="btn-primary" onClick={handleStartBattle}>
            ⚔️ Start Battle
          </button>
        ) : (
          <p className="hint">Waiting for host to start the battle...</p>
        )
      }
    </div>
  )
}

export default LobbyScreen