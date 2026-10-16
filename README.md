# Példányosítható React counter app

Egy React (Vite + TypeScript) counter app, ami egyetlen JS fájlba (`dist/react-app.js`) buildelődik,
és natív JS-ből tetszőleges számú, egymástól független példányban renderelhető különböző HTML elemekbe.

## Betöltés

### CDN-ről (jsDelivr)

A build-elt bundle a repóban van (`dist/react-app.js`), így közvetlenül a GitHubról, a jsDelivr CDN-en át is betölthető:

```html
<script src="https://cdn.jsdelivr.net/gh/batazo/Instantiable-React-App@main/dist/react-app.js"></script>
```

Az `@main` mindig a legfrissebb verzióra mutat, de a jsDelivr akár 12 óráig is cache-elheti,
így egy friss push nem feltétlenül jelenik meg azonnal. Stabil, nem változó verzióhoz add meg
egy commit hash-ét vagy egy git tag nevét:

```html
<script src="https://cdn.jsdelivr.net/gh/batazo/Instantiable-React-App@28e7b3d/dist/react-app.js"></script>
```

### Saját tárhelyről

Másold a `dist/react-app.js` fájlt a saját projektedbe, és töltsd be egy sima `<script>` taggel.

## Használat

```html
<div id="app-one"></div>
<section id="app-two"></section>

<script src="https://cdn.jsdelivr.net/gh/batazo/Instantiable-React-App@main/dist/react-app.js"></script>
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
- `yarn build` – library build: `dist/react-app.js` (IIFE, React-tel együtt).
  Commit előtt egy Husky pre-commit hook automatikusan lefuttatja, és a friss `dist/`-et is commitolja.
- `yarn preview` – a build kipróbálása: nyisd meg a `/example.html` oldalt
