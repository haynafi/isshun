'use client'

import { useState } from 'react'
import { User, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle login logic here
    console.log('Login attempt with:', email, password)
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-xl relative max-w-md mx-auto mt-8">
      <div className="flex min-h-screen flex-col bg-gray-50 pb-[72px]">
        <div className="flex-1 space-y-6 p-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Welcome Back!</h1>
            <p className="text-gray-500">Sign in to your account</p>
          </div>

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
              className={cn(
                'w-full rounded-full px-8 py-2 text-sm font-medium transition-colors',
                'bg-purple-500 text-white hover:bg-purple-600'
              )}
            >
              Sign In
            </button>
          </form>

          <div className="text-center">
            <a href="#" className="text-sm text-purple-600 hover:underline">Forgot password?</a>
          </div>
        </div>
      </div>
    </div>
  )
}

