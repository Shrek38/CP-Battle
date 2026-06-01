// client/src/components/RouteGuard.jsx
// Wraps protected routes and redirects to home if required state is missing.
// Think of it like a bouncer — if you don't have the right data, you're not getting in.

import { Navigate } from 'react-router-dom'

function RouteGuard({ children, condition, redirectTo = '/' }) {
  // condition is a boolean — if false, redirect
  if (!condition) {
    return <Navigate to={redirectTo} replace />
    // replace: true means this redirect doesn't add to browser history
    // so pressing Back won't bring them back to the broken screen
  }
  return children
}

export default RouteGuard