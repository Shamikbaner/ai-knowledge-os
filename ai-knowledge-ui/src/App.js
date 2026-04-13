import { useState, useEffect, useRef, useMemo } from 'react'
import './App.css'

function App() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)

  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem('chats')
    return saved ? JSON.parse(saved) : { 'Chat 1': [] }
  })

  const [currentChat, setCurrentChat] = useState(() => {
    return localStorage.getItem('currentChat') || 'Chat 1'
  })

  const messages = useMemo(() => {
    return chats[currentChat] || []
  }, [chats, currentChat])

  const chatRef = useRef(null)

  //SPEAK FUNCTION
  const speak = (text) => {
    const speech = new SpeechSynthesisUtterance(text)
    speech.lang = 'en-US'
    window.speechSynthesis.speak(speech)
  }

  //SAVE
  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats))
    localStorage.setItem('currentChat', currentChat)
  }, [chats, currentChat])

  //AUTO SCROLL
  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  //JARVIS[WAKE WORD MODE]
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Speech not supported')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript
      console.log('Heard:', transcript)
      if (transcript.toLowerCase().includes('jarvis')) {
        const command = transcript.toLowerCase().replace('jarvis', '').trim()
        if (command) {
          setQuery(command)
          setTimeout(()=>{
            sendQuery(command)
          },100)
        }
      }
    }

    recognition.start()
  }

  //ADD MESSAGE
  const addMessage = (msg) => {
    setChats((prev) => ({
      ...prev,
      [currentChat]: [...(prev[currentChat] || []), msg],
    }))
  }

  //RENAME CHAT
  const renameChat = (text) => {
    if (!currentChat.startsWith('Chat')) return
    const newName = text.slice(0, 20)

    setChats((prev) => {
      const updated = { ...prev }
      updated[newName] = updated[currentChat]
      delete updated[currentChat]
      return updated
    })
    setCurrentChat(newName)
  }

  //TYPING EFFECT
  const typeText = (text, callback) => {
    let i = 0
    let current = ''

    const safeText =
      typeof text === 'string' ? text : String(text || 'No response')
    const interval = setInterval(() => {
      current += safeText[i]
      i++
      callback(current)
      if (i >= safeText.length) clearInterval(interval)
    }, 10)
  }

  //SEND QUERY
  const sendQuery = async (voiceInput) => {
    const finalQuery = String(voiceInput || query || "")
    if (!finalQuery.trim()) return

    const isFirst = messages.length === 0
    addMessage({ type: 'user', text: finalQuery })
    if (isFirst) renameChat(finalQuery)
    setLoading(true)
    try {
      const res = await fetch('http://127.0.0.1:8000/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: finalQuery }),
      })

      const data = await res.json()

      const botMsg = {
        type: 'bot',
        text: '',
        sources: data.sources || [],
      }

      addMessage(botMsg)

      //SPEAK
      speak(data.answer || 'NO response')

      //TYPE EFFECT
      typeText(data.answer || 'NO response', (typed) => {
        setChats((prev) => {
          const updated = { ...prev }
          const chat = [...(updated[currentChat] || [])]

          if (chat.length > 0) {
            chat[chat.length - 1].text = typed
          }
          updated[currentChat] = chat
          return updated
        })
      })
    } catch (err) {
      console.error(err)
      addMessage({ type: 'bot', text: '❌Server Error' })
    }
    setLoading(false)
    setQuery('')
  }

  //PDF UPLOAD
  const uploadPDF = async () => {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)

    try {
      await fetch('http://127.0.0.1:8000/upload', {
        method: 'POST',
        body: formData,
      })
      addMessage({ type: 'bot', text: 'PDF uploaded successfully' })
    } catch {
      addMessage({ type: 'bot', text: '❌Upload failed' })
    }
  }

  //OCR IMAGE
  const uploadOCR = async (file) => {
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('http://127.0.0.1:8000/ocr', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      addMessage({
        type: 'bot',
        text: data.text || 'No text found',
      })
    } catch (err) {
      addMessage({ type: 'bot', text: '❌OCR FAILED' })
    }
  }

  //NEW CHAT
  const createNewChat = () => {
    const name = `Chat ${Object.keys(chats).length + 1}`
    setChats((prev) => ({ ...prev, [name]: [] }))
    setCurrentChat(name)
  }

  //DELETE CHAT
  const deleteChat = (chatName) => {
    setChats((prev) => {
      const updated = { ...prev }
      delete updated[chatName]

      const keys = Object.keys(updated)
      setCurrentChat(keys[0] || 'Chat 1')

      return updated
    })
  }

  return (
  <div className="app">

    {/* SIDEBAR */}
    <div className="sidebar">
      <button onClick={createNewChat}>➕ New Chat</button>

      {Object.keys(chats).map((chat) => (
        <div key={chat} className="chat-item">
          <span onClick={() => setCurrentChat(chat)}>{chat}</span>
          <button onClick={() => deleteChat(chat)}>❌</button>
        </div>
      ))}
    </div>

    {/* MAIN */}
    <div className="main">
      <h2>AI Knowledge OS 🤖</h2>

      {/* UPLOAD SECTION */}
      <div className="upload-box">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button onClick={uploadPDF}>
          📄 Upload PDF
        </button>

        <button onClick={() => uploadOCR(file)}>
          🧠 OCR Image
        </button>
      </div>

      {/* CHAT */}
      <div className="chat-box">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.type}`}>
            {msg.text}

            {msg.sources && msg.sources.length > 0 && (
              <div className="sources">
                <b>Sources:</b>
                {msg.sources.map((s, idx) => (
                  <div key={idx}>
                    📄 {String(s).slice(0, 40)}...
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="message bot typing">
            Thinking...
          </div>
        )}

        <div ref={chatRef} />
      </div>

      {/* INPUT */}
      <div className="input-box">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything..."
          onKeyDown={(e) => {
            if (e.key === "Enter") sendQuery()
          }}
        />

        <button onClick={startListening}>🎤</button>

        <button onClick={sendQuery}>Send</button>
      </div>
    </div>
  </div>
)
}

export default App
