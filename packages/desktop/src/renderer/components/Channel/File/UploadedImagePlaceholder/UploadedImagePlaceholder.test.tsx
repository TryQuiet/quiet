import React from 'react'

import { renderComponent } from '../../../../testUtils/renderComponent'
import UploadedFilePlaceholder from './UploadedImagePlaceholder'

describe('UploadedFilePlaceholder', () => {
  it('renders placeholder', () => {
    const result = renderComponent(
      <UploadedFilePlaceholder
        cid={'hvb45FGa'}
        imageHeight={1000}
        imageWidth={5000}
        name={'test'}
        ext={'.png'}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-placeholderWrapper-1"
            data-testid="hvb45FGa-imagePlaceholder"
          >
            <p
              class="makeStyles-fileName-4"
            >
              test.png
            </p>
            <div
              class="makeStyles-placeholder-2"
              style="width: 400px;"
            >
              <img
                class="makeStyles-placeholderIcon-3"
                src="test-file-stub"
              />
              <div
                class="MuiCircularProgress-root MuiCircularProgress-indeterminate"
                role="progressbar"
                style="width: 16px; height: 16px;"
              >
                <svg
                  class="MuiCircularProgress-svg"
                  viewBox="22 22 44 44"
                >
                  <circle
                    class="MuiCircularProgress-circle MuiCircularProgress-circleDisableShrink MuiCircularProgress-circleIndeterminate"
                    cx="44"
                    cy="44"
                    fill="none"
                    r="20.2"
                    stroke-width="3.6"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
