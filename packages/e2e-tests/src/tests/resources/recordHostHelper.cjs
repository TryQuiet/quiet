// Invoked by fixture XDG commands at the operating-system boundary. The app,
// renderer IPC and Electron's shell.openExternal implementation remain real.
const fs = require('node:fs')

fs.appendFileSync(
  process.env.QUIET_E2E_HELPER_LOG,
  JSON.stringify({
    args: process.argv.slice(2),
    preload: process.env.LD_PRELOAD,
    libraryPath: process.env.LD_LIBRARY_PATH,
    sentinel: process.env.QUIET_E2E_HOST_SENTINEL,
  }) + '\n'
)
