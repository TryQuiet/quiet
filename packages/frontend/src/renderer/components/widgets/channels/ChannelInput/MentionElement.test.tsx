import React from 'react'

import { renderComponent } from '../../../../testUtils/renderComponent'
import { MentionElement } from './MentionElement'

describe('MentionElement', () => {
  it('renders component highlight', () => {
    const result = renderComponent(
      <MentionElement
        onClick={jest.fn()}
        onMouseEnter={jest.fn()}
        name='test'
        channelName='#test'
        participant
        highlight
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root makeStyles-root-1 makeStyles-highlight-5 MuiGrid-container"
          >
            <div
              class="MuiGrid-root makeStyles-avatarDiv-2 MuiGrid-item"
            >
              <div
                class="makeStyles-alignAvatar-3"
              >
                Jdenticon
              </div>
            </div>
            <div
              class="MuiGrid-root makeStyles-data-4 MuiGrid-item MuiGrid-grid-xs-true"
            >
              <h5
                class="MuiTypography-root makeStyles-name-6 MuiTypography-h5"
              >
                test
              </h5>
              <p
                class="MuiTypography-root makeStyles-caption-7 makeStyles-captionHighlight-8 MuiTypography-body2"
              >
                Participant in #test
              </p>
            </div>
          </div>
        </div>
      </body>
    `)
  })
  it('renders component not highlight', () => {
    const result = renderComponent(
      <MentionElement
        onClick={jest.fn()}
        onMouseEnter={jest.fn()}
        name='test'
        channelName='#test'
        participant
        highlight={false}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root makeStyles-root-142 MuiGrid-container"
          >
            <div
              class="MuiGrid-root makeStyles-avatarDiv-143 MuiGrid-item"
            >
              <div
                class="makeStyles-alignAvatar-144"
              >
                Jdenticon
              </div>
            </div>
            <div
              class="MuiGrid-root makeStyles-data-145 MuiGrid-item MuiGrid-grid-xs-true"
            >
              <h5
                class="MuiTypography-root makeStyles-name-147 MuiTypography-h5"
              >
                test
              </h5>
              <p
                class="MuiTypography-root makeStyles-caption-148 MuiTypography-body2"
              >
                Participant in #test
              </p>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
