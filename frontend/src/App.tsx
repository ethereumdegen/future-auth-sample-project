import { Routes, Route, Navigate } from 'react-router'
import { useSession } from './lib/auth-client'
import SignIn from './pages/SignIn'
import Dashboard from './pages/Dashboard'

export default function App() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="*" element={<Navigate to="/sign-in" />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard user={session.user} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
