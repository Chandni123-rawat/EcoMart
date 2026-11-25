import { useCallback, useEffect, useState } from 'react'

const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export const socketOrigin = new URL(base, window.location.href).origin
export const liveRefresh = new EventTarget()

export async function api(path, { user, body, method = 'GET', signal } = {}) {
  const multipart = body instanceof FormData
  const response = await fetch(base + path, {
    method, signal,
    headers: { ...(user && { 'X-Demo-User': user }), ...(body && !multipart && { 'Content-Type': 'application/json' }) },
    body: multipart ? body : body ? JSON.stringify(body) : undefined
  })
  if (response.status === 204) return
  const data = await response.json().catch(() => null)
  if (!response.ok || data === null) throw new Error(data?.error || 'The marketplace is temporarily unavailable.')
  return data
}

export function imageUrl(url) {
  if (!url?.startsWith('/uploads/') || !base.startsWith('http')) return url
  return new URL(url, base).href
}

export function useData(path, user) {
  const [state, setState] = useState({})
  const [revision, setRevision] = useState(0)
  const [liveRevision, setLiveRevision] = useState(0)
  const key = JSON.stringify([path, user, revision])
  useEffect(() => {
    const topic = path?.match(/^\/(requests|listings)(?:[/?]|$)/)?.[1]
    if (!topic) return
    const refresh = () => setLiveRevision(value => value + 1)
    liveRefresh.addEventListener(topic, refresh)
    return () => liveRefresh.removeEventListener(topic, refresh)
  }, [path])
  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    api(path, { user, signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setState({ key, data })
    }).catch(error => {
      if (!controller.signal.aborted) setState({ key, error: error.message })
    })
    return () => controller.abort()
  }, [path, user, key, liveRevision])
  const retry = useCallback(() => setRevision(value => value + 1), [])
  return { ...(state.key === key ? state : {}), loading: Boolean(path && state.key !== key), retry }
}

export const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(value)
export const conditions = { LIKE_NEW: 'Like new', GOOD: 'Good', FAIR: 'Fair' }
export const label = value => value.charAt(0) + value.slice(1).toLowerCase()
