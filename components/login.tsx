'use client'

import { useState } from 'react'
import { User, Lock, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/')
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An unexpected error occurred')
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-xl relative max-w-md mx-auto mt-8">
      <div className="flex min-h-screen flex-col bg-gray-50 pb-[72px]">
        <div className="flex-1 space-y-6 p-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Welcome Back!</h1>
            <p className="text-gray-500">Sign in to your account</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-full bg-white px-4 py-2 pl-10 text-sm text-gray-900 border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  placeholder="Enter your email"
                  required
                />
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-full bg-white px-4 py-2 pl-10 text-sm text-gray-900 border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  placeholder="Enter your password"
                  required
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-full px-8 py-2 text-sm font-medium transition-colors bg-purple-500 text-white hover:bg-purple-600"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

