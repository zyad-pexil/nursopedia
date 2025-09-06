import { Navigate } from 'react-router-dom'

// Minimal protected route based on presence of authToken
export default function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('authToken')
  const userRaw = localStorage.getItem('user')
  const user = userRaw ? JSON.parse(userRaw) : null

  if (!token || !user) {
    return <Navigate to="/" replace />
  }

  if (adminOnly && user?.user_type !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}