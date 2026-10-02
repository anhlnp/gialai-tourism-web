import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { postApi } from '../hooks/useApi'

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Xin chào! Tôi là trợ lý du lịch AI. Hãy hỏi tôi bất cứ điều gì về du lịch Gia Lai - Bình Định nhé! 🏔️🌊\n\nVí dụ:\n• "Gợi ý lộ trình 2 ngày ở Gia Lai"\n• "Món ăn nào nên thử ở Pleiku?"\n• "Khách sạn nào gần biển Quy Nhơn?"' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await postApi('/chat', { message: userMsg })
      setMessages(prev => [...prev, { role: 'bot', content: res.answer || 'Xin lỗi, tôi không thể trả lời lúc này.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', content: 'Đã xảy ra lỗi. Vui lòng thử lại.' }])
    }
    setLoading(false)
  }

  return (
    <div className="page" style={{ paddingTop: 72 }}>
      <div className="chat-container">
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-region-sea))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>AI Trợ lý Du lịch</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>Powered by GraphRAG + Gemini</div>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <motion.div key={i}
              className={`chat-bubble ${msg.role}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                {msg.role === 'bot' && <Bot size={16} style={{ marginTop: 2, flexShrink: 0, color: 'var(--color-primary)' }} />}
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="chat-bubble bot" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Loader2 size={16} className="spin" style={{ color: 'var(--color-primary)' }} />
              <span>Đang suy nghĩ...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="chat-input-bar">
          <input
            placeholder="Hỏi về du lịch Gia Lai - Bình Định..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()}>
            <Send size={18} />
          </button>
        </div>
      </div>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
