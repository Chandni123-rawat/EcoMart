import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import { liveRefresh, socketOrigin } from './api'

export function LiveNotices({ studentId }) {
  const [notices, setNotices] = useState([])
  useEffect(() => {
    if (!studentId) return
    const socket = io(socketOrigin, { auth: { student: studentId } })
    const refreshRequests = () => liveRefresh.dispatchEvent(new Event('requests'))
    const refreshListings = () => liveRefresh.dispatchEvent(new Event('listings'))
    socket.on('connect', () => {
      refreshRequests()
      refreshListings()
    })
    socket.on('requests:changed', refreshRequests)
    socket.on('listings:changed', refreshListings)
    socket.on('requests:notice', notice => {
      setNotices(current => [...current.filter(item => item.requestId !== notice.requestId), notice].slice(-3))
    })
    return () => socket.disconnect()
  }, [studentId])

  return <div className="shell live-notices" aria-live="polite">
    {notices.map(notice => <div className="notice live-notice" key={notice.requestId}>
      <Bell size={17} aria-hidden="true" />
      <span>{notice.message}</span>
      <Link to="/activity">View activity</Link>
      <button type="button" aria-label="Dismiss notification" onClick={() => setNotices(current => current.filter(item => item.requestId !== notice.requestId))}><X size={18} /></button>
    </div>)}
  </div>
}
