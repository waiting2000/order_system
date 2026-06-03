import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

let _id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type, duration) => {
    const id = ++_id
    setToasts(prev => [...prev.slice(-4), { id, message, type }])
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const value = useCallback(() => {}, []) // dummy to force type shape
  value.error = (msg) => addToast(msg, 'error', 5000)
  value.success = (msg) => addToast(msg, 'success', 3000)
  value.info = (msg) => addToast(msg, 'info', 3000)

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null

  const config = {
    success: { bg: '#739D73', icon: '✓' },
    error:   { bg: '#C75B5B', icon: '✕' },
    info:    { bg: '#5B7FA5', icon: 'ℹ' },
  }

  return (
    <>
      <style>{`
        @keyframes toast-in {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes toast-out {
          from { transform: translateX(0);    opacity: 1; }
          to   { transform: translateX(120%); opacity: 0; }
        }
        .toast-enter  { animation: toast-in  0.3s cubic-bezier(0.21, 1.02, 0.73, 1) forwards; }
        .toast-leave  { animation: toast-out 0.25s ease-in forwards; }
      `}</style>
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col-reverse gap-2 pointer-events-none"
        style={{ maxWidth: '320px' }}
      >
        {toasts.map(t => {
          const c = config[t.type]
          return (
            <div
              key={t.id}
              className="toast-enter pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl shadow-lg"
              style={{
                background: c.bg,
                color: '#fff',
                fontSize: '13.5px',
                lineHeight: '1.5',
                boxShadow: `0 4px 16px ${c.bg}44`,
              }}
            >
              <span
                className="shrink-0 w-5 h-5 mt-px rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{ background: 'rgba(255,255,255,0.22)' }}
              >
                {c.icon}
              </span>
              <span className="flex-1 break-words">{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 opacity-50 hover:opacity-100 transition-opacity leading-none mt-0.5"
                style={{ fontSize: '16px' }}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}
