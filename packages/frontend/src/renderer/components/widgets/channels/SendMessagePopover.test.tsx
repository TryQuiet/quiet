import React from 'react'

import { SendMessagePopover } from './SendMessagePopover'
import { renderComponent } from '../../../testUtils/renderComponent'

describe('SendMessagePopover', () => {
  it('renders popover', () => {
    const ref = React.createRef<HTMLAnchorElement>()
    const result = renderComponent(
      <SendMessagePopover
        anchorEl={ref.current}
        handleClose={jest.fn()}
        username='TestUser'
        users={{}}
        address={
          'ztestsapling1juf4322spfp2nhmqaz5wymw8nkkxxyv06x38cel2nj6d7s8fdyd6dlsmc6efv02sf0kty2v7lfz'
        }
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div />
      </body>
    `)
  })
})
