import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import StoryRouter from 'storybook-react-router'
import create from '../../../store/create'

import { withStore } from '../../../storybook/decorators'

import JoinChannelModal from './JoinChannelModal'

const store = create({
  initialState: {
    publicChannels: {}
  }
})

storiesOf('Components/Widgets/Channels/JoinChannelModal', module)
  .addDecorator(withKnobs)
  .addDecorator(StoryRouter())
  .addDecorator(withStore(store))
  .add('playground', () => {
    return (
      <JoinChannelModal
        open
        publicChannels={{ 1: { name: 'test' } }}
        handleClose={() => {}}
      />
    )
  })
