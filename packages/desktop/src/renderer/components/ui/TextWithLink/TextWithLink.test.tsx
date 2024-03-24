import React from 'react'
import { defaultLogger } from '../../../logger'

import { renderComponent } from '../../../testUtils/renderComponent'
import { TextWithLink } from './TextWithLink'

describe('TextWithLink', () => {
  it('renders component', () => {
    const result = renderComponent(
      <TextWithLink
        text={'Here is simple text'}
        links={[
          {
            tag: 'simple',
            label: 'simple',
            action: () => {
              defaultLogger.info('linked clicked')
            },
          },
        ]}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <p
            class="MuiTypography-root MuiTypography-body1 css-rxnbv9-MuiTypography-root"
          >
            <span>
              Here
            </span>
            <span>
               
            </span>
            <span>
              is
            </span>
            <span>
               
            </span>
            <span>
              simple
            </span>
            <span>
               
            </span>
            <span>
              text
            </span>
          </p>
        </div>
      </body>
    `)
  })
})
