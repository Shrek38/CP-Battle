// pages/HomeScreen.jsx — Full scrollable landing page
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { socket } from '../socket'

const API_BASE = 'http://localhost:5000'

function HomeScreen({ state, actions }) {
  const { username, socketConnected } = state
  const { setUsername, setRoomCode, setIsHost } = actions

  const navigate = useNavigate()
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  // Which modal is open? null | 'join' | 'host'
  const [modal, setModal] = useState(null)

  // Join form
  const [joinName, setJoinName] = useState(username || '')
  const [joinCode, setJoinCode] = useState('')

  // Host form
  const [hostName,     setHostName]     = useState(username || '')
  const [hostPlatform, setHostPlatform] = useState('LeetCode')
  const [hostDiff,     setHostDiff]     = useState('Easy')
  const [hostMinR,     setHostMinR]     = useState('800')
  const [hostMaxR,     setHostMaxR]     = useState('1200')
  const [hostTimeLimit, setHostTimeLimit] = useState('none')
  const [hostMaxPlayers, setHostMaxPlayers] = useState('none')
  const [hostProblem,  setHostProblem]  = useState(null)
  const [fetchLoading, setFetchLoading] = useState(false)
  const [fetchError,   setFetchError]   = useState('')

  // Custom URL
  const [problemMode, setProblemMode] = useState('random')
  const [customUrl,   setCustomUrl]   = useState('')
  const [customError, setCustomError] = useState('')

  useEffect(() => {
    socket.on('room_created', ({ roomCode }) => {
      setRoomCode(roomCode)
      setIsHost(true)
      setLoading(false)
      // Save local config
      actions.setTimeLimit(hostTimeLimit === 'none' ? null : parseInt(hostTimeLimit))
      actions.setMaxPlayers(hostMaxPlayers === 'none' ? null : parseInt(hostMaxPlayers))
      // Send the problem + config if host already picked one
      if (hostProblem) {
        socket.emit('update_problem', { roomCode, problem: hostProblem })
      }
      if (hostTimeLimit !== 'none') {
        socket.emit('update_config', { roomCode, timeLimit: parseInt(hostTimeLimit) })
      }
      if (hostMaxPlayers !== 'none') {
        socket.emit('update_config', { roomCode, maxPlayers: parseInt(hostMaxPlayers) })
      }
      navigate('/lobby')
    })

    socket.on('room_joined', ({ roomCode, hostName: hn, timeLimit, maxPlayers }) => {
      setRoomCode(roomCode)
      setIsHost(false)
      actions.setHostName(hn)
      actions.setTimeLimit(timeLimit || null)
      actions.setMaxPlayers(maxPlayers || null)
      setLoading(false)
      navigate('/lobby')
    })

    socket.on('room_error', ({ message }) => {
      setError(message)
      setLoading(false)
    })

    return () => {
      socket.off('room_created')
      socket.off('room_joined')
      socket.off('room_error')
    }
  }, [hostProblem, hostTimeLimit, hostMaxPlayers])

  // ── Join ────────────────────────────────────────────────────────────────
  function handleJoin() {
    const name = joinName.trim()
    const code = joinCode.trim().toUpperCase()
    if (!name || name.length < 3) return setError('Name must be at least 3 characters')
    if (!code || code.length !== 6) return setError('Room code must be 6 characters')
    setUsername(name)
    setLoading(true)
    setError('')
    socket.emit('join_room', { username: name, roomCode: code })
  }

  // ── Host ────────────────────────────────────────────────────────────────
  function handleHost() {
    const name = hostName.trim()
    if (!name || name.length < 3) return setError('Name must be at least 3 characters')
    setUsername(name)
    setLoading(true)
    setError('')
    socket.emit('create_room', {
      username: name,
      timeLimit: hostTimeLimit === 'none' ? null : parseInt(hostTimeLimit),
      maxPlayers: hostMaxPlayers === 'none' ? null : parseInt(hostMaxPlayers),
    })
  }

  // ── Fetch random problem ────────────────────────────────────────────────
  async function handleFetchProblem() {
    setFetchLoading(true)
    setFetchError('')
    try {
      const params = hostPlatform === 'Codeforces'
        ? `platform=Codeforces&minRating=${hostMinR}&maxRating=${hostMaxR}`
        : `platform=${hostPlatform}&difficulty=${hostDiff}`
      const response = await fetch(`${API_BASE}/api/problem/random?${params}`)
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to fetch')
      }
      const data = await response.json()
      setHostProblem(data.problem)
    } catch (err) {
      setFetchError(err.message)
    } finally {
      setFetchLoading(false)
    }
  }

  // ── Custom URL ──────────────────────────────────────────────────────────
  function handleCustomUrl() {
    setCustomError('')
    const url = customUrl.trim()
    if (!url) return setCustomError('Enter a URL')
    const plat = /leetcode/i.test(url) ? 'LeetCode' : /codeforces/i.test(url) ? 'Codeforces' : /geeksforgeeks/i.test(url) ? 'GeeksforGeeks' : null
    if (!plat) return setCustomError('URL must be from LeetCode, Codeforces, or GFG')
    try { new URL(url) } catch { return setCustomError('Invalid URL') }
    const slug = url.split('/').filter(Boolean).pop() || 'Problem'
    const title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    const prob = { title, link: url, difficulty: 'Custom', platform: plat }
    setHostProblem(prob)
  }

  function getDiffClass(d) {
    if (!d) return ''
    const dl = d.toLowerCase()
    return dl === 'easy' ? 'diff-easy' : dl === 'hard' ? 'diff-hard' : 'diff-medium'
  }

  function getPlatClass(p) {
    if (!p) return ''
    return p.includes('LeetCode') ? 'plat-lc' : p.includes('Codeforces') ? 'plat-cf' : 'plat-gfg'
  }

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  // ═══════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="nav-logo">
          <span className="logo-icon">⚔️</span> CP Battle
        </div>
        <ul className="nav-links">
          <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollTo('features') }}>Features</a></li>
          <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollTo('how-it-works') }}>How It Works</a></li>
        </ul>
        <div className="nav-btns">
          <button className="nav-btn nav-btn-outline" onClick={() => { setModal('join'); setError('') }}>
            Join Room
          </button>
          <button className="nav-btn nav-btn-fill" onClick={() => { setModal('host'); setError('') }}>
            Host Battle
          </button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-left">
          <div className="hero-badge">⭐ Competitive Programming, Gamified</div>
          <h1 className="hero-title">
            Battle your <span className="hl">friends</span> on CP problems
          </h1>
          <p className="hero-desc">
            Host a private room, invite your crew with a code, and race to solve competitive programming challenges together. May the best coder win.
          </p>
          <div className="hero-actions">
            <button className="hero-btn hero-btn-primary" onClick={() => { setModal('host'); setError('') }}>
              ⚔️ Host a Battle →
            </button>
            <button className="hero-btn hero-btn-secondary" onClick={() => { setModal('join'); setError('') }}>
              {'>'}_  Join with Code
            </button>
          </div>
        </div>

        <div className="hero-right">
          <div className="code-editor">
            <div className="code-titlebar">
              <span className="code-dot r" />
              <span className="code-dot y" />
              <span className="code-dot g" />
              <span className="code-filename">solution.cpp</span>
            </div>
            <div className="code-body">
<span className="kw">#include</span> <span className="str">&lt;bits/stdc++.h&gt;</span>{'\n'}
<span className="kw">using namespace</span> std;{'\n'}
{'\n'}
<span className="kw">int</span> <span className="fn">solve</span>(vector&lt;<span className="kw">int</span>&gt;&amp; nums) {'{'}{'\n'}
{'  '}<span className="kw">int</span> n = nums.<span className="fn">size</span>();{'\n'}
{'  '}<span className="fn">sort</span>(nums.<span className="fn">begin</span>(), nums.<span className="fn">end</span>());{'\n'}
{'  '}<span className="cm">// greedy approach</span>{'\n'}
{'  '}<span className="kw">return</span> nums[n/<span className="num">2</span>];{'\n'}
{'}'}
            </div>
            <div className="code-accepted">
              ▶ Accepted — 0ms · 1st place!
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section className="section" id="features">
        <h2 className="section-title">Everything you need to compete</h2>
        <p className="section-desc">Built for competitive programmers who want to test their skills against friends, not strangers.</p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(251,191,36,0.12)' }}>⚡</div>
            <h4>Real-Time Battles</h4>
            <p>Compete head-to-head with friends in timed coding battles. Track submissions and see final rankings when the round ends.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(34,211,238,0.12)' }}>{'</>'}</div>
            <h4>Diverse Problem Sets</h4>
            <p>Battle on problems from Codeforces, LeetCode, and GeeksforGeeks, or add your own challenge through any supported URL.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(239,68,68,0.12)' }}>👥</div>
            <h4>Friend Rooms</h4>
            <p>Create a private room, share a 6-character code, and battle only with people you invite.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(249,115,22,0.12)' }}>⏱️</div>
            <h4>Timed Pressure</h4>
            <p>Set a time limit from 15 minutes to 2 hours — feel the clock ticking with every keystroke.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(74,222,128,0.12)' }}>📊</div>
            <h4>Multiple Difficulties</h4>
            <p>Whether you're warming up or going full competitive, pick your challenge level.</p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section className="section hiw-section" id="how-it-works">
        <h2 className="section-title">How it works</h2>
        <p className="section-desc">Get into your first battle in under 60 seconds.</p>

        <div className="steps-row">
          <div className="step">
            <div className="step-num">01</div>
            <h4>Create a Room</h4>
            <p>Choose difficulty, time limit, and how many players can join.</p>
          </div>
          <div className="step">
            <div className="step-num">02</div>
            <h4>Share the Code</h4>
            <p>Send your 6-character room code to friends. They join in one click.</p>
          </div>
          <div className="step">
            <div className="step-num">03</div>
            <h4>Battle Starts</h4>
            <p>Everyone gets the same problem. First to solve (and prove it) wins.</p>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="cta-card">
          <div className="cta-icon">⚔️</div>
          <h2 className="cta-title">Ready to battle?</h2>
          <p className="cta-desc">Create a room, share the code with your friends, and let the best coder win.</p>
          <div className="cta-btns">
            <button className="hero-btn hero-btn-primary" onClick={() => { setModal('host'); setError('') }}>
              ⚔️ Host a Battle →
            </button>
            <button className="hero-btn hero-btn-secondary" onClick={() => { setModal('join'); setError('') }}>
              {'>'}_  Join with Code
            </button>
          </div>
        </div>
      </section>
      
      {/*── FOOTER ───────────────────────────────────────────────────────────*/}
      <footer className="footer">
        Built for competitive programmers who love a good fight.
      </footer>

      {/* ═══════════════════════════════════════════════════════════════════
          JOIN MODAL
          ═══════════════════════════════════════════════════════════════════ */}
      {modal === 'join' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            <div className="modal-header">
              <span className="modal-header-icon">⚔️</span>
              <h3>Join a Battle Room</h3>
            </div>

            <div className="field">
              <label className="field-label">Your Name</label>
              <input className="input" placeholder="e.g. Alice"
                value={joinName} onChange={e => setJoinName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoin()} maxLength={15} autoFocus />
            </div>

            <div className="field">
              <label className="field-label">Room Code</label>
              <input className="input input-mono" placeholder="E.G. AB3X7K"
                value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()} maxLength={6} />
            </div>

            {error && <p className="error-text">{error}</p>}

            <button className="btn btn-cyan btn-lg" onClick={handleJoin}
              disabled={loading || !socketConnected}>
              {loading ? <><span className="spinner" /> Joining...</> : '⚔️ Join Battle'}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          HOST MODAL
          ═══════════════════════════════════════════════════════════════════ */}
      {modal === 'host' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            <div className="modal-header">
              <span className="modal-header-icon">⚔️</span>
              <h3>Host a Battle Room</h3>
            </div>

            <div className="modal-scroll">
              <div className="field">
                <label className="field-label">Your Name</label>
                <input className="input" placeholder="e.g. Alice"
                  value={hostName} onChange={e => setHostName(e.target.value)} maxLength={15} autoFocus />
              </div>

              {/* Problem selection */}
              <div className="field">
                <label className="field-label">Problem</label>
                <div className="tab-row">
                  <button className={`tab-btn ${problemMode === 'random' ? 'active' : ''}`}
                    onClick={() => setProblemMode('random')}>🎲 Random</button>
                  <button className={`tab-btn ${problemMode === 'custom' ? 'active' : ''}`}
                    onClick={() => setProblemMode('custom')}>🔗 Custom URL</button>
                </div>
              </div>

              {problemMode === 'random' ? (
                <>
                  <div className="form-row">
                    <div className="field">
                      <label className="field-label">Platform</label>
                      <select className="select" value={hostPlatform}
                        onChange={e => setHostPlatform(e.target.value)}>
                        <option>LeetCode</option>
                        <option>Codeforces</option>
                        <option>GeeksforGeeks</option>
                      </select>
                    </div>

                    {hostPlatform === 'Codeforces' ? (
                      <>
                        <div className="field">
                          <label className="field-label">Min Rating</label>
                          <select className="select" value={hostMinR}
                            onChange={e => setHostMinR(e.target.value)}>
                            {['800','900','1000','1100','1200','1300','1400','1500'].map(r =>
                              <option key={r}>{r}</option>)}
                          </select>
                        </div>
                        <div className="field">
                          <label className="field-label">Max Rating</label>
                          <select className="select" value={hostMaxR}
                            onChange={e => setHostMaxR(e.target.value)}>
                            {['900','1000','1100','1200','1300','1400','1500','1600','1800','2000'].map(r =>
                              <option key={r}>{r}</option>)}
                          </select>
                        </div>
                      </>
                    ) : (
                      <div className="field">
                        <label className="field-label">Difficulty</label>
                        <select className="select" value={hostDiff}
                          onChange={e => setHostDiff(e.target.value)}>
                          {['Easy','Medium','Hard'].map(d => <option key={d}>{d}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  <button className="btn btn-ghost" onClick={handleFetchProblem} disabled={fetchLoading}
                    style={{ width: '100%', textAlign: 'center' }}>
                    {fetchLoading ? <><span className="spinner" /> Searching...</> : '🔍 Search Problem'}
                  </button>
                  {fetchError && <p className="error-text">{fetchError}</p>}
                </>
              ) : (
                <>
                  <div className="field">
                    <label className="field-label">Problem URL</label>
                    <input className="input" placeholder="Paste LeetCode, Codeforces or GFG URL"
                      value={customUrl} onChange={e => setCustomUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCustomUrl()} />
                  </div>
                  <button className="btn btn-ghost" onClick={handleCustomUrl}
                    style={{ width: '100%', textAlign: 'center' }}>
                    ✅ Use This Problem
                  </button>
                  {customError && <p className="error-text">{customError}</p>}
                </>
              )}

              {/* Show selected problem */}
              {hostProblem && (
                <div className="problem-box">
                  <p className="problem-name">{hostProblem.title}</p>
                  <div className="problem-meta">
                    <span className={getPlatClass(hostProblem.platform)}>{hostProblem.platform}</span>
                    <span>·</span>
                    <span className={`diff-tag ${getDiffClass(hostProblem.difficulty)}`}>
                      {hostProblem.difficulty}
                    </span>
                  </div>
                  <a href={hostProblem.link} target="_blank" rel="noreferrer" className="problem-link">
                    View Problem ↗
                  </a>
                </div>
              )}

              {/* Time limit */}
              <div className="form-row">
                <div className="field">
                  <label className="field-label">Time Limit</label>
                  <select className="select" value={hostTimeLimit}
                    onChange={e => setHostTimeLimit(e.target.value)}>
                    <option value="none">No Limit</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>

                <div className="field">
                  <label className="field-label">Max Players</label>
                  <select className="select" value={hostMaxPlayers}
                    onChange={e => setHostMaxPlayers(e.target.value)}>
                    <option value="none">No Limit</option>
                    <option value="2">2</option>
                    <option value="4">4</option>
                    <option value="6">6</option>
                    <option value="8">8</option>
                    <option value="10">10</option>
                  </select>
                </div>
              </div>

              {error && <p className="error-text">{error}</p>}

              <button className="btn btn-cyan btn-lg" onClick={handleHost}
                disabled={loading || !socketConnected}>
                {loading ? <><span className="spinner" /> Creating...</> : '⚔️ Create & Host'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default HomeScreen