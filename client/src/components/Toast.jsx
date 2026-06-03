// Lightweight toast notification system
import { useState, useEffect, useCallback } from 'react'

let toastId = 0
let addToastFn = null

// Global function any component can call: showToast('message', 'error')
export function showToast(message, type = 'info', duration = 4000) {
  if (addToastFn) addToastFn({ id: ++toastId, message, type, duration })
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    setToasts(prev => [...prev, toast])
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === toast.id ? { ...t, exiting: true } : t))
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, 300)
    }, toast.duration)
  }, [])

  useEffect(() => {
    addToastFn = addToast
    return () => { addToastFn = null }
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type} ${t.exiting ? 'toast-exit' : ''}`}>
          <span>{t.type === 'error' ? '⚠️' : 'ℹ️'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
