import { fixture, test, Selector } from 'testcafe'

fixture`Electron test`
  .page('../dist/src/main/index.html#/');

const longTimeout = 100000

test('User can create new community, register and send few messages to general channel', async t => {
  // User opens app for the first time, sees spinner, waits for spinner to disappear
  await t.expect(Selector('span').withText('Starting Zbay').exists).notOk(`"Starting Zbay" spinner is still visible after ${longTimeout}ms`, { timeout: longTimeout })

  // User sees "join community" page and switches to "create community" view by clicking on the link
  const joinCommunityTitle = await Selector('h3').withText('Join community')()
  await t.expect(joinCommunityTitle).ok('User can\'t see "Join community" title')
  const createCommunityLink = Selector('a').withAttribute('data-testid', 'JoinCommunityLink')
  await t.click(createCommunityLink)

  // User is on "Create community" page, enters valid community name and presses the button
  const createCommunityTitle = await Selector('h3').withText('Create your community')()
  await t.expect(createCommunityTitle).ok()
  const continueButton2 = Selector('button').withText("Continue")
  const communityNameInput = Selector('input').withAttribute('placeholder', 'Community name')
  await t.typeText(communityNameInput, 'testcommunity')
  await t.click(continueButton2)

  // User sees "register username" page, enters the valid name and submits by clicking on the button
  const registerUsernameTitle = await Selector('h3').withText('Register a username')()
  await t.expect(registerUsernameTitle).ok()
  const usernameInput = Selector('input').withAttribute('name', 'userName').filterVisible()
  const submitButton = Selector('button').withText("Register")
  await t.expect(usernameInput.exists).ok()
  const username = 'testuser'
  await t.typeText(usernameInput, username)
  await t.click(submitButton)

  // User waits for the spinner to disappear and then sees general channel
  await t.expect(Selector('span').withText('Creating community').exists).notOk(`"Creating community" spinner is still visible after ${longTimeout}ms`, { timeout: longTimeout })
  await t.expect(Selector('h6').withText('#general').exists).ok('User can\'t see "general" channel')

  // User types a message, hits enter
  const messageInput = Selector('div').withAttribute('placeholder', `Message #general as @${username}`)
  await t.expect(messageInput.exists).ok()
  await t.typeText(messageInput, 'Hello everyone')
  await t.pressKey('enter')

  // Sent message is visible on the messages' list as part of a group
  const messagesList = Selector('ul').withAttribute('id', 'messages-scroll')
  await t.expect(messagesList.exists).ok('Could not find placeholder for messages', { timeout: 30000 })

  const messagesGroup = messagesList.find('li')
  await t.expect(messagesGroup.exists).ok({ timeout: 30000 })
  await t.expect(messagesGroup.count).eql(1)

  const messageGroupContent = messagesGroup.find('p').withAttribute('data-testid', /messagesGroupContent-/)
  await t.expect(messageGroupContent.exists).ok()
  await t.expect(messageGroupContent.textContent).eql('Hello\xa0everyone')

  // Send second message, should appear in the same messages group
  await t.typeText(messageInput, 'Welcome')
  await t.pressKey('enter')
  await t.expect(messagesGroup.count).eql(1)
  await t.expect(messageGroupContent.textContent).eql('Hello\xa0everyone\nWelcome')
})
