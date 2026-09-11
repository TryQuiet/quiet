import React from 'react'
import { StyleSheet } from 'react-native'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { Button } from './Button.component'

// Android accessibility guidance (and the Google Play pre-launch report) require
// touch targets to be at least 48dp tall. See TryQuiet/quiet#2586.
const MINIMUM_TOUCH_TARGET_DP = 48

describe('Button component', () => {
  it.each([
    ['legacy', false],
    ['newDesign', true],
  ])('%s variant meets the minimum touch target height', (_variant, newDesign) => {
    const { getByTestId } = renderComponent(<Button title={'Continue'} onPress={jest.fn()} newDesign={newDesign} />)

    const style = StyleSheet.flatten(getByTestId('button').props.style)

    expect(style.minHeight).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET_DP)
  })

  it('renders both variants at the 50px height from the design library', () => {
    const legacy = renderComponent(<Button title={'Continue'} onPress={jest.fn()} />)
    const redesigned = renderComponent(<Button title={'Continue'} onPress={jest.fn()} newDesign />)

    expect(StyleSheet.flatten(legacy.getByTestId('button').props.style).minHeight).toBe(50)
    expect(StyleSheet.flatten(redesigned.getByTestId('button').props.style).minHeight).toBe(50)
  })
})
