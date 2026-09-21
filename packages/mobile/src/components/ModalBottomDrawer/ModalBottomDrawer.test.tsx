import React from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native'
import { Dimensions, Text } from 'react-native'

import { ModalBottomDrawer } from './ModalBottomDrawer.component'

const initialDimensions = {
  window: Dimensions.get('window'),
  screen: Dimensions.get('screen'),
}

const resizeContainer = (width: number, height: number) =>
  fireEvent(screen.getByTestId('drawer-container'), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width, height } },
  })

describe('ModalBottomDrawer window sizing', () => {
  beforeEach(() => {
    Dimensions.set({
      window: { width: 390, height: 760, scale: 1, fontScale: 1 },
      screen: { width: 390, height: 844, scale: 1, fontScale: 1 },
    })
  })

  afterEach(() => {
    cleanup()
    Dimensions.set(initialDimensions)
  })

  it('fits a full-height drawer inside its safe-area parent and updates after rotation', () => {
    const onClose = jest.fn()
    render(
      <ModalBottomDrawer visible onClose={onClose} testIdPrefix='drawer' heightRatio={1}>
        <Text>Captcha content</Text>
      </ModalBottomDrawer>
    )

    // The window is the initial bound, never the larger physical display.
    expect(screen.getByTestId('drawer')).toHaveStyle({ height: 760, maxHeight: '100%' })

    resizeContainer(390, 704)
    expect(screen.getByTestId('drawer')).toHaveStyle({ height: 704 })

    act(() => {
      Dimensions.set({
        window: { width: 844, height: 390, scale: 1, fontScale: 1 },
        screen: { width: 844, height: 390, scale: 1, fontScale: 1 },
      })
    })
    resizeContainer(796, 330)

    expect(screen.getByTestId('drawer')).toHaveStyle({ height: 330 })
    expect(screen.getByText('Captcha content')).toBeOnTheScreen()
    fireEvent.press(screen.getByRole('button', { name: 'Close drawer' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('resizes a proportional drawer when only its parent changes size', () => {
    render(<ModalBottomDrawer visible onClose={jest.fn()} testIdPrefix='drawer' />)

    resizeContainer(390, 600)
    expect(screen.getByTestId('drawer')).toHaveStyle({ height: 400 })

    // A parent layout change need not produce a Dimensions change event.
    resizeContainer(390, 300)
    expect(screen.getByTestId('drawer')).toHaveStyle({ height: 200 })

    resizeContainer(390, 600)
    expect(screen.getByTestId('drawer')).toHaveStyle({ height: 400 })
  })

  it('clamps a fixed-height drawer to its container and restores its requested height when space returns', () => {
    render(<ModalBottomDrawer visible onClose={jest.fn()} testIdPrefix='drawer' heightPx={600} />)

    resizeContainer(390, 704)
    expect(screen.getByTestId('drawer')).toHaveStyle({ height: 600 })

    resizeContainer(390, 320)
    expect(screen.getByTestId('drawer')).toHaveStyle({ height: 320 })

    resizeContainer(390, 704)
    expect(screen.getByTestId('drawer')).toHaveStyle({ height: 600 })
  })
})
