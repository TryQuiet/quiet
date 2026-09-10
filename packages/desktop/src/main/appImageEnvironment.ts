/**
 * AppRun's loader settings are needed when Electron is loaded, but must not be
 * inherited by host programs such as xdg-open, xdg-mime, or xdg-settings.
 * Removing them here does not unload libraries already mapped into Electron.
 */
export const sanitizeAppImageEnvironment = (
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform
): void => {
  if (platform !== 'linux' || !env.APPIMAGE) return

  delete env.LD_PRELOAD
  delete env.LD_LIBRARY_PATH
}

// main.ts imports this before any module that can launch another process.
sanitizeAppImageEnvironment()
