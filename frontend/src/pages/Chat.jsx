import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Send, Bot, User, Loader2, Sparkles, Trash2, Compass, 
  UtensilsCrossed, Hotel, MapPin, ArrowRight, CornerDownLeft
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { postApi } from '../hooks/useApi'

const SUGGESTIONS = [
  { text: 'Biển Hồ T\'Nưng có gì đẹp?' },
  { text: 'Món ăn đặc sản nào nên thử ở Pleiku?' },
  { text: 'Gợi ý lịch trình 3 ngày 2 đêm ở Gia Lai' },
  { text: 'Khách sạn homestay nào gần trung tâm?' },
  { text: 'Núi lửa Chư Đang Ya mùa nào đẹp nhất?' }
]

function renderFormattedText(content) {
  const lines = content.split('\n')
  return lines.map((line, idx) => {
    // Process **bold**
    const parts = line.split(/(\*\*.*?\*\*)/g)
    const formattedParts = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} className="text-[#246B4A] font-bold">{part.slice(2, -2)}</strong>
      }
      return part
    })

    return (
      <div key={idx} className={line.trim() ? 'mb-1.5' : 'h-2'}>
        {formattedParts}
      </div>
    )
  })
}

export default function Chat() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('gialai_chat_history')
      return saved ? JSON.parse(saved) : [
        {
          role: 'bot',
          content: 'Xin chào! Tôi là Cố vấn Du lịch Số Gia Lai vận hành trên Đồ thị Tri thức GraphRAG. Hãy hỏi tôi về danh thắng, ẩm thực đặc sản, lưu trú hay gợi ý lịch trình nhé! 🏔️✨'
        }
      ]
    } catch {
      return [
        {
          role: 'bot',
          content: 'Xin chào! Tôi là Cố vấn Du lịch Số Gia Lai vận hành trên Đồ thị Tri thức GraphRAG. Hãy hỏi tôi về danh thắng, ẩm thực đặc sản, lưu trú hay gợi ý lịch trình nhé! 🏔️✨'
        }
      ]
    }
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem('gialai_chat_history', JSON.stringify(messages))
    } catch (e) {
      console.warn('Could not persist chat history:', e)
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim()
    if (!text || loading) return

    setInput('')
    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await postApi('/chat', { message: text })
      setMessages([
        ...newMessages,
        { 
          role: 'bot', 
          content: res.answer || res.reply || 'Xin lỗi, tôi chưa tìm thấy dữ liệu phù hợp trong đồ thị tri thức.',
          sources: res.sources || []
        }
      ])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages([
        ...newMessages,
        { 
          role: 'bot', 
          content: 'Không thể kết nối đến máy chủ GraphRAG lúc này. Vui lòng kiểm tra kết nối mạng.' 
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleClearChat = () => {
    const defaultMsg = [
      {
        role: 'bot',
        content: 'Đã làm mới cuộc hội thoại. Hãy hỏi tôi bất cứ điều gì bạn muốn khám phá tại Gia Lai nhé! 🌿'
      }
    ]
    setMessages(defaultMsg)
    try {
      localStorage.setItem('gialai_chat_history', JSON.stringify(defaultMsg))
    } catch (e) {
      console.warn('Could not clear chat:', e)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] pb-24 text-[#1A1D1A]">
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-68px)]">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-[#FAFAF7]/95 backdrop-blur-md px-4 py-3 border-b border-[#E8EBE5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#246B4A] flex items-center justify-center text-white shadow-xs">
              <Bot size={22} />
            </div>
            <div>
              <h1 className="font-editorial text-lg font-bold text-[#1A1D1A]">
                Trợ lý Du lịch GraphRAG
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-[#246B4A] font-semibold">
                <Sparkles size={12} />
                <span>Truy vấn Đồ thị Tri thức Neo4j</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleClearChat}
            className="p-2 rounded-full text-[#8A948C] hover:text-[#C26D38] hover:bg-[#FAFAF7] active:scale-95 transition-all"
            title="Làm mới cuộc trò chuyện"
          >
            <Trash2 size={18} />
          </button>
        </header>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs shadow-xs ${
                msg.role === 'user' 
                  ? 'bg-[#1A1D1A] text-white' 
                  : 'bg-[#246B4A] text-white'
              }`}>
                {msg.role === 'user' ? <User size={15} /> : <Bot size={15} />}
              </div>

              {/* Bubble Body */}
              <div className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                msg.role === 'user'
                  ? 'bg-[#246B4A] text-white rounded-tr-none'
                  : 'bg-white border border-[#E8EBE5] text-[#1A1D1A] rounded-tl-none'
              }`}>
                {renderFormattedText(msg.content)}

                {/* Citation/Sources Pill */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#E8EBE5] flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-[#8A948C] font-semibold uppercase tracking-wider">
                      Nguồn đồ thị:
                    </span>
                    {msg.sources.map((src, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded-full bg-[#EAF3EB] text-[#246B4A] text-[10px] font-semibold border border-[#246B4A]/20"
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {loading && (
            <div className="flex gap-2.5 items-center">
              <div className="w-8 h-8 rounded-full bg-[#246B4A] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot size={15} />
              </div>
              <div className="bg-white border border-[#E8EBE5] rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 text-xs text-[#5A635B] shadow-xs">
                <Loader2 size={15} className="animate-spin text-[#246B4A]" />
                <span>Đang truy vấn GraphRAG &amp; đồ thị tri thức...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick Suggestions Bar */}
        <div className="px-4 py-2 border-t border-[#E8EBE5] bg-[#FAFAF7]">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s.text)}
                className="shrink-0 px-3 py-1.5 rounded-full bg-white border border-[#E8EBE5] text-[#5A635B] hover:text-[#246B4A] hover:border-[#246B4A] text-xs font-medium shadow-xs active:scale-95 transition-all"
              >
                {s.text}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#FAFAF7] border-t border-[#E8EBE5]/60">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2"
          >
            <div className="flex-1 h-12 bg-white rounded-full border border-[#E8EBE5] px-4 flex items-center gap-2 shadow-xs focus-within:border-[#246B4A] focus-within:ring-2 focus-within:ring-[#246B4A]/10 transition-all">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Hỏi bất kỳ điều gì về du lịch Gia Lai..."
                className="flex-1 bg-transparent border-none text-xs sm:text-sm text-[#1A1D1A] placeholder:text-[#8A948C] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xs shrink-0 ${
                input.trim() && !loading
                  ? 'bg-[#246B4A] text-white hover:bg-[#1E573C] active:scale-95'
                  : 'bg-[#E8EBE5] text-[#8A948C] cursor-not-allowed'
              }`}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
