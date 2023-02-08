// import { createApp, actions, assertions } from 'integration-tests'
// import { fixture, test, ClientFunction } from 'testcafe'
// import { Channel, CreateCommunityModal, JoinCommunityModal, LoadingPanel, RegisterUsernameModal, Sidebar } from './selectors'
// import { goToMainPage } from './utils'
// import logger from './logger'

// const log = logger('create')

// const longTimeout = 100000

// let joiningUserApp = null

// fixture`Lazy loading test`
//   .before(async ctx => {
//     ctx.lazyLoadingMessagesChunk = 50
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

// const scrollOnBottom = ClientFunction(() => {
//   const channelContent = document.querySelector('[data-testid=channelContent]')
//   return Math.floor(channelContent.scrollHeight - channelContent.scrollTop) === Math.floor(channelContent.clientHeight)
// })

// const scrollUp = ClientFunction(() => {
//   const channelContent = document.querySelector('[data-testid=channelContent]')
//   channelContent.scrollBy(0, -channelContent.scrollHeight)
// })

// test('Two users register, can scroll to older messages and switch channels', async t => {
//   // User opens app for the first time, sees spinner, waits for spinner to disappears
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
//   await t.expect(registerModal.title.exists).ok({ timeout: 10_000 })
//   await registerModal.typeUsername(t.fixtureCtx.ownerUsername)
//   await registerModal.submit()

//   // User waits for the spinner to disappear and then sees general channel
//   const generalChannel = new Channel('general')
//   await t.expect(new LoadingPanel('Creating community').title.exists).notOk(`"Creating community" spinner is still visible after ${longTimeout}ms`, { timeout: longTimeout })
//   await t.expect(generalChannel.title.exists).ok('User can\'t see "general" channel')

//   // Owner opens the settings tab and gets an invitation code
//   const sidebar = new Sidebar()
//   const settingsModal = await sidebar.openSettings()
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

//   // Users exchange messages
//   const sentMessages = []
//   sentMessages.push('Created #general') // Initial message sent automatically when creating a channel
//   for (let i = 0; i < 40; i++) {
//     const message = await actions.sendMessage({
//       message: `Message ${i}`,
//       channelName: 'general',
//       store: joiningUserApp.store
//     })
//     sentMessages.push(message.message)
//     console.log('Sending message', message.message)
//     const ownerMessage = `Response to ${message.message}`
//     await generalChannel.sendMessage(ownerMessage)
//     sentMessages.push(ownerMessage)
//     await t.expect(scrollOnBottom()).eql(true)
//   }

//   // Owner sees only a chunk of messages
//   const allMessages = generalChannel.getAllMessages()
//   await t.expect(allMessages.exists).ok()
//   await t.expect(allMessages.count).eql(t.fixtureCtx.lazyLoadingMessagesChunk, 'User should see 50 last messages before scrolling up', { timeout: 10_000 })
//   console.log('first message before scroll', await allMessages.nth(0).textContent)
//   await t.expect(allMessages.nth(0).textContent).eql(sentMessages[sentMessages.length - t.fixtureCtx.lazyLoadingMessagesChunk], `User should see ${t.fixtureCtx.lazyLoadingMessagesChunk} last messages before scrolling up`)
//   await t.expect(scrollOnBottom()).eql(true) // Scrollbar on bottom

//   // Owner scrolls up and can see first messages on the channel
//   await scrollUp()
//   await t.expect(scrollOnBottom()).eql(false)
//   console.log('user messages count', await allMessages.count, await allMessages.nth(0).textContent)
//   await t.expect(allMessages.nth(0).textContent).eql(sentMessages[0], 'User should see first message after scrolling up')

//   // Guest sends a message, owner's scrollbar should not move
//   const newMsg = await actions.sendMessage({
//     message: 'new',
//     channelName: 'general',
//     store: joiningUserApp.store
//   })
//   sentMessages.push(newMsg.message)
//   await t.expect(scrollOnBottom()).eql(false, 'Scrollbar should stay in place when user receives new message')

//   // Owner scrolls up and sends a message
//   await scrollUp()
//   await generalChannel.sendMessage('Responding')
//   sentMessages.push('Responding')
//   await t.expect(scrollOnBottom()).eql(true, 'Scrollbar should scroll to the bottom when user sends a message')
//   await t.expect(allMessages.nth(0).textContent).eql(sentMessages[sentMessages.length - t.fixtureCtx.lazyLoadingMessagesChunk], `User should see ${t.fixtureCtx.lazyLoadingMessagesChunk} last messages before scrolling up`)

//   // Scroll up before switching channel
//   await scrollUp()

//   // Owner creates a new channel
//   const newChannelName = 'test-channel'
//   const newChannel = await sidebar.addNewChannel(newChannelName)
//   await t.expect(newChannel.title.exists).ok(`User can't see "${newChannelName}" channel title`)

//   // Owner switches to 'general', sees scrollbar on the bottom and only chunk of messages
//   await sidebar.switchChannel('general')
//   await t.expect(scrollOnBottom()).eql(true, 'Scrollbar should be on the bottom when user switches channel')
//   await t.expect(allMessages.count).eql(t.fixtureCtx.lazyLoadingMessagesChunk, `User should see only ${t.fixtureCtx.lazyLoadingMessagesChunk} last messages after switching channel`)

//   await t.wait(5000)
//   // // The wait is needed here because testcafe plugin doesn't actually close the window so 'close' event is not called in electron.
//   // // See: https://github.com/TryQuiet/monorepo/issues/222
// })
