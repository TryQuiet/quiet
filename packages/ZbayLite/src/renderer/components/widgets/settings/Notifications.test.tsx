import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'
import { Notifications } from './Notifications'

describe('Notifications', () => {
  it('renders component', () => {
    const props = {
      userFilterType: 1,
      userSound: 1,
      setUserNotification: jest.fn(),
      setUserNotificationsSound: jest.fn()
    }
    const result = renderComponent(<Notifications {...props} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column"
          >
            <div
              class="MuiGrid-root makeStyles-titleDiv-2 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-space-between"
            >
              <div
                class="MuiGrid-root makeStyles-title-1 MuiGrid-item"
              >
                <h3
                  class="MuiTypography-root MuiTypography-h3"
                >
                  Notifications
                </h3>
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item"
            >
              <h5
                class="MuiTypography-root makeStyles-subtitle-3 MuiTypography-h5"
              >
                Notify me about...
              </h5>
            </div>
            <div
              class="MuiGrid-root makeStyles-radioDiv-4 MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column"
            >
              <div
                class="MuiGrid-root makeStyles-spacing-9 MuiGrid-item"
              >
                <label
                  class="MuiFormControlLabel-root makeStyles-radioIcon-6"
                >
                  <span
                    aria-disabled="false"
                    class="MuiButtonBase-root MuiIconButton-root PrivateSwitchBase-root-159 MuiCheckbox-root MuiCheckbox-colorSecondary PrivateSwitchBase-checked-160 Mui-checked MuiIconButton-colorSecondary"
                  >
                    <span
                      class="MuiIconButton-label"
                    >
                      <input
                        checked=""
                        class="PrivateSwitchBase-input-162"
                        data-indeterminate="false"
                        type="checkbox"
                        value=""
                      />
                      <img
                        src="test-file-stub"
                      />
                    </span>
                    <span
                      class="MuiTouchRipple-root"
                    />
                  </span>
                  <span
                    class="MuiTypography-root MuiFormControlLabel-label MuiTypography-body1"
                  >
                    <div
                      class="MuiGrid-root makeStyles-offset-8 MuiGrid-direction-xs-column"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-item"
                      >
                        <span
                          class="makeStyles-bold-7"
                        >
                          Every new message
                        </span>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-item"
                      >
                        <span>
                          You’ll be notified for every new message
                        </span>
                      </div>
                    </div>
                  </span>
                </label>
                 
              </div>
              <div
                class="MuiGrid-root makeStyles-spacing-9 MuiGrid-item"
              >
                <label
                  class="MuiFormControlLabel-root makeStyles-radioIcon-6"
                >
                  <span
                    aria-disabled="false"
                    class="MuiButtonBase-root MuiIconButton-root PrivateSwitchBase-root-159 MuiCheckbox-root MuiCheckbox-colorSecondary MuiIconButton-colorSecondary"
                  >
                    <span
                      class="MuiIconButton-label"
                    >
                      <input
                        class="PrivateSwitchBase-input-162"
                        data-indeterminate="false"
                        type="checkbox"
                        value=""
                      />
                      <img
                        src="test-file-stub"
                      />
                    </span>
                    <span
                      class="MuiTouchRipple-root"
                    />
                  </span>
                  <span
                    class="MuiTypography-root MuiFormControlLabel-label MuiTypography-body1"
                  >
                    <div
                      class="MuiGrid-root makeStyles-offset-8 MuiGrid-direction-xs-column"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-item"
                      >
                        <span
                          class="makeStyles-bold-7"
                        >
                          Direct messages, mentions & keywords
                        </span>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-item"
                      >
                        <span>
                          You’ll be notified when someone mentions you or sends you a direct message.
                        </span>
                      </div>
                    </div>
                  </span>
                </label>
              </div>
              <div
                class="MuiGrid-root makeStyles-spacing-9 MuiGrid-item"
              >
                <label
                  class="MuiFormControlLabel-root makeStyles-radioIcon-6"
                >
                  <span
                    aria-disabled="false"
                    class="MuiButtonBase-root MuiIconButton-root PrivateSwitchBase-root-159 MuiCheckbox-root MuiCheckbox-colorSecondary MuiIconButton-colorSecondary"
                  >
                    <span
                      class="MuiIconButton-label"
                    >
                      <input
                        class="PrivateSwitchBase-input-162"
                        data-indeterminate="false"
                        type="checkbox"
                        value=""
                      />
                      <img
                        src="test-file-stub"
                      />
                    </span>
                    <span
                      class="MuiTouchRipple-root"
                    />
                  </span>
                  <span
                    class="MuiTypography-root MuiFormControlLabel-label MuiTypography-body1"
                  >
                    <div
                      class="MuiGrid-root makeStyles-offset-8 MuiGrid-direction-xs-column"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-item"
                      >
                        <span
                          class="makeStyles-bold-7"
                        >
                          Nothing
                        </span>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-item"
                      >
                        <span>
                          You won’t receive notificaitons from Zbay.
                        </span>
                      </div>
                    </div>
                  </span>
                </label>
              </div>
              <div
                class="MuiGrid-root makeStyles-subtitleSoundDiv-11 MuiGrid-item"
              >
                <h5
                  class="MuiTypography-root makeStyles-subtitle-3 MuiTypography-h5"
                >
                  Sounds
                </h5>
              </div>
              <div
                class="MuiGrid-root makeStyles-radioSoundDiv-5 MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column"
              >
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <label
                    class="MuiFormControlLabel-root"
                  >
                    <span
                      aria-disabled="false"
                      class="MuiButtonBase-root MuiIconButton-root PrivateSwitchBase-root-159 MuiCheckbox-root PrivateSwitchBase-checked-160 Mui-checked"
                    >
                      <span
                        class="MuiIconButton-label"
                      >
                        <input
                          checked=""
                          class="PrivateSwitchBase-input-162"
                          data-indeterminate="false"
                          type="checkbox"
                          value=""
                        />
                        <svg
                          aria-hidden="true"
                          class="MuiSvgIcon-root"
                          focusable="false"
                          role="presentation"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                          />
                        </svg>
                      </span>
                      <span
                        class="MuiTouchRipple-root"
                      />
                    </span>
                    <span
                      class="MuiTypography-root MuiFormControlLabel-label MuiTypography-body1"
                    >
                      <p
                        class="MuiTypography-root makeStyles-label-12 MuiTypography-body2"
                      >
                        Play a sound when receiving a notification
                      </p>
                    </span>
                  </label>
                </div>
                <div
                  class="MuiGrid-root makeStyles-spacingSound-13 MuiGrid-item"
                >
                  <label
                    class="MuiFormControlLabel-root makeStyles-radioSound-10"
                  >
                    <span
                      aria-disabled="false"
                      class="MuiButtonBase-root MuiIconButton-root PrivateSwitchBase-root-159 MuiCheckbox-root MuiCheckbox-colorSecondary PrivateSwitchBase-checked-160 Mui-checked MuiIconButton-colorSecondary"
                    >
                      <span
                        class="MuiIconButton-label"
                      >
                        <input
                          checked=""
                          class="PrivateSwitchBase-input-162"
                          data-indeterminate="false"
                          type="checkbox"
                          value=""
                        />
                        <img
                          src="test-file-stub"
                        />
                      </span>
                      <span
                        class="MuiTouchRipple-root"
                      />
                    </span>
                    <span
                      class="MuiTypography-root MuiFormControlLabel-label MuiTypography-body1"
                    >
                      Pow
                    </span>
                  </label>
                </div>
                <div
                  class="MuiGrid-root makeStyles-spacingSound-13 MuiGrid-item"
                >
                  <label
                    class="MuiFormControlLabel-root makeStyles-radioSound-10"
                  >
                    <span
                      aria-disabled="false"
                      class="MuiButtonBase-root MuiIconButton-root PrivateSwitchBase-root-159 MuiCheckbox-root MuiCheckbox-colorSecondary MuiIconButton-colorSecondary"
                    >
                      <span
                        class="MuiIconButton-label"
                      >
                        <input
                          class="PrivateSwitchBase-input-162"
                          data-indeterminate="false"
                          type="checkbox"
                          value=""
                        />
                        <img
                          src="test-file-stub"
                        />
                      </span>
                      <span
                        class="MuiTouchRipple-root"
                      />
                    </span>
                    <span
                      class="MuiTypography-root MuiFormControlLabel-label MuiTypography-body1"
                    >
                      Bang
                    </span>
                  </label>
                </div>
                <div
                  class="MuiGrid-root makeStyles-spacingSound-13 MuiGrid-item"
                >
                  <label
                    class="MuiFormControlLabel-root makeStyles-radioSound-10"
                  >
                    <span
                      aria-disabled="false"
                      class="MuiButtonBase-root MuiIconButton-root PrivateSwitchBase-root-159 MuiCheckbox-root MuiCheckbox-colorSecondary MuiIconButton-colorSecondary"
                    >
                      <span
                        class="MuiIconButton-label"
                      >
                        <input
                          class="PrivateSwitchBase-input-162"
                          data-indeterminate="false"
                          type="checkbox"
                          value=""
                        />
                        <img
                          src="test-file-stub"
                        />
                      </span>
                      <span
                        class="MuiTouchRipple-root"
                      />
                    </span>
                    <span
                      class="MuiTypography-root MuiFormControlLabel-label MuiTypography-body1"
                    >
                      Splat
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
