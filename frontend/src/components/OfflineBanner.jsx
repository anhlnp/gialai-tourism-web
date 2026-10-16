import { useState, useEffect } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = () => {
    setIsChecking(true)
    setTimeout(() => {
      setIsOnline(navigator.onLine)
      setIsChecking(false)
    }, 1000)
  }

  if (isOnline) return null

  return (
    <div className="offline-banner" role="alert">
      <WifiOff size={16} />
      <span>Bạn đang ở chế độ ngoại tuyến. Dữ liệu đã lưu vẫn có thể xem offline.</span>
      <button
        onClick={handleRetry}
        style={{
          background: 'none',
          border: '1px solid #fca5a5',
          borderRadius: 'var(--radius-pill)',
          padding: '2px 8px',
          color: '#991b1b',
          fontSize: '11px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          cursor: 'pointer'
        }}
      >
        <RefreshCw size={11} className={isChecking ? 'spin' : ''} /> Thử lại
      </button>
    </div>
  )
}
