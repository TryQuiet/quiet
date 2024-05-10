import React from 'react'
import { lightTheme as theme } from '../../../../theme'
import { ThemeProvider } from '@mui/material/styles'
import { renderComponent } from '../../../../testUtils/renderComponent'
import DuplicateModalComponent from './DuplicateModal.component'

describe('DuplicateModalComponent', () => {
  it('renderComponent', () => {
    const result = renderComponent(
      <ThemeProvider theme={theme}>
        <DuplicateModalComponent handleClose={() => {}} open={true} />
      </ThemeProvider>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body
        style="padding-right: 1024px; overflow: hidden;"
      >
        <div
          aria-hidden="true"
        />
        <div
          class="MuiModal-root css-1evs64r-MuiModal-root"
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
              class="MuiGrid-root MuiGrid-container MuiGrid-item Modalheader ModalheaderBorder css-lx31tv-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-grid-xs-true css-1r61agb-MuiGrid-root"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true css-1vd824g-MuiGrid-root"
                >
                  <h6
                    class="MuiTypography-root MuiTypography-subtitle1 MuiTypography-alignCenter Modaltitle Modalbold css-jxzupi-MuiTypography-root"
                    style="margin-left: 36px;"
                  >
                    Warning!
                  </h6>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item Modalactions css-hoc6b0-MuiGrid-root"
                    data-testid="ModalActions"
                  >
                    <button
                      class="MuiButtonBase-root MuiIconButton-root IconButtonroot MuiIconButton-sizeMedium css-c8hoqc-MuiButtonBase-root-MuiIconButton-root"
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
                  class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column css-1ohhbag-MuiGrid-root"
                >
                  <img
                    class="UserDuplicateModalComponent-image"
                    src="test-file-stub"
                  />
                  <h3
                    class="MuiTypography-root MuiTypography-h3 css-ptjqt4-MuiTypography-root"
                  >
                    Multiple users with same name
                  </h3>
                  <p
                    class="MuiTypography-root MuiTypography-body2 UserDuplicateModalComponent-bodyText css-16d47hw-MuiTypography-root"
                  >
                    An unregistered user is using the same name as another user. This should be rare, and could mean someone is impersonating another user.
                    <br />
                    <br />
                    These users will be marked
                  </p>
                  <div
                    class="MuiGrid-root css-9ezr5u-MuiGrid-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-item UserLabel-wrapper UserLabel-wrapperRed css-1gb55do-MuiGrid-root"
                    >
                      <img
                        class="UserLabel-image"
                        src="test-file-stub"
                      />
                      <span
                        class="MuiTypography-root MuiTypography-caption UserLabel-wrapper UserLabel-textWhite css-1d4bzk2-MuiTypography-root"
                      >
                        Duplicate
                      </span>
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
      </body>
    `)
  })
})
