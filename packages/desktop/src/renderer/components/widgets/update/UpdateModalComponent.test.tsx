import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'
import UpdateModalComponent, { UpdateModalProps } from './UpdateModalComponent'
import { Component as UpdateModalStory } from './UpdateModalComponent.stories'
import { screen } from '@testing-library/react'
import '@testing-library/jest-dom'

describe('UpdateModal', () => {
  it('renders modal with correct title, message, and buttons', () => {
    const props = UpdateModalStory.args as UpdateModalProps

    const result = renderComponent(<UpdateModalComponent {...props} />)

    expect(result).toMatchInlineSnapshot(`
      Object {
        "asFragment": [Function],
        "baseElement": <body
          style="padding-right: 1024px; overflow: hidden;"
        >
          <div
            aria-hidden="true"
          />
          <div
            class="MuiModal-root css-md2a92-MuiModal-root"
            data-testid="updateAppModal"
            role="presentation"
          >
            <div
              aria-hidden="true"
              class="MuiBackdrop-root css-i9fmh8-MuiBackdrop-root-MuiModal-backdrop"
              style="opacity: 1; webkit-transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms; transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;"
            />
            <div
              data-testid="sentinelStart"
              tabindex="0"
            />
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column Modalcentered css-6gh8l0-MuiGrid-root"
              tabindex="-1"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item Modalheader css-lx31tv-MuiGrid-root"
              >
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-grid-xs-true css-1r61agb-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true css-1vd824g-MuiGrid-root"
                  >
                    <h6
                      class="MuiTypography-root MuiTypography-subtitle1 MuiTypography-alignCenter Modaltitle css-jxzupi-MuiTypography-root"
                      style="margin-left: 36px;"
                    />
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-item Modalactions css-hoc6b0-MuiGrid-root"
                      data-testid="ModalActions"
                    >
                      <button
                        class="MuiButtonBase-root MuiIconButton-root IconButtonroot MuiIconButton-sizeMedium css-1hpikoh-MuiButtonBase-root-MuiIconButton-root"
                        tabindex="0"
                        type="button"
                      >
                        <svg
                          aria-hidden="true"
                          class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                          data-testid="ClearIcon"
                          focusable="false"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                          />
                        </svg>
                        <span
                          class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item ModalfullPage css-1h16bbz-MuiGrid-root"
              >
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-item Modalcontent css-1f064cs-MuiGrid-root"
                  style="width: 600px;"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-5oaaok-MuiGrid-root"
                  >
                    <div
                      class="MuiGrid-root css-vj1n65-MuiGrid-root"
                    >
                      <img
                        src="test-file-stub"
                      />
                    </div>
                    <div
                      class="MuiGrid-root UpdateModal-title css-vj1n65-MuiGrid-root"
                    >
                      <h3
                        class="MuiTypography-root MuiTypography-h3 css-ptjqt4-MuiTypography-root"
                      >
                        Software update
                      </h3>
                    </div>
                    <div
                      class="MuiGrid-root UpdateModal-message css-vj1n65-MuiGrid-root"
                    >
                      <p
                        class="MuiTypography-root MuiTypography-body2 css-16d47hw-MuiTypography-root"
                      >
                        A new version of Quiet is ready. It will be installed the next time you restart the app, or you can update now.
                      </p>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-spacing-xs-2 MuiGrid-direction-xs-column css-1bnhfwg-MuiGrid-root"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-4 css-gj1fbr-MuiGrid-root"
                      >
                        <button
                          class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeLarge MuiButton-containedSizeLarge MuiButton-fullWidth MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeLarge MuiButton-containedSizeLarge MuiButton-fullWidth css-l6ws65-MuiButtonBase-root-MuiButton-root"
                          style="height: 55px; font-size: 0.9rem; background-color: rgb(82, 28, 116);"
                          tabindex="0"
                          type="submit"
                        >
                          Update now
                          <span
                            class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              data-testid="sentinelEnd"
              tabindex="0"
            />
          </div>
        </body>,
        "container": <div
          aria-hidden="true"
        />,
        "debug": [Function],
        "findAllByAltText": [Function],
        "findAllByDisplayValue": [Function],
        "findAllByLabelText": [Function],
        "findAllByPlaceholderText": [Function],
        "findAllByRole": [Function],
        "findAllByTestId": [Function],
        "findAllByText": [Function],
        "findAllByTitle": [Function],
        "findByAltText": [Function],
        "findByDisplayValue": [Function],
        "findByLabelText": [Function],
        "findByPlaceholderText": [Function],
        "findByRole": [Function],
        "findByTestId": [Function],
        "findByText": [Function],
        "findByTitle": [Function],
        "getAllByAltText": [Function],
        "getAllByDisplayValue": [Function],
        "getAllByLabelText": [Function],
        "getAllByPlaceholderText": [Function],
        "getAllByRole": [Function],
        "getAllByTestId": [Function],
        "getAllByText": [Function],
        "getAllByTitle": [Function],
        "getByAltText": [Function],
        "getByDisplayValue": [Function],
        "getByLabelText": [Function],
        "getByPlaceholderText": [Function],
        "getByRole": [Function],
        "getByTestId": [Function],
        "getByText": [Function],
        "getByTitle": [Function],
        "queryAllByAltText": [Function],
        "queryAllByDisplayValue": [Function],
        "queryAllByLabelText": [Function],
        "queryAllByPlaceholderText": [Function],
        "queryAllByRole": [Function],
        "queryAllByTestId": [Function],
        "queryAllByText": [Function],
        "queryAllByTitle": [Function],
        "queryByAltText": [Function],
        "queryByDisplayValue": [Function],
        "queryByLabelText": [Function],
        "queryByPlaceholderText": [Function],
        "queryByRole": [Function],
        "queryByTestId": [Function],
        "queryByText": [Function],
        "queryByTitle": [Function],
        "rerender": [Function],
        "unmount": [Function],
      }
    `)

    expect(screen.getByText(props.title)).toBeInTheDocument()
    expect(screen.getByText(props.message)).toBeInTheDocument()

    props.buttons.forEach(button => {
      expect(screen.getByRole('button', { name: new RegExp((button as any).props.children, 'i') })).toBeInTheDocument()
    })
  })
})
