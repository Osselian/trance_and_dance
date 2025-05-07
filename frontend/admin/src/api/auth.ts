const API_PREFIX = '/auth' 

async function post<T>(endpoint: string, body?: unknown): Promise<T> {
  const resp = await fetch(API_PREFIX + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',          // чтобы браузер послал / получил refreshToken cookie
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!resp.ok) throw new Error((await resp.json()).message)
  return resp.json()
}

export const AuthAPI = {
  register: (data: { email: string; username: string; password: string }) =>
    post<{ accessToken: string }>('/register', data),

  login: (data: { email: string; password: string }) =>
    post<{ accessToken: string }>('/login', data),

  refresh: () => post<{ accessToken: string }>('/refresh-token'),

  logout: () => post<{ message: string }>('/logout'),
}