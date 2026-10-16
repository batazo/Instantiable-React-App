# Példányosítható React counter app

Egy React (Vite + TypeScript) counter app, ami egyetlen JS fájlba (`dist/react-app.js`) buildelődik,
és natív JS-ből tetszőleges számú, egymástól független példányban renderelhető különböző HTML elemekbe.

## Használat

```html
<div id="app-one"></div>
<section id="app-two"></section>

<script src="react-app.js"></script>
<script>
  const app_one = ReactApp.init({ counterDefault: 5 })
  app_one.render('#app-one')                          // CSS szelektor...

  const app_two = ReactApp.init({ counterDefault: 42, title: 'Második' })
    .render(document.getElementById('app-two'))       // ...vagy DOM elem

  app_one.getState()      // { counter: 5 }
  app_one.setCounter(10)
  app_one.increase()
  app_one.decrease()
</script>
```

### `ReactApp.init(options)`

| Opció            | Típus    | Alapértelmezés | Leírás                         |
| ---------------- | -------- | -------------- | ------------------------------ |
| `counterDefault` | `number` | `0`            | A számláló kezdőértéke         |
| `title`          | `string` | –              | Opcionális cím a példány felett |

### Példány API

| Metódus                 | Leírás                                                              |
| ----------------------- | ------------------------------------------------------------------- |
| `render(target)`        | Renderelés szelektorba vagy elembe; a példányt adja vissza (láncolható) |
| `unmount()`             | A React fa leszerelése (az állapot megmarad)                        |
| `getState()`            | Az aktuális állapot (`{ counter }`, immutábilis)                     |
| `setCounter(value)`     | Érték beállítása kívülről (nem véges számra `TypeError`)            |
| `increase()` / `decrease()` | Növelés / csökkentés eggyel                                     |
| `reset()`               | Visszaállítás a `counterDefault` értékre                            |
| `subscribe(listener)`   | Értesítés minden változásról (a UI-ból jövőkről is); leiratkozó függvényt ad vissza |

## Működés

Minden példány saját store-t kap (`src/store.ts`), ami a React-en kívül tárolja az állapotot.
A komponens `useSyncExternalStore`-ral olvassa, a natív API ugyanezt a store-t módosítja,
így a két irány mindig szinkronban van. A CSS a bundle része, első rendereléskor injektálódik.

## Parancsok

- `yarn dev` – fejlesztői szerver HMR-rel (`index.html` → `src/dev.ts` + `public/demo.js`)
- `yarn build` – library build: `dist/react-app.js` (IIFE, React-tel együtt)
- `yarn preview` – a build kipróbálása: nyisd meg a `/example.html` oldalt
