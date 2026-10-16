// Natív JS: semmi React, csak a globális ReactApp API használata.

const app_one = ReactApp.init({ counterDefault: 5, title: 'app_one' })
app_one.render('#app-one')

const app_two = ReactApp.init({ counterDefault: 42, title: 'app_two' })
app_two.render(document.getElementById('app-two'))

// Konzolból is elérhetők: app_one.increase(), app_two.getState() stb.
const apps = { app_one, app_two }
Object.assign(window, apps)

document.querySelectorAll('[data-app]').forEach((panel) => {
  const name = panel.dataset.app
  const app = apps[name]
  const input = panel.querySelector('input')
  const stateOutput = panel.querySelector('[data-state]')

  const showState = () => {
    stateOutput.textContent = `${name}.getState() → ${JSON.stringify(app.getState())}`
  }

  panel.addEventListener('click', (event) => {
    const action = event.target.closest('button')?.dataset.action
    switch (action) {
      case 'increase':
        app.increase()
        break
      case 'decrease':
        app.decrease()
        break
      case 'set':
        app.setCounter(Number(input.value))
        break
      case 'log':
        console.log(`${name}.getState()`, app.getState())
        break
    }
  })

  // A React-en belüli kattintások is ide futnak be.
  app.subscribe(showState)
  showState()
})
