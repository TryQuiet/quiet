import { createApp, noJest, sendMessage } from 'integration-tests'
import { fixture, test } from 'testcafe'
import logger from './logger'
import { DebugModeModal, JoinCommunityModal, LoadingPanel, RegisterUsernameModal, Channel } from './selectors'
import { goToMainPage } from './utils'
const log = logger('join')

const longTimeout = 500000
const timeout = 120_000

fixture`Joining user test`
  .beforeEach(async t => {
    await goToMainPage()
    await new DebugModeModal().close()
  })

test('User can join the community', async t => {
  const communityOwner = await createApp()
  const onionAddress = await noJest.createCommunity({ username: 'Owner', communityName: 'e2eCommunity', store: communityOwner.store })
  await sendMessage({
    message: 'Hi from the owner',
    channelName: 'general',
    store: communityOwner.store
  })
  await sendMessage({
    message: 'How are you?',
    channelName: 'general',
    store: communityOwner.store
  })

  const invitationCode = onionAddress.split('.')[0]
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

  // Joining user sees messages replicated from the owner
  const ownerMessages = generalChannel.getUserMessages('Owner')
  await t.expect(ownerMessages.exists).ok( { timeout: longTimeout })
  await t.expect(ownerMessages.textContent).contains('Hi from the owner')
  
  // Owner sends message
  await sendMessage({
    message: 'Hi joining-user!',
    channelName: 'general',
    store: communityOwner.store
  })
  
  await sendMessage({
    message: 'How are you 1 ?',
    channelName: 'general',
    store: communityOwner.store
  })
  await sendMessage({
    message: 'How are you 2 ?',
    channelName: 'general',
    store: communityOwner.store
  })
  console.log('3 ---> ', await ownerMessages.textContent)
  await t.expect(ownerMessages.textContent).contains('How are you 2 ?')
})
