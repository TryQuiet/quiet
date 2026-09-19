export const BACKWARD_COMPATIBILITY_BASE_VERSION = '11.0.0'

export const compatibilityBaseline = (
  currentVersion: string,
  currentFileName: string,
  download: (version: string) => string
) => {
  const version = /^(\d+)\.(\d+)\.(\d+)(?:-[\da-zA-Z.-]+)?(?:\+[\da-zA-Z.-]+)?$/.exec(currentVersion)
  if (!version) throw new Error(`Invalid build version: ${currentVersion}`)

  const current = version.slice(1, 4).map(Number)
  const baseline = BACKWARD_COMPATIBILITY_BASE_VERSION.split('.').map(Number)
  const difference = current.findIndex((part, index) => part !== baseline[index])
  // 10.x was internal only — no @quiet/desktop@10.0.0 release was ever published — and 11.0.0
  // deliberately breaks compatibility with it (new data directories, QSS deviceId, device links).
  // So there is nothing before 11.0.0 worth upgrading from: through 11.0.0 exercise save/reopen
  // with the supplied build, and only later builds must upgrade a released 11.0.0.
  const isPlaceholder = difference === -1 || current[difference] < baseline[difference]

  return {
    isPlaceholder,
    version: isPlaceholder ? currentVersion : BACKWARD_COMPATIBILITY_BASE_VERSION,
    fileName: isPlaceholder ? currentFileName : download(BACKWARD_COMPATIBILITY_BASE_VERSION),
  }
}
