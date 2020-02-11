import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'

import InviteMentionInfo from './InviteMentionInfo'

storiesOf('Components/Widgets/InviteMentionInfo', module)
  .addDecorator(withKnobs)
  .add('playground', () => {
    return <InviteMentionInfo nickname='norbert' timeStamp={1558990940} />
  })
