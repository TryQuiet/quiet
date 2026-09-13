import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'

import { ActionProgress } from './ActionProgress.component'

describe('ActionProgress component', () => {
  it('shows the status line over the bar', () => {
    const { getByText, getByTestId } = renderComponent(<ActionProgress status={'Generating device link…'} />)

    expect(getByText('Generating device link…')).toBeTruthy()
    expect(getByTestId('action-progress-fill')).toBeTruthy()
  })

  it('shows the second line when given', () => {
    const { getByText } = renderComponent(<ActionProgress status={'Joining now!'} secondary={'Hold on.'} value={0.5} />)

    expect(getByText('Hold on.')).toBeTruthy()
  })
})
