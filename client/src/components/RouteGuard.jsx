// To ensure no user lands directly to other than Home page
import { Navigate } from 'react-router-dom'

function RouteGuard({ children, condition, redirectTo = '/' }) {
  // condition is a boolean — if false, redirect
  if (!condition) {
    return <Navigate to={redirectTo} replace />
  }
  return children
}

export default RouteGuard