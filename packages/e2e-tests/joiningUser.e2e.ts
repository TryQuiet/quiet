import { createApp, sendMessage, actions, waitForExpect, assertions } from 'integration-tests'
import { fixture, test } from 'testcafe'
import logger from './logger'
import { DebugModeModal, JoinCommunityModal, LoadingPanel, RegisterUsernameModal, Channel } from './selectors'
import { goToMainPage } from './utils'
const log = logger('join')

const longTimeout = 120_000

fixture`Joining user test`
  .before(async ctx => {
    ctx.ownerUsername = 'alice'
    ctx.joiningUserUsername = 'bob-joining'
  })
  .beforeEach(async t => {
    await goToMainPage()
    await new DebugModeModal().close()
  })

test('User can join the community and exchange messages', async t => {
  // Owner creates community and sends a message
  const communityOwner = await createApp()
  const onionAddress = await actions.createCommunity({
    username: t.fixtureCtx.ownerUsername,
    communityName: 'e2eCommunity',
    store: communityOwner.store
  })
  await sendMessage({
    message: 'Welcome to my community',
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

  // User sees "register username" page, enters the valid, non-taken name and submits by clicking on the button
  const registerModal = new RegisterUsernameModal()
  await t.expect(registerModal.title.exists).ok({ timeout: longTimeout })
  await registerModal.typeUsername(t.fixtureCtx.joiningUserUsername)
  await registerModal.submit()

  // User waits for the spinner to disappear and then sees general channel
  const generalChannel = new Channel('general')
  await t.expect(new LoadingPanel('Creating community').title.exists).notOk(`"Creating community" spinner is still visible after ${longTimeout}ms`, { timeout: longTimeout })
  await t.expect(generalChannel.title.exists).ok('User can\'t see "general" channel', { timeout: longTimeout })

  // Joining user sees message replicated from the owner
  const ownerMessages = generalChannel.getUserMessages(t.fixtureCtx.ownerUsername)
  await t.expect(ownerMessages.exists).ok({ timeout: longTimeout })
  await t.expect(ownerMessages.textContent).contains('Welcome to my community')

  // Joining user sends a message and sees it on a channel
  await generalChannel.sendMessage('Hello')
  const joiningUserMessages = generalChannel.getUserMessages(t.fixtureCtx.joiningUserUsername)
  await t.expect(joiningUserMessages.exists).ok({ timeout: longTimeout })
  await t.expect(joiningUserMessages.textContent).contains('Hello')

  // Owner receives the message sent by the joining user
  await waitForExpect(() => assertions.assertReceivedMessagesMatch(t.fixtureCtx.ownerUsername, ['Hello'], communityOwner.store))

  // Owner sends message, user receives it
  await sendMessage({
    message: 'Hi joining-user! Nice to see you here',
    channelName: 'general',
    store: communityOwner.store
  })
  await t.expect(ownerMessages.count).eql(2)
  await t.expect(ownerMessages.nth(1).textContent).contains('Hi joining-user! Nice to see you here', { timeout: longTimeout })

  // Owner closes the app
  await communityOwner.manager.closeAllServices()
})
