export const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${BASE}${path}`, options)
  } catch {
    throw new Error('Cannot reach the backend. Is it running on port 8000?')
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = data.detail
    if (typeof detail === 'string') throw new Error(detail)
    if (Array.isArray(detail) && detail[0]?.msg) throw new Error(detail[0].msg)
    throw new Error(`Request failed (${response.status})`)
  }
  return data
}

const jsonPost = (path, body, method = 'POST') =>
  request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

export const checkStatus = () => request('/status')

export function uploadResume(file) {
  const form = new FormData()
  form.append('file', file)
  return request('/upload-resume', { method: 'POST', body: form })
}

export const analyzeJD = (payload) => jsonPost('/analyze-jd', payload)
export const createRoadmap = (payload) => jsonPost('/roadmap', payload)
export const saveProgress = (id, tasks) =>
  jsonPost(`/roadmap/${id}/progress`, { completed_tasks: tasks }, 'PUT')
export const startInterview = (payload) => jsonPost('/interview/start', payload)
export const sendAnswer = (id, answer) => jsonPost(`/interview/${id}/answer`, { answer })