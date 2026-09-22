import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import userEvent from '@testing-library/user-event'
import { renderComponent } from '../../../testUtils'
import { ChannelLinkNavigation, TextMessageComponent } from './TextMessage'
import { channelLinkHref } from './remarkChannelLinks'

const GENERAL_ID = 'general-channel-id'
const DESIGN_ID = 'design-channel-id'

const channelLinks = (onChannelLinkClick = jest.fn()): ChannelLinkNavigation => ({
  channels: new Map([
    ['general', GENERAL_ID],
    ['design', DESIGN_ID],
    ['design-review', 'design-review-channel-id'],
  ]),
  onChannelLinkClick,
})

const renderMessage = (message: string, navigation?: ChannelLinkNavigation, openUrl = jest.fn()) => ({
  openUrl,
  ...renderComponent(
    <TextMessageComponent
      message={message}
      messageId='message-id'
      pending={false}
      openUrl={openUrl}
      channelLinks={navigation}
    />
  ),
})

describe('TextMessage channel mentions', () => {
  it('turns a mention of an existing channel into a link to that channel', () => {
    const { baseElement } = renderMessage('see #general for details', channelLinks())

    const link = baseElement.querySelector('a')
    expect(link).not.toBeNull()
    expect(link).toHaveTextContent('#general')
    expect(link).toHaveAttribute('href', channelLinkHref(GENERAL_ID))
    expect(baseElement).toHaveTextContent('see #general for details')
  })

  it('calls onChannelLinkClick with the channel id when the link is clicked', async () => {
    const onChannelLinkClick = jest.fn()
    const { baseElement, openUrl } = renderMessage('see #general for details', channelLinks(onChannelLinkClick))

    await userEvent.click(baseElement.querySelector('a') as HTMLAnchorElement)

    expect(onChannelLinkClick).toHaveBeenCalledTimes(1)
    expect(onChannelLinkClick).toHaveBeenCalledWith(GENERAL_ID)
    // A channel link navigates inside the app; it must never reach the external browser.
    expect(openUrl).not.toHaveBeenCalled()
  })

  it('prefers the longest matching channel name', () => {
    const { baseElement } = renderMessage('see #design-review please', channelLinks())

    expect(baseElement.querySelector('a')).toHaveTextContent('#design-review')
  })

  it('leaves trailing sentence punctuation outside the link', () => {
    const { baseElement } = renderMessage('go to #general.', channelLinks())

    expect(baseElement.querySelector('a')).toHaveTextContent('#general')
    expect(baseElement).toHaveTextContent('go to #general.')
  })

  it('links every mention in a message', () => {
    const { baseElement } = renderMessage('#general and #design', channelLinks())

    const links = Array.from(baseElement.querySelectorAll('a'))
    expect(links.map(link => link.getAttribute('href'))).toEqual([
      channelLinkHref(GENERAL_ID),
      channelLinkHref(DESIGN_ID),
    ])
  })

  describe('does not link', () => {
    it.each([
      ['an unknown channel name', 'try #nope for details'],
      ['a name that only starts with a channel name', 'that is #generalize really'],
      ['a mention glued to a preceding word', 'not a mention: foo#general'],
      ['a mention inside inline code', 'inline code: `#general` stays code'],
      ['a fragment inside an autolinked url', 'see https://example.com/#general'],
      ['a doubled hash', 'see ##general'],
    ])('%s', (_label: string, message: string) => {
      const { baseElement } = renderMessage(message, channelLinks())

      expect(baseElement.querySelectorAll('[data-testid="channelLink"]')).toHaveLength(0)
      expect(baseElement).toHaveTextContent(message.replace(/`/g, ''))
    })

    it('a mention inside a fenced code block', () => {
      const { baseElement } = renderMessage('```\nping #general\n```', channelLinks())

      expect(baseElement.querySelectorAll('[data-testid="channelLink"]')).toHaveLength(0)
      expect(baseElement.querySelector('code')).toHaveTextContent('ping #general')
    })
  })

  it('keeps the url of an autolinked address intact', () => {
    const { baseElement } = renderMessage('see https://example.com/#general', channelLinks())

    expect(baseElement.querySelector('a')).toHaveAttribute('href', 'https://example.com/#general')
  })

  it('still opens a real url in the browser', async () => {
    const { baseElement, openUrl } = renderMessage('see https://example.com/ now', channelLinks())

    await userEvent.click(baseElement.querySelector('a') as HTMLAnchorElement)

    expect(openUrl).toHaveBeenCalledWith('https://example.com/')
  })

  it('renders mentions as plain text when no channel list is supplied', () => {
    const { baseElement } = renderMessage('see #general for details')

    expect(baseElement.querySelectorAll('a')).toHaveLength(0)
    expect(baseElement).toHaveTextContent('see #general for details')
  })

  it('ignores a hand-written link to a channel the user cannot see', async () => {
    const onChannelLinkClick = jest.fn()
    const { baseElement, openUrl } = renderMessage(
      `[click me](${channelLinkHref('secret-channel-id')})`,
      channelLinks(onChannelLinkClick)
    )

    await userEvent.click(baseElement.querySelector('a') as HTMLAnchorElement)

    expect(onChannelLinkClick).not.toHaveBeenCalled()
    // Nor may it fall through to the browser - `#channel/…` is not a url anyone should visit.
    expect(openUrl).not.toHaveBeenCalled()
  })
})
