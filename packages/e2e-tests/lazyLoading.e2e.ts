import { createApp, sendMessage, actions, assertions } from 'integration-tests'
import { fixture, test, ClientFunction, Selector } from 'testcafe'
import { Channel, CreateCommunityModal, DebugModeModal, JoinCommunityModal, LoadingPanel, RegisterUsernameModal, Sidebar } from './selectors'
import { goToMainPage } from './utils'
import logger from './logger'

const log = logger('create')

const longTimeout = 100000

let joiningUserApp = null

fixture`New user test`
  .before(async ctx => {
    ctx.ownerUsername = 'bob'
    ctx.ownerMessages = ['Hi']
    ctx.joiningUserUsername = 'alice-joining'
    ctx.joiningUserMessages = ['Nice to meet you all']
  })
  .afterEach(async () => {
    if (joiningUserApp) {
      await joiningUserApp.manager.closeAllServices()
      joiningUserApp = null
    }
  })
  .beforeEach(async () => {
    await goToMainPage()
  })

const scrollOnBottom = ClientFunction(() => {
  const channelContent = document.querySelector("[data-testid=channelContent]")
  return Math.floor(channelContent.scrollHeight - channelContent.scrollTop) === Math.floor(channelContent.clientHeight)
});

const scrollY = ClientFunction(() => {
  const channelContent = document.querySelector("[data-testid=channelContent]")
  channelContent.scrollBy(0, -channelContent.scrollHeight)
})

test('User can create new community, register and send few messages to general channel', async t => {
  // User opens app for the first time, sees spinner, waits for spinner to disappears
  await t.expect(new LoadingPanel('Starting Quiet').title.exists).notOk(`"Starting Quiet" spinner is still visible after ${longTimeout}ms`, { timeout: longTimeout })

  // User sees "join community" page and switches to "create community" view by clicking on the link
  const joinModal = new JoinCommunityModal()
  await t.expect(joinModal.title.exists).ok('User can\'t see "Join community" title')
  await joinModal.switchToCreateCommunity()

  // User is on "Create community" page, enters valid community name and presses the button
  const createModal = new CreateCommunityModal()
  await t.expect(createModal.title.exists).ok()
  await createModal.typeCommunityName('testcommunity')
  await createModal.submit()

  // User sees "register username" page, enters the valid name and submits by clicking on the button
  const registerModal = new RegisterUsernameModal()
  await t.expect(registerModal.title.exists).ok({timeout: 10_000})
  await registerModal.typeUsername(t.fixtureCtx.ownerUsername)
  await registerModal.submit()

  // User waits for the spinner to disappear and then sees general channel
  const generalChannel = new Channel('general')
  await t.expect(new LoadingPanel('Creating community').title.exists).notOk(`"Creating community" spinner is still visible after ${longTimeout}ms`, { timeout: longTimeout })
  await t.expect(generalChannel.title.exists).ok('User can\'t see "general" channel')

  // User sends a message
  await t.expect(generalChannel.messageInput.exists).ok()
  await generalChannel.sendMessage(t.fixtureCtx.ownerMessages[0])

  // Sent message is visible in a channel
  const messages = generalChannel.getUserMessages(t.fixtureCtx.ownerUsername)
  await t.expect(messages.exists).ok({ timeout: 30000 })
  await t.expect(messages.textContent).contains(t.fixtureCtx.ownerMessages[0])

  // Opens the settings tab and gets an invitation code
  const settingsModal = await new Sidebar().openSettings()
  await settingsModal.switchTab('invite') // TODO: Fix - the invite tab should be default for the owner
  await t.expect(settingsModal.title.exists).ok()
  await t.expect(settingsModal.invitationCode.exists).ok()
  const invitationCode = await settingsModal.invitationCode.textContent
  log('Received invitation code:', invitationCode)
  await settingsModal.close()

  // Guest opens the app and joins the new community successfully
  joiningUserApp = await createApp()
  await actions.joinCommunity({
    registrarAddress: invitationCode,
    userName: t.fixtureCtx.joiningUserUsername,
    expectedPeersCount: 2,
    store: joiningUserApp.store
  })
  await assertions.assertReceivedCertificates(t.fixtureCtx.joiningUserUsername, 2, longTimeout, joiningUserApp.store)
  await assertions.assertConnectedToPeers(joiningUserApp.store, 1)
  await assertions.assertReceivedChannel(
    t.fixtureCtx.joiningUserUsername,
    'general',
    longTimeout,
    joiningUserApp.store
  )
  await t.wait(2000) // Give the waggle some time, headless tests are fast

  const sentMessages = []
  for (let i=0; i < 40; i++) {
    const message = `Message ${i}`
    sentMessages.push(message)
    console.log('Sending message', message)
    await sendMessage({
      message,
      channelName: 'general',
      store: joiningUserApp.store
    })
    await generalChannel.sendMessage(`Response to ${message}`)
  }

  // Owner sees messages sent by the guest
  const joiningUserMessages = generalChannel.getUserMessages(t.fixtureCtx.joiningUserUsername)
  await t.expect(joiningUserMessages.exists).ok({ timeout: longTimeout })
  console.log('- - ->', await joiningUserMessages.textContent)
  
  await t.expect(joiningUserMessages.textContent).contains(`Message 29`, { timeout: longTimeout }) // Check if the last message has been received
  await t.expect(scrollOnBottom()).eql(true) // Scrollbar on bottom

  // User scrolls up
  await scrollY()
  await t.expect(scrollOnBottom()).eql(false)

  // Guest sends a message
  await sendMessage({
    message: 'new',
    channelName: 'general',
    store: joiningUserApp.store
  })
  await t.expect(scrollOnBottom()).eql(true, 'Scroll should land on the bottom when user receives new message')

  // User scrolls up and sends a message
  await scrollY()
  await generalChannel.sendMessage('Responding')
  await t.expect(scrollOnBottom()).eql(false, 'Scrollbar should stay in place when user sends a message')

  await t.wait(2000)
  // // The wait is needed here because testcafe plugin doesn't actually close the window so 'close' event is not called in electron.
  // // See: https://github.com/ZbayApp/monorepo/issues/222
})