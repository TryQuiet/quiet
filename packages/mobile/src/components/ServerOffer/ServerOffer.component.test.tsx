import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { ServerOffer } from './ServerOffer.component'

describe('ServerOffer', () => {
  it("carries the frame's copy and takes the server", () => {
    const onClose = jest.fn()
    const result = renderComponent(<ServerOffer visible onClose={onClose} showDontShowAgain={false} />)

    expect(result.getByText('Want a server?')).toBeTruthy()
    expect(result.getByText('It’s free!')).toBeTruthy()
    expect(
      result.getByText(
        'Messages are still end-to-end encrypted, joining will be faster, and Quiet will work much better on iPhones.'
      )
    ).toBeTruthy()
    // The frame's labels, not the app's old "Add server" / "No thanks".
    expect(result.getByText('Use Quiet’s server')).toBeTruthy()
    expect(result.getByText('Not now')).toBeTruthy()
    expect(result.queryByText('Add server')).toBeNull()

    fireEvent.press(result.getByTestId('server-offer-use-server'))
    expect(onClose).toHaveBeenCalledWith(true, false)
  })

  it('declines through "Not now" and through the close glyph', () => {
    const onClose = jest.fn()
    const result = renderComponent(<ServerOffer visible onClose={onClose} showDontShowAgain={false} />)

    fireEvent.press(result.getByTestId('server-offer-not-now'))
    expect(onClose).toHaveBeenLastCalledWith(false, false)

    // The bar zone holds the close glyph and no title (2922:10009); closing is "Not now".
    expect(result.getByTestId('appbar_without_title')).toBeTruthy()
    expect(result.queryByText('Add members')).toBeNull()
    fireEvent.press(result.getByTestId('appbar_action_item'))
    expect(onClose).toHaveBeenLastCalledWith(false, false)
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('is a screen, so it shows nothing when the offer is not open', () => {
    const result = renderComponent(<ServerOffer visible={false} onClose={jest.fn()} showDontShowAgain={false} />)

    expect(result.queryByTestId('server-offer-component')).toBeNull()
  })

  it('reports the "Don’t show this again" choice with the decision', () => {
    const onClose = jest.fn()
    const result = renderComponent(<ServerOffer visible onClose={onClose} showDontShowAgain={true} />)

    const checkbox = result.getByTestId('server-offer-dont-show-again')
    expect(checkbox.props.accessibilityState).toMatchObject({ checked: false })

    fireEvent.press(checkbox)
    expect(result.getByTestId('server-offer-dont-show-again').props.accessibilityState).toMatchObject({ checked: true })

    fireEvent.press(result.getByTestId('server-offer-not-now'))
    expect(onClose).toHaveBeenCalledWith(false, true)

    fireEvent.press(result.getByTestId('server-offer-use-server'))
    expect(onClose).toHaveBeenLastCalledWith(true, true)
  })

  it('leaves out the rule and the checkbox unless they are asked for', () => {
    const result = renderComponent(<ServerOffer visible onClose={jest.fn()} showDontShowAgain={false} />)

    expect(result.queryByTestId('server-offer-dont-show-again')).toBeNull()
    expect(result.queryByText('Don’t show this again')).toBeNull()
  })
})
