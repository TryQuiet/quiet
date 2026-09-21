import fs from 'fs'
import os from 'os'
import path from 'path'
import { DESKTOP_DATA_DIR } from '@quiet/common'
import { BuildSetup } from '../utils'

describe('E2E profile cleanup', () => {
  let fixture: string
  const originalCi = process.env.IS_CI
  const originalOptIn = process.env.QUIET_E2E_ALLOW_DEFAULT_PROFILE_CLEANUP

  beforeEach(() => {
    fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-profile-cleanup-'))
    delete process.env.IS_CI
    delete process.env.QUIET_E2E_ALLOW_DEFAULT_PROFILE_CLEANUP
  })

  afterEach(() => {
    fs.rmdirSync(fixture, { recursive: true })
    if (originalCi === undefined) delete process.env.IS_CI
    else process.env.IS_CI = originalCi
    if (originalOptIn === undefined) delete process.env.QUIET_E2E_ALLOW_DEFAULT_PROFILE_CLEANUP
    else process.env.QUIET_E2E_ALLOW_DEFAULT_PROFILE_CLEANUP = originalOptIn
  })

  const createProfile = (options: { defaultDataDir?: boolean; dataDir?: string }) => {
    const setup = new BuildSetup({ ...options, environment: { APPDATA: fixture } })
    fs.mkdirSync(setup.dataDirPath, { recursive: true })
    const savedIdentity = path.join(setup.dataDirPath, 'saved-identity.json')
    fs.writeFileSync(savedIdentity, 'existing user data')
    return { setup, savedIdentity }
  }

  it.each([undefined, 'true'])('preserves the default profile even when force is set and IS_CI=%s', isCi => {
    if (isCi !== undefined) process.env.IS_CI = isCi
    const { setup, savedIdentity } = createProfile({ defaultDataDir: true })

    expect(() => setup.clearDataDir(true)).toThrow('Refusing to delete the default Quiet profile')
    expect(fs.readFileSync(savedIdentity, 'utf8')).toBe('existing user data')
  })

  it.each([DESKTOP_DATA_DIR, DESKTOP_DATA_DIR.toLowerCase()])(
    'protects the default profile when selected by the data directory name %s',
    dataDir => {
      const { setup, savedIdentity } = createProfile({ dataDir })

      expect(() => setup.clearDataDir()).toThrow('Refusing to delete the default Quiet profile')
      expect(fs.readFileSync(savedIdentity, 'utf8')).toBe('existing user data')
    }
  )

  it('allows explicitly authorized cleanup of a disposable default profile', () => {
    const { setup } = createProfile({ defaultDataDir: true })
    process.env.QUIET_E2E_ALLOW_DEFAULT_PROFILE_CLEANUP = 'true'

    setup.clearDataDir(true)

    expect(fs.existsSync(setup.dataDirPath)).toBe(false)
  })

  it('cleans up an isolated test profile without opting in', () => {
    const { setup } = createProfile({})

    setup.clearDataDir()

    expect(fs.existsSync(setup.dataDirPath)).toBe(false)
  })

  it('retains CI profiles for diagnostics unless cleanup is forced', () => {
    const { setup, savedIdentity } = createProfile({})
    process.env.IS_CI = 'true'

    setup.clearDataDir()
    expect(fs.readFileSync(savedIdentity, 'utf8')).toBe('existing user data')
    setup.clearDataDir(true)
    expect(fs.existsSync(setup.dataDirPath)).toBe(false)
  })
})
