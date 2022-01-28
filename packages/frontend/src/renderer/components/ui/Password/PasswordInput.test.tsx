import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { PasswordInput } from './PasswordInput'

describe('PasswordInput', () => {
  it('renders component', () => {
    const result = renderComponent(
      <PasswordInput
        label='Master password'
        password='test password'
        passwordVisible={false}
        handleTogglePassword={jest.fn()}
        handleSetPassword={jest.fn()}
        error={false}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiFormControl-root MuiTextField-root MuiFormControl-marginNormal MuiFormControl-fullWidth"
          >
            <label
              class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-shrink MuiInputLabel-outlined MuiFormLabel-filled"
              data-shrink="true"
              for="password"
              id="password-label"
            >
              Master password
            </label>
            <div
              class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-adornedEnd MuiOutlinedInput-adornedEnd"
            >
              <input
                aria-invalid="false"
                class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputAdornedEnd MuiOutlinedInput-inputAdornedEnd"
                id="password"
                type="password"
                value="test password"
              />
              <div
                class="MuiInputAdornment-root MuiInputAdornment-positionEnd"
              >
                <button
                  aria-label="Toggle password visibility"
                  class="MuiButtonBase-root MuiIconButton-root"
                  tabindex="0"
                  type="button"
                >
                  <span
                    class="MuiIconButton-label"
                  >
                    <svg
                      aria-hidden="true"
                      class="MuiSvgIcon-root"
                      focusable="false"
                      role="presentation"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="m0 0h24v24H0z"
                        fill="none"
                      />
                      <path
                        d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
                      />
                    </svg>
                  </span>
                  <span
                    class="MuiTouchRipple-root"
                  />
                </button>
              </div>
              <fieldset
                aria-hidden="true"
                class="PrivateNotchedOutline-root-89 MuiOutlinedInput-notchedOutline"
                style="padding-left: 8px;"
              >
                <legend
                  class="PrivateNotchedOutline-legend-90"
                  style="width: 0px;"
                >
                  <span>
                    ​
                  </span>
                </legend>
              </fieldset>
            </div>
          </div>
        </div>
      </body>
    `)
  })

  it('renders with error', () => {
    const result = renderComponent(
      <PasswordInput
        label=''
        password=''
        passwordVisible={false}
        handleTogglePassword={jest.fn()}
        handleSetPassword={jest.fn()}
        error
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiFormControl-root MuiTextField-root MuiFormControl-marginNormal MuiFormControl-fullWidth"
          >
            
            <div
              class="MuiInputBase-root MuiOutlinedInput-root Mui-error Mui-error MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-adornedEnd MuiOutlinedInput-adornedEnd"
            >
              <input
                aria-invalid="true"
                class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputAdornedEnd MuiOutlinedInput-inputAdornedEnd"
                id="password"
                type="password"
                value=""
              />
              <div
                class="MuiInputAdornment-root MuiInputAdornment-positionEnd"
              >
                <button
                  aria-label="Toggle password visibility"
                  class="MuiButtonBase-root MuiIconButton-root"
                  tabindex="0"
                  type="button"
                >
                  <span
                    class="MuiIconButton-label"
                  >
                    <svg
                      aria-hidden="true"
                      class="MuiSvgIcon-root"
                      focusable="false"
                      role="presentation"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="m0 0h24v24H0z"
                        fill="none"
                      />
                      <path
                        d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
                      />
                    </svg>
                  </span>
                  <span
                    class="MuiTouchRipple-root"
                  />
                </button>
              </div>
              <fieldset
                aria-hidden="true"
                class="PrivateNotchedOutline-root-169 MuiOutlinedInput-notchedOutline"
                style="padding-left: 8px;"
              >
                <legend
                  class="PrivateNotchedOutline-legend-170"
                  style="width: 0.01px;"
                >
                  <span>
                    ​
                  </span>
                </legend>
              </fieldset>
            </div>
          </div>
        </div>
      </body>
    `)
  })

  it('renders with password visible', () => {
    const result = renderComponent(
      <PasswordInput
        label=''
        password=''
        passwordVisible
        handleTogglePassword={jest.fn()}
        handleSetPassword={jest.fn()}
        error
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiFormControl-root MuiTextField-root MuiFormControl-marginNormal MuiFormControl-fullWidth"
          >
            
            <div
              class="MuiInputBase-root MuiOutlinedInput-root Mui-error Mui-error MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-adornedEnd MuiOutlinedInput-adornedEnd"
            >
              <input
                aria-invalid="true"
                class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputAdornedEnd MuiOutlinedInput-inputAdornedEnd"
                id="password"
                type="test"
                value=""
              />
              <div
                class="MuiInputAdornment-root MuiInputAdornment-positionEnd"
              >
                <button
                  aria-label="Toggle password visibility"
                  class="MuiButtonBase-root MuiIconButton-root"
                  tabindex="0"
                  type="button"
                >
                  <span
                    class="MuiIconButton-label"
                  >
                    <svg
                      aria-hidden="true"
                      class="MuiSvgIcon-root"
                      focusable="false"
                      role="presentation"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                      />
                    </svg>
                  </span>
                  <span
                    class="MuiTouchRipple-root"
                  />
                </button>
              </div>
              <fieldset
                aria-hidden="true"
                class="PrivateNotchedOutline-root-249 MuiOutlinedInput-notchedOutline"
                style="padding-left: 8px;"
              >
                <legend
                  class="PrivateNotchedOutline-legend-250"
                  style="width: 0.01px;"
                >
                  <span>
                    ​
                  </span>
                </legend>
              </fieldset>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
