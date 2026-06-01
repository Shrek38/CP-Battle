// pages/RejoinScreen.jsx
// Shown when we detect the user had an active session but refreshed.
// We can't truly rejoin a Socket.io room after a full refresh
// (the old socket ID is gone from the server).
// The honest UX is to tell them what happened and send them home.

import { useNavigate } from 'react-router-dom'

function RejoinScreen({ actions }) {
  const navigate = useNavigate()

  function handleGoHome() {
    // Clear stale session data
    localStorage.removeItem('dsa_battle_roomCode')
    localStorage.removeItem('dsa_battle_isHost')
    actions.setRoomCode('')
    actions.setIsHost(false)
    actions.setPlayers([])
    actions.setProblem(null)
    actions.setLeaderboard([])
    navigate('/')
  }

  return (
    <div className="screen" style={{ justifyContent: 'center', minHeight: '100vh' }}>
      <div className="card card-glow" style={{ textAlign: 'center', gap: '16px' }}>
        <span className="rejoin-icon">🔄</span>
        <h2>Session Interrupted</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          You refreshed the page mid-session. Your socket connection was reset
          and you've been removed from the room.
        </p>
        <p className="hint">
          Ask your host to share the room code again to rejoin.
        </p>
        <button className="btn-primary" onClick={handleGoHome}>
          Back to Home
        </button>
      </div>
    </div>
  )
}

export default RejoinScreen