const { copyFileSync, mkdirSync } = require('node:fs')
const { dirname, resolve } = require('node:path')

const bundle = resolve(__dirname, '../lib/bundle.cjs')
const consumers = [
  resolve(__dirname, '../../backend-bundle/bundle.cjs'),
  resolve(__dirname, '../../mobile/nodejs-assets/nodejs-project/bundle.cjs'),
]

for (const consumer of consumers) {
  mkdirSync(dirname(consumer), { recursive: true })
  copyFileSync(bundle, consumer)
}
