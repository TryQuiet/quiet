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
      setNotificationsSound: jest.fn(),
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
                          You’ll be notified for every new message.
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
                          You won’t receive notifications from Quiet.
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
                  Sound when receiving a notification
                </h5>
              </div>
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column NotificationsradioSoundDiv css-80wlp8-MuiGrid-root"
              >
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
                <div
                  class="MuiGrid-root MuiGrid-item NotificationsspacingSound css-13i4rnv-MuiGrid-root"
                  data-testid="sound-none"
                >
                  <label
                    class="MuiFormControlLabel-root NotificationsradioSound MuiFormControlLabel-labelPlacementEnd css-j204z7-MuiFormControlLabel-root"
                  >
                    <span
                      class="MuiButtonBase-root MuiCheckbox-root MuiCheckbox-colorPrimary PrivateSwitchBase-root MuiCheckbox-root MuiCheckbox-colorPrimary MuiCheckbox-root MuiCheckbox-colorPrimary css-hkw0i8-MuiButtonBase-root-MuiCheckbox-root"
                      data-testid="sound-none-radio"
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
                      None
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
      setNotificationsSound: jest.fn(),
    }
    renderComponent(<NotificationsComponent {...props} />)
    const sounds = Object.values(NotificationsSounds).filter(sound => sound !== NotificationsSounds.none)
    for (const sound of sounds) {
      const soundRadioButton = screen.getByTestId(`sound-${sound}-radio`)
      await userEvent.click(soundRadioButton)
    }

    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(sounds.length)
  })
})
