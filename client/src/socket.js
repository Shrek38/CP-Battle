import { io } from 'socket.io-client'

const SERVER_URL = 'https://cp-battle-1.onrender.com'

// autoConnect: false means the socket won't connect until we call socket.connect()
// This gives us control over when the connection opens
export const socket = io(SERVER_URL, {
  autoConnect: false,
})