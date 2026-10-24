import { useState } from 'react'
import { uploadResume, analyzeJD } from '../api'

function Chips({ items, style }) {
  if (!items?.length) return <p className="text-sm text-gray-500">None</p>
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((s) => (
        <span key={s} className={`px-2 py-1 rounded-full text-sm ${style}`}>
          {s}
        </span>
      ))}
    </div>
  )
}

function Card({ title, children }) {
  return (
    <section className="bg-white rounded-lg border p-4">
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
    </section>
  )
}

export default function Analyze({ onDone, analysis }) {
  const [file, setFile] = useState(null)
  const [jd, setJd] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    setError('')
    if (!file) return setError('Please choose a PDF or DOCX resume.')
    if (jd.trim().length < 30) return setError('Please paste a longer job description (at least 30 characters).')
    setLoading(true)
    try {
      const resumeData = await uploadResume(file)
      const result = await analyzeJD({
        text: jd,
        resume_skills: resumeData.skills,
        resume_text: resumeData.text,
        resume_filename: resumeData.filename,
      })
      onDone(resumeData, result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const details = analysis?.jd_details

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div>
          <label className="block font-medium mb-1">1. Upload your resume (PDF or DOCX, max 5 MB)</label>
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => setFile(e.target.files[0] || null)}
            className="block w-full text-sm"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">2. Paste the job description</label>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={8}
            className="w-full border rounded p-2 text-sm"
            placeholder="Paste the full job description here..."
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-indigo-600 text-white px-5 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Analyzing... (this can take 10-30 seconds)' : 'Analyze'}
        </button>
      </div>

      {analysis && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card title="ATS-style score (estimate)">
              <p className="text-4xl font-bold text-indigo-600">{analysis.ats_score}/100</p>
              <div className="h-3 bg-gray-200 rounded mt-2">
                <div className="h-3 bg-indigo-600 rounded" style={{ width: `${Math.min(100, analysis.ats_score)}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-3">{analysis.ats_details.formula}</p>
              <p className="text-xs text-gray-500 mt-1">{analysis.ats_details.disclaimer}</p>
            </Card>
            <Card title="Skill match">
              <p className="text-4xl font-bold text-green-600">{analysis.match_percentage}%</p>
              <div className="h-3 bg-gray-200 rounded mt-2">
                <div className="h-3 bg-green-600 rounded" style={{ width: `${analysis.match_percentage}%` }} />
              </div>
              <p className="text-sm text-gray-600 mt-3">
                {analysis.matched_skills.length} of {analysis.jd_skills.length} required skills found in your resume.
              </p>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Card title="Matched skills">
              <Chips items={analysis.matched_skills} style="bg-green-100 text-green-800" />
            </Card>
            <Card title="Missing skills">
              <Chips items={analysis.missing_skills} style="bg-red-100 text-red-800" />
            </Card>
            <Card title="Additional skills">
              <Chips items={analysis.additional_skills} style="bg-gray-100 text-gray-700" />
            </Card>
          </div>

          {details && (details.job_title || details.experience_required || details.qualifications.length > 0) && (
            <Card title="What the job asks for">
              {details.job_title && <p className="text-sm"><b>Role:</b> {details.job_title}</p>}
              {details.experience_required && <p className="text-sm"><b>Experience:</b> {details.experience_required}</p>}
              {details.qualifications.length > 0 && (
                <p className="text-sm"><b>Qualifications:</b> {details.qualifications.join(', ')}</p>
              )}
              <div className="mt-2">
                <Chips items={details.keywords} style="bg-indigo-50 text-indigo-700" />
              </div>
            </Card>
          )}

          {details?.suggestions.length > 0 && (
            <Card title="How to improve your resume for this job">
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {details.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </Card>
          )}

          <p className="text-sm text-gray-600">Next: open the Learning Roadmap or Mock Interview tab above.</p>
        </div>
      )}
    </div>
  )
}