import { DownloadStatus, DownloadState } from '@quiet/state-manager'
import React from 'react'

import { renderComponent } from '../../../../testUtils/renderComponent'
import UploadedImagePlaceholder from './UploadedImagePlaceholder'

describe('UploadedImagePlaceholder', () => {
  let downloadStatus: DownloadStatus

  it('renders component', () => {
    downloadStatus = {
      mid: 'test',
      cid: 'hvb45FGa',
      downloadState: DownloadState.Completed
    }
    const result = renderComponent(
      <UploadedImagePlaceholder
        cid={'hvb45FGa'}
        imageHeight={1000}
        imageWidth={5000}
        name={'test'}
        ext={'.png'}
        downloadStatus={downloadStatus}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="css-ytr8bc"
            data-testid="hvb45FGa-imagePlaceholder"
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
      </body>
    `)
  })

  it('Shows download speed and progress', () => {
    downloadStatus = {
      mid: 'test',
      cid: 'hvb45FGa',
      downloadState: DownloadState.Downloading,
      downloadProgress: {
        size: 12345,
        downloaded: 1234,
        transferSpeed: 123
      }
    }
    const result = renderComponent(
      <UploadedImagePlaceholder
        cid={'hvb45FGa'}
        imageHeight={1000}
        imageWidth={5000}
        name={'test'}
        ext={'.png'}
        downloadStatus={downloadStatus}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="css-ytr8bc"
            data-testid="hvb45FGa-imagePlaceholder"
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
                      aria-valuenow="100"
                      class="MuiCircularProgress-root MuiCircularProgress-determinate MuiCircularProgress-colorPrimary css-1rhqaqh-MuiCircularProgress-root"
                      role="progressbar"
                      style="width: 18px; height: 18px; transform: rotate(-90deg); position: absolute; color: rgb(231, 231, 231);"
                    >
                      <svg
                        class="MuiCircularProgress-svg css-1idz92c-MuiCircularProgress-svg"
                        viewBox="22 22 44 44"
                      >
                        <circle
                          class="MuiCircularProgress-circle MuiCircularProgress-circleDeterminate css-oxts8u-MuiCircularProgress-circle"
                          cx="44"
                          cy="44"
                          fill="none"
                          r="20"
                          stroke-width="4"
                          style="stroke-dasharray: 125.664; stroke-dashoffset: 0.000px;"
                        />
                      </svg>
                    </span>
                    <span
                      aria-valuenow="10"
                      class="MuiCircularProgress-root MuiCircularProgress-determinate MuiCircularProgress-colorPrimary css-1rhqaqh-MuiCircularProgress-root"
                      role="progressbar"
                      style="width: 18px; height: 18px; transform: rotate(-90deg); color: rgb(178, 178, 178);"
                    >
                      <svg
                        class="MuiCircularProgress-svg css-1idz92c-MuiCircularProgress-svg"
                        viewBox="22 22 44 44"
                      >
                        <circle
                          class="MuiCircularProgress-circle MuiCircularProgress-circleDeterminate css-oxts8u-MuiCircularProgress-circle"
                          cx="44"
                          cy="44"
                          fill="none"
                          r="20"
                          stroke-width="4"
                          style="stroke-dasharray: 125.664; stroke-dashoffset: 113.102px;"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              </span>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
