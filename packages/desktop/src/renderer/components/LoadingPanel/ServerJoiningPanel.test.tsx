import React from 'react'
import { renderComponent } from '../../testUtils/renderComponent'
import ServerJoiningPanel, { serverStatus } from './ServerJoiningPanel'
import { ConnectionProcessInfo } from '@quiet/types'

const connectionInfo = { number: 25, text: ConnectionProcessInfo.CONNECTING_TO_COMMUNITY }

const render = (props: Partial<React.ComponentProps<typeof ServerJoiningPanel>> = {}) =>
  renderComponent(
    <ServerJoiningPanel
      open={true}
      isOwner={false}
      connectionInfo={connectionInfo}
      communityName='Rockets'
      {...props}
    />
  )

describe('ServerJoiningPanel', () => {
  it('shows the bar filled to the phase the app reports', () => {
    const result = render()

    expect(result.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('25')
    expect(result.getByTestId('actionProgressFill').style.width).toBe('25%')
  })

  it('falls back to the bare wording when the community has no name yet', () => {
    expect(serverStatus(false, undefined)).toBe('Joining community')
    expect(serverStatus(true, undefined)).toBe('Creating community')
  })

  it('dims the sidebar when there is one behind it', () => {
    const result = render({ withSidebar: true })

    expect(result.getByTestId('serverJoiningPanel').querySelector('.ServerJoiningPanelscrim')).toBeTruthy()
  })

  it('has nothing to dim when the sidebar is not mounted', () => {
    const result = render({ withSidebar: false })

    expect(result.getByTestId('serverJoiningPanel').querySelector('.ServerJoiningPanelscrim')).toBeNull()
  })

  it('renders nothing when closed', () => {
    const result = render({ open: false })

    expect(result.queryByTestId('serverJoiningPanel')).toBeNull()
  })

  // The rule the server screen exists for: a community on a server is not
  // reached by anything the person is waiting on being told about, so none of
  // its vocabulary belongs under the bar. Run over every phase the enum can
  // hold, not just the four the slice currently stores, so a phase added later
  // cannot reintroduce it.
  it.each(Object.entries(ConnectionProcessInfo))('says nothing about Tor while %s is the phase', (_key, phase) => {
    const result = renderComponent(
      <ServerJoiningPanel
        open={true}
        isOwner={false}
        connectionInfo={{ number: 40, text: phase }}
        communityName='Rockets'
      />
    )

    expect(result.container.textContent).not.toMatch(/tor\b/i)
    expect(result.container.textContent).not.toMatch(/hidden service/i)
    expect(result.container.textContent).not.toMatch(/onion/i)
  })

  it('renders component', () => {
    const result = render()
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            aria-modal="true"
            class="ServerJoiningPanelroot MuiBox-root css-1vwzvx6"
            data-testid="serverJoiningPanel"
            role="dialog"
          >
            <div
              class="ServerJoiningPanelcontent"
              data-testid="joiningPanelComponent"
            >
              <div
                class="MuiGrid-root ActionProgressroot css-ar2mpm-MuiGrid-root"
                data-testid="serverJoiningProgress"
              >
                <div
                  aria-valuemax="100"
                  aria-valuemin="0"
                  aria-valuenow="25"
                  class="ActionProgresstrack"
                  role="progressbar"
                >
                  <div
                    class="ActionProgressfill"
                    data-indeterminate="false"
                    data-testid="actionProgressFill"
                    style="width: 25%;"
                  />
                </div>
                <p
                  class="MuiTypography-root MuiTypography-body2 ActionProgressstatus css-1t82dwi-MuiTypography-root"
                  data-testid="actionProgressStatus"
                  role="status"
                >
                  Joining community “Rockets”
                </p>
                <span
                  class="MuiTypography-root MuiTypography-caption ActionProgresssecondary css-sb3pb0-MuiTypography-root"
                  data-testid="actionProgressSecondary"
                >
                  Connecting to community members
                </span>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
