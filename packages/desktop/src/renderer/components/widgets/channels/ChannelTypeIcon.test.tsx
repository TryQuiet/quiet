import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { ChannelHeaderComponent } from './ChannelHeader'
import ChannelTypeIcon from './ChannelTypeIcon'

describe('ChannelTypeIcon', () => {
  describe('Public', () => {
    it('shows hash icon when isPublic=true', () => {
      const result = renderComponent(<ChannelTypeIcon isPublic={true} />)
      expect(result.baseElement).toMatchInlineSnapshot(`
        <body>
          <div>
            <svg
              aria-hidden="true"
              class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
              data-testid="PublicChannelIcon"
              focusable="false"
              viewBox="0 0 24 24"
            >
              <svg
                fill="none"
                height="24"
                viewBox="0 0 24 24"
                width="24"
              >
                <path
                  d="M15.7318 4.875L12.8818 19.125"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2"
                />
                <path
                  d="M10.5355 4.875L7.68555 19.125"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2"
                />
                <path
                  d="M6.8252 8.58594H17.7502"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2"
                />
                <path
                  d="M5.875 15.4141H16.8"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2"
                />
              </svg>
            </svg>
          </div>
        </body>
      `)
    })

    it('shows hash icon when isPublic=undefined', () => {
      const result = renderComponent(<ChannelTypeIcon />)
      expect(result.baseElement).toMatchInlineSnapshot(`
        <body>
          <div>
            <svg
              aria-hidden="true"
              class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
              data-testid="PublicChannelIcon"
              focusable="false"
              viewBox="0 0 24 24"
            >
              <svg
                fill="none"
                height="24"
                viewBox="0 0 24 24"
                width="24"
              >
                <path
                  d="M15.7318 4.875L12.8818 19.125"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2"
                />
                <path
                  d="M10.5355 4.875L7.68555 19.125"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2"
                />
                <path
                  d="M6.8252 8.58594H17.7502"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2"
                />
                <path
                  d="M5.875 15.4141H16.8"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2"
                />
              </svg>
            </svg>
          </div>
        </body>
      `)
    })

    it(`doesn't fill hash icon when fill is specified`, () => {
      const result = renderComponent(<ChannelTypeIcon fill={'currentColor'} />)
      expect(result.baseElement).toMatchInlineSnapshot(`
        <body>
          <div>
            <svg
              aria-hidden="true"
              class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
              data-testid="PublicChannelIcon"
              fill="currentColor"
              focusable="false"
              viewBox="0 0 24 24"
            >
              <svg
                fill="none"
                height="24"
                viewBox="0 0 24 24"
                width="24"
              >
                <path
                  d="M15.7318 4.875L12.8818 19.125"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2"
                />
                <path
                  d="M10.5355 4.875L7.68555 19.125"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2"
                />
                <path
                  d="M6.8252 8.58594H17.7502"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2"
                />
                <path
                  d="M5.875 15.4141H16.8"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2"
                />
              </svg>
            </svg>
          </div>
        </body>
      `)
    })
  })
  describe('Private', () => {
    it('shows lock icon when isPublic=false', () => {
      const result = renderComponent(<ChannelTypeIcon isPublic={false} />)
      expect(result.baseElement).toMatchInlineSnapshot(`
        <body>
          <div>
            <svg
              aria-hidden="true"
              class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
              data-testid="LockIcon"
              focusable="false"
              viewBox="0 0 24 24"
            >
              <svg
                fill="none"
                height="24"
                viewBox="0 0 24 24"
                width="24"
              >
                <mask
                  fill="#fff"
                  id="a"
                >
                  <path
                    d="M5.5 11.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z"
                  />
                </mask>
                <path
                  d="M5.5 11.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z"
                  mask="url(#a)"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  clip-rule="evenodd"
                  d="M7.5 10.5h2V7a2.5 2.5 0 0 1 5 0v3.5h2V7a4.5 4.5 0 1 0-9 0z"
                  fill="currentColor"
                  fill-rule="evenodd"
                  stroke-width="4"
                />
              </svg>
            </svg>
          </div>
        </body>
      `)
    })

    it('shows lock icon when fill when fill is specified', () => {
      const result = renderComponent(<ChannelTypeIcon isPublic={false} fill={'currentColor'} />)
      expect(result.baseElement).toMatchInlineSnapshot(`
        <body>
          <div>
            <svg
              aria-hidden="true"
              class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
              data-testid="LockIcon"
              fill="currentColor"
              focusable="false"
              viewBox="0 0 24 24"
            >
              <svg
                fill="currentColor"
                height="24"
                viewBox="0 0 24 24"
                width="24"
              >
                <mask
                  fill="#fff"
                  id="a"
                >
                  <path
                    d="M5.5 11.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z"
                  />
                </mask>
                <path
                  d="M5.5 11.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z"
                  mask="url(#a)"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  clip-rule="evenodd"
                  d="M7.5 10.5h2V7a2.5 2.5 0 0 1 5 0v3.5h2V7a4.5 4.5 0 1 0-9 0z"
                  fill="currentColor"
                  fill-rule="evenodd"
                  stroke-width="4"
                />
              </svg>
            </svg>
          </div>
        </body>
      `)
    })
  })
})
