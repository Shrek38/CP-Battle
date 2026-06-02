// pages/ResultScreen.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { socket } from '../socket'

const MEDALS = ['🥇', '🥈', '🥉']

function ResultScreen({ state, actions }) {
  const { leaderboard, isHost, username, roomCode } = state
  const { setPlayers, setLeaderboard } = actions

  const navigate = useNavigate()
  const [proofImage, setProofImage] = useState(null) // base64 to display in modal

  // Trap back button
  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    const handlePopState = () => window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Socket listeners
  useEffect(() => {
    socket.off('next_round_started')
    socket.on('next_round_started', () => navigate('/lobby'))

    socket.on('room_closed', ({ message }) => {
      alert(message)
      actions.setRoomCode('')
      navigate('/')
    })

    return () => {
      socket.off('next_round_started')
      socket.off('room_closed')
    }
  }, [])

  function handleNextRound() {
    socket.emit('next_round', { roomCode })
  }

  function handleEndSession() {
    actions.setRoomCode('')
    actions.setIsHost(false)
    actions.setHostName('')
    setPlayers([])
    setLeaderboard([])
    navigate('/')
  }

  function handleLeaveRoom() {
    if (confirm('Are you sure you want to leave the room?')) {
      socket.emit('leave_room', { roomCode })
      actions.setRoomCode('')
      actions.setIsHost(false)
      actions.setHostName('')
      setPlayers([])
      setLeaderboard([])
      navigate('/')
    }
  }

  const winner = leaderboard.length > 0 ? leaderboard[0] : null

  return (
    <div className="screen">
      <button 
        className="exit-room-btn" 
        onClick={handleLeaveRoom}
        title="Leave Room"
      >
        Leave Room
      </button>

      <div className="page-title">
        <span className="icon">🏆</span> Results
      </div>

      {/* Winner banner */}
      {winner && winner.points > 0 && (
        <div className="card" style={{ textAlign: 'center', borderColor: 'rgba(251,191,36,0.2)' }}>
          <div style={{ fontSize: '2.5rem' }}>🏆</div>
          <div style={{
            fontSize: '1.3rem',
            fontWeight: 700,
            color: 'var(--amber-400)',
          }}>
            {winner.name} takes the lead!
          </div>
          <p className="hint">{winner.points} total points</p>
        </div>
      )}

      {/* Leaderboard */}
      {leaderboard.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>No results yet.</p>
        </div>
      ) : (
        <div className="card">
          <span className="label">LEADERBOARD</span>
          {leaderboard.map((player, index) => (
            <div
              key={player.id}
              className={`lb-row ${
                player.name === username ? 'me' : ''
              } ${index === 0 && player.points > 0 ? 'first' : ''}`}
            >
              <span className={`lb-rank ${index >= 3 ? 'num' : ''}`}>
                {MEDALS[index] ?? `#${index + 1}`}
              </span>
              <span className="lb-name">
                {player.name}
                {player.name === username && <span className="lb-you"> (You)</span>}
              </span>

              {/* Proof button */}
              {player.screenshotData && (
                <button
                  className="proof-btn"
                  onClick={() => setProofImage(player.screenshotData)}
                >
                  📸 Proof
                </button>
              )}

              <span className="lb-pts">{player.points} pts</span>
            </div>
          ))}

          <p className="hint" style={{ marginTop: '8px' }}>
            📸 = submitted proof of accepted submission
          </p>
        </div>
      )}

      {/* Actions */}
      {isHost ? (
        <div className="btn-group">
          <button className="btn btn-primary btn-lg" onClick={handleNextRound}>
            ▶ Next Round
          </button>
          <button className="btn btn-secondary" onClick={handleEndSession}>
            End Session
          </button>
        </div>
      ) : (
        <p className="hint">Waiting for host to start next round...</p>
      )}

      {/* Proof Image Modal */}
      {proofImage && (
        <div className="modal-overlay" onClick={() => setProofImage(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setProofImage(null)} title="Close">✕</button>
            <h3>📸 Submission Proof</h3>
            <img src={proofImage} alt="Submission proof" className="proof-modal-img" />
            <button className="btn btn-secondary" onClick={() => setProofImage(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResultScreen