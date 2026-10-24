import { useState } from 'react'
import { startInterview, sendAnswer } from '../api'

const TYPE_LABEL = { technical: 'Technical', behavioral: 'Behavioral', project: 'Project' }

function Score({ label, value }) {
  return (
    <div className="text-center bg-gray-50 rounded p-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-bold">{value}/10</p>
    </div>
  )
}

export default function Interview({ resume, analysis }) {
  const [sessionId, setSessionId] = useState(null)
  const [question, setQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [nextQuestion, setNextQuestion] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function reset() {
    setSessionId(null); setQuestion(null); setAnswer('')
    setEvaluation(null); setNextQuestion(null); setResult(null); setError('')
  }

  async function start() {
    setLoading(true)
    setError('')
    try {
      const data = await startInterview({
        resume_text: resume.text,
        resume_skills: resume.skills,
        jd_skills: analysis.jd_skills,
        missing_skills: analysis.missing_skills,
        analysis_id: analysis.analysis_id,
      })
      setSessionId(data.session_id)
      setQuestion(data.question)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function submit() {
    setLoading(true)
    setError('')
    try {
      const data = await sendAnswer(sessionId, answer)
      setEvaluation(data.evaluation)
      setNextQuestion(data.next_question)
      setResult(data.result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function goNext() {
    setQuestion(nextQuestion)
    setNextQuestion(null)
    setEvaluation(null)
    setAnswer('')
  }

  if (!sessionId) {
    return (
      <div className="bg-white rounded-lg border p-6 space-y-3">
        <h2 className="text-xl font-semibold">Adaptive mock interview</h2>
        <p className="text-sm text-gray-600">
          5 questions based on your resume and this job. Each next question adapts to how well you answered.
        </p>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button onClick={start} disabled={loading} className="bg-indigo-600 text-white px-5 py-2 rounded disabled:opacity-50">
          {loading ? 'Preparing your first question...' : 'Start interview'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {question && (
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500">
            Question {question.number} of {question.total} · {TYPE_LABEL[question.type]}
          </p>
          <div className="h-2 bg-gray-200 rounded mt-2">
            <div className="h-2 bg-indigo-600 rounded" style={{ width: `${(question.number / question.total) * 100}%` }} />
          </div>
          <p className="font-medium mt-3">{question.text}</p>

          {!evaluation && (
            <>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={6}
                className="w-full border rounded p-2 text-sm mt-3"
                placeholder="Type your answer here..."
              />
              {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
              <button
                onClick={submit}
                disabled={loading || answer.trim().length < 5}
                className="mt-2 bg-indigo-600 text-white px-5 py-2 rounded disabled:opacity-50"
              >
                {loading ? 'Evaluating...' : 'Submit answer'}
              </button>
            </>
          )}
        </div>
      )}

      {evaluation && (
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <h3 className="font-semibold">Feedback · overall {evaluation.overall}/10</h3>
          <div className="grid grid-cols-4 gap-2">
            <Score label="Relevance" value={evaluation.relevance} />
            <Score label="Completeness" value={evaluation.completeness} />
            <Score label="Clarity" value={evaluation.clarity} />
            <Score label="Technical" value={evaluation.technical} />
          </div>
          <p className="text-sm">{evaluation.feedback}</p>
          <div className="bg-indigo-50 rounded p-3">
            <p className="text-xs font-semibold text-indigo-700">Suggested stronger answer</p>
            <p className="text-sm mt-1">{evaluation.improved_answer}</p>
          </div>
          {nextQuestion && (
            <button onClick={goNext} className="bg-indigo-600 text-white px-5 py-2 rounded">
              Next question
            </button>
          )}
        </div>
      )}

      {result && (
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <h3 className="text-xl font-semibold">Interview complete: {result.average_score}/10</h3>
          <p className="text-sm">{result.summary}</p>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <div><b>Strengths</b><ul className="list-disc pl-5">{result.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
            <div><b>To improve</b><ul className="list-disc pl-5">{result.weaknesses.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
            <div><b>Next steps</b><ul className="list-disc pl-5">{result.next_steps.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
          </div>
          <button onClick={reset} className="border px-4 py-2 rounded">Practice again</button>
        </div>
      )}
    </div>
  )
}