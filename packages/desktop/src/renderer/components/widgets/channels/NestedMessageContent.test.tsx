import { AUTODOWNLOAD_SIZE_LIMIT, DownloadState, MessageType } from '@quiet/state-manager'
import React from 'react'
import { generateMessages, renderComponent } from '../../../testUtils'
import { FileActionsProps } from '../../Channel/File/FileComponent/FileComponent'

import NestedMessageContent, { NestedMessageContentProps } from './NestedMessageContent'

describe('NestedMessageContent', () => {
  it('renders message', () => {
    const messages = generateMessages()
    const result = renderComponent(<NestedMessageContent pending={false} message={messages[0]} />)
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
    const result = renderComponent(<NestedMessageContent pending={true} message={messages[0]} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-item"
          >
            <span
              class="MuiTypography-root makeStyles-message-137 makeStyles-pending-138 MuiTypography-body1"
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
    const result = renderComponent(<NestedMessageContent pending={true} message={messages[0]} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-item"
          >
            <span
              class="MuiTypography-root makeStyles-message-273 makeStyles-pending-274 MuiTypography-body1"
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
    const messages = generateMessages({ type: 2 })

    const message = {
      ...messages[0],
      media: {
        path: 'path/to/file/test.png',
        name: 'test',
        ext: '.png',
        cid: 'abcd1234',
        width: 500,
        height: 600,
        size: AUTODOWNLOAD_SIZE_LIMIT - 2048,
        message: {
          id: 'string',
          channelAddress: 'general'
        }
      }
    }
    const result = renderComponent(<NestedMessageContent pending={false} message={message} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-item"
          >
            <div
              class="makeStyles-message-409"
              data-testid="messagesGroupContent-0"
            >
              <div
                class="makeStyles-container-516"
              >
                <div
                  class="makeStyles-image-515"
                  data-testid="abcd1234-imageVisual"
                >
                  <p
                    class="makeStyles-fileName-520"
                  >
                    test.png
                  </p>
                  <img
                    class="makeStyles-image-515"
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

  it('renders large image as file', () => {
    const messages = generateMessages({ type: 2 })

    const message = {
      ...messages[0],
      media: {
        path: 'path/to/file/test.png',
        name: 'test',
        ext: '.png',
        cid: 'abcd1234',
        width: 500,
        height: 600,
        size: AUTODOWNLOAD_SIZE_LIMIT + 2048,
        message: {
          id: 'string',
          channelAddress: 'general'
        }
      }
    }

    const fileComponentProps: NestedMessageContentProps & FileActionsProps = {
      downloadStatus: {
        mid: 'mid',
        cid: 'cid',
        downloadState: DownloadState.Downloading,
        downloadProgress: {
          size: AUTODOWNLOAD_SIZE_LIMIT + 2048,
          downloaded: AUTODOWNLOAD_SIZE_LIMIT / 2,
          transferSpeed: 1000
        }
      },
      openContainingFolder: jest.fn(),
      downloadFile: jest.fn(),
      cancelDownload: jest.fn(),
      message: message,
      pending: false
    }

    const result = renderComponent(<NestedMessageContent {...fileComponentProps} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-item"
          >
            <div
              class="makeStyles-message-535"
              data-testid="messagesGroupContent-0"
            >
              <div
                class="makeStyles-border-641"
                data-testid="abcd1234-fileComponent"
              >
                <span>
                  <div
                    class=""
                    style="display: flex;"
                  >
                    <div
                      class="makeStyles-icon-642"
                    >
                      <div
                        aria-valuenow="100"
                        class="MuiCircularProgress-root MuiCircularProgress-colorPrimary"
                        role="progressbar"
                        style="width: 18px; height: 18px; transform: rotate(270.000deg); position: absolute; color: rgb(231, 231, 231);"
                      >
                        <svg
                          class="MuiCircularProgress-svg"
                          viewBox="22 22 44 44"
                        >
                          <circle
                            class="MuiCircularProgress-circle"
                            cx="44"
                            cy="44"
                            fill="none"
                            r="20"
                            stroke-width="4"
                            style="stroke-dasharray: 125.664; stroke-dashoffset: 0.000px;"
                          />
                        </svg>
                      </div>
                      <div
                        aria-valuenow="50"
                        class="MuiCircularProgress-root MuiCircularProgress-colorPrimary MuiCircularProgress-static"
                        role="progressbar"
                        style="width: 18px; height: 18px; transform: rotate(-90deg); color: rgb(178, 178, 178);"
                      >
                        <svg
                          class="MuiCircularProgress-svg"
                          viewBox="22 22 44 44"
                        >
                          <circle
                            class="MuiCircularProgress-circle MuiCircularProgress-circleStatic"
                            cx="44"
                            cy="44"
                            fill="none"
                            r="20"
                            stroke-width="4"
                            style="stroke-dasharray: 125.664; stroke-dashoffset: 62.838px;"
                          />
                        </svg>
                      </div>
                    </div>
                    <div
                      class="makeStyles-filename-644"
                    >
                      <h5
                        class="MuiTypography-root MuiTypography-h5"
                        style="line-height: 20px;"
                      >
                        test
                        .png
                      </h5>
                      <p
                        class="MuiTypography-root MuiTypography-body2"
                        style="line-height: 20px; color: rgb(127, 127, 127);"
                      >
                        20 MB
                      </p>
                    </div>
                  </div>
                </span>
                <div
                  style="padding-top: 16px; display: block;"
                >
                  <div
                    style="cursor: pointer;"
                  >
                    <div
                      class="makeStyles-actionIndicator-646"
                    >
                      <img
                        class="makeStyles-actionIcon-645"
                        src="test-file-stub"
                      />
                      <p
                        class="MuiTypography-root MuiTypography-body2"
                        style="color: rgb(127, 127, 127); margin-left: 8px;"
                      >
                        Downloading...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
