import React from 'react'
import { renderComponent } from '../../testUtils/renderComponent'
import StartingPanelComponent from './StartingPanelComponent'

describe('Create StartingPanelComponent', () => {
  it('renders component', () => {
    const result = renderComponent(
      <StartingPanelComponent
        handleClose={jest.fn()}
        message={'Starting Quiet'}
        torBootstrapInfo={'Bootstrapped 100% (done)'}
        open={true}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body
        style="padding-right: 1024px; overflow: hidden;"
      >
        <div
          aria-hidden="true"
        />
        <div
          class="Modalroot MuiModal-root css-1voaj9u-MuiModal-root"
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
                  class="MuiGrid-root MuiGrid-container StartingPanelComponentroot css-1xgsyr1-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column StartingPanelComponentcontentWrapper css-t0zib5-MuiGrid-root"
                    data-testid="startingPanelComponent"
                  >
                    <img
                      class="StartingPanelComponentimage"
                      src="test-file-stub"
                    />
                    <div
                      class="MuiGrid-root MuiGrid-container StartingPanelComponentprogressBar css-1e2bu2o-MuiGrid-root"
                    >
                      <div
                        class="StartingPanelComponentprogress"
                      />
                    </div>
                    <p
                      class="MuiTypography-root MuiTypography-body2 css-16d47hw-MuiTypography-root"
                    >
                      Starting Quiet: Tor Bootstrapped 100% (done)
                    </p>
                    <p
                      class="MuiTypography-root MuiTypography-body2 StartingPanelComponenttext css-16d47hw-MuiTypography-root"
                    >
                      This can take some time
                    </p>
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
