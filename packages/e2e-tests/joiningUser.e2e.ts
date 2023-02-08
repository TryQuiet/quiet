// import { createApp, actions, waitForExpect, assertions } from 'integration-tests'
// import { fixture, test } from 'testcafe'
// import { JoinCommunityModal, LoadingPanel, RegisterUsernameModal, Channel } from './selectors'
// import { goToMainPage } from './utils'

// const longTimeout = 120_000

// let communityOwner = null

// fixture`Joining user test`
//   .before(async ctx => {
//     ctx.ownerUsername = 'alice'
//     ctx.ownerMessages = [
//       'Welcome to my community',
//       'Hi joining-user! Nice to see you here'
//     ]
//     ctx.joiningUserUsername = 'bob-joining'
//     ctx.joiningUserMessages = ['Hello']
//   })
//   .beforeEach(async () => {
//     await goToMainPage()
//   })
//   .afterEach(async () => {
//     if (communityOwner) {
//       await communityOwner.manager.closeAllServices()
//       communityOwner = null
//     }
//   })

// test('User can join the community and exchange messages', async t => {
//   // await goToMainPage()
//   // Owner creates community and sends a message
//   communityOwner = await createApp()
//   const onionAddress = await actions.createCommunity({
//     username: t.fixtureCtx.ownerUsername,
//     communityName: 'e2eCommunity',
//     store: communityOwner.store
//   })
//   await t.wait(2000) // Give the backend some time, headless tests are fast
//   await actions.sendMessage({
//     message: t.fixtureCtx.ownerMessages[0],
//     channelName: 'general',
//     store: communityOwner.store
//   })
//   const invitationCode = onionAddress.split('.')[0]

//   // User opens app for the first time, sees spinner, waits for spinner to disappear
//   await t.expect(new LoadingPanel('Starting Quiet').title.exists).notOk(`"Starting Quiet" spinner is still visible after ${longTimeout}ms`, { timeout: longTimeout })

//   // User sees "join community" page, types correct community code and submits
//   const joinModal = new JoinCommunityModal()
//   await t.expect(joinModal.title.exists).ok('User can\'t see "Join community" title')
//   await joinModal.typeCommunityCode(invitationCode)
//   await joinModal.submit()

//   // User sees "register username" page, enters the valid, non-taken name and submits by clicking on the button
//   const registerModal = new RegisterUsernameModal()
//   await t.expect(registerModal.title.exists).ok({ timeout: longTimeout })
//   await registerModal.typeUsername(t.fixtureCtx.joiningUserUsername)
//   await registerModal.submit()

//   // User waits for the spinner to disappear and then sees general channel
//   const generalChannel = new Channel('general')
//   await t.expect(new LoadingPanel('Creating community').title.exists).notOk(`"Creating community" spinner is still visible after ${longTimeout}ms`, { timeout: longTimeout })
//   await t.expect(generalChannel.title.exists).ok('User can\'t see "general" channel', { timeout: longTimeout })

//   // Owner is connected with joining user
//   await assertions.assertReceivedCertificates(t.fixtureCtx.ownerUsername, 2, longTimeout, communityOwner.store)
//   await assertions.assertConnectedToPeers(communityOwner.store, 1)

//   // Joining user sees message replicated from the owner
//   const ownerMessages = generalChannel.getUserMessages(t.fixtureCtx.ownerUsername)
//   await t.expect(ownerMessages.exists).ok({ timeout: longTimeout })
//   await t.expect(ownerMessages.textContent).contains(t.fixtureCtx.ownerMessages[0])

//   // Joining user sends a message and sees it on a channel
//   await generalChannel.sendMessage(t.fixtureCtx.joiningUserMessages[0])
//   const joiningUserMessages = generalChannel.getUserMessages(t.fixtureCtx.joiningUserUsername)
//   await t.expect(joiningUserMessages.exists).ok({ timeout: longTimeout })
//   await t.expect(joiningUserMessages.textContent).contains(t.fixtureCtx.joiningUserMessages[0])

//   // Owner receives the message sent by the joining user
//   await waitForExpect(() => assertions.assertReceivedMessagesMatch(
//     t.fixtureCtx.ownerUsername,
//     t.fixtureCtx.joiningUserMessages,
//     communityOwner.store
//   ))

//   // Owner sends message, user receives it
//   await actions.sendMessage({
//     message: t.fixtureCtx.ownerMessages[1],
//     channelName: 'general',
//     store: communityOwner.store
//   })
//   await t.expect(ownerMessages.count).eql(2)
//   await t.expect(ownerMessages.nth(1).textContent).contains(t.fixtureCtx.ownerMessages[1], { timeout: longTimeout })
//   await t.wait(2000)
// })
