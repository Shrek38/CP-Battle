// pages/BattleScreen.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { socket } from '../socket'
import ScreenshotModal from '../components/ScreenshotModal'

function BattleScreen({ state, actions }) {
  const { username, problem, players, isHost, timeLimit } = state
  const { setPlayers, setLeaderboard } = actions

  const navigate   = useNavigate()
  const [timer,     setTimer]     = useState(0)
  const [solved,    setSolved]    = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [solvedAt,  setSolvedAt]  = useState(null)
  const [showScreenshotModal, setShowScreenshotModal] = useState(false)
  const [gaveUp, setGaveUp] = useState(false)

  // Timer: keeps counting up globally, but ends round if timeLimit reached
  useEffect(() => {
    const isTimeLimitMode = !!timeLimit
    const limitSeconds = isTimeLimitMode ? timeLimit * 60 : Infinity

    const interval = setInterval(() => {
      setTimer(t => {
        const nextTime = t + 1
        if (isTimeLimitMode && nextTime >= limitSeconds) {
          clearInterval(interval)
          if (isHost) {
            socket.emit('end_round', { roomCode: state.roomCode })
          }
          return limitSeconds
        }
        return nextTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLimit, isHost, state.roomCode])

  // Countdown after first solve (only used if no time limit is set)
  useEffect(() => {
    if (countdown === null || countdown <= 0) return
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (isHost) socket.emit('end_round', { roomCode: state.roomCode })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [countdown, isHost, state.roomCode])

  // Socket listeners
  useEffect(() => {
    socket.on('players_update', ({ players }) => setPlayers(players))
    socket.on('first_solve', ({ countdown }) => setCountdown(countdown))
    socket.on('round_ended', ({ leaderboard }) => {
      setLeaderboard(leaderboard)
      navigate('/result')
    })
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

  // Trap browser back button
  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    const handlePopState = () => window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Leave room handler
  function handleLeaveRoom() {
    if (confirm('Are you sure you want to leave the room? The battle is active.')) {
      socket.emit('leave_room', { roomCode: state.roomCode })
      actions.setRoomCode('')
      actions.setIsHost(false)
      actions.setHostName('')
      actions.setPlayers([])
      actions.setProblem(null)
      navigate('/')
    }
  }

  // Give up handler
  function handleGiveUp() {
    if (confirm('Are you sure you want to give up? You will score 0 points this round.')) {
      setGaveUp(true)
      setSolved(true)
      socket.emit('player_gave_up', { roomCode: state.roomCode, username })
    }
  }

  // When user clicks "I Solved It", show the screenshot modal
  function handleSolvedClick() {
    if (solved) return
    setShowScreenshotModal(true)
  }

  // Submit solve with optional screenshot proof
  function submitSolve(screenshotData) {
    setSolved(true)
    setSolvedAt(timer)
    setShowScreenshotModal(false)
    socket.emit('player_solved', {
      roomCode: state.roomCode,
      username,
      screenshotData: screenshotData || null,
    })
  }

  function handleEndRound() {
    socket.emit('end_round', { roomCode: state.roomCode })
  }

  function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    return `${m}:${(s % 60).toString().padStart(2, '0')}`
  }

  function getCountdownColor(cd) {
    const ratio = cd / 30
    const hue = ratio > 0.5 ? 120 - ((1 - ratio) * 2 * 60) : (ratio * 2) * 60
    return `hsl(${hue}, 85%, 55%)`
  }

  function getPlatClass(p) {
    if (!p) return ''
    if (p.includes('LeetCode'))   return 'plat-lc'
    if (p.includes('Codeforces')) return 'plat-cf'
    return 'plat-gfg'
  }

  return (
    <div className="screen">
      <button 
        className="exit-room-btn" 
        onClick={handleLeaveRoom}
        title="Leave Room"
      >
        Exit
      </button>

      <div className="page-title">
        <span className="icon">⚔️</span> Battle!
      </div>

      {/* Problem */}
      <div className="card">
        <span className="label">YOUR PROBLEM</span>
        <div className="problem-box">
          <p className="problem-name">{problem?.title}</p>
          <div className="problem-meta">
            <span className={getPlatClass(problem?.platform)}>{problem?.platform}</span>
            <span>·</span>
            <span>{problem?.difficulty}</span>
          </div>
          <a href={problem?.link} target="_blank" rel="noreferrer" className="problem-link">
            Open Problem ↗
          </a>
        </div>
      </div>

      {/* Timer */}
      <div className="card" style={{ textAlign: 'center' }}>
        {timeLimit ? (
          <>
            <span className="label">TIME REMAINING</span>
            <div className={`timer-display ${solved ? 'done' : 'running'}`} style={{ color: 'var(--amber-400)' }}>
              {formatTime(Math.max(0, timeLimit * 60 - timer))}
            </div>
            <div className="progress-bar-container" style={{
              background: 'var(--slate-800)',
              borderRadius: '999px',
              height: '8px',
              width: '100%',
              marginTop: '12px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(90deg, var(--cyan-400), var(--purple-500))',
                height: '100%',
                width: `${Math.min(100, (timer / (timeLimit * 60)) * 100)}%`,
                transition: 'width 1s linear'
              }} />
            </div>
            {solved ? (
              gaveUp ? (
                <p style={{ color: 'var(--red-400)', fontWeight: 600, marginTop: '8px' }}>
                  ❌ You gave up. Remaining players still have time.
                </p>
              ) : (
                <p style={{ color: 'var(--green-400)', fontWeight: 600, marginTop: '8px' }}>
                  ✅ Submitted in {formatTime(solvedAt)}! Remaining players still have time.
                </p>
              )
            ) : (
              <p className="hint" style={{ marginTop: '8px' }}>
                Solve before time runs out!
              </p>
            )}
          </>
        ) : (
          <>
            <span className="label">{solved ? 'YOUR TIME' : 'TIME ELAPSED'}</span>
            <div className={`timer-display ${solved ? 'done' : 'running'}`}>
              {formatTime(solved ? solvedAt : timer)}
            </div>
            {solved && (
              gaveUp ? (
                <p style={{ color: 'var(--red-400)', fontWeight: 600, marginTop: '8px' }}>❌ Gave Up!</p>
              ) : (
                <p style={{ color: 'var(--green-400)', fontWeight: 600, marginTop: '8px' }}>✅ Submitted!</p>
              )
            )}
          </>
        )}
      </div>

      {/* Countdown */}
      {countdown !== null && countdown > 0 && (
        <div className="countdown-bar" style={{ borderColor: getCountdownColor(countdown) }}>
          <p className={`countdown-num ${countdown <= 10 ? 'urgent' : ''}`}
             style={{ color: getCountdownColor(countdown) }}>
            ⏳ Round ends in {countdown}s
          </p>
          <p className="hint">
            {countdown <= 10 ? '🔥 Hurry up!' : 'First blood! Others can still score.'}
          </p>
        </div>
      )}

      {/* Player statuses */}
      <div className="card">
        <span className="label">PLAYERS</span>
        {players.map(p => (
          <div key={p.id} className="player-row">
            <span style={{ fontWeight: 500 }}>
              {p.name} {p.name === username && <span style={{ color: 'var(--blue-400)', fontSize: '0.8rem' }}>(You)</span>}
            </span>
            <span className={`solve-status ${p.status.includes('Solved') ? 'solved' : p.status.includes('Gave Up') ? 'gave-up' : 'solving'}`} style={{ color: p.status.includes('Gave Up') ? 'var(--red-400)' : undefined }}>
              {p.status}
            </span>
          </div>
        ))}
      </div>

      {/* Solve button or waiting message */}
      {!solved ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button className="btn btn-success btn-lg" onClick={handleSolvedClick} 
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: 'var(--green-400)' }}
          >
            🎯 Solved It!
          </button>
          <button className="btn btn-danger" onClick={handleGiveUp}
            style={{ background: 'rgba(248, 71, 17, 0.3)', border: '1px solid rgba(184, 100, 97, 0.56)', color: 'var(--slate-400)', fontSize: '0.95rem' }}
          >
            ⏭️ Pass
          </button>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="card-desc">
            {gaveUp ? '🏳️ You gave up this round. Waiting for others...' : '🎉 Nice work! Waiting for others...'}
          </p>
        </div>
      )}

      {isHost && (
        <button className="btn btn-secondary" onClick={handleEndRound} style={{ marginTop: '10px' }}>
          End Round Early
        </button>
      )}

      {/* Screenshot upload modal */}
      {showScreenshotModal && (
        <ScreenshotModal
          onSubmit={(data) => submitSolve(data)}
          onSkip={() => submitSolve(null)}
          onClose={() => setShowScreenshotModal(false)}
        />
      )}
    </div>
  )
}

export default BattleScreen