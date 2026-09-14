// Real Electron UI peer for historical Android release comparisons.
// Usage: node desktop_peer.cjs /absolute/private/config.json
const fs = require('node:fs')
const path = require('node:path')
const {spawn} = require('node:child_process')
const e2e = path.resolve(__dirname, '../../packages/e2e-tests')
const ts = require(path.join(e2e, 'node_modules/typescript'))
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true},
  }).outputText, filename)
}
const {
  App, Channel, JoinCommunityModal, CreateCommunityModal, ServerOfferModal,
  RegisterUsernameModal, TermsOfServiceModal, Sidebar,
} = require(path.join(e2e, 'src/selectors.ts'))
const {SettingsModalTabName} = require(path.join(e2e, 'src/enums.ts'))
const {By, until} = require(path.join(e2e, 'node_modules/selenium-webdriver'))
const {snapshotOwnedProcesses, waitForProcessExit} = require('../../packages/mobile/e2e/utils/desktopProcesses.cjs')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const config = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const output = path.resolve(config.output)
fs.mkdirSync(output, {recursive:true, mode:0o700})
fs.chmodSync(output, 0o700)
for (const name of ['requests', 'responses']) fs.mkdirSync(path.join(output, name), {recursive:true, mode:0o700})
const write = (file, value) => {
  fs.writeFileSync(file + '.tmp', JSON.stringify(value, null, 2) + '\n', {mode:0o600})
  fs.renameSync(file + '.tmp', file)
}
let app
let displayProcess
async function isolateDisplay() {
  if (process.platform !== 'linux') return
  if (config.display) {process.env.DISPLAY = config.display; return}
  // One visible Electron peer per X server. Other release windows must not
  // occlude it or change renderer scheduling during UI delivery measurements.
  const errorLog = fs.openSync(path.join(output, 'xvfb.log'), 'a', 0o600)
  displayProcess = spawn('Xvfb', ['-displayfd', '1', '-screen', '0', '1280x800x24', '-nolisten', 'tcp'],
    {stdio:['ignore', 'pipe', errorLog]})
  fs.closeSync(errorLog)
  const display = await new Promise((resolve, reject) => {
    let text = ''
    const timer = setTimeout(() => reject(new Error('Dedicated display did not start')), 15000)
    displayProcess.once('error', error => {clearTimeout(timer); reject(error)})
    displayProcess.once('exit', () => {clearTimeout(timer); reject(new Error('Dedicated display exited'))})
    displayProcess.stdout.on('data', chunk => {
      text += chunk.toString()
      if (/^\d+\n/.test(text)) {clearTimeout(timer); resolve(':' + text.trim())}
    })
  })
  process.env.DISPLAY = display
  write(path.join(output, 'display.json'), {display, pid:displayProcess.pid, dedicated:true})
}
let channel
const launch = async () => {
  await app.open(true)
  if (config.captureDriverOutput) {
    const capture = chunk => fs.appendFileSync(path.join(output, 'driver.raw.log'), chunk, {mode:0o600})
    app.buildSetup.child.stdout.on('data', capture)
    app.buildSetup.child.stderr.on('data', capture)
  }
  channel = new Channel(app.driver, 'general')
}
const stop = async () => {
  if (!app.isOpened) throw new Error('Desktop is already stopped')
  const processes = snapshotOwnedProcesses(app.buildSetup.child.pid)
  await app.close()
  await waitForProcessExit(processes)
  return {processExitVerified:true, processes}
}
async function main() {
  await isolateDisplay()
  app = new App({binaryPath: config.binary, qssEndpoint:config.endpoint, username:config.username,
    environment:config.environment,
    ...(config.profile ? {dataDir:config.profile} : {})})
  fs.mkdirSync(app.buildSetup.dataDirPath, {recursive:true, mode:0o700})
  fs.chmodSync(app.buildSetup.dataDirPath, 0o700)
  await launch()
  if (!config.profile) {
    const join = new JoinCommunityModal(app.driver)
    if (!await join.isReady()) throw new Error('Desktop onboarding is unavailable')
    if (config.invitation) {
      await join.typeCommunityInviteLink(config.invitation)
      await join.submit()
    } else {
      await join.switchToCreateCommunity()
      const create = new CreateCommunityModal(app.driver)
      await create.typeCommunityName(config.community)
      await create.submit()
      const offer = new ServerOfferModal(app.driver)
      if (!await offer.isReady()) throw new Error('QSS server offer is unavailable')
      await offer.chooseUseServer()
    }
    const register = new RegisterUsernameModal(app.driver)
    await register.isReady()
    await register.typeUsername(config.username)
    await register.submit()
    const terms = new TermsOfServiceModal(app.driver)
    await terms.isReady()
    await terms.chooseAgreeAndJoin()
  }
  if (config.onboardingTimeoutMs) {
    // Real CAPTCHA may still be running after terms are accepted. Keep the app
    // alive until the channel appears instead of using the selector's 10s limit.
    await app.driver.wait(until.elementLocated(By.css('[data-testid="channelTitle"]')),
      config.onboardingTimeoutMs, 'Desktop onboarding did not reach a channel')
  }
  if (!await channel.isOpen()) throw new Error('Desktop general channel is unavailable')
  const settings = await new Sidebar(app.driver).openSettings()
  await settings.switchTab(SettingsModalTabName.INVITE)
  const invitation = await (await settings.invitationLink()).getText()
  await settings.closeTabThenModal()
  write(path.join(output,'ready.json'), {invitation, profile:app.buildSetup.dataDir,
    profilePath:app.buildSetup.dataDirPath, username:config.username,
    binary:config.binary, endpoint:config.endpoint, release:config.release, readyAt:new Date().toISOString()})
  while (true) {
    for (const name of fs.readdirSync(path.join(output,'requests')).filter(n => /^[a-zA-Z0-9_-]+\.json$/.test(n)).sort()) {
      const responseFile = path.join(output,'responses',name)
      if (fs.existsSync(responseFile)) continue
      const request = JSON.parse(fs.readFileSync(path.join(output,'requests',name),'utf8'))
      const start = performance.now()
      try {
        let result
        if (request.action === 'send') await channel.sendMessage(request.message, config.username)
        else if (request.action === 'wait') await channel.waitForExactMessage(request.message, request.username)
        else if (request.action === 'stop') result = await stop()
        else if (request.action === 'launch') {await launch(); await channel.isOpen()}
        else if (request.action === 'shutdown') {if (app.isOpened) await stop(); write(responseFile,{passed:true}); return}
        else throw new Error('Unsupported peer command')
        write(responseFile,{passed:true, action:request.action, elapsedMs:performance.now()-start, result})
      } catch (error) {
        write(responseFile,{passed:false, action:request.action, elapsedMs:performance.now()-start, error:String(error)})
      }
    }
    await sleep(100)
  }
}
main().catch(error => {write(path.join(output,'failed.json'),{error:String(error)}); process.exitCode=1})
  .finally(async () => {
    try {if (app?.isOpened) await stop()}
    finally {if (displayProcess) displayProcess.kill('SIGTERM')}
  })
