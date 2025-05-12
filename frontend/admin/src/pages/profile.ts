export const profileView = `
<section class="p-6 max-w-md space-y-4">
  <h1 class="text-3xl font-semibold">My profile</h1>

  <div class="flex flex-col md:flex-row items-start gap-8">
    <img id="avatar-img"
         src="/img/default-avatar.png"
         class="w-24 h-24 rounded-full object-cover border flex-shrink-0" />

    <table class="border border-gray-400 text-left w-full">
      <tbody>
        <tr>
          <td class="table-cell-label">Login</td>
          <td class="table-cell-input">
            <input name="login"  class="input" readonly />
          </td>
        </tr>
        <tr class="table-row-alt">
          <td class="table-cell-label">Email</td>
          <td class="table-cell-input">
            <input name="email" class="input" readonly />
          </td>
        </tr>
        <tr class="table-row-alt">
          <td class="table-cell-label">Password</td>
          <td class="table-cell-input">
            <input name="password"
                   type="password"
                   class="input"
                   placeholder="••••••"
                   readonly />
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="flex gap-4">
    <button id="edit-btn"   class="btn-primary w-24">Edit</button>
    <button id="save-btn"   class="btn-primary w-24 hidden">Save</button>
    <button id="cancel-btn" class="btn-secondary w-24 hidden">Cancel</button>
  </div>

  <span id="status" class="text-sm text-gray-500"></span>
</section>

`

import { AuthAPI } from '../api/auth'

export async function profileInit() {

  /* --- берём ссылки на DOM-элементы после того, как шаблон уже вставлен --- */
  const loginEl  = document.querySelector<HTMLInputElement>('input[name="login"]')!
  const emailEl  = document.querySelector<HTMLInputElement>('input[name="email"]')!
  const passEl   = document.querySelector<HTMLInputElement>('input[name="password"]')!
  const statusEl = document.getElementById('status')!

  /* ---------- внутренняя функция: грузит профиль и заполняет поля ---------- */
  async function loadProfile() {
    const p = await AuthAPI.getProfile()        // GET /profile
    loginEl.value = p.username                  // логин
    emailEl.value = p.email                     // e-mail
    passEl.value  = '';                          // пароль не показываем
    (document.getElementById('avatar-img') as HTMLImageElement).src =
      p.avatarUrl ?? '/img/default-avatar.png'  // аватар или дефолт
  }

  /* ---------- ПЕРВЫЙ вызов сразу после вставки страницы ---------- */
  try {
    await loadProfile()
  } catch (err: any) {
    if (err.message.includes('401') || err.message.includes('Unauthorized')) {
      location.hash = '#/login'
    }
    return
  }

  /* … здесь можно добавлять обработчики Edit / Save / Cancel, uploadAvatar и т.п. … */
}