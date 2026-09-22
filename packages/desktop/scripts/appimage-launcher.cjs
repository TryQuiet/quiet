// Applied to electron-builder's generated launcher before building the AppImage.
// Keep these checks strict: a new builder template needs an explicit review.
function configureAppRun(source, executableName) {
  const binary = `BIN="$APPDIR/${executableName}"`
  if (source.split(binary).length !== 2) throw new Error('Unrecognized AppRun executable')

  const start = source.indexOf('\nHAVE_NO_SANDBOX=0\n')
  const end = source.indexOf('\natexit()\n', start)
  if (start === -1 || end === -1 || !source.slice(start, end).includes('NO_SANDBOX=(--no-sandbox)')) {
    throw new Error('Unrecognized AppRun sandbox policy')
  }
  // Let Electron enforce its sandbox requirements. A failed namespace probe
  // must not silently weaken the launch policy. Explicit CLI flags still pass through.
  source = source.slice(0, start) + '\nNO_SANDBOX=()\n' + source.slice(end)
  return source.replace(binary, `export LD_PRELOAD="\${APPDIR}/usr/lib/libssl.so"\n${binary}`)
}

module.exports = { configureAppRun }
