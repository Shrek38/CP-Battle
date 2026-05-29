// pages/BattleScreen.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { socket } from '../socket'

function BattleScreen({ state, actions }) {
  const { username, problem, players, isHost } = state
  const { setPlayers, setLeaderboard } = actions

  const navigate  = useNavigate()
  const [timer,    setTimer]    = useState(0)
  const [solved,   setSolved]   = useState(false)
  const [countdown, setCountdown] = useState(null)

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // ── Countdown after first solve ────────────────────────────────────────────
  useEffect(() => {
    if (countdown === null || countdown <= 0) return
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Time's up — host emits end_round (or everyone's client can,
          // but only the host should to avoid duplicate events)
          if (isHost) socket.emit('end_round', { roomCode: state.roomCode })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [countdown])

  // ── Socket listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    // Someone solved — update player list for everyone
    socket.on('players_update', ({ players }) => {
      setPlayers(players)
    })

    // First solve happened — start the countdown
    socket.on('first_solve', ({ username: solver, countdown }) => {
      setCountdown(countdown)
    })

    // Round ended — go to results
    socket.on('round_ended', ({ leaderboard }) => {
      setLeaderboard(leaderboard)
      navigate('/result')
    })

    // Host left mid-battle
    socket.on('room_closed', ({ message }) => {
      alert(message)
      navigate('/')
    })

    return () => {
      socket.off('players_update')
      socket.off('first_solve')
      socket.off('round_ended')
      socket.off('room_closed')
    }
  }, [])

  function handleSolvedIt() {
    if (solved) return
    setSolved(true)
    socket.emit('player_solved', { roomCode: state.roomCode, username })
  }

  function handleEndRound() {
    socket.emit('end_round', { roomCode: state.roomCode })
  }

  function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    return `${m}:${(s % 60).toString().padStart(2, '0')}`
  }

  return (
    <div className="screen">
      <h1>⚔️ Battle!</h1>

      <div className="card">
        <p className="label">YOUR PROBLEM</p>
        <p className="problem-title">{problem?.title}</p>
        <p className="problem-meta">{problem?.platform} · {problem?.difficulty}</p>
        <a href={problem?.link} target="_blank" rel="noreferrer" className="problem-link">
          Open Problem ↗
        </a>
      </div>

      <div className="card timer-card">
        <p className="label">TIME ELAPSED</p>
        <p className="timer">{formatTime(timer)}</p>
      </div>

      {countdown !== null && countdown > 0 && (
        <div className="card" style={{ textAlign: 'center', borderColor: '#f59e0b' }}>
          <p style={{ color: '#f59e0b', fontWeight: 700, fontSize: '1.1rem' }}>
            ⏳ Round ends in {countdown}s
          </p>
          <p className="hint">First blood claimed! Others can still score points.</p>
        </div>
      )}

      <div className="card">
        <p className="label">PLAYERS</p>
        {players.map(p => (
          <div key={p.id} className="player-row">
            <span>{p.name} {p.name === username && '(You)'}</span>
            <span className={p.status.includes('Solved') ? 'status-solved' : 'status-solving'}>
              {p.status}
            </span>
          </div>
        ))}
      </div>

      {!solved ? (
        <button className="btn-primary btn-big" onClick={handleSolvedIt}>
          ✅ I Solved It!
        </button>
      ) : (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>🎉 Nice! Waiting for others...</p>
        </div>
      )}

      {isHost && (
        <button className="btn-secondary" onClick={handleEndRound}>
          End Round Early
        </button>
      )}
    </div>
  )
}

export default BattleScreen