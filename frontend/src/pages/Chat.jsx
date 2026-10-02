import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Bot, User, Loader2, Sparkles, Trash2, Compass, Utensils, Hotel, Map } from 'lucide-react'
import { postApi } from '../hooks/useApi'

const SUGGESTIONS = [
  { icon: Compass, text: 'Núi Chư Nâm có gì đẹp?' },
  { icon: Utensils, text: 'Món ăn đặc sản nào nên thử ở Pleiku?' },
  { icon: Map, text: 'Gợi ý lộ trình 2 ngày ở Gia Lai' },
  { icon: Hotel, text: 'Khách sạn homestay nào view đẹp?' }
]

function renderFormattedText(content) {
  // Parse simple bold tags and bullets
  const lines = content.split('\n')
  return lines.map((line, idx) => {
    // Process **bold**
    const parts = line.split(/(\*\*.*?\*\*)/g)
    const formattedParts = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} style={{ color: 'var(--color-primary, #059669)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>
      }
      return part
    })

    return (
      <div key={idx} style={{ minHeight: line.trim() ? 'auto' : '8px', marginBottom: 2 }}>
        {formattedParts}
      </div>
    )
  })
}

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: 'Xin chào! Tôi là Trợ lý Du lịch Thông minh Gia Lai. Hãy hỏi tôi bất cứ điều gì về danh thắng, ẩm thực đặc sản, lưu trú hay lịch trình khám phá nhé! 🏔️✨'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim()
    if (!text || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const res = await postApi('/chat', { message: text })
      setMessages(prev => [
        ...prev,
        { role: 'bot', content: res.answer || res.reply || 'Xin lỗi, tôi không thể xử lý yêu cầu lúc này.' }
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'bot', content: 'Đã xảy ra lỗi kết nối. Vui lòng kiểm tra đường truyền hoặc thử lại sau.' }
      ])
    }
    setLoading(false)
  }

  const handleClearChat = () => {
    setMessages([
      {
        role: 'bot',
        content: 'Đã làm mới cuộc hội thoại. Hãy hỏi tôi về địa điểm, món ăn hoặc lộ trình bạn muốn khám phá nhé! 🏔️'
      }
    ])
  }

  return (
    <div className="page" style={{ paddingTop: 72 }}>
      <div className="chat-container" style={{
        maxWidth: 860,
        margin: '20px auto',
        height: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg-card, #ffffff)',
        borderRadius: 20,
        boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden'
      }}>
        {/* ── Header ── */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--color-bg-2, rgba(0,0,0,0.02))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #059669, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)'
            }}>
              <Bot size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text)' }}>
                AI Trợ lý Du lịch Gia Lai
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Sparkles size={12} />
                <span>Knowledge Graph &amp; GraphRAG</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleClearChat}
            title="Làm mới cuộc trò chuyện"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: '0.8rem',
              color: 'var(--color-text-2)',
              cursor: 'pointer'
            }}
          >
            <Trash2 size={14} /> Xóa chat
          </button>
        </div>

        {/* ── Messages List ── */}
        <div className="chat-messages" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              className={`chat-bubble ${msg.role}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
                display: 'flex',
                gap: 12,
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
              }}
            >
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: msg.role === 'user' ? '#0284c7' : 'linear-gradient(135deg, #059669, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#fff',
                marginTop: 2
              }}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={18} />}
              </div>

              <div style={{
                padding: '14px 18px',
                borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                background: msg.role === 'user' ? 'var(--color-primary, #059669)' : 'var(--color-bg-2, #f8fafc)',
                color: msg.role === 'user' ? '#ffffff' : 'var(--color-text, #1e293b)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--color-border)',
                lineHeight: 1.7,
                fontSize: '0.96rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                {renderFormattedText(msg.content)}
              </div>
            </motion.div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <Bot size={18} />
              </div>
              <div style={{
                padding: '12px 18px',
                borderRadius: '4px 18px 18px 18px',
                background: 'var(--color-bg-2)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--color-text-2)',
                fontSize: '0.92rem'
              }}>
                <Loader2 size={16} className="spin" color="var(--color-primary)" />
                <span>Trợ lý đang truy vấn dữ liệu...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Quick Suggestions Bar ── */}
        <div style={{
          padding: '8px 20px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          background: 'var(--color-bg-2, rgba(0,0,0,0.01))'
        }}>
          {SUGGESTIONS.map((s, idx) => {
            const Icon = s.icon
            return (
              <button
                key={idx}
                onClick={() => handleSend(s.text)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 9999,
                  background: 'var(--color-bg-card, #ffffff)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text, #334155)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)'
                  e.currentTarget.style.color = 'var(--color-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                  e.currentTarget.style.color = 'var(--color-text, #334155)'
                }}
              >
                <Icon size={13} color="var(--color-primary)" />
                <span>{s.text}</span>
              </button>
            )
          })}
        </div>

        {/* ── Input Bar ── */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--color-bg-card)'
        }}>
          <input
            type="text"
            placeholder="Nhập câu hỏi về điểm đến, đặc sản, khách sạn hay lịch trình..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: 12,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-2, #f8fafc)',
              color: 'var(--color-text)',
              fontSize: '0.95rem',
              outline: 'none'
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: 'var(--color-primary, #059669)',
              color: '#ffffff',
              border: 'none',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !input.trim() ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
              transition: 'transform 0.15s ease'
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
