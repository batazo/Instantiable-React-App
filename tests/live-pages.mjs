// Élő teszt a GitHub Pages oldalra: valódi egérkattintások headless böngészőben, CDP-n keresztül.
//
// Futtatás: yarn test:live
// Felülírható környezeti változók:
//   BASE_URL      – a tesztelt oldal (alapértelmezés: a GitHub Pages cím)
//   BROWSER_PATH  – Chromium-alapú böngésző (Edge/Chrome) futtatható fájlja
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BROWSER_CANDIDATES = [
  process.env.BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
]
const BROWSER = BROWSER_CANDIDATES.find((path) => path && existsSync(path))
if (!BROWSER) {
  console.error('Nem található Edge vagy Chrome. Add meg az útvonalát a BROWSER_PATH környezeti változóban.')
  process.exit(1)
}
const BASE = (process.env.BASE_URL ?? 'https://batazo.github.io/Instantiable-React-App/').replace(/\/?$/, '/')
const PORT = 9333
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const profile = mkdtempSync(join(tmpdir(), 'live-pages-'))
const browser = spawn(BROWSER, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' })

let target
for (let i = 0; i < 50 && !target; i++) {
  await wait(200)
  try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === 'page') } catch { /* még indul a böngésző */ }
}
if (!target) {
  browser.kill()
  console.error(`Nem sikerült csatlakozni a böngészőhöz a ${PORT}-es porton.`)
  process.exit(1)
}
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r))
let nextId = 1
const pending = new Map()
const consoleLines = []
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data)
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id) }
  if (msg.method === 'Runtime.consoleAPICalled') consoleLines.push(msg.params.args.map((a) => a.value ?? a.preview?.properties?.map((p) => `${p.name}:${p.value}`).join(',') ?? a.description).join(' '))
  if (msg.method === 'Runtime.exceptionThrown') consoleLines.push('EXCEPTION ' + msg.params.exceptionDetails.exception?.description)
})
const send = (method, params = {}) => new Promise((r) => { const id = nextId++; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })) })
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.result.value

async function click(selector) {
  const box = await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)
  for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 })
  await wait(150)
}
async function typeInto(selector, text) {
  await click(selector)
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).select()`)
  await send('Input.insertText', { text })
}
const value = (container) => evaluate(`document.querySelector('${container} .ra-counter__value').textContent`)
const stateText = (app) => evaluate(`document.querySelector('[data-app=${app}] [data-state]').textContent`)

let failures = 0
function check(label, actual, expected) {
  const ok = String(actual) === String(expected)
  if (!ok) failures++
  console.log(`${ok ? 'OK  ' : 'HIBA'} ${label}: ${actual}${ok ? '' : ` (várt: ${expected})`}`)
}

async function open(path) {
  await send('Page.enable'); await send('Runtime.enable')
  await send('Page.navigate', { url: BASE + path + '?t=' + Date.now() })
  for (let i = 0; i < 50; i++) { await wait(200); if (await evaluate(`!!document.querySelector('.ra-counter__value')`)) break }
  await wait(300)
}

console.log(`== ${BASE} (gyökér)`)
await open('')
check('kezdőállapot app_one', await value('#app-one'), 5)
check('kezdőállapot app_two', await value('#app-two'), 42)
// React UI gombjai
await click('#app-one [aria-label="Növelés"]')
check('React + gomb → app_one', await value('#app-one'), 6)
await click('#app-one [aria-label="Csökkentés"]'); await click('#app-one [aria-label="Csökkentés"]')
check('React − gomb kétszer → app_one', await value('#app-one'), 4)
check('natív kiírás követi a React kattintást', await stateText('app_one'), 'app_one.getState() → {"counter":4}')
await click('#app-one .ra-counter__reset')
check('Alaphelyzet → app_one', await value('#app-one'), 5)
// Natív JS vezérlők
await click('[data-app=app_one] [data-action=increase]')
check('increase() → app_one', await value('#app-one'), 6)
await click('[data-app=app_one] [data-action=decrease]'); await click('[data-app=app_one] [data-action=decrease]')
check('decrease() kétszer → app_one', await value('#app-one'), 4)
await typeInto('[data-app=app_one] input', '77')
await click('[data-app=app_one] [data-action=set]')
check('setCounter(77) → app_one', await value('#app-one'), 77)
check('getState() kiírás', await stateText('app_one'), 'app_one.getState() → {"counter":77}')
consoleLines.length = 0
await click('[data-app=app_one] [data-action=log]')
check('getState() → console', consoleLines.join(' | '), 'app_one.getState() counter:77')
// Függetlenség
check('app_two érintetlen maradt', await value('#app-two'), 42)
await click('[data-app=app_two] [data-action=increase]')
check('increase() → app_two', await value('#app-two'), 43)
check('app_one nem változott', await value('#app-one'), 77)
// Konzolból elérhető API
await evaluate('window.app_two.setCounter(-3)'); await wait(150)
check('window.app_two.setCounter(-3) → DOM', await value('#app-two'), -3)

console.log(`\n== ${BASE}example/ (CDN)`)
await open('example/')
check('kezdőállapot app_one', await value('#app-one'), 10)
await click('#app-one [aria-label="Növelés"]')
check('React + gomb → app_one', await value('#app-one'), 11)
check('getState() kiírás', await evaluate(`document.getElementById('log').textContent.split('\\n')[0]`), 'app_one.getState() → {"counter":11}')
await click('#app-two [aria-label="Csökkentés"]')
check('React − gomb → app_two', await value('#app-two'), 41)
await click('#app-one .ra-counter__reset')
check('Alaphelyzet → app_one (counterDefault 5)', await value('#app-one'), 5)

const errors = consoleLines.filter((l) => l.startsWith('EXCEPTION'))
check('JS hibák a konzolon', errors.length, 0)

ws.close()
browser.kill()
await wait(500)
try { rmSync(profile, { recursive: true, force: true }) } catch { /* a böngésző még foghatja a fájlokat */ }
console.log(`\n${failures === 0 ? 'Minden ellenőrzés sikeres.' : `${failures} ellenőrzés hibás.`}`)
process.exit(failures ? 1 : 0)
