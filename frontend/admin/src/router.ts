// import { home }     from './pages/home'
import { registerView, registerInit }  from './pages/register'
import { profileView, profileInit }    from './pages/profile'

type Route = { view: string; init?: () => void }

const routes: Record<string, Route> = {
  '#/register': { view: registerView, init: registerInit },
  '#/profile': { view: profileView, init: profileInit },
}

function mountRoute() {
  const outlet = document.getElementById('outlet')!
  const route  = routes[location.hash] ?? { view: '<h1>404</h1>' }

  outlet.innerHTML = route.view
  route.init?.()
}

export function initRouter() {
  window.addEventListener('hashchange', mountRoute)
  mountRoute()
}