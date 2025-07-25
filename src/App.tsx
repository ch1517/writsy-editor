import { useState } from 'react'
import './App.css'
import { TextEditor } from '@/components/TextEditor'

  function App() {
    const [html, setHtml] = useState('')

  return (
    <>
      <TextEditor html={html} onHtmlChange={setHtml} />
    </>
  )
}

export default App
