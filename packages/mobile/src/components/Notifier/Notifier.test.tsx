import React from 'react'
import '@testing-library/jest-native/extend-expect'
import { fireEvent, screen } from '@testing-library/react-native'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'

import { appImages } from '../../assets'

import { Notifier } from './Notifier.component'

describe('Notifier component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <Notifier
        onButtonPress={jest.fn()}
        onEmailPress={jest.fn()}
        icon={appImages.update_graphics}
        title={'Coming update will remove communities & messages'}
        message={
          'Quiet’s next release makes joining communities faster and more reliable by letting people join when the owner is offline! 🎉 However, these changes required us to reset all communities, and both communities and messages will be lost on mobile. 😥 We apologize for the inconvenience, and please reach out immediately if you need help backing up messages.'
        }
      />
    )

    expect(toJSON()).toMatchSnapshot()
  })

  it('should respond on button tap', () => {
    const buttonCallback = jest.fn()

    renderComponent(
      <Notifier
        onButtonPress={buttonCallback}
        onEmailPress={jest.fn()}
        icon={appImages.update_graphics}
        title={'Coming update will remove communities & messages'}
        message={
          'Quiet’s next release makes joining communities faster and more reliable by letting people join when the owner is offline! 🎉 However, these changes required us to reset all communities, and both communities and messages will be lost on mobile. 😥 We apologize for the inconvenience, and please reach out immediately if you need help backing up messages.'
        }
      />
    )

    fireEvent.press(screen.getByText('I understand'))

    expect(buttonCallback).toBeCalled()
  })
})
