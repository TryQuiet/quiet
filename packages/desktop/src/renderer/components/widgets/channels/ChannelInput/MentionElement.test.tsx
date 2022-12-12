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
            class="MuiGrid-root MuiGrid-container MentionElementroot MentionElementhighlight css-1mfbfa2-MuiGrid-root"
          >
            <div
              class="MuiGrid-root MuiGrid-item MentionElementavatarDiv css-13i4rnv-MuiGrid-root"
            >
              <div
                class="MentionElementalignAvatar"
              >
                Jdenticon
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true MentionElementdata css-1vd824g-MuiGrid-root"
            >
              <h5
                class="MuiTypography-root MuiTypography-h5 MentionElementname css-11l3dv4-MuiTypography-root"
              >
                test
              </h5>
              <p
                class="MuiTypography-root MuiTypography-body2 MentionElementcaption MentionElementcaptionHighlight css-16d47hw-MuiTypography-root"
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
            class="MuiGrid-root MuiGrid-container MentionElementroot css-1mfbfa2-MuiGrid-root"
          >
            <div
              class="MuiGrid-root MuiGrid-item MentionElementavatarDiv css-13i4rnv-MuiGrid-root"
            >
              <div
                class="MentionElementalignAvatar"
              >
                Jdenticon
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true MentionElementdata css-1vd824g-MuiGrid-root"
            >
              <h5
                class="MuiTypography-root MuiTypography-h5 MentionElementname css-11l3dv4-MuiTypography-root"
              >
                test
              </h5>
              <p
                class="MuiTypography-root MuiTypography-body2 MentionElementcaption css-16d47hw-MuiTypography-root"
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
