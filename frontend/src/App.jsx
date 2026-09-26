import { useEffect, useState } from 'react'

function App() {
  const [status, setStatus] = useState('Checking backend...')

  useEffect(() => {
    fetch('http://127.0.0.1:8000/status')
      .then((response) => response.json())
      .then((data) => {
        setStatus(data.status)
      })
      .catch(() => {
        setStatus('Backend connection failed')
      })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">
          AI Resume Analyzer
        </h1>

        <p className="mt-4 text-xl">
          Backend status: <strong>{status}</strong>
        </p>
      </div>
    </div>
  )
}

export default App