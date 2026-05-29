// pages/LobbyScreen.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { socket } from '../socket'

const API_BASE = 'http://localhost:5000'

function LobbyScreen({ state, actions }) {
  const { username, roomCode, isHost, problem, players } = state
  const { setProblem, setPlayers } = actions

  const navigate = useNavigate()

  const [platform,   setPlatform]   = useState('LeetCode')
  const [difficulty, setDifficulty] = useState('Easy')
  const [minRating,  setMinRating]  = useState('800')
  const [maxRating,  setMaxRating]  = useState('1200')
  const [copied,     setCopied]     = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    // Server broadcasts this whenever room state changes
    // (new player joins, problem updates, etc.)
    socket.on('room_update', ({ players, problem, hostName, locked }) => {
      setPlayers(players)
      if (problem) setProblem(problem)
    })

    // Host clicked Start Battle — everyone navigates to /battle
    socket.on('battle_started', ({ problem, players }) => {
      setProblem(problem)
      setPlayers(players)
      navigate('/battle')
    })

    // Host disconnected
    socket.on('room_closed', ({ message }) => {
      alert(message)
      navigate('/')
    })

    return () => {
      socket.off('room_update')
      socket.off('battle_started')
      socket.off('room_closed')
    }
  }, [])

  async function handleSearchAgain() {
    setLoading(true)
    setFetchError('')
    try {
      const params = platform === 'Codeforces'
        ? `platform=Codeforces&minRating=${minRating}&maxRating=${maxRating}`
        : `platform=${platform}&difficulty=${difficulty}`

      const response = await fetch(`${API_BASE}/api/problem/random?${params}`)
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to fetch problem')
      }
      const data = await response.json()
      setProblem(data.problem)

      // Sync the new problem to all guests via socket
      socket.emit('update_problem', { roomCode, problem: data.problem })

    } catch (err) {
      setFetchError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleStartBattle() {
    if (!problem) return setFetchError('Please fetch a problem first!')
    socket.emit('start_battle', { roomCode })
  }

  return (
    <div className="screen">
      <h1>⚔️ DSA Battle</h1>

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

      {/* Live player list — updates in real time */}
      <div className="card">
        <p className="label">PLAYERS ({players.length})</p>
        {players.map(p => (
          <div key={p.id} className="player-row">
            <span>{p.name}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {p.name === username && <span className="badge">You</span>}
              {p.name === username && isHost && <span className="badge host">Host</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <p className="label">PROBLEM</p>

        {isHost && (
          <>
            <div className="selector-row">
              <select className="select" value={platform}
                onChange={e => setPlatform(e.target.value)}>
                <option>LeetCode</option>
                <option>Codeforces</option>
                <option>GeeksforGeeks</option>
              </select>

              {platform === 'Codeforces' ? (
                <>
                  <select className="select" value={minRating}
                    onChange={e => setMinRating(e.target.value)}>
                    {['800','900','1000','1100','1200','1300','1400','1500'].map(r =>
                      <option key={r}>{r}</option>)}
                  </select>
                  <span style={{ color: '#6b7280' }}>to</span>
                  <select className="select" value={maxRating}
                    onChange={e => setMaxRating(e.target.value)}>
                    {['900','1000','1100','1200','1300','1400','1500','1600'].map(r =>
                      <option key={r}>{r}</option>)}
                  </select>
                </>
              ) : (
                <select className="select" value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}>
                  {['Easy','Medium','Hard'].map(d => <option key={d}>{d}</option>)}
                </select>
              )}
            </div>

            <button className="btn-ghost" onClick={handleSearchAgain} disabled={loading}>
              {loading ? '⏳ Fetching...' : '🔄 Search Again'}
            </button>
            {fetchError && <p className="error">{fetchError}</p>}
          </>
        )}

        {problem ? (
          <div className="problem-card">
            <p className="problem-title">{problem.title}</p>
            <p className="problem-meta">{problem.platform} · {problem.difficulty}</p>
            <a href={problem.link} target="_blank" rel="noreferrer" className="problem-link">
              View Problem ↗
            </a>
          </div>
        ) : (
          <p className="hint">
            {isHost ? 'Click Search Again to pick a problem' : 'Waiting for host to pick a problem...'}
          </p>
        )}
      </div>

      {isHost ? (
        <button className="btn-primary" onClick={handleStartBattle} disabled={!problem}>
          ⚔️ Start Battle
        </button>
      ) : (
        <p className="hint">Waiting for host to start the battle...</p>
      )}
    </div>
  )
}

export default LobbyScreen