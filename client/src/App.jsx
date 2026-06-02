import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { socket } from './socket'

import HomeScreen   from './pages/HomeScreen'
import LobbyScreen  from './pages/LobbyScreen'
import BattleScreen from './pages/BattleScreen'
import ResultScreen from './pages/ResultScreen'
import RouteGuard   from './components/RouteGuard'
import ToastContainer, { showToast } from './components/Toast'

function App() {
  const [username, setUsername]             = useState('')
  const [roomCode, setRoomCode]             = useState('')
  const [isHost, setIsHost]                 = useState(false)
  const [socketConnected, setSocketConnected] = useState(false)
  const [hostName, setHostName]             = useState('')
  const [problem, setProblem]               = useState(null)
  const [players, setPlayers]               = useState([])
  const [leaderboard, setLeaderboard]       = useState([])
  const [timeLimit, setTimeLimit]           = useState(null)
  const [maxPlayers, setMaxPlayers]         = useState(null)

  // ── Persist username in localStorage ────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('dsa_battle_username')
    if (saved) setUsername(saved)
  }, [])

  useEffect(() => {
    if (username) localStorage.setItem('dsa_battle_username', username)
  }, [username])

  // ── Persist room info to detect refresh-interrupts ──────────────────────
  useEffect(() => {
    if (roomCode) {
      localStorage.setItem('dsa_battle_roomCode', roomCode)
      localStorage.setItem('dsa_battle_isHost', JSON.stringify(isHost))
    } else {
      localStorage.removeItem('dsa_battle_roomCode')
      localStorage.removeItem('dsa_battle_isHost')
    }
  }, [roomCode, isHost])

  // ── Socket connection + disconnect toast ────────────────────────────────
  useEffect(() => {
    // Check if user had an active session before this page load
    const hadSession = localStorage.getItem('dsa_battle_roomCode')

    socket.connect()

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
      setSocketConnected(true)

      // If they had an active room session, show a toast and clean up
      if (hadSession) {
        showToast("Oops! You are disconnected from the Battle.", 'error', 5000)
        localStorage.removeItem('dsa_battle_roomCode')
        localStorage.removeItem('dsa_battle_isHost')
      }
    })

    socket.on('disconnect', () => {
      setSocketConnected(false)
    })

    // Central room updates to keep state dynamically synchronized across all screens
    socket.on('room_update', ({ players, problem, hostId, hostName, timeLimit, maxPlayers }) => {
      if (players) setPlayers(players)
      if (problem) setProblem(problem)
      if (hostName) setHostName(hostName)
      if (hostId) {
        setIsHost(socket.id === hostId)
      }
      if (timeLimit !== undefined) setTimeLimit(timeLimit)
      if (maxPlayers !== undefined) setMaxPlayers(maxPlayers)
    })

    socket.on('players_update', ({ players }) => {
      if (players) setPlayers(players)
    })

    return () => { 
      socket.disconnect() 
      socket.off('room_update')
      socket.off('players_update')
    }
  }, [])

  // ── Bundle state/actions for screens ────────────────────────────────────
  const appState = {
    username, roomCode, isHost, problem, players,
    leaderboard, socketConnected, hostName, timeLimit, maxPlayers,
  }

  const appActions = {
    setUsername, setRoomCode, setIsHost,
    setProblem, setPlayers, setLeaderboard, setHostName, setTimeLimit, setMaxPlayers,
  }

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route
          path="/"
          element={<HomeScreen state={appState} actions={appActions} />}
        />
        <Route
          path="/lobby"
          element={
            <RouteGuard condition={!!roomCode}>
              <LobbyScreen state={appState} actions={appActions} />
            </RouteGuard>
          }
        />
        <Route
          path="/battle"
          element={
            <RouteGuard condition={!!roomCode && !!problem}>
              <BattleScreen state={appState} actions={appActions} />
            </RouteGuard>
          }
        />
        <Route
          path="/result"
          element={
            <RouteGuard condition={!!roomCode && leaderboard.length > 0}>
              <ResultScreen state={appState} actions={appActions} />
            </RouteGuard>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App