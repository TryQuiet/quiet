import { DownloadState } from '@quiet/state-manager'
import React from 'react'

import { renderComponent } from '../../../../testUtils/renderComponent'
import FileComponent from './FileComponent'

describe('FileComponent', () => {
  it('renders component', () => {
    const result = renderComponent(
      <FileComponent
        message={{
          id: '32',
          type: 2,
          media: {
            cid: 'QmWUCSApiy76nW9DAk5M9QbH1nkW5XCYwxUHRSULjATyqs',
            message: {
              channelAddress: 'general',
              id: 'wgtlstx3u7'
            },
            ext: '.zip',
            name: 'my-file-name-goes-here-an-isnt-truncated',
            size: 2048,
            width: 1200,
            height: 580,
            path: 'files/my-file-name-goes-here-an-isnt-truncated.zip'
          },
          message: '',
          createdAt: 0,
          date: '12:46',
          nickname: 'vader'
        }}
        downloadStatus={{
          mid: '32',
          cid: 'QmWUCSApiy76nW9DAk5M9QbH1nkW5XCYwxUHRSULjATyqs',
          downloadState: DownloadState.Ready,
          downloadProgress: undefined
        }}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-border-1"
            data-testid="QmWUCSApiy76nW9DAk5M9QbH1nkW5XCYwxUHRSULjATyqs-fileComponent"
          >
            <span>
              <div
                class=""
                style="display: flex;"
                title=""
              >
                <div
                  class="makeStyles-icon-2"
                >
                  <img
                    class="makeStyles-fileIcon-3"
                    src="test-file-stub"
                  />
                </div>
                <div
                  class="makeStyles-filename-4"
                >
                  <h5
                    class="MuiTypography-root MuiTypography-h5"
                    style="line-height: 20px;"
                  >
                    my-file-name-goes-here-an-isnt-truncated
                    .zip
                  </h5>
                  <p
                    class="MuiTypography-root MuiTypography-body2"
                    style="line-height: 20px; color: rgb(127, 127, 127);"
                  >
                    2 KB
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
                  class="makeStyles-actionIndicator-6"
                >
                  <img
                    class="makeStyles-actionIcon-5"
                    src="test-file-stub"
                  />
                  <p
                    class="MuiTypography-root MuiTypography-body2"
                    style="color: rgb(103, 191, 211); margin-left: 8px;"
                  >
                    Download file
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
