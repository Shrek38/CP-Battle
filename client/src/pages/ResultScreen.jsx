// pages/ResultScreen.jsx
// Shows the leaderboard after a round ends.
// Host can start next round or end the session.

import { useNavigate } from 'react-router-dom'

// Medal emojis for top 3
const MEDALS = ['🥇', '🥈', '🥉']

function ResultScreen({ state, actions }) {
  const { leaderboard, isHost, username } = state
  const { setPlayers, setProblem } = actions

  const navigate = useNavigate()

  function handleNextRound() {
    // Reset player statuses but KEEP cumulative points
    actions.setPlayers(prev =>
      prev.map(p => ({ ...p, status: 'Solving...' }))
    )
    // Navigate back to lobby to pick a new problem
    navigate('/lobby')
  }

  function handleEndSession() {
    // Full reset — back to home
    actions.setPlayers(prev =>
      prev.map(p => ({ ...p, points: 0, status: 'Solving...' }))
    )
    actions.setLeaderboard([])
    navigate('/')
  }

  return (
    <div className="screen">
      <h1>🏆 Results</h1>

      {leaderboard.length === 0
        ? <p>No results yet.</p>
        : (
          <div className="card">
            <p className="label">LEADERBOARD</p>
            {leaderboard.map((player, index) => (
              <div
                key={player.id}
                className={`leaderboard-row ${player.name === username ? 'highlight' : ''}`}
              >
                <span className="rank">
                  {MEDALS[index] ?? `#${index + 1}`}
                </span>
                <span className="player-name">
                  {player.name}
                  {player.name === username && ' (You)'}
                </span>
                <span className="points">{player.points} pts</span>
              </div>
            ))}
          </div>
        )
      }

      {/* Host controls */}
      {isHost
        ? (
          <div className="button-group">
            <button className="btn-primary" onClick={handleNextRound}>
              ▶ Next Round
            </button>
            <button className="btn-secondary" onClick={handleEndSession}>
              End Session
            </button>
          </div>
        ) : (
          <p className="hint">Waiting for host to start next round...</p>
        )
      }
    </div>
  )
}

export default ResultScreen