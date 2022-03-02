import { Selector, t } from 'testcafe'

export class LoadingPanel {
  private readonly text: string

  constructor(title: string) {
    this.text = title
  }

  get title() {
    return Selector('span').withText(this.text)
  }
}

export class Channel {
  private readonly name: string

  constructor(name: string) {
    this.name = name
  }

  get title() {
    return Selector('h6').withText(`#${this.name}`)
  }

  get messagesList() {
    return Selector('ul').withAttribute('id', 'messages-scroll')
  }

  get messagesGroup() {
    return this.messagesList.find('li')
  }

  get messagesGroupContent() {
    return this.messagesGroup.find('p').withAttribute('data-testid', /messagesGroupContent-/)
  }

  get messageInput () {
    return Selector('div').withAttribute('data-testid', 'messageInput')
  }

  async sendMessage(message: string) {
    await t.typeText(this.messageInput, message)
    await t.pressKey('enter')
  }
}

export class JoinCommunityModal {
  get title() {
    return Selector('h3').withText('Join community')
  }

  async switchToCreateCommunity() {
    await t.click(Selector('a').withAttribute('data-testid', 'JoinCommunityLink'))
  }
}

export class CreateCommunityModal {
  get title() {
    return Selector('h3').withText('Create your community')
  }

  async typeCommunityName(name: string) {
    const communityNameInput = Selector('input').withAttribute('placeholder', 'Community name')
    await t.typeText(communityNameInput, name)
  }

  async submit() {
    const continueButton = Selector('button').withAttribute('data-testid', 'continue-createCommunity')
    await t.click(continueButton)
  }
}

export class RegisterUsernameModal {
  get title() {
    return Selector('h3').withText('Register a username')
  }

  async typeUsername(username: string) {
    const usernameInput = Selector('input').withAttribute('name', 'userName').filterVisible()
    await t.expect(usernameInput.exists).ok()
    await t.typeText(usernameInput, username)
  }

  async submit() {
    const submitButton = Selector('button').withText('Register')
    await t.click(submitButton)
  }
}

export class DebugModeModal {
  get title() {
    return Selector('h3').withText('App is running in debug mode')
  }

  async close() {
    await t.click(Selector('button').withText('Understand'))
  }
}
