
import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { Appbar } from './Appbar.component'

describe('Appbar component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(<Appbar />)

    expect(toJSON()).toMatchInlineSnapshot()
  })
})
