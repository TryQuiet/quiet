import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { ServerOffer } from './ServerOffer.component'

describe('ServerOffer', () => {
  it("carries the frame's copy and takes the server", () => {
    const onClose = jest.fn()
    const result = renderComponent(<ServerOffer onClose={onClose} onBack={jest.fn()} showDontShowAgain={false} />)

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

  it('declines with "Not now", and its glyph goes back without deciding', () => {
    const onClose = jest.fn()
    const onBack = jest.fn()
    const result = renderComponent(<ServerOffer onClose={onClose} onBack={onBack} showDontShowAgain={false} />)

    fireEvent.press(result.getByTestId('server-offer-not-now'))
    expect(onClose).toHaveBeenCalledWith(false, false)

    // The bar zone holds the glyph and no title (2922:10009), and the frame wires it to "back".
    expect(result.getByTestId('appbar_without_title')).toBeTruthy()
    expect(result.queryByText('Add members')).toBeNull()
    fireEvent.press(result.getByTestId('appbar_action_item'))
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('scrolls, so the rule and the checkbox stay reachable at large font scales', () => {
    const result = renderComponent(<ServerOffer onClose={jest.fn()} onBack={jest.fn()} showDontShowAgain={true} />)

    const scroll = result.getByTestId('server-offer-content')
    expect(scroll).toBeTruthy()
    // The content grows past the viewport rather than being clipped to it.
    const style = Array.isArray(scroll.props.contentContainerStyle)
      ? Object.assign({}, ...scroll.props.contentContainerStyle)
      : scroll.props.contentContainerStyle
    expect(style).toMatchObject({ flexGrow: 1 })
    expect(result.getByTestId('server-offer-dont-show-again')).toBeTruthy()
  })

  it('reports the "Don’t show this again" choice with the decision', () => {
    const onClose = jest.fn()
    const result = renderComponent(<ServerOffer onClose={onClose} onBack={jest.fn()} showDontShowAgain={true} />)

    const checkbox = result.getByTestId('server-offer-dont-show-again')
    expect(checkbox.props.accessibilityState).toMatchObject({ checked: false })

    fireEvent.press(checkbox)
    expect(result.getByTestId('server-offer-dont-show-again').props.accessibilityState).toMatchObject({ checked: true })

    fireEvent.press(result.getByTestId('server-offer-not-now'))
    expect(onClose).toHaveBeenCalledWith(false, true)

    fireEvent.press(result.getByTestId('server-offer-use-server'))
    expect(onClose).toHaveBeenLastCalledWith(true, true)
  })

  it('can start with the box ticked, and reports that untouched', () => {
    const onClose = jest.fn()
    const result = renderComponent(
      <ServerOffer onClose={onClose} onBack={jest.fn()} showDontShowAgain={true} defaultDontShowAgain={true} />
    )

    expect(result.getByTestId('server-offer-dont-show-again').props.accessibilityState).toMatchObject({ checked: true })
    fireEvent.press(result.getByTestId('server-offer-use-server'))
    expect(onClose).toHaveBeenCalledWith(true, true)
  })

  it('leaves out the rule and the checkbox unless they are asked for', () => {
    const result = renderComponent(<ServerOffer onClose={jest.fn()} onBack={jest.fn()} showDontShowAgain={false} />)

    expect(result.queryByTestId('server-offer-dont-show-again')).toBeNull()
    expect(result.queryByText('Don’t show this again')).toBeNull()
  })
})
