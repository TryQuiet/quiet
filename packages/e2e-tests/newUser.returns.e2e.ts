// import { fixture, test, t } from 'testcafe'
// import {
//   Channel,
//   LoadingPanel
// } from './selectors'
// import { goToMainPage } from './utils'

// const longTimeout = 100000

// fixture`Reopen test`
//   .before(async ctx => {
//     ctx.ownerUsername = 'bob'
//     ctx.ownerMessages = ['Hi']
//     ctx.joiningUserUsername = 'alice-joining'
//     ctx.joiningUserMessages = ['Nice to meet you all']
//   })
//   .beforeEach(async () => {
//     await goToMainPage()
//   })

// test('User reopens app, sees general channel and the messages he sent before', async t => {
//   // User opens app for the first time, sees spinner, waits for spinner to disappear
//   await t
//     .expect(new LoadingPanel('Starting Quiet').title.exists)
//     .notOk(`"Starting Quiet" spinner is still visible after ${longTimeout}ms`, {
//       timeout: longTimeout
//     })

//   // Returning user sees "general" channel
//   const generalChannel = new Channel('general')
//   await t.expect(generalChannel.title.exists).ok('User can\'t see "general" channel')

//   // Returning user sees everyone's messages
//   const ownerMessages = generalChannel.getUserMessages(t.fixtureCtx.ownerUsername)
//   await t.expect(ownerMessages.exists).ok({ timeout: longTimeout })
//   await t.expect(ownerMessages.textContent).contains(t.fixtureCtx.ownerMessages[0])

//   const joiningUserMessages = generalChannel.getUserMessages(t.fixtureCtx.joiningUserUsername)
//   await t.expect(joiningUserMessages.exists).ok({ timeout: longTimeout })
//   await t.expect(joiningUserMessages.textContent).contains(t.fixtureCtx.joiningUserMessages[0])
// })
