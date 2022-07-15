import { MessageType } from '@quiet/state-manager'
import React from 'react'
import { generateMessages, renderComponent } from '../../../testUtils'

import NestedMessageContent from './NestedMessageContent'

describe('NestedMessageContent', () => {
  it('renders message', () => {
    const messages = generateMessages()
    const result = renderComponent(
      <NestedMessageContent pending={false} message={messages[0]} openUrl={jest.fn()} />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-item"
          >
            <span
              class="MuiTypography-root makeStyles-message-1 MuiTypography-body1"
              data-testid="messagesGroupContent-0"
            >
              message0
            </span>
          </div>
        </div>
      </body>
    `)
  })

  it('renders pending message', () => {
    const messages = generateMessages()
    const result = renderComponent(
      <NestedMessageContent pending={true} message={messages[0]} openUrl={jest.fn()} />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-item"
          >
            <span
              class="MuiTypography-root makeStyles-message-138 makeStyles-pending-139 MuiTypography-body1"
              data-testid="messagesGroupContent-0"
            >
              message0
            </span>
          </div>
        </div>
      </body>
    `)
  })

  it('renders info message', () => {
    const messages = generateMessages({ type: 3 })
    const result = renderComponent(
      <NestedMessageContent pending={true} message={messages[0]} openUrl={jest.fn()} />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-item"
          >
            <span
              class="MuiTypography-root makeStyles-message-275 makeStyles-pending-276 MuiTypography-body1"
              data-testid="messagesGroupContent-0"
            >
              message0
            </span>
          </div>
        </div>
      </body>
    `)
  })

  it('renders file', () => {
    const message = {
      id: 'string',
      type: MessageType.Image,
      message: '',
      createdAt: 1636995488.44,
      date: 'string',
      nickname: 'bob',
      media: {
        path: 'path/to/file/test.png',
        name: 'test',
        ext: '.png',
        cid: 'abcd1234',
        width: 500,
        height: 600,
        id: 'string',
        channelAddress: 'general'
      }
    }
    const result = renderComponent(
      <NestedMessageContent pending={false} message={message} openUrl={jest.fn()} />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-item"
          >
            <div
              class="makeStyles-message-412"
              data-testid="messagesGroupContent-string"
            >
              <div
                class="makeStyles-container-520"
              >
                <div
                  class="makeStyles-image-519"
                  data-testid="abcd1234-imageVisual"
                >
                  <p
                    class="makeStyles-fileName-524"
                  >
                    test.png
                  </p>
                  <img
                    class="makeStyles-image-519"
                    src="path/to/file/test.png"
                    style="width: 400px;"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
