import { createApp, noJest } from 'integration-tests'
import { fixture, test } from 'testcafe'
import logger from './logger'
import { DebugModeModal, JoinCommunityModal, LoadingPanel, RegisterUsernameModal, Channel } from './selectors'
import { goToMainPage } from './utils'
const log = logger('join')

const longTimeout = 500000
const timeout = 120_000

fixture`Joining user test`
  // .before(async ctx => {

  // })
  .beforeEach(async t => {
    await goToMainPage()
    await new DebugModeModal().close()
  })

//   .after(async t => {
//     const dataPath = fs.readFileSync('/tmp/appDataPath', { encoding: 'utf8' })
//     const fullDataPath = path.join(dataPath, 'Quiet')
//     console.log(`Test data is in ${fullDataPath}. You may want to remove it.`)
//     // await fs.rm(fullDataPath, { recursive: true, force: true }) // TODO: use this with node >=14, rmdirSync doesn't seem to work
//   })

test('User can join the community', async t => {
  const communityOwner = await createApp()
  const onionAddress = await noJest.createCommunity({ username: 'Owner', communityName: 'e2eCommunity', store: communityOwner.store })

  const invitationCode = onionAddress.split('.')[0]
  log('RECEIVED ADDRESS', invitationCode)
  // User opens app for the first time, sees spinner, waits for spinner to disappear
  await t.expect(new LoadingPanel('Starting Quiet').title.exists).notOk(`"Starting Quiet" spinner is still visible after ${longTimeout}ms`, { timeout: longTimeout })

  // User sees "join community" page, types correct community code and submits
  const joinModal = new JoinCommunityModal()
  await t.expect(joinModal.title.exists).ok('User can\'t see "Join community" title')
  await joinModal.typeCommunityCode(invitationCode)
  await joinModal.submit()

  // User sees "register username" page, enters the valid name and submits by clicking on the button
  const registerModal = new RegisterUsernameModal()
  await t.expect(registerModal.title.exists).ok({ timeout: longTimeout })
  await registerModal.typeUsername('joining-user')
  await registerModal.submit()

  // User waits for the spinner to disappear and then sees general channel
  const generalChannel = new Channel('general')
  await t.expect(new LoadingPanel('Creating community').title.exists).notOk(`"Creating community" spinner is still visible after ${longTimeout}ms`, { timeout: longTimeout })
  await t.expect(generalChannel.title.exists).ok('User can\'t see "general" channel', { timeout: longTimeout })
})
