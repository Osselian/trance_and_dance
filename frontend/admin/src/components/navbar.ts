export function renderNavbar() {
  const header = document.getElementById('navbar')!;
  const token  = localStorage.getItem('token');

  if (token) {
    header.innerHTML = `
      <nav class="flex items-center justify-between p-4 bg-gray-800 text-white">
        <a href="#/" class="text-xl font-bold">PONG</a>
        <div class="space-x-4">
          <a href="#/profile" class="hover:text-teal-400">Profile</a>
          <a href="#/friends" class="hover:text-teal-400">Friends</a>
          <a href="#/chat"    class="hover:text-teal-400">Chat</a>
          <button id="logout-btn" class="hover:text-red-400">Logout</button>
        </div>
      </nav>
    `;
    document.getElementById('logout-btn')!.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth-changed'));
      location.hash = '#/login';
    });

  } else {
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