import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { DownloadState, DownloadStatus } from '@quiet/types'
import { DEFAULT_AUTODOWNLOAD_SIZE_LIMIT } from '@quiet/state-manager'
import { generateMessages, renderComponent } from '../../../testUtils'
import { FileActionsProps } from '../../Channel/File/FileComponent/FileComponent'
import { screen } from '@testing-library/dom'

import NestedMessageContent, { NestedMessageContentProps } from './NestedMessageContent'

describe('NestedMessageContent', () => {
  it('renders message', () => {
    const messages = generateMessages()
    const result = renderComponent(
      <NestedMessageContent
        maxAutodownloadSizeBytes={DEFAULT_AUTODOWNLOAD_SIZE_LIMIT}
        pending={false}
        message={messages[0]}
        openUrl={jest.fn()}
      />
    )

    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-item css-15myz84-MuiGrid-root"
          >
            <span
              class="MuiTypography-root MuiTypography-body1 TextMessagemessage css-w6r0mf-MuiTypography-root"
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
      <NestedMessageContent
        maxAutodownloadSizeBytes={DEFAULT_AUTODOWNLOAD_SIZE_LIMIT}
        pending={true}
        message={messages[0]}
        openUrl={jest.fn()}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-item css-15myz84-MuiGrid-root"
          >
            <span
              class="MuiTypography-root MuiTypography-body1 TextMessagemessage TextMessagepending css-w6r0mf-MuiTypography-root"
              data-testid="messagesGroupContent-0"
            >
              message0
            </span>
          </div>
        </div>
      </body>
    `)
  })

  it('renders proper download status for malicious file', async () => {
    // TODO: add tests for the rest of statuses
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
        size: DEFAULT_AUTODOWNLOAD_SIZE_LIMIT - 2048,
        message: {
          id: 'string',
          channelId: 'general',
        },
      },
    }
    const downloadStatus: DownloadStatus = {
      mid: message.id,
      cid: message.media.cid,
      downloadState: DownloadState.Malicious,
      downloadProgress: {
        size: 10000,
        downloaded: 10000,
        transferSpeed: 500,
      },
    }
    const result = renderComponent(
      <NestedMessageContent
        pending={false}
        maxAutodownloadSizeBytes={DEFAULT_AUTODOWNLOAD_SIZE_LIMIT}
        message={message}
        downloadStatus={downloadStatus}
        openUrl={jest.fn()}
      />
    )
    expect(await screen.findByText('File not valid. Download canceled.')).toBeVisible()
  })

  it('renders info message', () => {
    const messages = generateMessages({ type: 3 })
    const result = renderComponent(
      <NestedMessageContent
        pending={true}
        maxAutodownloadSizeBytes={DEFAULT_AUTODOWNLOAD_SIZE_LIMIT}
        message={messages[0]}
        openUrl={jest.fn()}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-item css-15myz84-MuiGrid-root"
          >
            <span
              class="MuiTypography-root MuiTypography-body1 TextMessagemessage TextMessagepending css-w6r0mf-MuiTypography-root"
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
        size: DEFAULT_AUTODOWNLOAD_SIZE_LIMIT - 2048,
        message: {
          id: 'string',
          channelId: 'general',
        },
      },
    }
    const result = renderComponent(
      <NestedMessageContent
        pending={false}
        maxAutodownloadSizeBytes={DEFAULT_AUTODOWNLOAD_SIZE_LIMIT}
        message={message}
        openUrl={jest.fn()}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-item css-15myz84-MuiGrid-root"
          >
            <div
              class="NestedMessageContentmessage"
              data-testid="messagesGroupContent-0"
            >
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
          </div>
        </div>
      </body>
    `)
  })

  it('renders downloaded large image as image', () => {
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
        size: DEFAULT_AUTODOWNLOAD_SIZE_LIMIT + 2048,
        message: {
          id: 'string',
          channelId: 'general',
        },
      },
    }

    const fileComponentProps: NestedMessageContentProps & FileActionsProps = {
      downloadStatus: {
        mid: 'mid',
        cid: 'cid',
        downloadState: DownloadState.Downloading,
        downloadProgress: {
          size: DEFAULT_AUTODOWNLOAD_SIZE_LIMIT + 2048,
          downloaded: DEFAULT_AUTODOWNLOAD_SIZE_LIMIT / 2,
          transferSpeed: 1000,
        },
      },
      maxAutodownloadSizeBytes: DEFAULT_AUTODOWNLOAD_SIZE_LIMIT,
      openUrl: jest.fn(),
      openContainingFolder: jest.fn(),
      downloadFile: jest.fn(),
      cancelDownload: jest.fn(),
      message: message,
      pending: false,
    }

    const result = renderComponent(<NestedMessageContent {...fileComponentProps} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-item css-15myz84-MuiGrid-root"
          >
            <div
              class="NestedMessageContentmessage"
              data-testid="messagesGroupContent-0"
            >
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
          </div>
        </div>
      </body>
    `)
  })
})
