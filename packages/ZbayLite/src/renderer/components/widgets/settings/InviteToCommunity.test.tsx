import '@testing-library/jest-dom'
import { waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { InviteToCommunity } from '../../../components/widgets/settings/InviteToCommunity'
import { renderComponent } from '../../../testUtils/renderComponent'

describe('InviteToCommunity', () => {
  it('renders properly', () => {
    const result = renderComponent(
      <InviteToCommunity
        communityName={'My new community'}
        invitationUrl={'http://registrarurl.onion'}
      />
    )
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
                  Invite a friend
                </h3>
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item"
            >
              <div
                class="MuiGrid-root MuiGrid-item"
              >
                <p
                  class="MuiTypography-root MuiTypography-body2"
                >
                  Get a link to invite friends to 
                  <span
                    class="makeStyles-bold-11"
                  >
                    My new community
                  </span>
                </p>
              </div>
            </div>
            <div
              class="MuiGrid-root"
            >
              <button
                class="MuiButtonBase-root MuiButton-root MuiButton-contained makeStyles-button-7 MuiButton-containedPrimary MuiButton-containedSizeLarge MuiButton-sizeLarge MuiButton-fullWidth"
                tabindex="0"
                type="submit"
              >
                <span
                  class="MuiButton-label"
                >
                  Create link
                </span>
                <span
                  class="MuiTouchRipple-root"
                />
              </button>
            </div>
          </div>
        </div>
      </body>
    `)
  })

  it('reveals registrar url when user clicks on the button', async () => {
    const registrarUrl = 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad'
    renderComponent(
      <InviteToCommunity
        communityName={'My new community'}
        invitationUrl={registrarUrl}
      />
    )
    expect(screen.queryByText(registrarUrl)).toBeNull()
    const revealUrlButton = screen.getByRole('button')
    expect(revealUrlButton).toBeEnabled()
    userEvent.click(revealUrlButton)
    await waitFor(() => expect(screen.queryByText(registrarUrl)).not.toBeNull())
    const copyToClipboardButton = screen.queryByRole('button')
    expect(copyToClipboardButton).not.toBeNull()
    expect(copyToClipboardButton).toHaveTextContent('Copy to clipboard')
  })
})
