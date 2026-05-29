// pages/HomeScreen.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { socket } from '../socket'

function HomeScreen({ state, actions }) {
  const { username, socketConnected } = state
  const { setUsername, setRoomCode, setIsHost, setPlayers } = actions

  const navigate  = useNavigate()
  const [nameInput, setNameInput] = useState(username || '')
  const [joinInput, setJoinInput] = useState('')
  const [nameSet,   setNameSet]   = useState(!!username)
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)

  useEffect(() => {
    // Listen for successful room creation
    socket.on('room_created', ({ roomCode }) => {
      setRoomCode(roomCode)
      setIsHost(true)
      setLoading(false)
      navigate('/lobby')
    })

    // Listen for successful room join
    socket.on('room_joined', ({ roomCode }) => {
      setRoomCode(roomCode)
      setIsHost(false)
      setLoading(false)
      navigate('/lobby')
    })

    // Listen for errors (wrong room code, locked room, etc.)
    socket.on('room_error', ({ message }) => {
      setError(message)
      setLoading(false)
    })

    // Cleanup: remove listeners when component unmounts
    // This prevents duplicate listeners if user navigates back to home
    return () => {
      socket.off('room_created')
      socket.off('room_joined')
      socket.off('room_error')
    }
  }, [])

  function handleSetName() {
    const trimmed = nameInput.trim()
    if (!trimmed)           return setError('Username cannot be empty')
    if (trimmed.length < 3) return setError('At least 3 characters please')
    if (trimmed.length > 15) return setError('Max 15 characters')
    setUsername(trimmed)
    setNameSet(true)
    setError('')
  }

  function handleCreateRoom() {
    setLoading(true)
    setError('')
    // Emit to server — server generates the room code and responds with room_created
    socket.emit('create_room', { username })
  }

  function handleJoinRoom() {
    const trimmed = joinInput.trim().toUpperCase()
    if (!trimmed)            return setError('Enter a room code')
    if (trimmed.length !== 6) return setError('Room code must be 6 characters')
    setLoading(true)
    setError('')
    socket.emit('join_room', { username, roomCode: trimmed })
  }

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

  return (
    <div className="screen">
      <h1>⚔️ DSA Battle</h1>
      <p className="subtitle">Welcome, <strong>{username}</strong></p>

      {/* Connection status indicator */}
      <p style={{ textAlign: 'center', fontSize: '0.8rem' }}>
        {socketConnected
          ? <span style={{ color: '#34d399' }}>● Connected</span>
          : <span style={{ color: '#f87171' }}>● Connecting...</span>
        }
      </p>

      <div className="card">
        <h2>Create a Room</h2>
        <p>You'll be the host and pick the problem</p>
        <button
          className="btn-primary"
          onClick={handleCreateRoom}
          disabled={loading || !socketConnected}
        >
          {loading ? '⏳ Creating...' : '+ Create Room'}
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
        <button
          className="btn-secondary"
          onClick={handleJoinRoom}
          disabled={loading || !socketConnected}
        >
          {loading ? '⏳ Joining...' : 'Join Room →'}
        </button>
      </div>

      <button className="btn-ghost" onClick={() => { setNameSet(false); setError('') }}>
        Change username
      </button>
    </div>
  )
}

export default HomeScreen