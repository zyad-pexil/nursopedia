import { Navigate } from 'react-router-dom'

// Redirects authenticated users away from public-only pages (login/register)
export default function PublicOnlyRoute({ children }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  const user = userRaw ? JSON.parse(userRaw) : null

  if (token && user) {
    if (user?.user_type === 'admin') {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return children
}