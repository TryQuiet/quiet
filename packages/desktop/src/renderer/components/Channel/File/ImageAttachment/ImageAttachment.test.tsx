import { DisplayableMessage, DownloadState, DownloadStatus, MessageType } from '@quiet/types'
import React from 'react'
import '@testing-library/jest-dom'

import { renderComponent } from '../../../../testUtils/renderComponent'
import ImageAttachment from './ImageAttachment'

describe('FileAttachment', () => {
  let message: DisplayableMessage
  let downloadStatus: DownloadStatus
  let processingMessage: DisplayableMessage

  beforeEach(() => {
    message = {
      id: 'string',
      type: MessageType.Image,
      message: '',
      createdAt: 1636995488.44,
      date: 'string',
      nickname: 'bob',
      isDuplicated: false,
      isRegistered: true,
      pubKey: 'string',
      media: {
        path: null,
        name: 'test',
        ext: '.png',
        cid: 'abcd1234',
        width: 500,
        height: 600,
        message: {
          id: 'string',
          channelId: 'general',
        },
      },
    }

    // Create a processing image message without width/height
    processingMessage = {
      ...message,
      // Cast to any to bypass TypeScript checks for test purposes
      media: {
        path: null,
        name: 'test',
        ext: '.png',
        cid: '', // Empty cid for processing images
        width: undefined,
        height: undefined,
        message: {
          id: 'string',
          channelId: 'general',
        },
      } as any,
    }

    downloadStatus = {
      mid: 'string',
      cid: 'abcd1234',
      downloadState: DownloadState.Completed,
    }
  })

  it('renders a placeholder if image is not finished downloading yet', () => {
    const result = renderComponent(
      <ImageAttachment
        // @ts-expect-error
        media={message.media}
        downloadStatus={downloadStatus}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="css-2iuva0"
          >
            <div
              class="css-1d93fl3"
              data-testid="abcd1234-imagePlaceholder"
            >
              <p
                class="css-h94c3"
              >
                test.png
              </p>
              <div
                class="ImageAttachmentPlaceholderplaceholder"
                style="width: 400px;"
              >
                <span>
                  <div
                    aria-label=""
                    class=""
                    data-mui-internal-clone-element="true"
                    style="display: flex;"
                  >
                    <img
                      class="ImageAttachmentPlaceholderplaceholderIcon"
                      src="test-file-stub"
                    />
                    <div
                      class="ImageAttachmentPlaceholdericon"
                    >
                      <span
                        class="MuiCircularProgress-root MuiCircularProgress-indeterminate MuiCircularProgress-colorPrimary css-acfop9-MuiCircularProgress-root"
                        role="progressbar"
                        style="width: 18px; height: 18px; position: absolute; color: rgb(178, 178, 178);"
                      >
                        <svg
                          class="MuiCircularProgress-svg css-1idz92c-MuiCircularProgress-svg"
                          viewBox="22 22 44 44"
                        >
                          <circle
                            class="MuiCircularProgress-circle MuiCircularProgress-circleIndeterminate css-176wh8e-MuiCircularProgress-circle"
                            cx="44"
                            cy="44"
                            fill="none"
                            r="20"
                            stroke-width="4"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>
                </span>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
  it('renders image if image is downloaded', () => {
    // @ts-expect-error
    message.media.path = 'path/to/file/test.png'
    // @ts-expect-error
    message.media.message = {
      id: 'string',
      channelId: 'general',
    }
    const result = renderComponent(
      <ImageAttachment
        // @ts-expect-error
        media={message.media}
        downloadStatus={downloadStatus}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="css-2iuva0"
          >
            <div
              class="ImageAttachmentcontainer"
            >
              <div
                class="ImageAttachmentimage"
                data-testid="abcd1234-imageVisual"
              >
                <p
                  class="css-h94c3"
                >
                  test.png
                </p>
                <img
                  class="ImageAttachmentimage"
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

  it('renders a placeholder spinner when image is processing (no width/height)', () => {
    const result = renderComponent(
      <ImageAttachment
        // @ts-expect-error
        media={processingMessage.media}
        downloadStatus={downloadStatus}
      />
    )

    // Instead of verifying by testId which may be empty, check for placeholder elements
    const placeholderElement = result.container.querySelector('.ImageAttachmentPlaceholderplaceholder')
    expect(placeholderElement).toBeInTheDocument()

    // Verify the spinner (CircularProgress) is rendered
    const spinner = result.container.querySelector('.MuiCircularProgress-root')
    expect(spinner).toBeInTheDocument()

    expect(result.baseElement).toMatchSnapshot()
  })
})
