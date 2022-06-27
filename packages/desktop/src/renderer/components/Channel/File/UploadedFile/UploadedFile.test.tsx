import React from 'react'

import { renderComponent } from '../../../../testUtils/renderComponent'
import UploadedFilePlaceholder from './UploadedFile'

describe('UploadedFile', () => {
  it('renders component', () => {
    const result = renderComponent(
      <UploadedFilePlaceholder
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
            width: 1200,
            height: 580,
            path: 'files/my-file-name-goes-here-an-isnt-truncated.zip'
          },
          message: '',
          createdAt: 0,
          date: '12:46',
          nickname: 'vader'
        }}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-file-1"
            data-testid="QmWUCSApiy76nW9DAk5M9QbH1nkW5XCYwxUHRSULjATyqs-imageVisual"
          >
            <div
              class="makeStyles-iconWrapper-2"
            >
              <img
                class="makeStyles-icon-4"
                src="test-file-stub"
              />
            </div>
            <div
              class="makeStyles-filenameWrapper-3"
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
                16 MB
              </p>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
