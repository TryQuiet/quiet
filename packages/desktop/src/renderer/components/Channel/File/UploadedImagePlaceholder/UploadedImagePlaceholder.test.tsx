import React from 'react'

import { renderComponent } from '../../../../testUtils/renderComponent'
import UploadedImagePlaceholder from './UploadedImagePlaceholder'

describe('UploadedImagePlaceholder', () => {
  it('renders component', () => {
    const result = renderComponent(
      <UploadedImagePlaceholder
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
            class="css-1b4jr6y"
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
      </body>
    `)
  })
})
