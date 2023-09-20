import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'
import { UsernameCreated } from './UsernameCreated'

describe('UsernameCreated', () => {
  it('renders component', () => {
    const result = renderComponent(<UsernameCreated handleClose={jest.fn()} setFormSent={jest.fn()} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container css-1uw1izs-MuiGrid-root"
          >
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-grid-xs-12 UsernameCreatedusernameConatainer css-s2k0j8-MuiGrid-root"
            >
              <img
                class="UsernameCreatedusernameIcon"
                src="test-file-stub"
              />
            </div>
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-grid-xs-12 UsernameCreatedinfoConatainer css-s2k0j8-MuiGrid-root"
            >
              <h4
                class="MuiTypography-root MuiTypography-h4 css-ajdqea-MuiTypography-root"
              >
                You created a username
              </h4>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-auto UsernameCreatedbuttonContainer css-1wrgmsj-MuiGrid-root"
            >
              <button
                class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall MuiButton-fullWidth MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall MuiButton-fullWidth UsernameCreatedbutton css-14mi2mx-MuiButtonBase-root-MuiButton-root"
                tabindex="0"
                type="button"
              >
                Done
                <span
                  class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                />
              </button>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
