import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'
import { DropZoneComponent } from './DropZoneComponent'

describe('Drop zone component', () => {
  it('renders component', () => {
    const result = renderComponent(
      <DropZoneComponent handleFileDrop={jest.fn()} channelName={'test-channel'} />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column MuiGrid-grid-xs-true css-zb6m38-MuiGrid-root"
            data-testid="drop-zone"
          />
        </div>
      </body>
    `)
  })
})
