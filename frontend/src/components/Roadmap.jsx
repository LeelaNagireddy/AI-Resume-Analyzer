import { useState } from 'react'
import { createRoadmap, saveProgress } from '../api'

const PRIORITY_STYLE = {
  High: 'bg-red-100 text-red-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-green-100 text-green-800',
}

export default function Roadmap({ analysis, resume, roadmap, setRoadmap }) {
  const [weeks, setWeeks] = useState(4)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    setLoading(true)
    setError('')
    try {
      const data = await createRoadmap({
        missing_skills: analysis.missing_skills,
        resume_skills: resume.skills,
        job_title: analysis.jd_details?.job_title || '',
        weeks,
        analysis_id: analysis.analysis_id,
      })
      setRoadmap(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function toggle(key) {
    const done = roadmap.completed_tasks.includes(key)
      ? roadmap.completed_tasks.filter((k) => k !== key)
      : [...roadmap.completed_tasks, key]
    setRoadmap({ ...roadmap, completed_tasks: done })
    if (roadmap.roadmap_id) {
      try {
        await saveProgress(roadmap.roadmap_id, done)
      } catch (e) {
        setError(`Progress not saved: ${e.message}`)
      }
    }
  }

  const totalTasks = roadmap ? roadmap.items.reduce((n, i) => n + i.tasks.length, 0) : 0
  const percent = totalTasks ? Math.round((roadmap.completed_tasks.length / totalTasks) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border p-4 flex flex-wrap items-center gap-3">
        <p className="text-sm">
          Missing skills: <b>{analysis.missing_skills.join(', ') || 'none'}</b>
        </p>
        <label className="text-sm ml-auto">
          Weeks:{' '}
          <select value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className="border rounded p-1">
            {[2, 4, 6, 8, 12].map((w) => <option key={w}>{w}</option>)}
          </select>
        </label>
        <button onClick={generate} disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? 'Creating...' : roadmap ? 'Regenerate roadmap' : 'Generate roadmap'}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {roadmap && (
        <>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm">{roadmap.summary}</p>
            {totalTasks > 0 && (
              <>
                <div className="h-3 bg-gray-200 rounded mt-3">
                  <div className="h-3 bg-green-600 rounded" style={{ width: `${percent}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{percent}% of tasks completed</p>
              </>
            )}
          </div>

          {roadmap.items.map((item, i) => (
            <div key={i} className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{i + 1}. {item.skill}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_STYLE[item.priority]}`}>
                  {item.priority} priority
                </span>
                <span className="text-xs text-gray-500">Week {item.week}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{item.why}</p>
              <ul className="mt-2 space-y-1">
                {item.tasks.map((task, j) => {
                  const key = `${i}-${j}`
                  return (
                    <li key={key} className="text-sm">
                      <label className="flex gap-2 items-start">
                        <input type="checkbox" checked={roadmap.completed_tasks.includes(key)} onChange={() => toggle(key)} className="mt-1" />
                        <span>{task}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
              <p className="text-sm mt-2"><b>Milestone:</b> {item.milestone}</p>
            </div>
          ))}
        </>
      )}
    </div>
  )
}