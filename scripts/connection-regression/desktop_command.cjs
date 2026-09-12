// Attach to this test's existing ChromeDriver session to make UI assertions.
const fs = require('node:fs')
const path = require('node:path')
const {execFileSync} = require('node:child_process')
const e2e = path.resolve(__dirname, '../../packages/e2e-tests')
const ts = require(path.join(e2e, 'node_modules/typescript'))
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true},
  }).outputText, filename)
}
const {WebDriver} = require(path.join(e2e, 'node_modules/selenium-webdriver'))
const {Session} = require(path.join(e2e, 'node_modules/selenium-webdriver/lib/session'))
const {Executor, HttpClient} = require(path.join(e2e, 'node_modules/selenium-webdriver/http'))
const {Channel} = require(path.join(e2e, 'src/selectors.ts'))
const {snapshotOwnedProcesses, waitForProcessExit} = require('../../packages/mobile/e2e/utils/desktopProcesses.cjs')

async function main(request) {
  const log = fs.readFileSync(request.launchLog, 'utf8')
  const ports = [...log.matchAll(/Starting ChromeDriver[^\n]+on port (\d+)/g)]
  if (ports.length !== 1) throw new Error('Expected one owned ChromeDriver launch')
  const port = Number(ports[0][1])
  const endpoint = `http://localhost:${port}`
  const response = await fetch(endpoint + '/sessions')
  if (!response.ok) throw new Error('ChromeDriver is unavailable')
  const {value} = await response.json()
  if (value.length !== 1) throw new Error('Expected one test session')
  const session = value[0]
  const driver = new WebDriver(new Session(session.id, session.capabilities), new Executor(new HttpClient(endpoint)))
  const channel = new Channel(driver, 'general')
  const start = performance.now()
  if (request.action === 'snapshot') {
    fs.writeFileSync(request.outputPrefix + '.png', Buffer.from(await driver.takeScreenshot(), 'base64'), {mode:0o600})
    fs.writeFileSync(request.outputPrefix + '.html', await driver.getPageSource(), {mode:0o600})
  } else if (request.action === 'wait') {
    await channel.waitForExactMessage(request.message, request.username)
  } else if (request.action === 'send') {
    await channel.sendMessage(request.message, request.username)
  } else if (request.action === 'stop') {
    const pid = Number(execFileSync('lsof', ['-t', `-iTCP:${port}`, '-sTCP:LISTEN'], {encoding:'utf8'}).trim())
    const owned = snapshotOwnedProcesses(pid)
    await driver.quit()
    process.kill(pid, 'SIGTERM')
    await waitForProcessExit(owned)
    return {passed: true, action: 'stop', processExitVerified: true, processes: owned}
  } else {
    throw new Error('Unsupported desktop action')
  }
  return {passed: true, action: request.action, elapsedMs: performance.now()-start}
}
main(JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))).then(result => {
  fs.writeFileSync(process.argv[3], JSON.stringify(result, null, 2) + '\n', {mode:0o600})
  console.log(JSON.stringify(result))
}).catch(error => {console.error(error); process.exitCode = 1})
