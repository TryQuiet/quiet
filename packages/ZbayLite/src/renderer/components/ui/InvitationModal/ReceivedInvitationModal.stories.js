import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'

import ReceivedInvitationModal from './ReceivedInvitationModal'

storiesOf('Components/UI/ReceivedInvitationModal', module)
  .addDecorator(withKnobs)
  .add('playground', () => (
    <ReceivedInvitationModal
      open
      handleClose={() => {}}
    />
  ))
