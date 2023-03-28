import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'

import { QRCode } from './QRCode.component'

describe('QRCode component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <QRCode
        value={'https://tryquiet.org/join?code='}
        shareCode={jest.fn()}
        handleBackButton={jest.fn()}
      />
    )

    expect(toJSON()).toMatchInlineSnapshot()
  })
})
