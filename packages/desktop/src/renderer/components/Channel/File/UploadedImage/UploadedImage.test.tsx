import { DisplayableMessage, MessageType } from '@quiet/state-manager'
import React from 'react'

import { renderComponent } from '../../../../testUtils/renderComponent'
import UploadedImage from './UploadedImage'

describe('UploadedFile', () => {
  let message: DisplayableMessage

  beforeEach(() => {
    message = {
      id: 'string',
      type: MessageType.Image,
      message: '',
      createdAt: 1636995488.44,
      date: 'string',
      nickname: 'bob',
      media: {
        path: null,
        name: 'test',
        ext: '.png',
        cid: 'abcd1234',
        width: 500,
        height: 600,
        message: {
          id: 'string',
          channelAddress: 'general'
        }
      }
    }
  })

  it('renders a placeholder if image is not finished downloading yet', () => {
    const result = renderComponent(<UploadedImage message={message} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="css-gd4qex"
          >
            <div
              class="css-1b4jr6y"
              data-testid="abcd1234-imagePlaceholder"
            >
              <p
                class="css-h94c3"
              >
                test.png
              </p>
              <div
                class="UploadedImagePlaceholderplaceholder"
                style="width: 400px;"
              >
                <img
                  class="UploadedImagePlaceholderplaceholderIcon"
                  src="test-file-stub"
                />
                <span
                  class="MuiCircularProgress-root MuiCircularProgress-indeterminate MuiCircularProgress-colorInherit css-62e83j-MuiCircularProgress-root"
                  role="progressbar"
                  style="width: 16px; height: 16px;"
                >
                  <svg
                    class="MuiCircularProgress-svg css-1idz92c-MuiCircularProgress-svg"
                    viewBox="22 22 44 44"
                  >
                    <circle
                      class="MuiCircularProgress-circle MuiCircularProgress-circleIndeterminate MuiCircularProgress-circleDisableShrink css-79nvmn-MuiCircularProgress-circle"
                      cx="44"
                      cy="44"
                      fill="none"
                      r="20.2"
                      stroke-width="3.6"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
  it('renders image if image is downloaded', () => {
    message.media.path = 'path/to/file/test.png'
    message.media.message = {
      id: 'string',
      channelAddress: 'general'
    }
    const result = renderComponent(<UploadedImage message={message} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="css-gd4qex"
          >
            <div
              class="UploadedImagecontainer"
            >
              <div
                class="UploadedImageimage"
                data-testid="abcd1234-imageVisual"
              >
                <p
                  class="css-h94c3"
                >
                  test.png
                </p>
                <img
                  class="UploadedImageimage"
                  src="path/to/file/test.png"
                  style="width: 400px;"
                />
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
