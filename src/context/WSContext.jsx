import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from './AuthContext'

const WSContext = createContext(null)

/**
 * WebSocket 连接管理器
 * - 登录后自动连接
 * - 断线自动重连（指数退避 1s → 2s → 4s → ... 最大 30s）
 * - 提供连接状态
 * - 事件回调注册机制
 */
export function WSProvider({ children }) {
  const { token, isAuthenticated } = useAuth()
  const [status, setStatus] = useState('disconnected') // 'connecting' | 'connected' | 'disconnected'
  const [onlineCount, setOnlineCount] = useState(0)
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)
  const retryCount = useRef(0)
  const listenersRef = useRef({})

  // 注册事件监听
  const on = useCallback((eventType, handler) => {
    if (!listenersRef.current[eventType]) {
      listenersRef.current[eventType] = new Set()
    }
    listenersRef.current[eventType].add(handler)
    return () => {
      listenersRef.current[eventType]?.delete(handler)
    }
  }, [])

  // 连接 WebSocket
  const connect = useCallback(() => {
    if (!token) return
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return

    setStatus('connecting')

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const host = window.location.host
    const wsUrl = `${protocol}://${host}/ws?token=${encodeURIComponent(token)}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('connected')
      retryCount.current = 0
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        // 系统消息（在线人数等）
        if (msg.type === 'connected') {
          setOnlineCount(msg.online || 0)
          return
        }
        // 触发事件监听器
        const handlers = listenersRef.current[msg.type]
        if (handlers) {
          handlers.forEach(fn => {
            try { fn(msg.payload) } catch (e) { /* ignore */ }
          })
        }
      } catch { /* ignore malformed messages */ }
    }

    ws.onclose = () => {
      setStatus('disconnected')
      wsRef.current = null

      // 指数退避重连
      const delay = Math.min(1000 * Math.pow(2, retryCount.current), 30000)
      retryCount.current++
      reconnectTimer.current = setTimeout(() => connect(), delay)
    }

    ws.onerror = () => {
      // 关闭时会触发 onclose，那里处理重连
    }
  }, [token])

  // 登录后连接，退出时断开
  useEffect(() => {
    if (isAuthenticated && token) {
      // 延迟一点点，确保 AuthProvider 稳定
      const t = setTimeout(() => connect(), 500)
      return () => clearTimeout(t)
    } else {
      // 未登录时断开
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      setStatus('disconnected')
      setOnlineCount(0)
    }
  }, [isAuthenticated, token, connect])

  // 清理
  useEffect(() => {
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  const value = { status, onlineCount, on }

  return (
    <WSContext.Provider value={value}>
      {children}
    </WSContext.Provider>
  )
}

export function useWS() {
  const ctx = useContext(WSContext)
  if (!ctx) throw new Error('useWS must be used within WSProvider')
  return ctx
}
