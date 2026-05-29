// server/index.js

const express = require('express')
const cors    = require('cors')
const http    = require('http')       // ← NEW: Node's built-in HTTP module
const { Server } = require('socket.io')  // ← NEW
require('dotenv').config()

const problemRoutes = require('./routes/problem')

const app    = express()
const server = http.createServer(app)  // ← wrap Express in HTTP server

// ── Socket.io setup ───────────────────────────────────────────────────────────
// Socket.io attaches to the HTTP server, not the Express app.
// This is because WebSocket connections are HTTP upgrades —
// they start as HTTP then switch protocols.
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  }
})

const PORT = process.env.PORT || 5000

// ── Express middleware ────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
}))
app.use(express.json())
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} — ${req.method} ${req.path}`)
  next()
})

// ── REST routes ───────────────────────────────────────────────────────────────
app.use('/api/problem', problemRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'DSA Battle server is running' })
})

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

app.use((err, req, res, next) => {
  console.error('Server error:', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

// ── In-memory room store ──────────────────────────────────────────────────────
// rooms is a Map: roomCode → roomData object
// We use Map instead of plain object because it has better performance
// for frequent add/delete operations
//
// roomData shape:
// {
//   code:     'XYZ123',
//   hostId:   socket.id,          // socket.id of the host
//   hostName: 'alice',
//   players:  [{ id, name, points, status }],
//   problem:  { title, link, difficulty, platform },
//   locked:   false,              // true once battle starts
// }

const rooms = new Map()

// ── Helper: broadcast updated player list to everyone in room ─────────────────
function broadcastRoom(roomCode) {
  const room = rooms.get(roomCode)
  if (!room) return
  // io.to(roomCode) sends to ALL sockets that have joined this Socket.io room
  io.to(roomCode).emit('room_update', {
    players: room.players,
    problem: room.problem,
    hostName: room.hostName,
    locked:  room.locked,
  })
}

// ── Socket.io event handlers ──────────────────────────────────────────────────
// io.on('connection') fires every time a new client connects
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`)

  // Each socket automatically gets a unique socket.id
  // Think of it as a temporary user ID for this connection session

  // ── CREATE ROOM ─────────────────────────────────────────────────────────────
  // Client emits: { username }
  // Server responds with: { roomCode } back to just this socket
  // Then broadcasts room_update to the room

  socket.on('create_room', ({ username }) => {
    // Generate unique 6-char room code, retry if collision
    let roomCode
    do {
      roomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    } while (rooms.has(roomCode))

    const room = {
      code:     roomCode,
      hostId:   socket.id,
      hostName: username,
      players:  [{ id: socket.id, name: username, points: 0, status: 'Waiting' }],
      problem:  null,
      locked:   false,
    }

    rooms.set(roomCode, room)

    // socket.join() adds this socket to a Socket.io "room"
    // This is Socket.io's built-in grouping — unrelated to our game rooms
    // but we use the same code as the group name for simplicity
    socket.join(roomCode)

    // emit() sends to just this one socket
    socket.emit('room_created', { roomCode })

    broadcastRoom(roomCode)
    console.log(`Room created: ${roomCode} by ${username}`)
  })

  // ── JOIN ROOM ───────────────────────────────────────────────────────────────
  // Client emits: { username, roomCode }
  // Server responds: room_joined (success) or room_error (failure)

  socket.on('join_room', ({ username, roomCode }) => {
    const room = rooms.get(roomCode)

    // Validate
    if (!room) {
      socket.emit('room_error', { message: `Room ${roomCode} does not exist` })
      return
    }
    if (room.locked) {
      socket.emit('room_error', { message: 'This room is locked — battle already started' })
      return
    }
    if (room.players.find(p => p.name === username)) {
      socket.emit('room_error', { message: 'Username already taken in this room' })
      return
    }

    // Add player
    room.players.push({ id: socket.id, name: username, points: 0, status: 'Waiting' })
    socket.join(roomCode)

    // Tell this socket it successfully joined
    socket.emit('room_joined', { roomCode, hostName: room.hostName })

    // Tell EVERYONE in the room (including the new player) about the updated list
    broadcastRoom(roomCode)
    console.log(`${username} joined room ${roomCode}`)
  })

  // ── UPDATE PROBLEM ──────────────────────────────────────────────────────────
  // Host emits this when they click "Search Again" — syncs problem to all guests
  // Client emits: { roomCode, problem }

  socket.on('update_problem', ({ roomCode, problem }) => {
    const room = rooms.get(roomCode)
    if (!room || room.hostId !== socket.id) return  // only host can do this

    room.problem = problem
    broadcastRoom(roomCode)
  })

  // ── START BATTLE ────────────────────────────────────────────────────────────
  // Host emits this when they click "Start Battle"
  // Client emits: { roomCode }

  socket.on('start_battle', ({ roomCode }) => {
    const room = rooms.get(roomCode)
    if (!room || room.hostId !== socket.id) return

    room.locked = true

    // Reset all player statuses for the new round
    room.players = room.players.map(p => ({ ...p, status: 'Solving...' }))

    // Broadcast to everyone — their React app will navigate to /battle
    io.to(roomCode).emit('battle_started', {
      problem: room.problem,
      players: room.players,
    })

    console.log(`Battle started in room ${roomCode}`)
  })

  // ── PLAYER SOLVED ───────────────────────────────────────────────────────────
  // Client emits: { roomCode, username, position }
  // position = how many people solved before this player (0-indexed)

  socket.on('player_solved', ({ roomCode, username }) => {
    const room = rooms.get(roomCode)
    if (!room) return

    // Count how many have already solved
    const solvedCount = room.players.filter(p =>
      p.status.startsWith('Solved')
    ).length

    const POINTS = [3, 2, 1]
    const earned = POINTS[solvedCount] ?? 0

    // Update this player in the room state
    room.players = room.players.map(p =>
      p.name === username
        ? { ...p, status: `Solved ✅ (+${earned}pts)`, points: p.points + earned }
        : p
    )

    // Broadcast updated player list to everyone
    io.to(roomCode).emit('players_update', { players: room.players })

    // If this was the first solve, tell everyone to start the countdown
    if (solvedCount === 0) {
      io.to(roomCode).emit('first_solve', { username, countdown: 30 })
    }

    console.log(`${username} solved in room ${roomCode}, earned ${earned} pts`)
  })

  // ── END ROUND ───────────────────────────────────────────────────────────────
  // Host (or auto-countdown) emits this
  // Client emits: { roomCode }

  socket.on('end_round', ({ roomCode }) => {
    const room = rooms.get(roomCode)
    if (!room) return

    const leaderboard = [...room.players]
      .sort((a, b) => b.points - a.points)
      .map((p, i) => ({ ...p, rank: i + 1 }))

    io.to(roomCode).emit('round_ended', { leaderboard })
    console.log(`Round ended in room ${roomCode}`)
  })

  // ── NEXT ROUND ──────────────────────────────────────────────────────────────
  // Host clicks "Next Round" on result screen
  // Client emits: { roomCode }

  socket.on('next_round', ({ roomCode }) => {
    const room = rooms.get(roomCode)
    if (!room || room.hostId !== socket.id) return

    // Unlock room, reset statuses, keep points
    room.locked  = false
    room.problem = null
    room.players = room.players.map(p => ({ ...p, status: 'Waiting' }))

    io.to(roomCode).emit('next_round_started')
    broadcastRoom(roomCode)
    console.log(`Next round started in room ${roomCode}`)
  })

  // ── DISCONNECT ──────────────────────────────────────────────────────────────
  // Fires automatically when a socket loses connection (tab close, network drop)
  // This is the most important edge case to handle

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`)

    // Find which room this socket was in
    // We have to search all rooms since we don't track socket→room directly
    for (const [roomCode, room] of rooms) {

      const wasInRoom = room.players.find(p => p.id === socket.id)
      if (!wasInRoom) continue

      // ── Host disconnected ──────────────────────────────────────────────────
      if (room.hostId === socket.id) {
        // Tell everyone the room is closing
        io.to(roomCode).emit('room_closed', {
          message: 'Host disconnected — room closed'
        })
        rooms.delete(roomCode)
        console.log(`Room ${roomCode} closed — host left`)
      }

      // ── Guest disconnected ─────────────────────────────────────────────────
      else {
        room.players = room.players.filter(p => p.id !== socket.id)
        broadcastRoom(roomCode)
        console.log(`${wasInRoom.name} left room ${roomCode}`)
      }

      break  // a socket can only be in one room
    }
  })
})

// ── Start server ──────────────────────────────────────────────────────────────
// IMPORTANT: listen on `server`, not `app`
// If you do app.listen(), Socket.io won't work
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})