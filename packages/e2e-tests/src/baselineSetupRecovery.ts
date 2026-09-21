import fs from 'fs'
import path from 'path'
import { error } from 'selenium-webdriver'
import { App, JoiningLoadingPanel } from './selectors'
import { createLogger } from './logger'

const logger = createLogger('baselineSetupRecovery')
const publicationFailure =
  'backend:Tor Failed to publish registered hidden service Error: Timeout while waiting for Tor HS_DESC event'

/** Only the released baseline's initial community setup may be reopened once. */
export async function completeBaselineJoin(
  app: App,
  baseline: { version: string; isPlaceholder: boolean },
  waitForJoin = () => new JoiningLoadingPanel(app.driver).waitForJoinToComplete()
): Promise<void> {
  try {
    await waitForJoin()
    return
  } catch (failure) {
    if (
      baseline.isPlaceholder ||
      baseline.version !== '11.0.0' ||
      !(failure instanceof error.TimeoutError) ||
      !failure.message.startsWith("Loading panel element didn't disappear within timeout") ||
      !app.buildSetup.hasProcessOutput(publicationFailure)
    ) {
      throw failure
    }

    // Keep evidence before reopening; never delete the profile or substitute a
    // current build. All baseline version/message/channel and upgrade checks
    // still run against the same released binary and its persisted data.
    const directory = path.resolve('back-compat-artifacts', `${app.name}-publication-timeout`)
    fs.mkdirSync(directory, { recursive: true })
    fs.writeFileSync(path.join(directory, 'process.log'), app.buildSetup.getProcessOutput())
    fs.writeFileSync(path.join(directory, 'failure.txt'), failure.stack ?? String(failure))
    fs.writeFileSync(path.join(directory, 'setup.png'), await app.driver.takeScreenshot(), 'base64')
    logger.warn('Reopening released 11.0.0 after its initial Tor publication timeout', { directory })
    await app.close({ forceSaveState: true })
    app.buildSetup.clearProcessOutput()
    await app.open()
    // Intentionally outside the catch: neither another publication failure nor
    // any later upgrade/assertion failure receives a second attempt.
    await waitForJoin()
  }
}
