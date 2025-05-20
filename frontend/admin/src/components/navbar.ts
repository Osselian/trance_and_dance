
export function renderNavbar() {
  const header = document.getElementById('navbar')!;
  const token  = localStorage.getItem('token');

  if (token) {
    // пользователь залогинен
    header.innerHTML = `
      <nav class="flex items-center justify-between p-4 bg-gray-800 text-white">
        <a href="#/" class="text-xl font-bold">PONG</a>
        <div class="space-x-4">
          <a href="#/profile" class="hover:text-teal-400">Profile</a>
          <button id="logout-btn" class="hover:text-red-400">Logout</button>
        </div>
      </nav>
    `;
    // вешаем слушатель только когда кнопка реально есть
    document.getElementById('logout-btn')!.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth-changed'));
      location.hash = '#/login';
    });

  } else {
    // пользователь не залогинен
    header.innerHTML = `
      <nav class="flex items-center justify-between p-4 bg-gray-800 text-white">
        <a href="#/" class="text-xl font-bold">PONG</a>
        <div class="space-x-4">
          <a href="#/login"    class="hover:text-teal-400">Sign in</a>
          <a href="#/register" class="hover:text-teal-400">Sign up</a>
        </div>
      </nav>
    `;
  }
}