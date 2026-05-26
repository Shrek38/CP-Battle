import { useState, useEffect } from 'react'

// ─── 1. CHILD COMPONENT — receives data via "props" ──────────────────────────
// Props are like function arguments. The parent passes data down to the child.
// This component is "dumb" — it only displays what it receives.

function PlayerCard({ name, status, points }) {
  return (
    <div style={{ border: '1px solid #ccc', padding: '8px', margin: '4px' }}>
      <strong>{name}</strong> — {status} — {points} pts
    </div>
  )
}

// ─── 2. MAIN COMPONENT ───────────────────────────────────────────────────────

function BattleRoomPreview() {

  // useState(initialValue) returns [currentValue, setterFunction]
  // When you call the setter, React re-renders the component automatically.
  // Rule: NEVER mutate state directly (e.g. array.push). Always use the setter.

  const [players, setPlayers] = useState([
    { id: 1, name: 'Alice', status: 'Solving...', points: 0 },
    { id: 2, name: 'Bob',   status: 'Solving...', points: 0 },
    { id: 3, name: 'Carol', status: 'Solving...', points: 0 },
  ])

  const [timer, setTimer] = useState(0)         // seconds elapsed
  const [isRunning, setIsRunning] = useState(false)
  const [winner, setWinner] = useState(null)    // null means no winner yet

  // ─── 3. useEffect ─────────────────────────────────────────────────────────
  // useEffect runs AFTER the component renders.
  // The dependency array [ ] controls WHEN it re-runs:
  //   []           → run once on mount (like componentDidMount)
  //   [isRunning]  → re-run every time isRunning changes
  //   no array     → run after every render (dangerous, avoid)
  //
  // The function it returns is the "cleanup" — runs when the component
  // unmounts or before the effect re-runs. Always clean up intervals/sockets here.

  useEffect(() => {
    if (!isRunning) return   // do nothing if battle hasn't started

    const interval = setInterval(() => {
      setTimer(prev => prev + 1)   // prev is the guaranteed latest value
    }, 1000)

    return () => clearInterval(interval)   // CLEANUP — prevents memory leaks
  }, [isRunning])             // re-run this effect whenever isRunning changes

  // ─── 4. EVENT HANDLERS ────────────────────────────────────────────────────

  function handleStartBattle() {
    setIsRunning(true)
    setTimer(0)
    setWinner(null)
  }

  function handleSolvedIt(playerId, playerName) {
    // Stop the timer
    setIsRunning(false)
    setWinner(playerName)

    // Update this player's status and points.
    // IMPORTANT: Never do players[0].status = 'Done' — mutating state directly
    // won't trigger a re-render. Always create a new array with .map()
    setPlayers(prevPlayers =>
      prevPlayers.map(p =>
        p.id === playerId
          ? { ...p, status: 'Solved ✅', points: p.points + 3 }  // spread to copy, then override
          : p
      )
    )
  }

  function handleReset() {
    setIsRunning(false)
    setTimer(0)
    setWinner(null)
    setPlayers([
        { id: 1, name: 'Alice', status: 'Solving...', points: 0 },
        { id: 2, name: 'Bob',   status: 'Solving...', points: 0 },
        { id: 3, name: 'Carol', status: 'Solving...', points: 0 },
    ])
  }

  // ─── 5. HELPER: format seconds → "MM:SS" ─────────────────────────────────
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // ─── 6. JSX — the "template" for what renders ─────────────────────────────
  // JSX looks like HTML but it's JavaScript. Key rules:
  //   - Use className instead of class
  //   - Any JS expression goes inside { }
  //   - A component must return ONE root element (wrap in <div> or <>...</>)
  //   - When rendering a list, every item needs a unique key prop

  return (
    <div style={{ fontFamily: 'monospace', padding: '20px', maxWidth: '400px' }}>
      <h2>Room: XYZ123</h2>
      <p>Problem: <a href="#">Two Sum (LeetCode Easy)</a></p>

      {/* Timer */}
      <h3 style={{ color: isRunning ? 'green' : 'gray' }}>
        ⏱ {formatTime(timer)}
      </h3>

      {/* Winner banner — only shows when winner is set */}
      {winner && (
        <div style={{ background: '#d4edda', padding: '10px', marginBottom: '10px' }}>
          🏆 {winner} solved it first!
        </div>
      )}

      {/* Player list — .map() turns array into JSX elements */}
      <div>
        {players.map(player => (
          // KEY: must be unique and stable. Use database IDs, not array index.
          <div key={player.id}>
            <PlayerCard
              name={player.name}
              status={player.status}
              points={player.points}
            />
            {isRunning && player.status === 'Solving...' && (
              <button onClick={() => handleSolvedIt(player.id, player.name)}>
                I Solved It! ({player.name})
              </button>
            )}
          </div>
        ))}
      </div>

      {!isRunning && !winner && (
        <button onClick={handleStartBattle} style={{ marginTop: '10px' }}>
            ▶ Start Battle
        </button>
        )}

        {/* Shows ONLY after someone wins — lets you reset and play again */}
        {winner && (
        <button onClick={handleReset} style={{ marginTop: '10px' }}>
            🔄 Start Again
        </button>
      )}
    </div>
  )
}

export default BattleRoomPreview