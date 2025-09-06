import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import PublicOnlyRoute from './components/PublicOnlyRoute.jsx'
import Dashboard from './pages/Dashboard.jsx'
import SubjectPage from './pages/Subject.jsx'
import LessonPage from './pages/Lesson.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminManage from './pages/AdminManage.jsx'
import AdminStudentProfile from './pages/AdminStudentProfile.jsx'
import ExamPage from './pages/Exam.jsx'
import Profile from './pages/Profile.jsx'
import Notifications from './pages/Notifications.jsx'

function Layout() {
  useEffect(() => {
    function onCtx(e){ e.preventDefault(); }
    document.addEventListener('contextmenu', onCtx)
    return () => document.removeEventListener('contextmenu', onCtx)
  }, [])

  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<PublicOnlyRoute><App initialView="login" /></PublicOnlyRoute>} />
          <Route path="register" element={<PublicOnlyRoute><App initialView="register" /></PublicOnlyRoute>} />

          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route path="subject/:id" element={<ProtectedRoute><SubjectPage /></ProtectedRoute>} />
          <Route path="lesson/:id" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
          <Route path="exam/:id" element={<ProtectedRoute><ExamPage /></ProtectedRoute>} />
          <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

          <Route
            path="admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/manage"
            element={
              <ProtectedRoute adminOnly>
                <AdminManage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/users/:id"
            element={
              <ProtectedRoute adminOnly>
                <AdminStudentProfile />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
