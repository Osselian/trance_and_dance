export const profileView = `
<section class="p-6 max-w-md space-y-4">
  <h1 class="text-3xl font-semibold">My profile</h1>

  <div class="flex flex-col md:flex-row items-start gap-8">
    <div class="relative w-24 h-24 rounded-full overflow-hidden border flex-shrink-0">
      <img
        id="avatar-img"
        src="/img/default-avatar.jpg"
        onerror="this.onerror=null;this.src='/img/default-avatar.jpg'"
        class="w-full h-full object-cover"
      />
      <input
        id="avatar-input"
        type="file"
        accept="image/*"
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer hidden"
      />
    </div>

    <table class="border border-gray-400 text-left w-full">
      <tbody>
        <tr>
          <td class="table-cell-label">Login</td>
          <td class="table-cell-input">
            <input name="login" class="input" readonly />
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
            <input
              name="password"
              type="password"
              class="input"
              placeholder="••••••"
              readonly
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="flex gap-4">
    <button id="edit-btn"   type="button" class="btn-primary w-24">Edit</button>
    <button id="save-btn"   type="button" class="btn-primary w-24 hidden">Save</button>
    <button id="cancel-btn" type="button" class="btn-secondary w-24 hidden">Cancel</button>
  </div>

  <span id="status" class="text-sm text-gray-500"></span>
</section>
`;

import { AuthAPI } from '../api/auth';
import type { Profile } from '../api/auth';
import { BASE } from '../api/auth'

export async function profileInit() {

  /* --- берём ссылки на DOM-элементы после того, как шаблон уже вставлен --- */
  const loginEl  = document.querySelector<HTMLInputElement>('input[name="login"]')!
  const emailEl  = document.querySelector<HTMLInputElement>('input[name="email"]')!
  const passEl   = document.querySelector<HTMLInputElement>('input[name="password"]')!
  const statusEl = document.getElementById('status')!
  const editBtn    = document.getElementById('edit-btn')! as HTMLButtonElement;
  const saveBtn    = document.getElementById('save-btn')! as HTMLButtonElement;
  const cancelBtn  = document.getElementById('cancel-btn')! as HTMLButtonElement;
  const avatarImg  = document.getElementById('avatar-img')! as HTMLImageElement;
  const avatarInput = document.getElementById('avatar-input')! as HTMLInputElement;

  let original: Profile;
  let newAvatarFile: File | null = null;

  async function loadProfile() {
    const p = await AuthAPI.getProfile()        // GET /profile
    original = p;
    loginEl.value = p.username                  // логин
    emailEl.value = p.email                     // e-mail
    passEl.value  = '';                          // пароль не показываем
    // avatarImg.src = p.avatarUrl;
    const url = p.avatarUrl.startsWith('http')
      ? p.avatarUrl
      : BASE + p.avatarUrl

    avatarImg.src = url
    newAvatarFile  = null;
  }

  function setEditing(enabled:boolean) {
    [loginEl, emailEl, passEl].forEach(el => {
      if (enabled) el.removeAttribute('readonly');
      else el.setAttribute('readonly', 'true');
    });
    editBtn.classList.toggle('hidden', enabled);
    saveBtn.classList.toggle('hidden', !enabled);
    cancelBtn.classList.toggle('hidden', !enabled);
    avatarInput.classList.toggle('hidden', !enabled);
    statusEl.textContent = '';
  }

  avatarInput.addEventListener('change', () => {
    const file = avatarInput.files?.[0];
    if (!file) return;
    newAvatarFile = file;
    const reader = new FileReader();
    reader.onload = () => { avatarImg.src = reader.result as string; };
    reader.readAsDataURL(file);
  });

  editBtn.addEventListener('click', () => {
    setEditing(true);
    loginEl.focus();
  });

    cancelBtn.addEventListener('click', () => {
    loginEl.value = original.username;
    emailEl.value = original.email;
    passEl.value  = '';
    avatarImg.src = original.avatarUrl;
    setEditing(false);
  })

  saveBtn.addEventListener('click', async () => {
    try {
      let avatarUrl = original.avatarUrl;
    if (newAvatarFile) {
      const respUrl = await AuthAPI.uploadAvatar(newAvatarFile)
      avatarUrl = respUrl.startsWith('http') 
        ? respUrl 
        : BASE + respUrl
    }
      // if (newAvatarFile) {
      //   const resp = await AuthAPI.uploadAvatar(newAvatarFile);
      //   avatarUrl = resp.avatarUrl;
      // }

      const payload: { username: string; email: string; password?: string; avatarUrl: string } = {
        username: loginEl.value,
        email:    emailEl.value,
        avatarUrl,
      };
      if (passEl.value.trim()) payload.password = passEl.value;

      const updated = await AuthAPI.updateProfile(payload);
      original = updated;
      await loadProfile();
      setEditing(false);
      statusEl.textContent = 'Saved successfully!';
    } catch (err: any) {
      statusEl.textContent = 'Error saving: ' + err.message;
    }
  });

  // —————— Инициализация ——————
  try {
    await loadProfile();
    setEditing(false);
  } catch (err: any) {
    if (err.message.includes('401')) {
      location.hash = '#/login'; return;
    }
    statusEl.textContent = 'Failed to load profile';
  }
}