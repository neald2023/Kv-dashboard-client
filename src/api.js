
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function api(path, opts={}){
  const token = localStorage.getItem('kv_token')
  const res = await fetch(BASE+path, {
    ...opts,
    headers: {
      'Content-Type':'application/json',
      ...(opts.headers||{}),
      'x-token': token || ''
    }
  })
  if (!res.ok){
    const data = await res.json().catch(()=>({}))
    throw new Error(data.error || 'Request failed')
  }
  return res.json()
}
