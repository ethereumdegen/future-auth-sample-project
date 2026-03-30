import { signOut } from '../lib/auth-client'
import { useNavigate } from 'react-router'
import { Shield, LogOut, User } from 'lucide-react'

interface UserData {
  id: string
  email: string
  name?: string
  image?: string | null
}

export default function Dashboard({ user }: { user: UserData }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Shield size={14} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white">My App</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{user.email}</span>
            <button
              onClick={() => signOut().then(() => navigate('/sign-in'))}
              className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-8">Dashboard</h1>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center">
              <User size={24} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{user.name || 'User'}</h2>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>

          <div className="bg-gray-950 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">User ID</p>
            <code className="text-sm text-gray-300 font-mono">{user.id}</code>
          </div>
        </div>

        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Next Steps</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>Add your own routes to <code className="bg-gray-800 px-1.5 py-0.5 rounded text-xs">src/main.rs</code></li>
            <li>Add migrations to <code className="bg-gray-800 px-1.5 py-0.5 rounded text-xs">migrations/</code></li>
            <li>Use the <code className="bg-gray-800 px-1.5 py-0.5 rounded text-xs">AuthUser</code> extractor to protect endpoints</li>
            <li>Build your frontend pages in <code className="bg-gray-800 px-1.5 py-0.5 rounded text-xs">frontend/src/pages/</code></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
