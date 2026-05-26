// pages/HomeScreen.jsx
// First screen the user sees.
// Responsibilities:
//   1. Ask for username if not set yet
//   2. Let user create or join a room

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function HomeScreen({ state, actions }) {
  const { username } = state
  const { setUsername, setRoomCode, setIsHost } = actions

  // useNavigate() gives you a function to programmatically change the URL
  // e.g. navigate('/lobby') is like clicking a link to /lobby
  const navigate = useNavigate()

  // Local state — only this screen needs these, so they live here
  const [nameInput, setNameInput]   = useState(username || '')
  const [joinInput, setJoinInput]   = useState('')
  const [nameSet, setNameSet]       = useState(!!username)  // !! converts to boolean
  const [error, setError]           = useState('')

  function handleSetName() {
    const trimmed = nameInput.trim()
    if (!trimmed) return setError('Username cannot be empty')
    if (trimmed.length < 3) return setError('At least 3 characters please')
    if (trimmed.length > 15) return setError('Max 15 characters')
    setUsername(trimmed)
    setNameSet(true)
    setError('')
  }

  function handleCreateRoom() {
    // Generate a random 6-character room code
    // Day 5 will replace this with a server-generated code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    setRoomCode(code)
    setIsHost(true)
    navigate('/lobby')
  }

  function handleJoinRoom() {
    const trimmed = joinInput.trim().toUpperCase()
    if (!trimmed) return setError('Enter a room code')
    if (trimmed.length !== 6) return setError('Room code must be 6 characters')
    setRoomCode(trimmed)
    setIsHost(false)
    navigate('/lobby')
  }

  // ── If username not set yet, show name entry form ────────────────────────
  if (!nameSet) {
    return (
      <div className="screen">
        <h1>⚔️ DSA Battle</h1>
        <div className="card">
          <h2>Choose your username</h2>
          <p>This will be shown to other players</p>
          <input
            className="input"
            placeholder="e.g. coder42"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            // Let user press Enter instead of clicking button
            onKeyDown={e => e.key === 'Enter' && handleSetName()}
            maxLength={15}
          />
          {error && <p className="error">{error}</p>}
          <button className="btn-primary" onClick={handleSetName}>
            Continue →
          </button>
        </div>
      </div>
    )
  }

  // ── Main home screen after username is set ───────────────────────────────
  return (
    <div className="screen">
      <h1>⚔️ DSA Battle</h1>
      <p className="subtitle">Welcome, <strong>{username}</strong></p>

      <div className="card">
        <h2>Create a Room</h2>
        <p>You'll be the host and pick the problem</p>
        <button className="btn-primary" onClick={handleCreateRoom}>
          + Create Room
        </button>
      </div>

      <div className="card">
        <h2>Join a Room</h2>
        <input
          className="input"
          placeholder="Enter 6-digit room code"
          value={joinInput}
          onChange={e => setJoinInput(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
          maxLength={6}
        />
        {error && <p className="error">{error}</p>}
        <button className="btn-secondary" onClick={handleJoinRoom}>
          Join Room →
        </button>
      </div>

      {/* Small affordance to change username */}
      <button
        className="btn-ghost"
        onClick={() => { setNameSet(false); setError('') }}
      >
        Change username
      </button>
    </div>
  )
}

export default HomeScreen