import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  // Library módban a Vite nem cseréli le a process.env.NODE_ENV-et, a React viszont használja.
  define: command === 'build' ? { 'process.env.NODE_ENV': JSON.stringify(mode) } : {},
  build: {
    // Egyetlen, React-et is tartalmazó fájl, ami <script> taggel betöltve
    // létrehozza a globális window.ReactApp objektumot.
    lib: {
      entry: 'src/index.tsx',
      name: 'ReactApp',
      formats: ['iife'],
      fileName: () => 'react-app.js',
    },
  },
}))
