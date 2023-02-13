import './rn-addons'

import { LogBox } from 'react-native'

import { withKnobs } from '@storybook/addon-knobs'

import {
  configure,
  addDecorator,
  getStorybookUI,
} from '@storybook/react-native'

import { withNavigation } from './navigationDecorator'

LogBox.ignoreAllLogs()

addDecorator(withKnobs)
addDecorator(withNavigation)

configure(() => {
  require('../src/components/JoinCommunity/JoinCommunity.stories')
  require('../src/components/Appbar/Appbar.stories')
  require('../src/components/Registration/UsernameRegistration.stories')
  require('../src/components/ChannelTile/ChannelTile.stories')
  require('../src/components/ChannelList/ChannelList.stories')
  require('../src/components/Message/Message.stories')
  require('../src/components/Chat/Chat.stories')
  require('../src/components/Typography/Typography.stories')
  require('../src/components/Button/Button.stories')
  require('../src/components/Input/Input.stories')
  require('../src/components/MessageSendButton/MessageSendButton.stories')
  require('../src/components/InitCheck/InitCheck.stories')
  require('../src/components/Loading/Loading.stories')
  require('../src/components/Success/Success.stories')
  require('../src/components/Error/Error.stories')
}, module)

const StorybookUIRoot = getStorybookUI({
  asyncStorage: null,
})

export default StorybookUIRoot
