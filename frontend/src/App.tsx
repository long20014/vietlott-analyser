import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [apiStatus, setApiStatus] = useState<string>('Checking...')

  useEffect(() => {
    fetch('/api')
      .then((res) => res.json())
      .then((data) => setApiStatus(data.message))
      .catch(() => setApiStatus('Backend not reachable'))
  }, [])

  return (
    <div className="App">
      <h1>Vietlott Analyser</h1>
      <p>API Status: <strong>{apiStatus}</strong></p>
    </div>
  )
}

export default App
