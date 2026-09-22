import path from 'node:path'
import { fileURLToPath } from 'node:url'
import webpack from 'webpack'
import backendConfig from '../webpack.config.js'

const directory = path.dirname(fileURLToPath(import.meta.url))
const config = backendConfig({ mode: 'production' })
config.entry = { 'tor-identity-probe': path.join(directory, 'tor-identity-probe.mjs') }
webpack(config, (error, stats) => {
  if (error) console.error(error)
  else console.log(stats.toString({ all: false, errors: true, warnings: true, timings: true }))
  if (error || stats.hasErrors()) process.exitCode = 1
})
