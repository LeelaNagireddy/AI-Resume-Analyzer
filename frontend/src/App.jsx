import { useEffect, useState } from 'react'
import { checkStatus } from './api'
import Analyze from './components/Analyze'
import Roadmap from './components/Roadmap'
import Interview from './components/Interview'

const TABS = [
  ['analyze', '1. Analyze Resume'],
  ['roadmap', '2. Learning Roadmap'],
  ['interview', '3. Mock Interview'],
]

function App() {
  const [tab, setTab] = useState('analyze')
  const [resume, setResume] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [roadmap, setRoadmap] = useState(null)
  const [runId, setRunId] = useState(0)
  const [backend, setBackend] = useState('checking')

  useEffect(() => {
    checkStatus()
      .then(() => setBackend('online'))
      .catch(() => setBackend('offline'))
  }, [])

  function handleDone(resumeData, analysisData) {
    setResume(resumeData)
    setAnalysis(analysisData)
    setRoadmap(null)
    setRunId((n) => n + 1)
  }

  const badge =
    backend === 'online'
      ? 'bg-green-100 text-green-700'
      : backend === 'offline'
        ? 'bg-red-100 text-red-700'
        : 'bg-gray-100 text-gray-600'

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">AI Resume Analyzer</h1>
          <span className={`text-sm px-3 py-1 rounded-full ${badge}`}>Backend: {backend}</span>
        </div>
        <nav className="max-w-5xl mx-auto px-4 flex gap-2">
          {TABS.map(([key, label]) => {
            const locked = key !== 'analyze' && !analysis
            return (
              <button
                key={key}
                disabled={locked}
                onClick={() => setTab(key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  tab === key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600'
                } ${locked ? 'opacity-40 cursor-not-allowed' : 'hover:text-indigo-600'}`}
              >
                {label}
              </button>
            )
          })}
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'analyze' && <Analyze onDone={handleDone} analysis={analysis} />}
        {tab === 'roadmap' && analysis && (
          <Roadmap analysis={analysis} resume={resume} roadmap={roadmap} setRoadmap={setRoadmap} />
        )}
        {tab === 'interview' && analysis && (
          <Interview key={runId} resume={resume} analysis={analysis} />
        )}
      </main>
    </div>
  )
}

export default App