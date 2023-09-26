import { LogBox } from 'react-native'

import {
  configure,
  addDecorator,
  getStorybookUI,
} from '@storybook/react-native'

import { withNavigation } from './navigation'

LogBox.ignoreAllLogs()

addDecorator(withNavigation)

configure(() => {
  require('../src/components/JoinCommunity/JoinCommunity.stories')
  require('../src/components/LeaveCommunity/LeaveCommunity.stories')
  require('../src/components/ContextMenu/ContextMenu.stories')
  require('../src/components/ConfirmationBox/ConfirmationBox.stories')
  require('../src/components/CreateCommunity/CreateCommunity.stories')
  require('../src/components/Appbar/Appbar.stories')
  require('../src/components/Registration/UsernameRegistration.stories')
  require('../src/components/ChannelTile/ChannelTile.stories')
  require('../src/components/ChannelList/ChannelList.stories')
  require('../src/components/CreateChannel/CreateChannel.stories')
  require('../src/components/DeleteChannel/DeleteChannel.stories')
  require('../src/components/QRCode/QRCode.stories')
  require('../src/components/Message/Message.stories')
  require('../src/components/Chat/Chat.stories')
  require('../src/components/TextWithLink/TextWithLink.stories')
  require('../src/components/Typography/Typography.stories')
  require('../src/components/Button/Button.stories')
  require('../src/components/Input/Input.stories')
  require('../src/components/MessageSendButton/MessageSendButton.stories')
  require('../src/components/InitCheck/InitCheck.stories')
  require('../src/components/Loading/Loading.stories')
  require('../src/components/Success/Success.stories')
  require('../src/components/Error/Error.stories')
  require('../src/components/AggressiveWarning/AggressiveWarning.stories')
}, module)

const StorybookUIRoot = getStorybookUI({
  asyncStorage: null,
})

export default StorybookUIRoot
