import React from 'react'
import { shallow } from 'enzyme'
import { RegistraionGuide } from './RegistrationGuide'
import { mockClasses } from '../../../shared/testing/mocks'

describe('RegistraionGuide', () => {
  it('renders component', () => {
    const result = shallow(
      <RegistraionGuide
        classes={mockClasses}
        isGuideCompleted
        content={[{
          slideId: 9,
          title: 'Buying & selling',
          sentences: ['You can buy and sell things on Zbay, privately.', 'Zbay lets you send a seller your order information (quantity, size, etc.) and your shipping address (if necessary) with funds in an encrypted message.',
            'With Bitcoin, third parties can see who paid who, but Zcash makes this much more difficult, if not impossible, protecting your privacy. Someday Zbay will have escrow payments with dispute resolution and seller ratings. Right now, channel owners can use moderation to keep out scam sellers.'
          ],
          fileName: './buying.svg'
        },
        {
          slideId: 10,
          title: 'And now... some waiting!',
          sentences: ['Our tour has concluded! Now, we just have to wait for some blockchain files to download. Perhaps leave your computer and go have a sandwich.',
            'If you\'d like to learn more about the values and vision behind the Zbay project, there\'s a great (and long) essay on our site.', 'Or you can learn more about Zcash the technology that Zbay builds on.'
          ],
          fileName: './hourglass.svg'
        }]}
        currentSlide={1}
        prevSlide={jest.fn()}
        nextSlide={jest.fn()}
        setStoryStatus={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
