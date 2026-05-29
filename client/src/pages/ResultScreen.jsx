// pages/ResultScreen.jsx
import { useNavigate } from 'react-router-dom'
import { socket } from '../socket'

const MEDALS = ['🥇', '🥈', '🥉']

function ResultScreen({ state, actions }) {
  const { leaderboard, isHost, username, roomCode } = state
  const { setPlayers, setLeaderboard } = actions

  const navigate = useNavigate()

  // Listen for next round — guests navigate when host triggers it
  socket.off('next_round_started')
  socket.on('next_round_started', () => {
    navigate('/lobby')
  })

  function handleNextRound() {
    socket.emit('next_round', { roomCode })
  }

  function handleEndSession() {
    setPlayers(prev => prev.map(p => ({ ...p, points: 0, status: 'Waiting' })))
    setLeaderboard([])
    navigate('/')
  }

  return (
    <div className="screen">
      <h1>🏆 Results</h1>

      {leaderboard.length === 0 ? (
        <p>No results yet.</p>
      ) : (
        <div className="card">
          <p className="label">LEADERBOARD</p>
          {leaderboard.map((player, index) => (
            <div
              key={player.id}
              className={`leaderboard-row ${player.name === username ? 'highlight' : ''}`}
            >
              <span className="rank">{MEDALS[index] ?? `#${index + 1}`}</span>
              <span className="player-name">
                {player.name}{player.name === username && ' (You)'}
              </span>
              <span className="points">{player.points} pts</span>
            </div>
          ))}
        </div>
      )}

      {isHost ? (
        <div className="button-group">
          <button className="btn-primary" onClick={handleNextRound}>▶ Next Round</button>
          <button className="btn-secondary" onClick={handleEndSession}>End Session</button>
        </div>
      ) : (
        <p className="hint">Waiting for host to start next round...</p>
      )}
    </div>
  )
}

export default ResultScreen