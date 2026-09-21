const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { createHash } = require('node:crypto')
const webpack = require('webpack')
const { MARKER } = require('../e2e/qss-only/mode.cjs')

async function buildQssOnly({ output, stage = [] }) {
  if (!output || !path.isAbsolute(output)) throw new Error('--output must be an absolute task-owned directory')
  if (stage.some(target => !['android', 'desktop'].includes(target))) throw new Error('Stage targets must be android or desktop')
  const backend = path.resolve(__dirname, '..')
  const outputPath = path.resolve(output)
  const reserved = ['lib', '../backend-bundle', '../mobile/nodejs-assets/nodejs-project'].map(name => path.resolve(backend, name))
  if (reserved.includes(outputPath)) throw new Error('Build QSS-only into a separate output directory before staging')
  fs.mkdirSync(outputPath, { recursive: true })
  const receiptPath = path.join(outputPath, 'qss-only-build.json')
  fs.rmSync(receiptPath, { force: true })
  const { default: makeConfig } = await import(pathToFileURL(path.join(backend, 'e2e/qss-only/webpack.config.js')))
  const config = makeConfig({ qssOnlyOutput: outputPath })
  config.context = backend
  // ts-loader's relative config path is resolved against the source file;
  // pin the build config as well for callers outside packages/backend.
  config.module.rules[0].use.options.configFile = path.join(backend, 'tsconfig.build.json')
  const stats = await new Promise((resolve, reject) => {
    const compiler = webpack(config)
    compiler.run((error, result) => {
      compiler.close(closeError => {
        if (error || closeError) reject(error || closeError)
        else if (result.hasErrors()) reject(new Error(result.toString({ all: false, errors: true })))
        else resolve(result)
      })
    })
  })
  const modules = []
  const collect = entries => { for (const entry of entries || []) { modules.push(entry.name || ''); collect(entry.modules) } }
  collect(stats.toJson({ all: false, modules: true, nestedModules: true }).modules)
  const replaced = ['tor.module.cjs', 'tor.service.cjs', 'libp2p.js']
  if (replaced.some(name => !modules.some(item => item.endsWith(`/e2e/qss-only/${name}`))) ||
      modules.some(item => /\/src\/nest\/tor\/tor(?:-control)?\.(?:module|service)\.ts$/.test(item))) {
    throw new Error('QSS-only module replacement was incomplete; do not stage this build')
  }
  const bundlePath = path.join(outputPath, 'bundle.cjs')
  const bundle = fs.readFileSync(bundlePath)
  if (!bundle.includes(Buffer.from(MARKER))) throw new Error('Missing QSS-only bundle marker')
  const receipt = {
    version: 1, mode: 'qss-only', marker: MARKER, tor: 'simulated-metadata', p2p: false,
    bundleSHA256: createHash('sha256').update(bundle).digest('hex'),
    replacedModules: replaced,
  }
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n')
  for (const target of stage) {
    const destination = path.resolve(backend, target === 'android' ? '../mobile/nodejs-assets/nodejs-project/bundle.cjs' : '../backend-bundle/bundle.cjs')
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    fs.copyFileSync(bundlePath, destination)
  }
  return { receipt: receiptPath, ...receipt }
}

if (require.main === module) {
  const args = process.argv.slice(2)
  const outputIndex = args.indexOf('--output')
  const stage = args.flatMap((value, index) => value === '--stage' ? args[index + 1].split(',') : [])
  buildQssOnly({ output: outputIndex < 0 ? undefined : args[outputIndex + 1], stage })
    .then(result => process.stdout.write(JSON.stringify(result, null, 2) + '\n'))
    .catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1 })
}

module.exports = { buildQssOnly }
