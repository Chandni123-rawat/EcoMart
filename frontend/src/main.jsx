import React, { lazy, Suspense, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { Plus, UserRound } from 'lucide-react'
import { useData } from './api'
import { Logo, Select } from './components/shared'
import { Button } from './components/ui/button'
import { Home, Marketplace } from './market'
import { ListingDetail, ListingForm, MyActivity } from './workflow'
import { LiveNotices } from './realtime'
import './styles.css'

const Analytics = lazy(() => import('./analytics'))

function App() {
  const users = useData('/users')
  const [student, setStudent] = useState(() => localStorage.getItem('green-demo-student') || 'aisha')
  const user = users.data?.find(person => person.id === student) || users.data?.[0]
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return <>
    <a className="skip" href="#main">Skip to content</a>
    <header className="header">
      <div className="shell nav-row">
        <Logo />
        <nav aria-label="Main navigation">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/marketplace">Marketplace</NavLink>
          <NavLink to="/activity">My Activity</NavLink>
          <NavLink to="/analytics">Analytics</NavLink>
        </nav>
        <div className="nav-actions">
          {users.error ? <button className="profile-retry" onClick={users.retry}>Retry profiles</button> : <div className="profile">
            <span className="profile-avatar" aria-hidden="true">{user ? user.name[0] : <UserRound size={14} />}</span>
            <Select aria-label="Switch demo student" value={user?.id || ''} disabled={!user} onChange={event => {
              setStudent(event.target.value)
              localStorage.setItem('green-demo-student', event.target.value)
            }}>
              {!user && <option value="">Demo student</option>}
              {users.data?.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}
            </Select>
          </div>}
          <Button asChild><Link to="/sell"><Plus size={17} /> <span>Sell an Item</span></Link></Button>
        </div>
      </div>
    </header>
    <LiveNotices key={user?.id} studentId={user?.id} />
    <main id="main">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/marketplace/:id" element={<ListingDetail key={pathname + user?.id} user={user} />} />
        <Route path="/sell" element={<ListingForm key={pathname + user?.id} user={user} />} />
        <Route path="/sell/:id" element={<ListingForm key={pathname + user?.id} user={user} />} />
        <Route path="/activity" element={<MyActivity key={user?.id} user={user} />} />
        <Route path="*" element={<div className="shell page"><h1>Page not found</h1><Button asChild><Link to="/marketplace">Browse marketplace</Link></Button></div>} />
        <Route path="/analytics" element={<Suspense fallback={<div className="shell page" role="status">Loading analytics…</div>}><Analytics /></Suspense>} />
      </Routes>
    </main>
    <footer><div className="shell footer-row"><Logo /><p>A student marketplace for a more circular campus.</p><Link to="/marketplace">Marketplace</Link></div></footer>
  </>
}

createRoot(document.getElementById('root')).render(<BrowserRouter><App /></BrowserRouter>)
