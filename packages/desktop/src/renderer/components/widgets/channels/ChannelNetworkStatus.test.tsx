import React from 'react'

import { renderComponent } from '../../../testUtils'
import ChannelNetworkStatus from './ChannelNetworkStatus'

describe('ChannelNetworkStatus', () => {
  it('renders and displays when community has peers but none are connected', () => {
    const result = renderComponent(
      <ChannelNetworkStatus channelName={'general'} isConnectedToOtherPeers={false} communityHasPeers={true} />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container css-11lq3yg-MuiGrid-root"
            data-testid="quietTryingToConnect-general"
            style="display: flex; flex-direction: row; align-items: center; padding: 11px 16px 11px 16px; width: 100%; border-top: 1px solid #F0F0F0; border-radius: 16px 16px 0px 0px;"
          >
            <div
              class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
              style="display: flex; flex-direction: row; padding-right: 12px;"
            >
              <span
                class="MuiCircularProgress-root MuiCircularProgress-indeterminate MuiCircularProgress-colorInherit channelQuietConnectingSpinner css-62e83j-MuiCircularProgress-root"
                role="progressbar"
                style="width: 20px; height: 20px;"
              >
                <svg
                  class="MuiCircularProgress-svg css-1idz92c-MuiCircularProgress-svg"
                  viewBox="22 22 44 44"
                >
                  <circle
                    class="MuiCircularProgress-circle MuiCircularProgress-circleIndeterminate css-176wh8e-MuiCircularProgress-circle"
                    cx="44"
                    cy="44"
                    fill="none"
                    r="20.2"
                    stroke-width="3.6"
                  />
                </svg>
              </span>
            </div>
            <p
              class="MuiTypography-root MuiTypography-body1 css-gn1vah-MuiTypography-root"
            >
              Quiet is trying to connect...
            </p>
          </div>
        </div>
      </body>
    `)
  })

  it('renders without display when community has peers and at least one is connected', () => {
    const result = renderComponent(
      <ChannelNetworkStatus channelName={'general'} isConnectedToOtherPeers={true} communityHasPeers={true} />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container css-11lq3yg-MuiGrid-root"
            data-testid="quietTryingToConnect-general"
            style="display: none; flex-direction: row; align-items: center; padding: 11px 16px 11px 16px; width: 100%; border-top: 1px solid #F0F0F0; border-radius: 16px 16px 0px 0px;"
          >
            <div
              class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
              style="display: flex; flex-direction: row; padding-right: 12px;"
            >
              <span
                class="MuiCircularProgress-root MuiCircularProgress-indeterminate MuiCircularProgress-colorInherit channelQuietConnectingSpinner css-62e83j-MuiCircularProgress-root"
                role="progressbar"
                style="width: 20px; height: 20px;"
              >
                <svg
                  class="MuiCircularProgress-svg css-1idz92c-MuiCircularProgress-svg"
                  viewBox="22 22 44 44"
                >
                  <circle
                    class="MuiCircularProgress-circle MuiCircularProgress-circleIndeterminate css-176wh8e-MuiCircularProgress-circle"
                    cx="44"
                    cy="44"
                    fill="none"
                    r="20.2"
                    stroke-width="3.6"
                  />
                </svg>
              </span>
            </div>
            <p
              class="MuiTypography-root MuiTypography-body1 css-gn1vah-MuiTypography-root"
            >
              Quiet is trying to connect...
            </p>
          </div>
        </div>
      </body>
    `)
  })

  it('renders without display when community has no peers', () => {
    const result = renderComponent(
      <ChannelNetworkStatus channelName={'general'} isConnectedToOtherPeers={false} communityHasPeers={false} />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container css-11lq3yg-MuiGrid-root"
            data-testid="quietTryingToConnect-general"
            style="display: none; flex-direction: row; align-items: center; padding: 11px 16px 11px 16px; width: 100%; border-top: 1px solid #F0F0F0; border-radius: 16px 16px 0px 0px;"
          >
            <div
              class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
              style="display: flex; flex-direction: row; padding-right: 12px;"
            >
              <span
                class="MuiCircularProgress-root MuiCircularProgress-indeterminate MuiCircularProgress-colorInherit channelQuietConnectingSpinner css-62e83j-MuiCircularProgress-root"
                role="progressbar"
                style="width: 20px; height: 20px;"
              >
                <svg
                  class="MuiCircularProgress-svg css-1idz92c-MuiCircularProgress-svg"
                  viewBox="22 22 44 44"
                >
                  <circle
                    class="MuiCircularProgress-circle MuiCircularProgress-circleIndeterminate css-176wh8e-MuiCircularProgress-circle"
                    cx="44"
                    cy="44"
                    fill="none"
                    r="20.2"
                    stroke-width="3.6"
                  />
                </svg>
              </span>
            </div>
            <p
              class="MuiTypography-root MuiTypography-body1 css-gn1vah-MuiTypography-root"
            >
              Quiet is trying to connect...
            </p>
          </div>
        </div>
      </body>
    `)
  })
})
