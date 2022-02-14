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
