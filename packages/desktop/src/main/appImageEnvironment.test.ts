/** @jest-environment node */
import { execFileSync } from 'child_process'
import { sanitizeAppImageEnvironment } from './appImageEnvironment'

const readChildEnvironment = (env: NodeJS.ProcessEnv) =>
  JSON.parse(
    execFileSync(process.execPath, ['-e', 'process.stdout.write(JSON.stringify(process.env))'], {
      env,
      encoding: 'utf8',
    })
  )

describe('AppImage host process environment', () => {
  it('removes loader overrides from real inherited children while preserving host configuration', () => {
    const env = {
      ...process.env,
      APPIMAGE: '/opt/Quiet.AppImage',
      LD_PRELOAD: '',
      LD_LIBRARY_PATH: '/opt/quiet/usr/lib',
      QUIET_HOST_ENV_TEST: 'preserved',
    }
    expect(readChildEnvironment(env).LD_LIBRARY_PATH).toBe('/opt/quiet/usr/lib')

    sanitizeAppImageEnvironment(env, 'linux')

    const child = readChildEnvironment(env)
    expect(child.LD_PRELOAD).toBeUndefined()
    expect(child.LD_LIBRARY_PATH).toBeUndefined()
    expect(child.QUIET_HOST_ENV_TEST).toBe('preserved')
    expect(child.PATH).toBe(process.env.PATH)
    expect(child.APPIMAGE).toBe('/opt/Quiet.AppImage')

    // Tor supplies its own resource path; main's cleanup must not override it.
    const torChild = readChildEnvironment({ ...env, LD_LIBRARY_PATH: '/opt/quiet/tor' })
    expect(torChild.LD_LIBRARY_PATH).toBe('/opt/quiet/tor')
  })

  it.each([
    ['linux', undefined],
    ['linux', ''],
    ['darwin', '/opt/Quiet.AppImage'],
    ['win32', 'C:\\Quiet.AppImage'],
  ] as Array<[NodeJS.Platform, string | undefined]>)(
    'preserves loader settings for %s with APPIMAGE=%s',
    (platform, appImage) => {
      const env = { APPIMAGE: appImage, LD_PRELOAD: 'custom-preload', LD_LIBRARY_PATH: 'custom-library-path' }
      const original = { ...env }
      sanitizeAppImageEnvironment(env, platform)
      expect(env).toEqual(original)
    }
  )
})
