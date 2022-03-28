import React, { useState } from 'react'

import { makeStyles } from '@material-ui/core/styles'
import { Grid } from '@material-ui/core'

import Page from '../ui/Page/Page'
import PageHeader from '../ui/Page/PageHeader'

import ChannelHeaderComponent from '../widgets/channels/ChannelHeader'
import ChannelMessagesComponent from '../widgets/channels/ChannelMessages'
import ChannelInputComponent from '../widgets/channels/ChannelInput'

import { useModal } from '../../containers/hooks'

import { DisplayableMessage, PublicChannel, Identity, MessagesDailyGroups } from '@quiet/nectar'

const useStyles = makeStyles(theme => ({
  root: {},
  messages: {
    height: 0,
    backgroundColor: theme.palette.colors.white
  }
}))

export interface ChannelComponentProps {
  user: Identity
  channel: PublicChannel
  channelSettingsModal: ReturnType<typeof useModal>
  channelInfoModal: ReturnType<typeof useModal>
  messages: {
    count: number
    groups: MessagesDailyGroups
  }
  setChannelMessagesSliceValue: (value: number) => void
  onDelete: () => void
  onInputChange: (value: string) => void
  onInputEnter: (message: string) => void
  mutedFlag: boolean
  disableSettings?: boolean
  notificationFilter: string
  openNotificationsTab: () => void
}

export const ChannelComponent: React.FC<ChannelComponentProps> = ({
  user,
  channel,
  channelInfoModal,
  channelSettingsModal,
  messages,
  setChannelMessagesSliceValue,
  onDelete,
  onInputChange,
  onInputEnter,
  mutedFlag,
  disableSettings = false,
  notificationFilter,
  openNotificationsTab
}) => {
  const classes = useStyles({})

  const [infoClass, setInfoClass] = useState<string>(null)

  return (
    <Page>
      <PageHeader>
        <ChannelHeaderComponent
          channel={channel}
          onSettings={channelSettingsModal.handleOpen}
          onInfo={channelInfoModal.handleOpen}
          onDelete={onDelete}
          mutedFlag={mutedFlag}
          disableSettings={disableSettings}
          notificationFilter={notificationFilter}
          openNotificationsTab={openNotificationsTab}
        />
      </PageHeader>
      <Grid item xs className={classes.messages}>
        <ChannelMessagesComponent
          username={user?.nickname}
          channel={channel}
          messages={messages}
          setChannelMessagesSliceValue={setChannelMessagesSliceValue}
        />
      </Grid>
      <Grid item>
        <ChannelInputComponent
          channelAddress={channel.address}
          channelName={channel.name}
          // TODO https://github.com/ZbayApp/ZbayLite/issues/443
          inputPlaceholder={`#${channel.name} as @${user?.nickname}`}
          onChange={value => {
            onInputChange(value)
          }}
          onKeyPress={message => {
            onInputEnter(message)
          }}
          infoClass={infoClass}
          setInfoClass={setInfoClass}
        />
      </Grid>
    </Page>
  )
}

export default ChannelComponent
