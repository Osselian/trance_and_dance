const BASE = import.meta.env.VITE_API_URL ?? 'https://localhost:3000'

async function post<T>(endpoint: string, body?: unknown): Promise<T> {
  const resp = await fetch(BASE + '/auth' + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!resp.ok) throw new Error((await resp.json()).message)
  return resp.json()
}

function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function get<T>(url: string): Promise<T> {
  const r = await fetch(BASE + url, {
    headers: { ...authHeaders() },
    credentials: 'include',
  })
  if (!r.ok) throw new Error((await r.json()).message)
  return r.json()
}

async function put<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(BASE + url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error((await r.json()).message)
  return r.json()
}


export const AuthAPI = {
  register: (data: { email: string; username: string; password: string }) =>
    post<{ accessToken: string }>('/register', data),

  login: (data: { email: string; password: string }) =>
    post<{ accessToken: string }>('/login', data),

  refresh: () => post<{ accessToken: string }>('/refresh-token'),
  logout:  () => post<{ message: string }>('/logout'),

  getProfile: () =>
    get<{
      id: number
      username: string
      email: string
      avatarUrl: string | null
    }>('/user/profile'),

  updateProfile: (data: { username?: string; password?: string }) =>
    put('/user/profile', data),
}
