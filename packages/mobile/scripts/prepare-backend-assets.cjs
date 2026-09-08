const { copyFileSync, mkdirSync } = require('node:fs')
const { resolve } = require('node:path')

const projectDirectory = resolve(__dirname, '../nodejs-assets/nodejs-project')
const source = resolve(__dirname, '../../backend/lib/bundle.cjs')
const destination = resolve(projectDirectory, 'bundle.cjs')

mkdirSync(projectDirectory, { recursive: true })
copyFileSync(source, destination)
