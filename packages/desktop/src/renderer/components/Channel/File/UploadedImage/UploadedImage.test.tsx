import {
  DisplayableMessage,
  DownloadState,
  DownloadStatus,
  MessageType
} from '@quiet/state-manager'
import React from 'react'

import { renderComponent } from '../../../../testUtils/renderComponent'
import UploadedImage from './UploadedImage'

describe('UploadedFile', () => {
  let message: DisplayableMessage
  let downloadStatus: DownloadStatus

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
          channelId: 'general'
        }
      }
    }

    downloadStatus = {
      mid: 'string',
      cid: 'abcd1234',
      downloadState: DownloadState.Completed
    }
  })

  it('renders a placeholder if image is not finished downloading yet', () => {
    const result = renderComponent(
      <UploadedImage
        // @ts-expect-error
        media={message.media}
        downloadStatus={downloadStatus}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="css-gd4qex"
          >
            <div
              class="css-ytr8bc"
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
                <span>
                  <div
                    aria-label=""
                    class=""
                    data-mui-internal-clone-element="true"
                    style="display: flex;"
                  >
                    <img
                      class="UploadedImagePlaceholderplaceholderIcon"
                      src="test-file-stub"
                    />
                    <div
                      class="UploadedImagePlaceholdericon"
                    >
                      <span
                        class="MuiCircularProgress-root MuiCircularProgress-indeterminate MuiCircularProgress-colorPrimary css-9a4009-MuiCircularProgress-root"
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
      channelId: 'general'
    }
    const result = renderComponent(
      <UploadedImage
        // @ts-expect-error
        media={message.media}
        downloadStatus={downloadStatus}
      />
    )
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
