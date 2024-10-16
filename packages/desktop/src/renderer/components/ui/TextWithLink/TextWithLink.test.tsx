import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { TextWithLink } from './TextWithLink'

import { createLogger } from '../../../logger'

const logger = createLogger('textWithLink:test')

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
              logger.info('linked clicked')
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
