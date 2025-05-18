import { homeView, initHome }    from './pages/home'
import { notFoundView }    from './pages/notFound'
import { registerView, registerInit }  from './pages/register'
import { profileView, profileInit }    from './pages/profile'
import { loginView, loginInit }    from './pages/login'

type Route = { view: string; init?: () => void }

const routes: Record<string, Route> = {
  '#/': { view: homeView, init: initHome},
  '#/register': { view: registerView, init: registerInit },
  '#/profile': { view: profileView, init: profileInit },
  '#/login': { view: loginView, init: loginInit },
}

function mountRoute() {
  const outlet = document.getElementById('outlet')!
  const route  = routes[location.hash] ?? { view: notFoundView }

  outlet.innerHTML = route.view
  route.init?.()
}

export function initRouter() {
  window.addEventListener('hashchange', mountRoute)
  mountRoute()
}