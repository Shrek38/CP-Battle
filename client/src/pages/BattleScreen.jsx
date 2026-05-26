// pages/BattleScreen.jsx
// The main action screen during a round.
// Timer counts up, players click "I Solved It!", statuses update live.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function BattleScreen({ state, actions }) {
  const { username, problem, players } = state
  const { setPlayers, setLeaderboard } = actions

  const navigate = useNavigate()

  const [timer,    setTimer]    = useState(0)
  const [finished, setFinished] = useState(false)
  const [countdown, setCountdown] = useState(null)  // null means countdown not started
  const [solved,   setSolved]   = useState(false)  // has THIS user clicked solved?

  // Points awarded by finishing position
  const POINTS = [3, 2, 1]

  // Track how many have solved so far (to assign points)
  const [solveCount, setSolveCount] = useState(0)

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (finished) return
    const interval = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [finished])

  useEffect(() => {
    if (countdown === null) return      // not started yet
    if (countdown === 0) {              // reached zero — end the round
        handleEndRound()
        return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    return `${m}:${(s % 60).toString().padStart(2, '0')}`
  }

  // ── "I Solved It!" handler ────────────────────────────────────────────────
  function handleSolvedIt() {
    if (solved) return

    setSolved(true)
    const position = solveCount
    setSolveCount(c => c + 1)
    const earned = POINTS[position] ?? 0

    actions.setPlayers(prev =>
        prev.map(p =>
        p.name === username
            ? { ...p, status: `Solved ✅ (+${earned}pts)`, points: p.points + earned }
            : p
        )
    )
    // Only the first solver triggers the countdown
    if (position === 0) {
        setCountdown(30)
    }
  }

  // ── End round (host manually or everyone solved) ──────────────────────────
  function handleEndRound() {
    setFinished(true)

    // Build leaderboard from current player state
    // Sort by points descending
    const ranked = [...players]
      .sort((a, b) => b.points - a.points)
      .map((p, i) => ({ ...p, rank: i + 1 }))

    setLeaderboard(ranked)
    navigate('/result')
  }

  return (
    <div className="screen">
      <h1>⚔️ Battle!</h1>

      {/* Problem info */}
      <div className="card">
        <p className="label">YOUR PROBLEM</p>
        <p className="problem-title">{problem.title}</p>
        <p className="problem-meta">{problem.platform} · {problem.difficulty}</p>
        
          href={problem.link}
          target="_blank"
          rel="noreferrer"
          className="problem-link"
        <a>
          Open Problem ↗
        </a>
      </div>

      {/* Timer */}
      <div className="card timer-card">
        <p className="label">TIME ELAPSED</p>
        <p className="timer">{formatTime(timer)}</p>
      </div>

      {/* Player statuses */}
      <div className="card">
        <p className="label">PLAYERS</p>
        {players.map(p => (
          <div key={p.id} className="player-row">
            <span>{p.name} {p.name === username && '(You)'}</span>
            <span className={
              p.status.includes('Solved') ? 'status-solved' : 'status-solving'
            }>
              {p.status}
            </span>
          </div>
        ))}
      </div>
      {/* Countdown banner — only shows after first person solves */}
      {countdown !== null && (
        <div className="card" style={{ textAlign: 'center', borderColor: '#f59e0b' }}>
            <p style={{ color: '#f59e0b', fontWeight: 600 }}>
            ⏳ Round ends in {countdown}s
            </p>
            <p className="hint">First solver found! Others still have time.</p>
        </div>
      )}

      {/* "I Solved It!" — disabled after clicking */}
      {!solved
        ? (
          <button className="btn-primary btn-big" onClick={handleSolvedIt}>
            ✅ I Solved It!
          </button>
        ) : (
          <div className="card">
            <p>🎉 Nice! Waiting for others...</p>
          </div>
        )
      }

      {/* End round button — Day 5 will restrict this to host only */}
      <button
        className="btn-secondary"
        onClick={handleEndRound}
        disabled={countdown !== null}
        style={{ opacity: countdown !== null ? 0.4 : 1 }}
      >
        {countdown !== null ? `Ending in ${countdown}s...` : 'End Round'}
      </button>
    </div>
  )
}

export default BattleScreen