import React from 'react'
import { StyleSheet } from 'react-native'
import { fireEvent } from '@testing-library/react-native'
import { renderComponent } from '../../../utils/functions/renderComponent/renderComponent'
import { PlusButton } from './PlusButton.component'

/** Android Material's floor. iOS asks for 44, so clearing 48 clears both. */
const TOUCH_TARGET = 48

/** The outermost rendered node is Paper's Surface, which is what carries the button's box. */
const rootStyle = (tree: any) => StyleSheet.flatten(tree.props.style) as Record<string, number>

describe('PlusButton component', () => {
  it('is at least 48x48, so a thumb does not have to aim', () => {
    const { toJSON } = renderComponent(<PlusButton onPress={jest.fn()} accessibilityLabel={'Create channel'} />)

    // Paper clips its own hitSlop with overflow:'hidden' on this Surface, so the box itself has to
    // be the target — slop cannot rescue it from outside.
    const style = rootStyle(toJSON())
    expect(style.width).toBeGreaterThanOrEqual(TOUCH_TARGET)
    expect(style.height).toBeGreaterThanOrEqual(TOUCH_TARGET)
  })

  it('keeps the row height it had at 36, by claiming the margin instead of adding to it', () => {
    const { toJSON } = renderComponent(<PlusButton onPress={jest.fn()} accessibilityLabel={'Create channel'} />)

    const style = rootStyle(toJSON())
    expect(style.margin).toBe(0)
    expect(style.width + 2 * style.margin).toBe(TOUCH_TARGET)
  })

  it('announces what it does, since the glyph carries no text', () => {
    const { getByLabelText } = renderComponent(
      <PlusButton onPress={jest.fn()} accessibilityLabel={'New direct message'} />
    )

    expect(getByLabelText('New direct message')).toBeTruthy()
  })

  it('calls onPress when tapped', () => {
    const onPress = jest.fn()
    const { getByLabelText } = renderComponent(<PlusButton onPress={onPress} accessibilityLabel={'Create channel'} />)

    fireEvent.press(getByLabelText('Create channel'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
