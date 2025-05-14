export const BASE = import.meta.env.VITE_API_URL ?? 'https://localhost:3000'

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

export interface Profile {
  username: string;
  email:    string;
  avatarUrl:string;
}

export const AuthAPI = {

  async register(data: RegisterData) {
    const resp = await post<{ accessToken:string }>('/register', data);
    localStorage.setItem('token', resp.accessToken);
    return resp;
  },
  async login(data: LoginData) {
    const resp = await post<{ accessToken:string }>('/login', data);
    localStorage.setItem('token', resp.accessToken);
    return resp;
  },
  // register: (data: { email: string; username: string; password: string }) =>
  //   post<{ accessToken: string }>('/register', data),

  // login: (data: { email: string; password: string }) =>
  //   post<{ accessToken: string }>('/login', data),

  refresh: () => post<{ accessToken: string }>('/refresh-token'),
  logout:  () => post<{ message: string }>('/logout'),

  getProfile: () =>
      // Теперь указываем, что get вернёт именно Profile
      get<Profile>('/user/profile'),

    updateProfile: (data: {
      username: string
      email:    string
      password?: string
      avatarUrl?: string
    }) =>
      // И put вернёт обновлённый Profile
      put<Profile>('/user/profile', data),

    uploadAvatar: (file: File): Promise<string> => {
        const form = new FormData()
        form.append('avatar', file)

        return fetch(BASE + '/user/avatar', {
          method:      'POST',
          credentials: 'include',
          headers:     authHeaders(),
          body:        form,
        })
        .then(async resp => {
          if (!resp.ok) {
            const err = await resp.json()
            throw new Error(err.message || resp.status.toString())
          }
          // backend returns { message, profile }
          const data: { message: string; profile: Profile } = await resp.json()
          return data.profile.avatarUrl
        })
      }
}
