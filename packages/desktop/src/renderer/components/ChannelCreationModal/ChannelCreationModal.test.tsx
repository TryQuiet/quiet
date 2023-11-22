import React from 'react'
import { renderComponent } from '../../testUtils/renderComponent'
import ChannelCreationModalComponent from './ChannelCreationModal.component'

describe('Create ChannelCreationModalComponent', () => {
    it('renders component', () => {
        const result = renderComponent(<ChannelCreationModalComponent handleClose={jest.fn()} open={true} />)
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body
        style="padding-right: 1024px; overflow: hidden;"
      >
        <div
          aria-hidden="true"
        />
        <div
          class="MuiModal-root css-1vjugmr-MuiModal-root"
          role="presentation"
          zindex="1300"
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
                  />
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
                  class="MuiGrid-root MuiGrid-container ChannelCreationModalComponentwrapper css-upjnze-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-ejbsmj-MuiGrid-root"
                    data-testid="spinnerLoader"
                  >
                    <span
                      class="MuiCircularProgress-root MuiCircularProgress-indeterminate MuiCircularProgress-colorInherit SpinnerLoaderspinner css-62e83j-MuiCircularProgress-root"
                      role="progressbar"
                      style="width: 40px; height: 40px;"
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
                          r="20.2"
                          stroke-width="3.6"
                        />
                      </svg>
                    </span>
                    <span
                      class="MuiTypography-root MuiTypography-caption MuiTypography-alignCenter SpinnerLoadermessage css-1ws1t6m-MuiTypography-root"
                      style="font-size: 0.9090909090909091rem;"
                    >
                      Channel recreation
                    </span>
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
      </body>
    `)
    })
})
