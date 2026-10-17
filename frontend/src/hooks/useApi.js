/**
 * useApi — Custom hook for API calls interacting directly with live backend endpoints.
 * Zero mock data in production runtime path.
 */
import { useState, useEffect, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

export function useApi(endpoint, options = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { immediate = true, params = {} } = options

  const fetchData = useCallback(async (overrideParams) => {
    setLoading(true)
    setError(null)
    const effectiveParams = overrideParams || params
    try {
      const queryParams = new URLSearchParams(effectiveParams)
      const qs = queryParams.toString()
      const url = `${API_BASE}${endpoint}${qs ? '?' + qs : ''}`
      const res = await fetch(url)
      if (!res.ok) {
        let errDetail = `HTTP ${res.status}: ${res.statusText || 'Lỗi máy chủ'}`
        try {
          const errJson = await res.json()
          if (errJson.detail) errDetail = errJson.detail
        } catch {}
        throw new Error(errDetail)
      }
      const json = await res.json()
      setData(json)
      return json
    } catch (err) {
      setData(null)
      setError(err.message || 'Không thể kết nối đến máy chủ backend')
      return null
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    if (immediate) fetchData()
  }, [endpoint])

  return { data, loading, error, isFallback: false, refetch: fetchData }
}

export async function getApi(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`)
  if (!res.ok) {
    let errDetail = `HTTP ${res.status}: ${res.statusText || 'Lỗi tải dữ liệu'}`
    try {
      const errJson = await res.json()
      if (errJson.detail) errDetail = errJson.detail
    } catch {}
    throw new Error(errDetail)
  }
  return await res.json()
}

export async function postApi(endpoint, body) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let errDetail = `HTTP ${res.status}: ${res.statusText || 'Lỗi yêu cầu'}`
    try {
      const errJson = await res.json()
      if (errJson.detail) errDetail = errJson.detail
    } catch {}
    throw new Error(errDetail)
  }
  return await res.json()
}
