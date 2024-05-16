import { storiesOf } from '@storybook/react-native'
import React from 'react'

import { TextWithLink } from './TextWithLink.component'

import { createLogger } from '../../utils/logger'

const logger = createLogger('textWithLink:stories')

storiesOf('TextWithLink', module).add('Default', () => (
  <TextWithLink
    text={'Here is %a text'}
    links={[
      {
        tag: 'a',
        label: 'linked',
        action: () => {
          logger.info('link clicked')
        },
      },
    ]}
  />
))
