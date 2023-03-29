import React from 'react'
import { renderComponent } from '../../testUtils/renderComponent'
import JoiningPanelComponent from './JoiningPanelComponent'

describe('Create JoiningPanelComponent', () => {
  it('renders component', () => {
    const result = renderComponent(
      <JoiningPanelComponent
        handleClose={jest.fn()}
        openUrl={jest.fn()}
        open={true}
        torConnectionInfo={{ number: 50, text: 'Initializing storage' }}
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
              class="MuiGrid-root MuiGrid-container MuiGrid-item ModalfullPage ModalwithoutHeader css-1h16bbz-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item Modalcontent css-1f064cs-MuiGrid-root"
                style="width: 600px;"
              >
                <div
                  class="MuiGrid-root MuiGrid-container JoiningPanelComponentroot css-lzlt1s-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column JoiningPanelComponentcontentWrapper css-t0zib5-MuiGrid-root"
                  >
                    <img
                      class="JoiningPanelComponentimage"
                      src="test-file-stub"
                    />
                    <h2
                      class="MuiTypography-root MuiTypography-h2 JoiningPanelComponentheading2 css-qahk46-MuiTypography-root"
                    >
                      Joining now!
                    </h2>
                    <div
                      class="JoiningPanelComponentprogressBarWrapper"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container JoiningPanelComponentprogressBar css-1e2bu2o-MuiGrid-root"
                      >
                        <div
                          class="JoiningPanelComponentprogress"
                        />
                      </div>
                      <p
                        class="MuiTypography-root MuiTypography-body2 css-16d47hw-MuiTypography-root"
                      >
                        Initializing storage
                      </p>
                    </div>
                    <p
                      class="MuiTypography-root MuiTypography-body2 JoiningPanelComponenttext css-16d47hw-MuiTypography-root"
                    >
                      You can exit the app - we'll notify you once you're connected! 
                      <br />
                      <strong>
                         This first time might take 30 seconds, 10 minutes, or even longer.
                      </strong>
                      <br />
                      <br />
                      There's a good reason why it's slow: Quiet stores data on your community’s devices (not Big Tech’s servers!) and uses the battle-tested privacy tool Tor to protect your information. Tor is fast once connected, but can take a long time to connect at first.
                    </p>
                    <a>
                      <p
                        class="MuiTypography-root MuiTypography-body2 JoiningPanelComponentlink css-16d47hw-MuiTypography-root"
                      >
                        Learn more about Tor and Quiet
                      </p>
                    </a>
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
