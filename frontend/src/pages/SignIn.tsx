import { useState } from 'react'
import { useNavigate } from 'react-router'
import { authClient } from '../lib/auth-client'
import { Shield } from 'lucide-react'

export default function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authClient.emailOtp.sendVerificationOtp({ email })
      setStep('otp')
    } catch {
      setError('Failed to send code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await authClient.emailOtp.verifyEmail({ email, otp })
      if (result.error) {
        setError(result.error.message || 'Invalid code. Please try again.')
      } else {
        navigate('/')
      }
    } catch {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Sign In</h1>
          <p className="text-gray-400 mt-2">
            {step === 'email'
              ? 'Enter your email to receive a sign-in code'
              : `We sent a code to ${email}`}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <input
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-center text-2xl tracking-widest focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setOtp(''); setError('') }}
              className="w-full text-gray-400 hover:text-white py-2 text-sm transition-colors"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
