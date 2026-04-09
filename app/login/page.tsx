'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    try {
      const res = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (res.ok) {
        if (data.role === 'admin') router.push('/admin')
        else router.push('/user')
      } else {
        setError(data.message || 'Invalid credentials')
      }
    } catch {
      setError('Cannot connect to server')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '2.5rem', width: '100%', maxWidth: '380px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '500', margin: '0 0 4px' }}>Password Analyzer</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>Sign in to your account</p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '13px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '13px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>

        {error && (
          <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>
        )}

        <button
          onClick={handleLogin}
          style={{ width: '100%', background: '#2563eb', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', border: 'none', cursor: 'pointer' }}
        >
          Sign in
        </button>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '13px', color: '#3b82f6', cursor: 'pointer' }}>
          Forgot password?
        </p>

      </div>
    </div>
  )
}