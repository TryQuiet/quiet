// sudo may reset the environment (sudo-rs ignores -E). Pass it through stdin,
// never command-line arguments, so credentials are not exposed in process listings.
const { spawn } = require('child_process')
let input = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', chunk => {
  input += chunk
})
process.stdin.on('end', () => {
  const child = spawn(process.argv[2], process.argv.slice(3), {
    env: JSON.parse(input),
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  child.on('error', error => {
    console.error(error)
    process.exitCode = 1
  })
  child.on('exit', code => {
    process.exitCode = code ?? 1
  })
})
