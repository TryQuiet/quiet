import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { WindowWrapper } from './WindowWrapper'

describe('WindowWrapper', () => {
    const Page = () => <div>Test page</div>

    it('renders component', () => {
        const result = renderComponent(
            <WindowWrapper>
                <Page />
            </WindowWrapper>
        )
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="WindowWrapperwrapper css-j4mowy"
          >
            <div>
              Test page
            </div>
          </div>
        </div>
      </body>
    `)
    })

    it('renders with custom className', () => {
        const result = renderComponent(
            <WindowWrapper className='test-class'>
                <Page />
            </WindowWrapper>
        )
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="WindowWrapperwrapper test-class css-j4mowy"
          >
            <div>
              Test page
            </div>
          </div>
        </div>
      </body>
    `)
    })
})
