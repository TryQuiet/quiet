import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  const Content = () => <div>Test Header</div>
  it('renders component', () => {
    const result = renderComponent(
      <PageHeader>
        <Content />
      </PageHeader>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-item PageHeaderroot css-1j1q06-MuiGrid-root"
          >
            <div>
              Test Header
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
