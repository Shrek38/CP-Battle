// server/index.js

const express = require('express')
const cors    = require('cors')
const http    = require('http')
const { Server } = require('socket.io')
require('dotenv').config()
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://cp-battle.vercel.app'
]
const problemRoutes = require('./routes/problem')

const app    = express()
const server = http.createServer(app)

// ── Socket.io setup ───────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 5e6, // 5MB for screenshot uploads
})

const PORT = process.env.PORT || 5000

// ── Express middleware ────────────────────────────────────────────────────────
app.use(cors({
  origin: allowedOrigins,
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
//
// roomData shape:
// {
//   code:     'XYZ123',
//   hostId:   socket.id,
//   hostName: 'alice',
//   players:  [{ id, name, points, status, ready, screenshotData }],
//   problem:  { title, link, difficulty, platform },
//   locked:   false,
// }

const rooms = new Map()

// ── Helper: broadcast updated player list to everyone in room ─────────────────
function broadcastRoom(roomCode) {
  const room = rooms.get(roomCode)
  if (!room) return
  io.to(roomCode).emit('room_update', {
    players:  room.players,
    problem:  room.problem,
    hostName: room.hostName,
    hostId:   room.hostId,
    locked:   room.locked,
    timeLimit: room.timeLimit,
    maxPlayers: room.maxPlayers,
  })
}

// ── Socket.io event handlers ──────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`)

  // ── CREATE ROOM ─────────────────────────────────────────────────────────────
  socket.on('create_room', ({ username, timeLimit, maxPlayers }) => {
    let roomCode
    do {
      roomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    } while (rooms.has(roomCode))

    const room = {
      code:     roomCode,
      hostId:   socket.id,
      hostName: username,
      players:  [{ id: socket.id, name: username, points: 0, status: 'Waiting', ready: true, screenshotData: null }],
      problem:  null,
      locked:   false,
      timeLimit: timeLimit || null,
      maxPlayers: maxPlayers || null,
    }

    rooms.set(roomCode, room)
    socket.join(roomCode)
    socket.emit('room_created', { roomCode })
    broadcastRoom(roomCode)
    console.log(`Room created: ${roomCode} by ${username} (limit: ${timeLimit}, max: ${maxPlayers})`)
  })

  // ── JOIN ROOM ───────────────────────────────────────────────────────────────
  socket.on('join_room', ({ username, roomCode }) => {
    const room = rooms.get(roomCode)

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
    if (room.maxPlayers && room.players.length >= room.maxPlayers) {
      socket.emit('room_error', { message: 'This room is already full' })
      return
    }

    room.players.push({ id: socket.id, name: username, points: 0, status: 'Waiting', ready: false, screenshotData: null })
    socket.join(roomCode)
    socket.emit('room_joined', {
      roomCode,
      hostName: room.hostName,
      hostId: room.hostId,
      timeLimit: room.timeLimit,
      maxPlayers: room.maxPlayers
    })
    broadcastRoom(roomCode)
    console.log(`${username} joined room ${roomCode}`)
  })

  // ── TOGGLE READY ────────────────────────────────────────────────────────────
  socket.on('toggle_ready', ({ roomCode }) => {
    const room = rooms.get(roomCode)
    if (!room) return
    const player = room.players.find(p => p.id === socket.id)
    if (!player) return
    player.ready = !player.ready
    broadcastRoom(roomCode)
    console.log(`${player.name} toggled ready to ${player.ready} in room ${roomCode}`)
  })

  // ── UPDATE CONFIG ───────────────────────────────────────────────────────────
  socket.on('update_config', ({ roomCode, timeLimit, maxPlayers }) => {
    const room = rooms.get(roomCode)
    if (!room || room.hostId !== socket.id) return
    if (timeLimit !== undefined) room.timeLimit = timeLimit
    if (maxPlayers !== undefined) room.maxPlayers = maxPlayers
    broadcastRoom(roomCode)
    console.log(`Config updated in room ${roomCode}: limit=${timeLimit}, max=${maxPlayers}`)
  })

  // ── UPDATE PROBLEM ──────────────────────────────────────────────────────────
  socket.on('update_problem', ({ roomCode, problem }) => {
    const room = rooms.get(roomCode)
    if (!room || room.hostId !== socket.id) return
    room.problem = problem
    broadcastRoom(roomCode)
  })

  // ── START BATTLE ────────────────────────────────────────────────────────────
  socket.on('start_battle', ({ roomCode }) => {
    const room = rooms.get(roomCode)
    if (!room || room.hostId !== socket.id) return

    room.locked = true
    room.players = room.players.map(p => ({ ...p, status: 'Solving...', screenshotData: null }))

    io.to(roomCode).emit('battle_started', {
      problem: room.problem,
      players: room.players,
    })

    console.log(`Battle started in room ${roomCode}`)
  })

  // ── PLAYER SOLVED ───────────────────────────────────────────────────────────
  socket.on('player_solved', ({ roomCode, username, screenshotData }) => {
    const room = rooms.get(roomCode)
    if (!room) return

    const solvedCount = room.players.filter(p =>
      p.status.startsWith('Solved')
    ).length

    const POINTS = [3, 2, 1]
    const earned = POINTS[solvedCount] ?? 0

    room.players = room.players.map(p =>
      p.name === username
        ? { ...p, status: `Solved ✅ (+${earned}pts)`, points: p.points + earned, screenshotData: screenshotData || null }
        : p
    )

    io.to(roomCode).emit('players_update', { players: room.players })

    if (solvedCount === 0 && !room.timeLimit) {
      io.to(roomCode).emit('first_solve', { username, countdown: 30 })
    }

    console.log(`${username} solved in room ${roomCode}, earned ${earned} pts`)
  })

  // ── END ROUND ───────────────────────────────────────────────────────────────
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
  socket.on('next_round', ({ roomCode }) => {
    const room = rooms.get(roomCode)
    if (!room || room.hostId !== socket.id) return

    room.locked  = false
    room.problem = null
    room.players = room.players.map(p => ({ ...p, status: 'Waiting', ready: p.id === room.hostId, screenshotData: null }))

    io.to(roomCode).emit('next_round_started')
    broadcastRoom(roomCode)
    console.log(`Next round started in room ${roomCode}`)
  })

  // ── DISCONNECT ──────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`)

    for (const [roomCode, room] of rooms) {
      const wasInRoom = room.players.find(p => p.id === socket.id)
      if (!wasInRoom) continue

      if (room.hostId === socket.id) {
        io.to(roomCode).emit('room_closed', {
          message: 'Host disconnected — room closed'
        })
        rooms.delete(roomCode)
        console.log(`Room ${roomCode} closed — host left`)
      } else {
        room.players = room.players.filter(p => p.id !== socket.id)
        broadcastRoom(roomCode)
        console.log(`${wasInRoom.name} left room ${roomCode}`)
      }

      break
    }
  })
})

// ── Start server ──────────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
})