'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Result = {
  hash: string
  strength: string
  suggestion: string
}

export default function UserPage() {
  const [password, setPassword] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [passwords, setPasswords] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAnalyse = async () => {
    if (!password) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:8000/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (res.ok) {
        setResults(prev => [...prev, data])
        setPasswords(prev => [...prev, password])
        setPassword('')
      } else {
        setError(data.message || 'Something went wrong')
      }
    } catch {
      setError('Cannot connect to server')
    }
    setLoading(false)
  }

  const getStrengthStyle = (strength: string) => {
    if (strength === 'strong') return { background: '#dcfce7', color: '#16a34a' }
    if (strength === 'medium') return { background: '#fef9c3', color: '#ca8a04' }
    return { background: '#fee2e2', color: '#dc2626' }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', borderRadius: '50%', background: '#dbeafe', marginBottom: '1rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C9.24 2 7 4.24 7 7v2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-2V7c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v2H9V7c0-1.66 1.34-3 3-3zm0 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" fill="#1d4ed8" />
              </svg>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: '500', margin: '0 0 6px', color: '#111827' }}>Your Password Analyzer</h1>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>Enter your password below to check its strength</p>
          </div>
          <button
            onClick={() => router.push('/login')}
            style={{ background: 'white', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            ← Logout
          </button>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '2rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '14px', color: '#374151', fontWeight: '500', whiteSpace: 'nowrap' }}>Type your password:</label>
            <input
              type="text"
              placeholder="e.g. NEPAL@234@#$!"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAnalyse()}
              style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', minWidth: '200px', color: '#111827' }}
            />
            <button
              onClick={handleAnalyse}
              style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {loading ? 'Analysing...' : 'Analyse'}
            </button>
          </div>
          {error && (
            <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '0.75rem', margin: '0.75rem 0 0' }}>{error}</p>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
            <p style={{ margin: '0', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Analysis Results</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>Your P/W</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>Hash value</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>Strength</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>Suggestion</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                      Enter a password and click Analyse to see results
                    </td>
                  </tr>
                ) : (
                  results.map((result, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '14px 20px', color: '#111827', fontFamily: 'monospace' }}>
                        {'*'.repeat(passwords[index].length)}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#6b7280', fontFamily: 'monospace', fontSize: '12px' }}>
                        {result.hash.substring(0, 16)}...
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', ...getStrengthStyle(result.strength) }}>
                          {result.strength}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', color: '#374151' }}>{result.suggestion}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}