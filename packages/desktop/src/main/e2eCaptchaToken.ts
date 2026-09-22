import fs from 'fs'
import path from 'path'

export function e2eCaptchaToken(env: NodeJS.ProcessEnv): string {
  if (env.IS_E2E !== 'true') throw new Error('CI enrollment is only available in E2E mode')
  const filename = env.QUIET_E2E_CI_ENROLLMENT_TOKEN_FILE
  if (env.QSS_ENDPOINT !== 'wss://qss-dev.quiet-services.app') {
    if (filename) throw new Error('CI enrollment is restricted to staging QSS')
    return '10000000-aaaa-bbbb-cccc-000000000001'
  }
  if (!filename || !path.isAbsolute(filename))
    throw new Error('Staging E2E requires a private CI enrollment token file')
  const fd = fs.openSync(filename, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW)
  try {
    const stat = fs.fstatSync(fd)
    if (!stat.isFile() || (stat.mode & 0o077) !== 0 || stat.size > 16400) {
      throw new Error('CI enrollment token file must be private and contain one bounded token')
    }
    const token = fs.readFileSync(fd, 'utf8')
    if (!/^quiet-ci-oidc:[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
      throw new Error('Invalid CI enrollment token file')
    }
    return token
  } finally {
    fs.closeSync(fd)
  }
}
