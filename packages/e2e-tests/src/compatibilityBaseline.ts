export const BACKWARD_COMPATIBILITY_BASE_VERSION = '10.0.0'

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
  // The release branch still carries pre-10 package versions until the version bump.
  // Through 10.0.0, exercise save/reopen with the supplied build; later builds must upgrade 10.0.0.
  const isPlaceholder = difference === -1 || current[difference] < baseline[difference]

  return {
    isPlaceholder,
    version: isPlaceholder ? currentVersion : BACKWARD_COMPATIBILITY_BASE_VERSION,
    fileName: isPlaceholder ? currentFileName : download(BACKWARD_COMPATIBILITY_BASE_VERSION),
  }
}
