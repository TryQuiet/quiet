// Profiling instrumentation only. Never records arguments, keys or plaintext.
'use strict'
const fs = require('node:fs')
const path = require('node:path')
const {performance} = require('node:perf_hooks')
const metrics = new Map()
const stack = []
const classes = {}
let directory
let enabled = true
let cpuSession
let webpack
function metric(name) {
  if (!metrics.has(name)) metrics.set(name, {calls: 0, totalMs: 0, selfMs: 0, maxMs: 0, errors: 0})
  return metrics.get(name)
}
function sync(name, fn) {
  return function (...args) {
    if (!enabled) return fn.apply(this, args)
    const frame = {children: 0}
    stack.push(frame)
    const start = performance.now()
    let failed = false
    try { return fn.apply(this, args) }
    catch (error) { failed = true; throw error }
    finally {
      const elapsed = performance.now() - start
      stack.pop()
      if (stack.length) stack[stack.length - 1].children += elapsed
      const m = metric(name)
      m.calls++; m.totalMs += elapsed; m.selfMs += elapsed - frame.children
      m.maxMs = Math.max(m.maxMs, elapsed); m.errors += Number(failed)
    }
  }
}
function asyncSpan(name, fn) {
  return async function (...args) {
    if (!enabled) return fn.apply(this, args)
    const start = performance.now()
    let failed = false
    try { return await fn.apply(this, args) }
    catch (error) { failed = true; throw error }
    finally {
      const elapsed = performance.now() - start
      const m = metric(name + '.wall')
      m.calls++; m.totalMs += elapsed; m.maxMs = Math.max(m.maxMs, elapsed); m.errors += Number(failed)
    }
  }
}
function object(prefix, obj) {
  for (const key of Object.keys(obj)) if (typeof obj[key] === 'function') obj[key] = sync(prefix + '.' + key, obj[key])
}
function prototype(name, Class) {
  classes[name] = Class
  for (const key of Object.getOwnPropertyNames(Class.prototype)) {
    if (key === 'constructor') continue
    const descriptor = Object.getOwnPropertyDescriptor(Class.prototype, key)
    if (typeof descriptor.value !== 'function') continue
    const wrap = descriptor.value.constructor.name === 'AsyncFunction' ? asyncSpan : sync
    Object.defineProperty(Class.prototype, key, {...descriptor, value: wrap(name + '.' + key, descriptor.value)})
  }
}
function sodium(obj) {
  for (const key of Object.keys(obj)) if (/^(crypto_|randombytes_)/.test(key) && typeof obj[key] === 'function') obj[key] = sync('sodium.' + key, obj[key])
}
function snapshot() { return Object.fromEntries([...metrics].map(([k, v]) => [k, {...v}])) }
function reset() { if (stack.length) throw new Error('Cannot reset during a measured call'); metrics.clear() }
function write(name, value) {
  if (!directory) return
  fs.writeFileSync(path.join(directory, name + '.tmp'), JSON.stringify(value), {mode: 0o600})
  fs.renameSync(path.join(directory, name + '.tmp'), path.join(directory, name))
}
async function cpuStart() {
  const inspector = require('node:inspector')
  cpuSession = new inspector.Session(); cpuSession.connect()
  const post = (method, params = {}) => new Promise((resolve, reject) => cpuSession.post(method, params, (e, r) => e ? reject(e) : resolve(r)))
  cpuSession.profilePost = post
  await post('Profiler.enable'); await post('Profiler.setSamplingInterval', {interval: 1000}); await post('Profiler.start')
}
async function cpuStop(name) {
  if (!cpuSession) return
  const {profile} = await cpuSession.profilePost('Profiler.stop')
  write(name + '.cpuprofile', profile); cpuSession.disconnect(); cpuSession = undefined
}
function boot(req) {
  webpack = req
  if (process.env.QUIET_PROFILE_DISABLE_WASM === '1') globalThis.WebAssembly = undefined
  directory = process.env.QUIET_PROFILE_DIRECTORY || path.join(process.env.HOME, 'Documents', 'quiet-profile-results')
  const controlDirectory = process.env.QUIET_PROFILE_CONTROL_DIRECTORY || path.join(process.env.HOME, 'Documents', 'quiet-profiling')
  fs.mkdirSync(directory, {recursive: true, mode: 0o700})
  write('runtime.json', {utc: new Date().toISOString(), versions: process.versions, platform: process.platform, arch: process.arch, webAssemblyType: typeof WebAssembly, execArgv: process.execArgv, pid: process.pid})
  if (process.env.QUIET_PROFILE_EXPORT_ONLY === '1') return
  setInterval(() => write('metrics.json', {utc: new Date().toISOString(), metrics: snapshot(), memory: process.memoryUsage()}), 5000).unref()
  let lastCommand
  let commandRunning = false
  setInterval(async () => {
    if (commandRunning) return
    const file = path.join(controlDirectory, 'command.json')
    if (!fs.existsSync(file)) return
    const command = JSON.parse(fs.readFileSync(file))
    if (command.id === lastCommand) return
    commandRunning = true; lastCommand = command.id
    try {
      write('command-status.json', {id: command.id, running: true, utc: new Date().toISOString()})
      if (command.action === 'benchmark') {
        if (!/^[a-zA-Z0-9_-]+$/.test(command.id)) throw new Error('Invalid profiling command id')
        const config = {...command.config, fixtures: path.join(controlDirectory, 'fixtures'), output: path.join(directory, command.id)}
        const candidate = path.join(controlDirectory, 'bench.cjs')
        const benchPath = fs.existsSync(candidate) ? candidate : path.join(__dirname, 'quiet-profile-bench.cjs')
        delete require.cache[require.resolve(benchPath)]
        await require(benchPath).run({webpack, profiler: module.exports}, config)
      } else if (command.action === 'profile') {
        reset(); await cpuStart()
        await new Promise(resolve => setTimeout(resolve, command.durationMs || 30000))
        await cpuStop(command.id)
        write(command.id + '-metrics.json', snapshot())
      } else throw new Error('Unknown profiling command')
      write('command-status.json', {id: command.id, passed: true, utc: new Date().toISOString()})
    } catch (error) { write('command-status.json', {id: command.id, passed: false, error: String(error), utc: new Date().toISOString()}) }
    finally { commandRunning = false }
  }, 500).unref()
  setTimeout(async () => {
    try { await cpuStart(); write('cpu-status.json', {started: true}); setTimeout(() => cpuStop('startup').catch(error => write('cpu-error.json', {error: String(error)})), 45000).unref() }
    catch (error) { write('cpu-error.json', {error: String(error)}) }
  }, 1000).unref()
}
module.exports = {boot, sync, asyncSpan, object, prototype, sodium, snapshot, reset, write, cpuStart, cpuStop, classes,
  setEnabled(value) { enabled = value }, get webpack() { return webpack }, get directory() { return directory }}
