import { NotificationsOptions, NotificationsSounds } from '@quiet/state-manager'
import React from 'react'
import { renderComponent } from '../../../../testUtils/renderComponent'
import { NotificationsComponent } from './NotificationsComponent'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'

describe('Notifications', () => {
  it('renders component', () => {
    const props = {
      notificationsOption: NotificationsOptions.notifyForEveryMessage,
      notificationsSound: NotificationsSounds.bang,
      setNotificationsOption: jest.fn(),
      setNotificationsSound: jest.fn()
    }
    const result = renderComponent(<NotificationsComponent {...props} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-9tpmqz-MuiGrid-root"
          >
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item NotificationstitleDiv css-89gxc5-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-item Notificationstitle css-13i4rnv-MuiGrid-root"
              >
                <h3
                  class="MuiTypography-root MuiTypography-h3 css-ptjqt4-MuiTypography-root"
                >
                  Notifications
                </h3>
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
            >
              <h5
                class="MuiTypography-root MuiTypography-h5 Notificationssubtitle css-11l3dv4-MuiTypography-root"
              >
                Notify me about...
              </h5>
            </div>
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column NotificationsradioDiv css-80wlp8-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-item Notificationsspacing css-13i4rnv-MuiGrid-root"
              >
                <label
                  class="MuiFormControlLabel-root NotificationsradioIcon MuiFormControlLabel-labelPlacementEnd css-j204z7-MuiFormControlLabel-root"
                >
                  <span
                    class="MuiButtonBase-root MuiCheckbox-root MuiCheckbox-colorPrimary PrivateSwitchBase-root MuiCheckbox-root MuiCheckbox-colorPrimary Mui-checked MuiCheckbox-root MuiCheckbox-colorPrimary css-hkw0i8-MuiButtonBase-root-MuiCheckbox-root"
                  >
                    <input
                      checked=""
                      class="PrivateSwitchBase-input css-1m9pwf3"
                      data-indeterminate="false"
                      type="checkbox"
                    />
                    <img
                      src="test-file-stub"
                    />
                    <span
                      class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                    />
                  </span>
                  <span
                    class="MuiTypography-root MuiTypography-body1 MuiFormControlLabel-label css-ghvhpl-MuiTypography-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column Notificationsoffset css-1vpwcmr-MuiGrid-root"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                      >
                        <span
                          class="Notificationsbold"
                        >
                          Every new message
                        </span>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
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
                class="MuiGrid-root MuiGrid-item Notificationsspacing css-13i4rnv-MuiGrid-root"
              >
                <label
                  class="MuiFormControlLabel-root NotificationsradioIcon MuiFormControlLabel-labelPlacementEnd css-j204z7-MuiFormControlLabel-root"
                >
                  <span
                    class="MuiButtonBase-root MuiCheckbox-root MuiCheckbox-colorPrimary PrivateSwitchBase-root MuiCheckbox-root MuiCheckbox-colorPrimary MuiCheckbox-root MuiCheckbox-colorPrimary css-hkw0i8-MuiButtonBase-root-MuiCheckbox-root"
                  >
                    <input
                      class="PrivateSwitchBase-input css-1m9pwf3"
                      data-indeterminate="false"
                      type="checkbox"
                    />
                    <img
                      src="test-file-stub"
                    />
                    <span
                      class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                    />
                  </span>
                  <span
                    class="MuiTypography-root MuiTypography-body1 MuiFormControlLabel-label css-ghvhpl-MuiTypography-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column Notificationsoffset css-1vpwcmr-MuiGrid-root"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                      >
                        <span
                          class="Notificationsbold"
                        >
                          Nothing
                        </span>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                      >
                        <span>
                          You won’t receive notificaitons from Quiet.
                        </span>
                      </div>
                    </div>
                  </span>
                </label>
              </div>
              <div
                class="MuiGrid-root MuiGrid-item NotificationssubtitleSoundDiv css-13i4rnv-MuiGrid-root"
              >
                <h5
                  class="MuiTypography-root MuiTypography-h5 Notificationssubtitle css-11l3dv4-MuiTypography-root"
                >
                  Sounds
                </h5>
              </div>
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column NotificationsradioSoundDiv css-80wlp8-MuiGrid-root"
              >
                <div
                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                >
                  <label
                    class="MuiFormControlLabel-root MuiFormControlLabel-labelPlacementEnd css-j204z7-MuiFormControlLabel-root"
                    data-testid="sound-switch"
                  >
                    <span
                      class="MuiButtonBase-root MuiCheckbox-root MuiCheckbox-colorDefault PrivateSwitchBase-root MuiCheckbox-root MuiCheckbox-colorDefault Mui-checked MuiCheckbox-root MuiCheckbox-colorDefault css-dk24d0-MuiButtonBase-root-MuiCheckbox-root"
                    >
                      <input
                        checked=""
                        class="PrivateSwitchBase-input css-1m9pwf3"
                        data-indeterminate="false"
                        type="checkbox"
                      />
                      <svg
                        aria-hidden="true"
                        class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                        data-testid="CheckBoxIcon"
                        focusable="false"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                        />
                      </svg>
                      <span
                        class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                      />
                    </span>
                    <p
                      class="MuiTypography-root MuiTypography-body2 Notificationslabel css-16d47hw-MuiTypography-root"
                    >
                      Play a sound when receiving a notification
                    </p>
                  </label>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item NotificationsspacingSound css-13i4rnv-MuiGrid-root"
                  data-testid="sound-librarianShhh"
                >
                  <label
                    class="MuiFormControlLabel-root NotificationsradioSound MuiFormControlLabel-labelPlacementEnd css-j204z7-MuiFormControlLabel-root"
                  >
                    <span
                      class="MuiButtonBase-root MuiCheckbox-root MuiCheckbox-colorPrimary PrivateSwitchBase-root MuiCheckbox-root MuiCheckbox-colorPrimary MuiCheckbox-root MuiCheckbox-colorPrimary css-hkw0i8-MuiButtonBase-root-MuiCheckbox-root"
                      data-testid="sound-librarianShhh-radio"
                    >
                      <input
                        class="PrivateSwitchBase-input css-1m9pwf3"
                        data-indeterminate="false"
                        type="checkbox"
                      />
                      <img
                        src="test-file-stub"
                      />
                      <span
                        class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                      />
                    </span>
                    <span
                      class="MuiTypography-root MuiTypography-body1 MuiFormControlLabel-label css-ghvhpl-MuiTypography-root"
                    >
                      Librarian Shhh
                    </span>
                  </label>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item NotificationsspacingSound css-13i4rnv-MuiGrid-root"
                  data-testid="sound-pow"
                >
                  <label
                    class="MuiFormControlLabel-root NotificationsradioSound MuiFormControlLabel-labelPlacementEnd css-j204z7-MuiFormControlLabel-root"
                  >
                    <span
                      class="MuiButtonBase-root MuiCheckbox-root MuiCheckbox-colorPrimary PrivateSwitchBase-root MuiCheckbox-root MuiCheckbox-colorPrimary MuiCheckbox-root MuiCheckbox-colorPrimary css-hkw0i8-MuiButtonBase-root-MuiCheckbox-root"
                      data-testid="sound-pow-radio"
                    >
                      <input
                        class="PrivateSwitchBase-input css-1m9pwf3"
                        data-indeterminate="false"
                        type="checkbox"
                      />
                      <img
                        src="test-file-stub"
                      />
                      <span
                        class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                      />
                    </span>
                    <span
                      class="MuiTypography-root MuiTypography-body1 MuiFormControlLabel-label css-ghvhpl-MuiTypography-root"
                    >
                      Pow
                    </span>
                  </label>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item NotificationsspacingSound css-13i4rnv-MuiGrid-root"
                  data-testid="sound-bang"
                >
                  <label
                    class="MuiFormControlLabel-root NotificationsradioSound MuiFormControlLabel-labelPlacementEnd css-j204z7-MuiFormControlLabel-root"
                  >
                    <span
                      class="MuiButtonBase-root MuiCheckbox-root MuiCheckbox-colorPrimary PrivateSwitchBase-root MuiCheckbox-root MuiCheckbox-colorPrimary Mui-checked MuiCheckbox-root MuiCheckbox-colorPrimary css-hkw0i8-MuiButtonBase-root-MuiCheckbox-root"
                      data-testid="sound-bang-radio"
                    >
                      <input
                        checked=""
                        class="PrivateSwitchBase-input css-1m9pwf3"
                        data-indeterminate="false"
                        type="checkbox"
                      />
                      <img
                        src="test-file-stub"
                      />
                      <span
                        class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                      />
                    </span>
                    <span
                      class="MuiTypography-root MuiTypography-body1 MuiFormControlLabel-label css-ghvhpl-MuiTypography-root"
                    >
                      Bang
                    </span>
                  </label>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item NotificationsspacingSound css-13i4rnv-MuiGrid-root"
                  data-testid="sound-splat"
                >
                  <label
                    class="MuiFormControlLabel-root NotificationsradioSound MuiFormControlLabel-labelPlacementEnd css-j204z7-MuiFormControlLabel-root"
                  >
                    <span
                      class="MuiButtonBase-root MuiCheckbox-root MuiCheckbox-colorPrimary PrivateSwitchBase-root MuiCheckbox-root MuiCheckbox-colorPrimary MuiCheckbox-root MuiCheckbox-colorPrimary css-hkw0i8-MuiButtonBase-root-MuiCheckbox-root"
                      data-testid="sound-splat-radio"
                    >
                      <input
                        class="PrivateSwitchBase-input css-1m9pwf3"
                        data-indeterminate="false"
                        type="checkbox"
                      />
                      <img
                        src="test-file-stub"
                      />
                      <span
                        class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                      />
                    </span>
                    <span
                      class="MuiTypography-root MuiTypography-body1 MuiFormControlLabel-label css-ghvhpl-MuiTypography-root"
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

  it('plays sound when switching sound', async () => {
    window.HTMLMediaElement.prototype.play = jest.fn()
    const props = {
      notificationsOption: NotificationsOptions.notifyForEveryMessage,
      notificationsSound: NotificationsSounds.bang,
      setNotificationsOption: jest.fn(),
      setNotificationsSound: jest.fn()
    }
    renderComponent(<NotificationsComponent {...props} />)
    const sounds = Object.values(NotificationsSounds).filter(
      sound => sound !== NotificationsSounds.none
    )
    for (const sound of sounds) {
      const soundRadioButton = screen.getByTestId(`sound-${sound}-radio`)
      await userEvent.click(soundRadioButton)
    }

    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(sounds.length)
  })
})
