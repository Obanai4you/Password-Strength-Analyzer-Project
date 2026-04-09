'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type User = {
  id: number
  username: string
  email: string
  contact: string
  password: string
}

type PasswordData = {
  user_id: number
  hash: string
  strength: string
  suggestion: string
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState<User[]>([])
  const [passwordData, setPasswordData] = useState<PasswordData[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', contact: '', username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const router = useRouter()

  const handleCreateUser = async () => {
    try {
      const res = await fetch('http://localhost:8000/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })
      const data = await res.json()
      if (res.ok) {
        setUsers(prev => [...prev, data])
        setShowCreateUser(false)
        setNewUser({ name: '', contact: '', username: '', email: '', password: '' })
      } else {
        setError(data.message || 'Failed to create user')
      }
    } catch {
      setError('Cannot connect to server')
    }
  }

  const strengthCount = (s: string) => passwordData.filter(p => p.strength === s).length
  const total = passwordData.length || 1

  const inputStyle = {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
    outline: 'none',
    color: '#111827',
    marginBottom: '12px',
  }

  const getStrengthStyle = (strength: string) => {
    if (strength === 'strong') return { background: '#dcfce7', color: '#16a34a' }
    if (strength === 'medium') return { background: '#fef9c3', color: '#ca8a04' }
    return { background: '#fee2e2', color: '#dc2626' }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex' }}>

      {/* Sidebar */}
      <div style={{ width: '200px', background: 'white', borderRight: '1px solid #e5e7eb', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1.5rem', fontWeight: '500' }}>Hey Admin 👋</p>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {['users', 'password', 'analytics'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  textAlign: 'left', padding: '10px 12px', borderRadius: '8px', border: 'none',
                  cursor: 'pointer', fontSize: '14px',
                  fontWeight: activeTab === tab ? '500' : '400',
                  background: activeTab === tab ? '#eff6ff' : 'transparent',
                  color: activeTab === tab ? '#1d4ed8' : '#374151'
                }}
              >
                {tab === 'users' ? 'Users' : tab === 'password' ? 'Password Analyzer' : 'Analytics'}
              </button>
            ))}
          </nav>
        </div>
        <button
          onClick={() => router.push('/login')}
          style={{ textAlign: 'left', padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#ef4444', background: 'transparent' }}
        >
          ← Logout
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '500', margin: '0', color: '#111827' }}>Password Analyzer</h1>
          <button
            onClick={() => setShowCreateUser(true)}
            style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
          >
            Create User
          </button>
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '1rem' }}>{error}</p>}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div style={{ flex: 1, background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <p style={{ margin: '0', fontSize: '14px', fontWeight: '500', color: '#374151' }}>All Users</p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    {['User', 'Hash values', 'Strength', 'Suggestion', 'No. of passwords'].map(h => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                        No users yet — create one using the button above
                      </td>
                    </tr>
                  ) : (
                    users.map((user, index) => {
                      const userPasswords = passwordData.filter(p => p.user_id === user.id)
                      return (
                        <tr key={index} onClick={() => setSelectedUser(user)} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}>
                          <td style={{ padding: '14px 20px', color: '#111827' }}>{user.username}</td>
                          <td style={{ padding: '14px 20px', color: '#6b7280', fontFamily: 'monospace', fontSize: '12px' }}>
                            {userPasswords[0]?.hash.substring(0, 12) || '-'}
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            {userPasswords[0] ? (
                              <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', ...getStrengthStyle(userPasswords[0].strength) }}>
                                {userPasswords[0].strength}
                              </span>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '14px 20px', color: '#374151' }}>{userPasswords[0]?.suggestion || '-'}</td>
                          <td style={{ padding: '14px 20px', color: '#111827' }}>{userPasswords.length}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {selectedUser && (
              <div style={{ width: '220px', background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '1.5rem', height: 'fit-content' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <p style={{ margin: '0', fontSize: '14px', fontWeight: '500', color: '#374151' }}>User details</p>
                  <span onClick={() => setSelectedUser(null)} style={{ cursor: 'pointer', color: '#9ca3af', fontSize: '18px' }}>×</span>
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '2' }}>
                  <p style={{ margin: '0' }}>Username: <span style={{ color: '#111827' }}>{selectedUser.username}</span></p>
                  <p style={{ margin: '0' }}>Contact: <span style={{ color: '#111827' }}>{selectedUser.contact}</span></p>
                  <p style={{ margin: '0' }}>Email: <span style={{ color: '#111827' }}>{selectedUser.email}</span></p>
                  <p style={{ margin: '0' }}>P/W: <span style={{ color: '#111827', fontFamily: 'monospace' }}>{'*'.repeat(selectedUser.password.length)}</span></p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Password Analyzer Tab */}
        {activeTab === 'password' && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <p style={{ margin: '0', fontSize: '14px', fontWeight: '500', color: '#374151' }}>All Password Analysis</p>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  {['User ID', 'Hash value', 'Strength', 'Suggestion'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {passwordData.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                      No password data yet
                    </td>
                  </tr>
                ) : (
                  passwordData.map((p, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '14px 20px', color: '#111827' }}>{p.user_id}</td>
                      <td style={{ padding: '14px 20px', color: '#6b7280', fontFamily: 'monospace', fontSize: '12px' }}>{p.hash.substring(0, 16)}...</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', ...getStrengthStyle(p.strength) }}>
                          {p.strength}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', color: '#374151' }}>{p.suggestion}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '2rem' }}>
            <p style={{ margin: '0 0 1.5rem', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Analytics</p>
            <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                <svg viewBox="0 0 36 36" style={{ width: '160px', height: '160px', transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#16a34a" strokeWidth="3"
                    strokeDasharray={`${(strengthCount('strong') / total) * 100} 100`} strokeLinecap="round" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ca8a04" strokeWidth="3"
                    strokeDasharray={`${(strengthCount('medium') / total) * 100} 100`}
                    strokeDashoffset={`-${(strengthCount('strong') / total) * 100}`} strokeLinecap="round" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#dc2626" strokeWidth="3"
                    strokeDasharray={`${(strengthCount('weak') / total) * 100} 100`}
                    strokeDashoffset={`-${((strengthCount('strong') + strengthCount('medium')) / total) * 100}`} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <p style={{ margin: '0', fontSize: '20px', fontWeight: '500', color: '#111827' }}>{total === 1 ? 0 : total}</p>
                  <p style={{ margin: '0', fontSize: '11px', color: '#6b7280' }}>total</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Strong', key: 'strong', color: '#16a34a' },
                  { label: 'Medium', key: 'medium', color: '#ca8a04' },
                  { label: 'Weak', key: 'weak', color: '#dc2626' },
                ].map(item => (
                  <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color }}></div>
                    <span style={{ fontSize: '13px', color: '#374151' }}>{item.label} — {Math.round((strengthCount(item.key) / total) * 100)}%</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '120px' }}>
                {['strong', 'medium', 'weak'].map(s => (
                  <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>{strengthCount(s)}</span>
                    <div style={{
                      width: '36px',
                      height: `${Math.max(8, (strengthCount(s) / total) * 100)}px`,
                      borderRadius: '4px 4px 0 0',
                      background: s === 'strong' ? '#16a34a' : s === 'medium' ? '#ca8a04' : '#dc2626'
                    }}></div>
                    <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'capitalize' }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <div style={{ position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '400px', margin: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: '0', fontSize: '18px', fontWeight: '500' }}>Create User</h2>
              <span onClick={() => setShowCreateUser(false)} style={{ cursor: 'pointer', color: '#9ca3af', fontSize: '22px' }}>×</span>
            </div>
            {['name', 'contact', 'username', 'email'].map(field => (
              <input
                key={field}
                style={inputStyle}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={newUser[field as keyof typeof newUser]}
                onChange={e => setNewUser({ ...newUser, [field]: e.target.value })}
              />
            ))}
            <input
              style={{ ...inputStyle, marginBottom: '1.5rem' }}
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={e => setNewUser({ ...newUser, password: e.target.value })}
            />
            <button
              onClick={handleCreateUser}
              style={{ width: '100%', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
            >
              Create User
            </button>
          </div>
        </div>
      )}

    </div>
  )
}