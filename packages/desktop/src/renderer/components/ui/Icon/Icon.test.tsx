import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { Icon } from './Icon'
import icon from '../../static/images/zcash/zcash-icon-fullcolor.svg'

describe('Icon', () => {
    it('renders component', () => {
        const result = renderComponent(<Icon src={icon} />)
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <img
            src="test-file-stub"
          />
        </div>
      </body>
    `)
    })
})
