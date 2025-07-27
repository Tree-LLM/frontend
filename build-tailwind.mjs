import { cli } from 'tailwindcss'

cli([
  '-i', './src/index.css',
  '-o', './src/tailwind.generated.css',
  '--config', './tailwind.config.js'
])