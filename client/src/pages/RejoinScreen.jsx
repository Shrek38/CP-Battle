// Shown when a page refresh is detected mid-session — cleans up stale state and sends user back to home
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