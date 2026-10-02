import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'

export default function ImageGalleryModal({ isOpen, onClose, images = [], title = '', initialIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex, isOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && images.length > 1) {
        setCurrentIndex((prev) => (prev + 1) % images.length)
      }
      if (e.key === 'ArrowLeft' && images.length > 1) {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, images.length, onClose])

  if (!isOpen || !images || images.length === 0) return null

  const currentImg = images[currentIndex]

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(10, 15, 29, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '20px'
        }}
        onClick={onClose}
      >
        {/* Top bar */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 24,
            right: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fff',
            zIndex: 10
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f8fafc', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              {title}
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Ảnh {currentIndex + 1} / {images.length}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '50%',
              width: 42,
              height: 42,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            aria-label="Đóng"
          >
            <X size={22} />
          </button>
        </div>

        {/* Main image container */}
        <div
          style={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '75vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.img
            key={currentImg}
            src={currentImg}
            alt={`${title} - ảnh ${currentIndex + 1}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              maxWidth: '100%',
              maxHeight: '72vh',
              objectFit: 'contain',
              borderRadius: 12,
              boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/800x500/1e293b/94a3b8?text=Image+Unavailable'
            }}
          />

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
                }}
                style={{
                  position: 'absolute',
                  left: -20,
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                }}
                aria-label="Ảnh trước"
              >
                <ChevronLeft size={24} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentIndex((prev) => (prev + 1) % images.length)
                }}
                style={{
                  position: 'absolute',
                  right: -20,
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                }}
                aria-label="Ảnh sau"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail bar */}
        {images.length > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              display: 'flex',
              gap: 10,
              maxWidth: '85vw',
              overflowX: 'auto',
              padding: '8px 12px',
              background: 'rgba(15, 23, 42, 0.7)',
              backdropFilter: 'blur(10px)',
              borderRadius: 30,
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  width: 56,
                  height: 42,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: idx === currentIndex ? '2px solid #10b981' : '1px solid transparent',
                  opacity: idx === currentIndex ? 1 : 0.6,
                  transform: idx === currentIndex ? 'scale(1.08)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  padding: 0,
                  background: 'none'
                }}
              >
                <img
                  src={img}
                  alt={`thumb-${idx}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </AnimatePresence>
  )
}
