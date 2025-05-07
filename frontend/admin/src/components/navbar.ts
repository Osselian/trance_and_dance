export function renderNavbar() {
  const header = document.getElementById('navbar')!
  header.innerHTML = `
    <nav class="flex items-center justify-between p-4 bg-gray-800 text-white">
      <a href="#/" class="text-xl font-bold">PONG</a>
      <div class="space-x-4">
        <a href="#/login"     class="hover:text-teal-400">Sign in</a>
        <a href="#/register"  class="hover:text-teal-400">Sign up</a>
      </div>
    </nav>
  `
}