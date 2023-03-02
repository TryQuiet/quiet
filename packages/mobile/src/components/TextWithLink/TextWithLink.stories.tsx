import { storiesOf } from '@storybook/react-native'
import React from 'react'

import { TextWithLink } from './TextWithLink.component'

storiesOf('TextWithLink', module).add('Default', () => (
  <TextWithLink
    text={'Here is %a text'}
    links={[
      {
        tag: 'a',
        label: 'linked',
        action: () => {
          console.log('link clicked')
        }
      }
    ]}
  />
))
