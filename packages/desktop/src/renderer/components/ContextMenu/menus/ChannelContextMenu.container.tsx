import React, { FC } from 'react'
import { useSelector } from 'react-redux'

import { communities, publicChannels, users } from '@quiet/state-manager'

import { useContextMenu } from '../../../../hooks/useContextMenu'
import { MenuName } from '../../../../const/MenuNames.enum'
import { ContextMenu, ContextMenuItemList } from '../ContextMenu.component'
import DebugChannelComponent from '../../debugInfo/debugChannelComponent'
import { ContextMenuItemProps } from '../ContextMenu.types'

import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import { exportChats } from '../../../../utils/functions/exportMessages'
import ChannelTypeIcon from '../../widgets/channels/ChannelTypeIcon'
import { ChannelType, PublicChannelStorage, UserProfile } from '@quiet/types'
import DMProfilePhoto from '../../widgets/channels/DMProfilePhoto'
import { isDefined } from '@quiet/common'

export const ChannelContextMenu: FC = () => {
  const [showDebug, setShowDebug] = React.useState(false)
  const isOwner = useSelector(communities.selectors.isOwner)
  const channel = useSelector(publicChannels.selectors.currentChannel)
  const channelMessages = useSelector(publicChannels.selectors.currentChannelMessagesMergedBySender)
  const userProfiles = useSelector(users.selectors.userProfiles)
  const me = useSelector(users.selectors.myUserProfile)

  let title = ''
  if (channel) {
    title = `${channel.displayedName}`
  }

  const channelContextMenu = useContextMenu(MenuName.Channel)

  const deleteChannelModal = useModal(ModalName.deleteChannel)
  const addMembersChannelModal = useModal(ModalName.addMembersChannel)

  const items: ContextMenuItemProps[] = []

  if (channel && !(channel?.public ?? true) && channel.type !== ChannelType.DM && isOwner) {
    items.push({
      title: 'Add members',
      action: () => {
        channelContextMenu.handleClose() // Dismiss context menu before displaying modal
        addMembersChannelModal.handleOpen()
      },
    })
  }

  if (isOwner) {
    items.push({
      title: 'Delete',
      action: () => {
        channelContextMenu.handleClose() // Dismiss context menu before displaying modal
        deleteChannelModal.handleOpen()
      },
    })
  }

  items.push({
    title: 'Export messages',
    action: () => channel && exportChats(channel?.name, channelMessages),
  })

  if (process.env.NODE_ENV === 'development') {
    items.push({
      title: 'Debug',
      action: () => setShowDebug(true),
    })
  }

  const TitleIcon: FC<{
    channel: PublicChannelStorage | undefined
    me: UserProfile | undefined
    userProfiles: Record<string, UserProfile>
  }> = ({ channel, me, userProfiles }) => {
    if (channel == null) {
      return <></>
    }
    if (channel.type == null || channel.type === ChannelType.CHANNEL) {
      return (
        <ChannelTypeIcon
          isPublic={channel?.public ?? true}
          fill={'currentColor'}
          style={{ fontSize: 16, fontWeight: 'medium' }}
          data-testid={`contextMenu-channel-settings-type-icon`}
        />
      )
    }

    const members = channel.memberIds?.map(memberId => userProfiles[memberId]).filter(isDefined) ?? []
    return <DMProfilePhoto me={me} members={members} />
  }

  return showDebug ? (
    <ContextMenu
      title={title + ' Debug'}
      titleIcon={<TitleIcon channel={channel} me={me} userProfiles={userProfiles} />}
      {...channelContextMenu}
      handleBack={() => setShowDebug(false)}
    >
      <DebugChannelComponent />
    </ContextMenu>
  ) : (
    <ContextMenu
      title={title}
      titleIcon={<TitleIcon channel={channel} me={me} userProfiles={userProfiles} />}
      {...channelContextMenu}
    >
      <ContextMenuItemList items={items} />
    </ContextMenu>
  )
}

export default ChannelContextMenu
