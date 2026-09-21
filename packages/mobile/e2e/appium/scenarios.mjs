import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { preflight } from './config.mjs'
import { Desktop } from './desktop.mjs'
import { Mobile } from './mobile.mjs'
const require = createRequire(import.meta.url)
const { parseQssInvitation, writeProof, waitForServerProof } = require('../utils/qssCommunity.cjs')

export async function runScenario(t, fullLoop) {
  const { config, run, fixture, build } = await preflight(fullLoop)
  const suffix = run.runId.slice(-10)
  const names = { community: `push${suffix}`, desktop: `sender-${suffix}`, mobile: `phone-${suffix}` }
  const desktop = new Desktop(config, names, fixture)
  const mobile = new Mobile(config, run)
  // Fixed stage labels are safe to publish when raw logs contain invitations.
  const progress = stage => fs.writeFileSync(path.join(run.directory, 'progress.json'), JSON.stringify({ stage }), { mode: 0o600 })
  t.after(async () => {
    try { await mobile.close() } finally { await desktop.close() }
  })
  try {
    progress('desktop-create')
    let invite = await desktop.create()
    const metadata = parseQssInvitation(invite, names.community)
    mobile.teamId = metadata.teamId
    writeProof(run, { ...metadata, platform: config.platform, build, fullLoopPassed: false })
    progress('mobile-start')
    await mobile.start()
    progress('mobile-join')
    await mobile.join(invite, names.mobile)
    invite = undefined
    // Foreground round-trip establishes completed enrollment and the real peer.
    const foreground = `Foreground enrollment ${suffix}`
    progress('foreground-send')
    await desktop.send(foreground)
    progress('foreground-receive')
    await mobile.message(foreground, names.desktop)
    progress('qss-storage-proof')
    await waitForServerProof(run, metadata.teamId, fixture.project)
    if (!fullLoop) {
      await mobile.artifacts('onboarding')
      writeProof(run, { ...metadata, platform: config.platform, build, onboardingPassed: true, fullLoopPassed: false, provider: 'disabled' })
      progress('onboarding-complete')
      return
    }
    const notifications = []
    await t.test('fresh UI join receives a real provider notification without relaunch', async () => {
      progress('fresh-join-background')
      const before = await waitForServerProof(run, metadata.teamId, fixture.project)
      await mobile.background()
      const text = `Fresh join notification ${suffix}`
      progress('fresh-join-send')
      await desktop.send(text)
      await waitForServerProof(run, metadata.teamId, fixture.project, { afterSyncSeq: before.maxSyncSeq })
      progress('fresh-join-notification-tap')
      notifications.push(await mobile.notificationAndTap({ text, username: names.desktop, channel: 'general', artifact: 'fresh-join' }))
    })
    await t.test('notification shows the named channel and tapping opens that conversation', async () => {
      const channel = `alerts-${suffix}`
      progress('named-channel-create')
      await desktop.addChannel(channel)
      // Observe real channel metadata sync, then leave mobile in general so
      // only tapping the notification can navigate to the target channel.
      progress('named-channel-sync')
      await mobile.tapId('appbar_action_item')
      await mobile.visible(mobile.id(`channel_tile_${channel}`), 60000)
      await mobile.tapId('channel_tile_general')
      progress('named-channel-background')
      await mobile.background()
      const before = await waitForServerProof(run, metadata.teamId, fixture.project)
      const text = `Named channel notification ${suffix}`
      progress('named-channel-send')
      await desktop.send(text, channel)
      await waitForServerProof(run, metadata.teamId, fixture.project, { afterSyncSeq: before.maxSyncSeq })
      progress('named-channel-notification-tap')
      notifications.push(await mobile.notificationAndTap({ text, username: names.desktop, channel, artifact: 'named-channel' }))
    })
    // node:test continues after failed subtests; never write a success receipt
    // unless both actual OS interactions finished.
    if (notifications.length !== 2) throw new Error('A full-loop notification scenario failed')
    writeProof(run, { ...metadata, platform: config.platform, build, fullLoopPassed: true, notifications })
    progress('provider-complete')
  } catch (error) {
    await mobile.artifacts('failure').catch(() => {})
    await desktop.artifacts(run.directory).catch(() => {})
    throw error
  }
}
