import * as child_process from 'child_process'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

import { QUIET_DIR, TOR_PASSWORD_PROVIDER, TOR_PARAMS_PROVIDER } from '../const'
import { TorParamsProvider } from './tor.types'

export const torPasswordProvider = {
  provide: TOR_PASSWORD_PROVIDER,
  useFactory: (torParamsProvider: TorParamsProvider, quietDir: string) => {
    const password = crypto.randomBytes(16).toString('hex')
    if (!torParamsProvider.torPath) return null

    // Tor validates the DataDirectory during config parsing, even for --hash-password. Some tor
    // builds (e.g. the libtor.so shipped with Tor Browser for Android) have a compiled-in default
    // DataDirectory that the app's uid cannot read (/data/local/tmp), which makes --hash-password
    // exit 1 and crashes the backend on startup. Always pass the same DataDirectory the tor
    // process itself uses (see Tor#init).
    const torDataDirectory = path.join(quietDir, 'TorDataDirectory')
    if (!fs.existsSync(torDataDirectory)) {
      fs.mkdirSync(torDataDirectory, { recursive: true })
    }

    const hashedPassword = child_process.execFileSync(
      torParamsProvider.torPath,
      ['--quiet', '--DataDirectory', torDataDirectory, '--hash-password', password],
      {
        env: torParamsProvider.options?.env,
      }
    )
    const torPassword = password
    const torHashedPassword = hashedPassword.toString().trim()

    return { torPassword, torHashedPassword }
  },
  inject: [TOR_PARAMS_PROVIDER, QUIET_DIR],
}
