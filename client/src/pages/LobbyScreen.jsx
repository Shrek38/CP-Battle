import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { socket } from '../socket'

const API_BASE = import.meta.env.VITE_API_BASE

// Detect platform from URL
function detectPlatform(url) {
  if (/leetcode\.com/i.test(url))        return 'LeetCode'
  if (/codeforces\.com/i.test(url))      return 'Codeforces'
  if (/geeksforgeeks\.org/i.test(url))   return 'GeeksforGeeks'
  return null
}

// Extract problem name from URL
function extractTitleFromUrl(url) {
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)

    if (u.hostname.includes('leetcode')) {
      const slug = parts.find((_, i) => parts[i - 1] === 'problems') || parts[parts.length - 1]
      return slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Custom Problem'
    }
    if (u.hostname.includes('codeforces')) {
      return `CF ${parts[parts.length - 2] || ''}${parts[parts.length - 1] || ''}`
    }
    if (u.hostname.includes('geeksforgeeks')) {
      const slug = parts.find((_, i) => parts[i - 1] === 'problems') || parts[parts.length - 1]
      return slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'GFG Problem'
    }
    return 'Custom Problem'
  } catch {
    return 'Custom Problem'
  }
}

function LobbyScreen({ state, actions }) {
  const { username, roomCode, isHost, problem, players, timeLimit, maxPlayers } = state
  const { setProblem, setPlayers } = actions

  const navigate = useNavigate()

  const [platform,   setPlatform]   = useState('LeetCode')
  const [difficulty, setDifficulty] = useState('Easy')
  const [minRating,  setMinRating]  = useState('800')
  const [maxRating,  setMaxRating]  = useState('1200')
  const [copied,     setCopied]     = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [fetchError, setFetchError] = useState('')

  // Tab: 'random' or 'custom'
  const [problemMode, setProblemMode] = useState('random')
  const [customUrl,   setCustomUrl]   = useState('')
  const [customError, setCustomError] = useState('')

  // Host ID from server
  const [hostId, setHostId] = useState(null)

  useEffect(() => {
    socket.on('room_update', ({ players, problem, hostName, hostId: hid, locked, timeLimit: tl, maxPlayers: mp }) => {
      setPlayers(players)
      if (hid) setHostId(hid)
      if (problem) setProblem(problem)
      if (tl !== undefined) actions.setTimeLimit(tl)
      if (mp !== undefined) actions.setMaxPlayers(mp)

      // Double-check host privilege updates using username and socket ID comparisons
      const userMatches = username && hostName && username.toLowerCase() === hostName.toLowerCase()
      const socketMatches = socket.id && hid && socket.id === hid
      if (userMatches || socketMatches) {
        actions.setIsHost(true)
      } else {
        actions.setIsHost(false)
      }
    })

    socket.on('battle_started', ({ problem, players }) => {
      setProblem(problem)
      setPlayers(players)
      navigate('/battle')
    })

    socket.on('room_closed', ({ message }) => {
      alert(message)
      navigate('/')
    })

    return () => {
      socket.off('room_update')
      socket.off('battle_started')
      socket.off('room_closed')
    }
  }, [username, actions, navigate])

  async function handleFetchRandom() {
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
      socket.emit('update_problem', { roomCode, problem: data.problem })
    } catch (err) {
      setFetchError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleCustomUrl() {
    setCustomError('')
    const url = customUrl.trim()
    if (!url) return setCustomError('Please enter a URL')

    const plat = detectPlatform(url)
    if (!plat) return setCustomError('URL must be from LeetCode, Codeforces, or GeeksforGeeks')

    try {
      new URL(url) // validate URL format
    } catch {
      return setCustomError('Invalid URL format')
    }

    const prob = {
      title: extractTitleFromUrl(url),
      link: url,
      difficulty: 'Custom',
      platform: plat,
    }
    setProblem(prob)
    socket.emit('update_problem', { roomCode, problem: prob })
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleStartBattle() {
    if (!problem) return setFetchError('Pick a problem first!')
    socket.emit('start_battle', { roomCode })
  }

  function handleToggleReady() {
    socket.emit('toggle_ready', { roomCode })
  }

  function handleLeaveRoom() {
    if (confirm('Are you sure you want to leave the room?')) {
      socket.emit('leave_room', { roomCode })
      actions.setRoomCode('')
      actions.setIsHost(false)
      actions.setHostName('')
      actions.setPlayers([])
      actions.setProblem(null)
      navigate('/')
    }
  }
  
  function getDiffClass(d) {
    if (!d) return ''
    const dl = d.toLowerCase()
    if (dl === 'easy') return 'diff-easy'
    if (dl === 'hard') return 'diff-hard'
    return 'diff-medium'
  }

  function getPlatClass(p) {
    if (!p) return ''
    if (p.includes('LeetCode'))   return 'plat-lc'
    if (p.includes('Codeforces')) return 'plat-cf'
    return 'plat-gfg'
  }

  // Generate avatar color from name
  function avatarColor(name) {
    const colors = ['#3b82f6','#ef4444','#22c55e','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316']
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
  }

  const readyCount = players.filter(p => p.ready).length
  const allReady = readyCount === players.length
  const myPlayer = players.find(p => p.name === username)
  const amReady = myPlayer?.ready || false

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
        <span className="icon">⚔️</span> Battle Lobby
      </div>

      {/* Room Code & Config Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }} className="lobby-header-grid">
        {/* Room Code */}
        <div className="card" style={{ margin: 0 }}>
          <span className="label">ROOM CODE</span>
          <div className="room-code-display" style={{ marginTop: '8px' }}>
            <span className="room-code" style={{ fontSize: '1.4rem' }}>{roomCode}</span>
            <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopyCode} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
              {copied ? '✓' : '📋'}
            </button>
          </div>
          <p className="hint" style={{ marginTop: '6px' }}>Share with friends to join</p>
        </div>

        {/* Battle Config */}
        <div className="card" style={{ margin: 0 }}>
          <span className="label">BATTLE CONFIG</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="hint">⏱️ Time Limit:</span>
              <span style={{ fontWeight: 600, color: 'var(--amber-400)', fontSize: '0.95rem' }}>
                {timeLimit ? `${timeLimit} Min` : 'No Limit'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="hint">👥 Max Players:</span>
              <span style={{ fontWeight: 600, color: 'var(--purple-400)', fontSize: '0.95rem' }}>
                {maxPlayers ? `${players.length} / ${maxPlayers}` : `${players.length} (No Cap)`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Players */}
      <div className="card">
        <span className="label">PLAYERS ({players.length}) — {readyCount} READY</span>
        {players.map(p => (
          <div key={p.id} className="player-row">
            <div className="player-info">
              <div className="player-avatar" style={{ background: avatarColor(p.name) }}>
                {p.name.charAt(0).toUpperCase()}
              </div>
              <span>{p.name}</span>
              {/* Host label visible to ALL players */}
              {p.id === hostId && <span className="tag tag-host">👑 Host</span>}
              {p.name === username && <span className="tag tag-you">You</span>}
            </div>
            <span className={`ready-dot ${p.ready ? 'ready' : 'notready'}`}
                  title={p.ready ? 'Ready' : 'Not ready'} />
          </div>
        ))}

        {/* Ready toggle for non-host players */}
        {!isHost && (
          <button
            className={`btn-ready ${amReady ? 'is-ready' : ''}`}
            onClick={handleToggleReady}
          >
            {amReady ? '✅ Ready!' : '⬜ Click when ready'}
          </button>
        )}

        {/* Ready status hint for host */}
        {isHost && !allReady && players.length > 1 && (
          <p className="hint" style={{ color: 'var(--amber-400)' }}>
            ⚠ {players.length - readyCount} player(s) not ready — you can still start
          </p>
        )}
        {isHost && allReady && players.length > 1 && (
          <p className="hint" style={{ color: 'var(--green-400)' }}>
            ✅ All players are ready!
          </p>
        )}
      </div>

      {/* Problem Selection */}
      <div className="card">
        <span className="label">PROBLEM</span>

        {isHost && (
          <>
            {/* Tab switcher */}
            <div className="tab-row">
              <button
                className={`tab-btn ${problemMode === 'random' ? 'active' : ''}`}
                onClick={() => setProblemMode('random')}
              >
                🎲 Random
              </button>
              <button
                className={`tab-btn ${problemMode === 'custom' ? 'active' : ''}`}
                onClick={() => setProblemMode('custom')}
              >
                🔗 Custom URL
              </button>
            </div>

            {problemMode === 'random' ? (
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
                      <span className="selector-sep">to</span>
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
                <button className="btn btn-ghost" onClick={handleFetchRandom} disabled={loading}>
                  {loading ? <><span className="spinner" /> Fetching...</> : '🔄 Fetch Random Problem'}
                </button>
                {fetchError && <p className="error-text">{fetchError}</p>}
              </>
            ) : (
              <>
                <input
                  className="input"
                  placeholder="Paste a LeetCode, Codeforces, or GFG problem URL"
                  value={customUrl}
                  onChange={e => setCustomUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCustomUrl()}
                />
                <button className="btn btn-ghost" onClick={handleCustomUrl}>
                  ✅ Use This Problem
                </button>
                {customError && <p className="error-text">{customError}</p>}
              </>
            )}
          </>
        )}

        {/* Show selected problem */}
        {problem ? (
          <div className="problem-box">
            <p className="problem-name">{problem.title}</p>
            <div className="problem-meta">
              <span className={getPlatClass(problem.platform)}>{problem.platform}</span>
              <span>·</span>
              <span className={`diff-tag ${getDiffClass(problem.difficulty)}`}>
                {problem.difficulty}
              </span>
            </div>
            <a href={problem.link} target="_blank" rel="noreferrer" className="problem-link">
              View Problem ↗
            </a>
            {problem.fallback && (
              <p className="fallback-hint">ℹ Using cached problem — live API was unavailable</p>
            )}
          </div>
        ) : (
          <p className="hint">
            {isHost ? 'Pick a problem using the options above' : 'Waiting for host to pick a problem...'}
          </p>
        )}
      </div>

      {/* Start Battle */}
      {isHost ? (
        <button className="btn btn-primary btn-lg" onClick={handleStartBattle} disabled={!problem}>
          ⚔️ Start Battle
        </button>
      ) : (
        <p className="hint">Waiting for host to start the battle...</p>
      )}
    </div>
  )
}

export default LobbyScreen