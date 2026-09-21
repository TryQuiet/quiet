/** @jest-environment node */
import fs from 'fs'
import os from 'os'
import path from 'path'
import { e2eCaptchaToken } from './e2eCaptchaToken'

describe('E2E enrollment selection', () => {
  it('keeps the public test token for the isolated local fixture', () => {
    expect(e2eCaptchaToken({ IS_E2E: 'true', QSS_ENDPOINT: 'ws://localhost:3003' })).toBe(
      '10000000-aaaa-bbbb-cccc-000000000001'
    )
  })

  it('never sends a CI token to production or uses it outside E2E mode', () => {
    expect(() => e2eCaptchaToken({ IS_E2E: 'false' })).toThrow('only available in E2E')
    expect(() =>
      e2eCaptchaToken({
        IS_E2E: 'true',
        QSS_ENDPOINT: 'wss://qss-prod.quiet-services.app',
        QUIET_E2E_CI_ENROLLMENT_TOKEN_FILE: '/private/token',
      })
    ).toThrow('restricted to staging')
    expect(() => e2eCaptchaToken({ IS_E2E: 'true', QSS_ENDPOINT: 'wss://qss-dev.quiet-services.app' })).toThrow(
      'private CI enrollment token'
    )
  })
})

// The provider workflows run on Linux and macOS; POSIX file modes and
// O_NOFOLLOW are the protection used for their short-lived runtime token.
;(process.platform === 'win32' ? describe.skip : describe)('private CI enrollment file', () => {
  let directory: string
  let filename: string
  let env: NodeJS.ProcessEnv
  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-ci-enrollment-'))
    filename = path.join(directory, 'token')
    fs.writeFileSync(filename, 'quiet-ci-oidc:header.claims.signature', { mode: 0o600 })
    env = {
      IS_E2E: 'true',
      QSS_ENDPOINT: 'wss://qss-dev.quiet-services.app',
      QUIET_E2E_CI_ENROLLMENT_TOKEN_FILE: filename,
    }
  })
  afterEach(() => fs.rmSync(directory, { recursive: true, force: true }))

  it('reads the runtime identity without embedding it in the app', () => {
    expect(e2eCaptchaToken(env)).toBe('quiet-ci-oidc:header.claims.signature')
  })

  it('rejects a shared token file', () => {
    fs.chmodSync(filename, 0o644)
    expect(() => e2eCaptchaToken(env)).toThrow('must be private')
  })

  it('rejects a symlink and malformed contents', () => {
    const link = path.join(directory, 'link')
    fs.symlinkSync(filename, link)
    expect(() => e2eCaptchaToken({ ...env, QUIET_E2E_CI_ENROLLMENT_TOKEN_FILE: link })).toThrow()
    fs.writeFileSync(filename, 'malformed-private-sentinel')
    expect(() => e2eCaptchaToken(env)).toThrow('Invalid CI enrollment token file')
  })
})
