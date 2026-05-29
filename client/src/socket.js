// client/src/socket.js
// We create ONE socket instance and import it wherever needed.
// If you created a new socket inside each component, you'd get
// multiple connections and duplicate events.

import { io } from 'socket.io-client'

const SERVER_URL = 'http://localhost:5000'

// autoConnect: false means the socket won't connect until we call socket.connect()
// This gives us control over when the connection opens
export const socket = io(SERVER_URL, {
  autoConnect: false,
})