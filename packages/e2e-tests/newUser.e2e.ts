// import { createApp, actions, assertions } from 'integration-tests'
// import { fixture, test, t } from 'testcafe'
// import { Channel, CreateCommunityModal, JoinCommunityModal, LoadingPanel, RegisterUsernameModal, Sidebar } from './selectors'
// import { goToMainPage } from './utils'
// import logger from './logger'

// const log = logger('create')

// const longTimeout = 100000

// let joiningUserApp = null

// fixture`New user test`
//   .before(async ctx => {
//     ctx.ownerUsername = 'bob'
//     ctx.ownerMessages = ['Hi']
//     ctx.joiningUserUsername = 'alice-joining'
//     ctx.joiningUserMessages = ['Nice to meet you all']
//   })
//   .afterEach(async () => {
//     if (joiningUserApp) {
//       await joiningUserApp.manager.closeAllServices()
//       joiningUserApp = null
//     }
//   })
//   .beforeEach(async () => {
//     await goToMainPage()
//   })

// // .after(async t => {
// //   const dataPath = fs.readFileSync('/tmp/appDataPath', { encoding: 'utf8' })
// //   const fullDataPath = path.join(dataPath, process.env.DATA_DIR)
// //   console.log(`Removing ${fullDataPath}`)

// //   // Throws 'Property 'rm' does not exist on type 'typeof import("fs")'.ts(2339)'
// //   await fs.rm(fullDataPath, { recursive: true, force: true })
// // })

// test('User can create new community, register and send few messages to general channel', async t => {
//   // User opens app for the first time, sees spinner, waits for spinner to disappear

//   await t.expect(new LoadingPanel('Starting Quiet').title.exists).notOk(`"Starting Quiet" spinner is still visible after ${longTimeout}ms`, { timeout: longTimeout })

//   // User sees "join community" page and switches to "create community" view by clicking on the link
//   const joinModal = new JoinCommunityModal()
//   await t.expect(joinModal.title.exists).ok('User can\'t see "Join community" title')
//   await joinModal.switchToCreateCommunity()

//   // User is on "Create community" page, enters valid community name and presses the button
//   const createModal = new CreateCommunityModal()
//   await t.expect(createModal.title.exists).ok()
//   await createModal.typeCommunityName('testcommunity')
//   await createModal.submit()

//   // User sees "register username" page, enters the valid name and submits by clicking on the button
//   const registerModal = new RegisterUsernameModal()
//   await t.expect(registerModal.title.exists).ok()
//   await registerModal.typeUsername(t.fixtureCtx.ownerUsername)
//   await registerModal.submit()

//   // User waits for the spinner to disappear and then sees general channel
//   const generalChannel = new Channel('general')
//   await t.expect(new LoadingPanel('Creating community').title.exists).notOk(`"Creating community" spinner is still visible after ${longTimeout}ms`, { timeout: longTimeout })
//   await t.expect(generalChannel.title.exists).ok('User can\'t see "general" channel')

//   // User sends a message
//   await t.expect(generalChannel.messageInput.exists).ok()
//   await generalChannel.sendMessage(t.fixtureCtx.ownerMessages[0])

//   // Sent message is visible in a channel
//   const messages = generalChannel.getUserMessages(t.fixtureCtx.ownerUsername)
//   await t.expect(messages.exists).ok({ timeout: 30000 })
//   await t.expect(messages.textContent).contains(t.fixtureCtx.ownerMessages[0])

//   // Opens the settings tab and gets an invitation code
//   const settingsModal = await new Sidebar().openSettings()
//   await settingsModal.switchTab('invite') // TODO: Fix - the invite tab should be default for the owner
//   await t.expect(settingsModal.title.exists).ok()
//   await t.expect(settingsModal.invitationCode.exists).ok()
//   const invitationCode = await settingsModal.invitationCode.textContent
//   log('Received invitation code:', invitationCode)
//   await settingsModal.close()

//   // Guest opens the app and joins the new community successfully
//   joiningUserApp = await createApp()
//   await actions.joinCommunity({
//     registrarAddress: invitationCode,
//     userName: t.fixtureCtx.joiningUserUsername,
//     expectedPeersCount: 2,
//     store: joiningUserApp.store
//   })
//   await assertions.assertReceivedCertificates(t.fixtureCtx.joiningUserUsername, 2, longTimeout, joiningUserApp.store)
//   await assertions.assertConnectedToPeers(joiningUserApp.store, 1)
//   await assertions.assertReceivedChannel(
//     t.fixtureCtx.joiningUserUsername,
//     'general',
//     longTimeout,
//     joiningUserApp.store
//   )
//   await t.wait(2000) // Give the backend some time, headless tests are fast

//   await actions.sendMessage({
//     message: t.fixtureCtx.joiningUserMessages[0],
//     channelName: 'general',
//     store: joiningUserApp.store
//   })

//   // Owner sees message sent by the guest
//   const joiningUserMessages = generalChannel.getUserMessages(t.fixtureCtx.joiningUserUsername)
//   await t.expect(joiningUserMessages.exists).ok({ timeout: longTimeout })
//   await t.expect(joiningUserMessages.textContent).contains(t.fixtureCtx.joiningUserMessages[0])

//   await t.wait(10000)
//   // // The wait is needed here because testcafe plugin doesn't actually close the window so 'close' event is not called in electron.
//   // // See: https://github.com/TryQuiet/monorepo/issues/222
// })
