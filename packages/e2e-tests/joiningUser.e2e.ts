// // import { createApp, noJest } from 'integration-tests'
// import { fixture, test } from 'testcafe'
// import logger from './logger'
// import { DebugModeModal, JoinCommunityModal, LoadingPanel, RegisterUsernameModal } from './selectors'
// import { goToMainPage } from './utils'
// const log = logger('join')

// const longTimeout = 500000
// const timeout = 120_000


// fixture`Joining user test`
//   .before(async ctx => {
//     log('BEFORE')

//     // const communityOwner = await createApp()
//     // const onionAddress = await noJest.createCommunity({ username: 'Owner', communityName: 'e2eCommunity', store: communityOwner.store })
//     // ctx.onionAddress = onionAddress
//     // log('ONION', onionAddress)
//     log('AFTER - - - ')
//   })
//   .beforeEach(async t => {
//     await goToMainPage()
//     await new DebugModeModal().close()
//   })

// //   .after(async t => {
// //     const dataPath = fs.readFileSync('/tmp/appDataPath', { encoding: 'utf8' })
// //     const fullDataPath = path.join(dataPath, 'Quiet')
// //     console.log(`Test data is in ${fullDataPath}. You may want to remove it.`)
// //     // await fs.rm(fullDataPath, { recursive: true, force: true }) // TODO: use this with node >=14, rmdirSync doesn't seem to work
// //   })

// test('User can join the community', async t => {
//   log('RECEIVED ADDRESS', t.fixtureCtx.onionAddress)
//   //   // User opens app for the first time, sees spinner, waits for spinner to disappear
//   await t.expect(new LoadingPanel('Starting Quiet').title.exists).notOk(`"Starting Quiet" spinner is still visible after ${longTimeout}ms`, { timeout: longTimeout })

//   // User sees "join community" page and switches to "create community" view by clicking on the link
//   const joinModal = new JoinCommunityModal()
//   await t.expect(joinModal.title.exists).ok('User can\'t see "Join community" title')
//   await joinModal.typeCommunityCode(t.fixtureCtx.onionAddress)
//   await joinModal.submit()

//   //   // User sees "register username" page, enters the valid name and submits by clicking on the button
//   const registerModal = new RegisterUsernameModal()
//   await t.expect(registerModal.title.exists).ok()

// })
// //   // User opens app for the first time, sees spinner, waits for spinner to disappear
// //   await t.expect(new LoadingPanel('Starting Quiet').title.exists).notOk(`"Starting Quiet" spinner is still visible after ${longTimeout}ms`, { timeout: longTimeout })

// //   // User sees "join community" page and switches to "create community" view by clicking on the link
// //   const joinModal = new JoinCommunityModal()
// //   await t.expect(joinModal.title.exists).ok('User can\'t see "Join community" title')
// //   await joinModal.switchToCreateCommunity()

// //   // User is on "Create community" page, enters valid community name and presses the button
// //   const createModal = new CreateCommunityModal()
// //   await t.expect(createModal.title.exists).ok()
// //   await createModal.typeCommunityName('testcommunity')
// //   await createModal.submit()

// //   // User sees "register username" page, enters the valid name and submits by clicking on the button
// //   const registerModal = new RegisterUsernameModal()
// //   await t.expect(registerModal.title.exists).ok()
// //   await registerModal.typeUsername('testuser')
// //   await registerModal.submit()

// //   // User waits for the spinner to disappear and then sees general channel
// //   const generalChannel = new Channel('general')
// //   await t.expect(new LoadingPanel('Creating community').title.exists).notOk(`"Creating community" spinner is still visible after ${longTimeout}ms`, { timeout: longTimeout })
// //   await t.expect(generalChannel.title.exists).ok('User can\'t see "general" channel')

// //   // User sends a message
// //   await t.expect(generalChannel.messageInput.exists).ok()
// //   await generalChannel.sendMessage('Hello everyone')

// //   // Sent message is visible on the messages' list as part of a group
// //   await t.expect(generalChannel.messagesList.exists).ok('Could not find placeholder for messages', { timeout: 30000 })

// //   await t.expect(generalChannel.messagesGroup.exists).ok({ timeout: 30000 })
// //   await t.expect(generalChannel.messagesGroup.count).eql(1)
// //   await t.expect(generalChannel.messagesGroupContent.exists).ok()
// //   await t.expect(generalChannel.messagesGroupContent.textContent).eql('Hello\xa0everyone')
// //   await t.wait(5000)
// //   // The wait is needed here because testcafe plugin doesn't actually close the window so 'close' event is not called in electron.
// //   // See: https://github.com/ZbayApp/monorepo/issues/222
// // })

