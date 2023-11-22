import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/dom'
import { renderComponent } from '../../testUtils/renderComponent'

import CreateUsernameComponent, { UsernameVariant } from './CreateUsernameComponent'
import { FieldErrors, UsernameErrors } from '../../forms/fieldsErrors'
import { keyFromCertificate, parseCertificate } from '@quiet/identity'
import { UserData } from '@quiet/types'

describe('Create username', () => {
    it.each([
        ['double-hyp--hens', 'double-hyp-hens'],
        ['-start-with-hyphen', 'start-with-hyphen'],
        [' start-with-space', 'start-with-space'],
        ['end-with-hyphen-', 'end-with-hyphen'],
        ['end-with-space ', 'end-with-space'],
        ['UpperCaseToLowerCase', 'uppercasetolowercase'],
        ['spaces to hyphens', 'spaces-to-hyphens'],
        ['----hyphens', 'hyphens'],
    ])('user inserting wrong name "%s" gets corrected "%s"', async (name: string, corrected: string) => {
        renderComponent(<CreateUsernameComponent open={true} registerUsername={() => {}} handleClose={() => {}} />)

        const input = screen.getByPlaceholderText('Enter a username')

        await userEvent.type(input, name)
        expect(screen.getByTestId('createUserNameWarning')).toHaveTextContent(
            `Your username will be registered as @${corrected}`
        )
    })

    it.each([
        ['   whitespaces', FieldErrors.Whitespaces],
        ['!@#', UsernameErrors.WrongCharacter],
    ])('user inserting invalid name "%s" should see "%s" error', async (name: string, error: string) => {
        const registerUsername = jest.fn()

        renderComponent(
            <CreateUsernameComponent open={true} registerUsername={registerUsername} handleClose={() => {}} />
        )

        const input = screen.getByPlaceholderText('Enter a username')
        const button = screen.getByText('Register')

        await userEvent.type(input, name)
        await userEvent.click(button)

        await waitFor(() => expect(registerUsername).not.toBeCalled())

        const message = await screen.findByText(error)
        expect(message).toBeVisible()
    })
})

describe('Username taken', () => {
    const userCertData = {
        username: 'userName',
        onionAddress: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
        peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
        dmPublicKey: '0bfb475810c0e26c9fab590d47c3d60ec533bb3c451596acc3cd4f21602e9ad9',
    }

    const userCertString =
        'MIICaDCCAg6gAwIBAgIGAYBqyuV2MAoGCCqGSM49BAMCMBkxFzAVBgNVBAMTDnF1aWV0Y29tbXVuaXR5MB4XDTEwMTIyODEwMTAxMFoXDTMwMTIyODEwMTAxMFowSTFHMEUGA1UEAxM+bnFudzRrYzRjNzdmYjQ3bGs1Mm01bDU3aDR0Y3hjZW83eW14ZWtmbjd5aDVtNjZ0NGp2Mm9sYWQub25pb24wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQZBMmiVmRBRvw+QiL5DYg7WGFUVgA7u90KMpJg4qCaCJJNh7wH2tl0EDsN4FeGmR9AkvtCGd+5vYL0nGcX/oLdo4IBEDCCAQwwCQYDVR0TBAIwADALBgNVHQ8EBAMCAIAwHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMC8GCSqGSIb3DQEJDAQiBCAL+0dYEMDibJ+rWQ1Hw9YOxTO7PEUVlqzDzU8hYC6a2TAYBgorBgEEAYOMGwIBBAoTCHVzZXJOYW1lMD0GCSsGAQIBDwMBAQQwEy5RbWYzeVNrWXFMRVQ5eHRBdER6dkFyNVBwM2VnSzFIM0M1aUpBWm0xU3BMRXA2MEkGA1UdEQRCMECCPm5xbnc0a2M0Yzc3ZmI0N2xrNTJtNWw1N2g0dGN4Y2VvN3lteGVrZm43eWg1bTY2dDRqdjJvbGFkLm9uaW9uMAoGCCqGSM49BAMCA0gAMEUCIF63rnIq8vd86NT9RHSFj7borwwODqyfE7Pw64tGElpIAiEA5ZDSdrDd8OGf+kv7wxByM1Xgmc5m/aydUk+WorbO3Gg='
    const parsedCert = parseCertificate(userCertString)
    const userPubKey = keyFromCertificate(parsedCert)

    const registeredUsers: Record<string, UserData> = {
        [userPubKey]: userCertData,
    }
    it('renders component ', () => {
        const result = renderComponent(
            <CreateUsernameComponent
                handleClose={() => {}}
                open={true}
                currentUsername={'jack'}
                variant={UsernameVariant.TAKEN}
                registeredUsers={registeredUsers}
                registerUsername={() => {}}
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
                    Username taken
                  </h6>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item Modalactions css-hoc6b0-MuiGrid-root"
                    data-testid="createUsernameModalActions"
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
                  class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-1j6kke6-MuiGrid-root"
                >
                  <form>
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column CreateUsernameComponent-fullContainer css-1e5jxqd-MuiGrid-root"
                    >
                      <p
                        class="MuiTypography-root MuiTypography-body2 CreateUsernameComponent-marginMedium css-16d47hw-MuiTypography-root"
                      >
                        We’re sorry, but the username 
                        <strong>
                          @jack
                        </strong>
                         was already claimed by someone else. 
                        <br />
                        Can you choose another name?
                      </p>
                      <p
                        class="MuiTypography-root MuiTypography-body2 CreateUsernameComponent-inputLabel css-16d47hw-MuiTypography-root"
                      >
                        Enter username
                      </p>
                      <div
                        class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root CreateUsernameComponent-focus CreateUsernameComponent-margin css-wb57ya-MuiFormControl-root-MuiTextField-root"
                      >
                        <div
                          class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl css-143wfni-MuiInputBase-root-MuiOutlinedInput-root"
                        >
                          <input
                            aria-invalid="false"
                            class="MuiInputBase-input MuiOutlinedInput-input css-24rejj-MuiInputBase-input-MuiOutlinedInput-input"
                            id=":ra:"
                            name="userName"
                            placeholder="Username"
                            type="text"
                            value=""
                          />
                          <fieldset
                            aria-hidden="true"
                            class="MuiOutlinedInput-notchedOutline css-1d3z3hw-MuiOutlinedInput-notchedOutline"
                          >
                            <legend
                              class="css-ihdtdm"
                            >
                              <span
                                class="notranslate"
                              >
                                ​
                              </span>
                            </legend>
                          </fieldset>
                        </div>
                      </div>
                      <p
                        class="MuiTypography-root MuiTypography-body2 css-xseqde-MuiTypography-root"
                      />
                      <span
                        class="MuiTypography-root MuiTypography-caption css-1d4bzk2-MuiTypography-root"
                        style="margin-top: 8px;"
                      >
                        You can choose any username you like. No spaces or special characters.
                      </span>
                      <div
                        class="CreateUsernameComponent-gutter"
                      />
                      <button
                        class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium CreateUsernameComponent-button CreateUsernameComponent-buttonModern css-1fotjar-MuiButtonBase-root-MuiButton-root"
                        tabindex="0"
                        type="submit"
                      >
                        Continue
                        <span
                          class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                        />
                      </button>
                    </div>
                  </form>
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
