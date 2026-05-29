import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { socket } from './socket'
import HomeScreen   from './pages/HomeScreen'
import LobbyScreen  from './pages/LobbyScreen'
import BattleScreen from './pages/BattleScreen'
import ResultScreen from './pages/ResultScreen'

function App() {

  // ── Shared state that multiple screens need ──────────────────────────────
  // Why here and not inside each screen?
  // Because when React Router swaps screens, the old screen's component
  // is UNMOUNTED — its local state is destroyed. Keeping it here in App
  // means it survives navigation.
  
  const [username, setUsername] = useState('')       // e.g. "alice123"
  const [roomCode, setRoomCode] = useState('')       // e.g. "XYZ123"
  const [isHost, setIsHost]     = useState(false)    // did this user create the room?
  const [socketConnected, setSocketConnected] = useState(false)

  // Dummy problem — Day 4 will replace this with real API data
  const [problem, setProblem] = useState({
    title: 'Two Sum',
    link: 'https://leetcode.com/problems/two-sum',
    difficulty: 'Easy',
    platform: 'LeetCode',
  })

  // Dummy players — Day 5 will replace this with Socket.io live data
  const [players, setPlayers] = useState([
    { id: 1, name: 'alice123', points: 0, status: 'Solving...' },
    { id: 2, name: 'bob456',   points: 0, status: 'Solving...' },
  ])

  // Leaderboard persists across rounds within a session
  const [leaderboard, setLeaderboard] = useState([])

  // ── Persist username in localStorage ─────────────────────────────────────
  // On first load, check if user already set a username before
  useEffect(() => {
    const saved = localStorage.getItem('dsa_battle_username')
    if (saved) setUsername(saved)
  }, [])   // empty array = run once on mount

  // Whenever username changes, save it
  useEffect(() => {
    if (username) localStorage.setItem('dsa_battle_username', username)
  }, [username])

  useEffect(() => {
  // Connect when app loads
    socket.connect()

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
      setSocketConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
      setSocketConnected(false)
    })

    // Cleanup when App unmounts (rare but correct practice)
    return () => {
      socket.disconnect()
    }
  }, [])
  // ── Bundle everything screens might need ─────────────────────────────────
  // Instead of passing 10 props to every screen, we pass one "appState" object
  // and one "appActions" object. Keeps things organised.
  const appState = { username, roomCode, isHost, problem, players, leaderboard, socketConnected }

  const appActions = {
    setUsername,
    setRoomCode,
    setIsHost,
    setProblem,
    setPlayers,
    setLeaderboard,
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Each <Route> maps a URL path to a component */}
        {/* "element" is what renders at that path */}

        <Route
          path="/"
          element={<HomeScreen state={appState} actions={appActions} />}
        />
        <Route
          path="/lobby"
          element={<LobbyScreen state={appState} actions={appActions} />}
        />
        <Route
          path="/battle"
          element={<BattleScreen state={appState} actions={appActions} />}
        />
        <Route
          path="/result"
          element={<ResultScreen state={appState} actions={appActions} />}
        />

        {/* Any unknown URL redirects to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App