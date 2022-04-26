import React, { useState, useEffect, useLayoutEffect } from 'react'

import { makeStyles } from '@material-ui/core/styles'
import { Grid } from '@material-ui/core'

import Page from '../ui/Page/Page'
import PageHeader from '../ui/Page/PageHeader'

import ChannelHeaderComponent from '../widgets/channels/ChannelHeader'
import ChannelMessagesComponent from '../widgets/channels/ChannelMessages'
import ChannelInputComponent from '../widgets/channels/ChannelInput'

import { useModal } from '../../containers/hooks'

import { Identity, MessagesDailyGroups, MessageSendingStatus } from '@quiet/nectar'

import { useResizeDetector } from 'react-resize-detector'
import { Dictionary } from '@reduxjs/toolkit'

const useStyles = makeStyles(theme => ({
  root: {},
  messages: {
    height: 0,
    backgroundColor: theme.palette.colors.white
  }
}))

export interface ChannelComponentProps {
  user: Identity
  channelAddress: string
  channelName: string
  channelMessagesSlice: number
  channelSettingsModal: ReturnType<typeof useModal>
  channelInfoModal: ReturnType<typeof useModal>
  messages: {
    count: number
    groups: MessagesDailyGroups
  }
  pendingMessages: Dictionary<MessageSendingStatus>
  lazyLoading: (load: boolean) => void
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
  channelAddress,
  channelName,
  channelMessagesSlice,
  channelInfoModal,
  channelSettingsModal,
  messages,
  pendingMessages,
  lazyLoading,
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

  const [scrollPosition, setScrollPosition] = React.useState(1)
  const [scrollHeight, setScrollHeight] = React.useState(0)

  const onResize = React.useCallback(() => {
    scrollBottom()
  }, [])

  const { ref: scrollbarRef } = useResizeDetector<HTMLDivElement>({ onResize })

  const scrollBottom = () => {
    if (!scrollbarRef.current) return
    setScrollHeight(0)
    scrollbarRef.current?.scrollTo({
      behavior: 'auto',
      top: Math.abs(scrollbarRef.current?.clientHeight - scrollbarRef.current?.scrollHeight)
    })
  }

  const onEnterKeyPress = (message: string) => {
    // Go back to the bottom if scroll is at the top or in the middle
    scrollBottom()
    // Send message
    onInputEnter(message)
  }

  /* Get scroll position and save it to the state as 0 (top), 1 (bottom) or -1 (middle) */
  const onScroll = React.useCallback(() => {
    const top = scrollbarRef.current?.scrollTop === 0

    const bottom =
      Math.floor(scrollbarRef.current?.scrollHeight - scrollbarRef.current?.scrollTop) ===
      Math.floor(scrollbarRef.current?.clientHeight)

    let position = -1
    if (top) position = 0
    if (bottom) position = 1

    setScrollPosition(position)
  }, [])

  /* Keep scroll position in certain cases */
  useLayoutEffect(() => {
    // Keep scroll at the bottom when new message arrives
    if (scrollbarRef.current && scrollPosition === 1) {
      scrollBottom()
    }
    // Keep scroll position when new chunk of messages is being loaded
    if (scrollbarRef.current && scrollPosition === 0) {
      scrollbarRef.current.scrollTop = scrollbarRef.current.scrollHeight - scrollHeight
    }
  }, [messages])

  /* Lazy loading messages - top (load) */
  useEffect(() => {
    if (scrollbarRef.current.scrollHeight < scrollbarRef.current.clientHeight) return
    if (scrollbarRef.current && scrollPosition === 0) {
      /* Cache scroll height before loading new messages (to keep the scroll position after re-rendering) */
      setScrollHeight(scrollbarRef.current.scrollHeight)
      lazyLoading(true)
    }
  }, [lazyLoading, scrollPosition])

  /* Lazy loading messages - bottom (trim) */
  useEffect(() => {
    if (scrollbarRef.current.scrollHeight < scrollbarRef.current.clientHeight) return
    if (scrollbarRef.current && scrollPosition === 1) {
      lazyLoading(false)
    }
  }, [lazyLoading, scrollPosition])

  useEffect(() => {
    scrollBottom()
  }, [channelAddress])

  return (
    <Page>
      <PageHeader>
        <ChannelHeaderComponent
          channelName={channelName}
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
          messages={messages.groups}
          pendingMessages={pendingMessages}
          scrollbarRef={scrollbarRef}
          onScroll={onScroll}
        />
      </Grid>
      <Grid item>
        <ChannelInputComponent
          channelAddress={channelAddress}
          channelName={channelName}
          // TODO https://github.com/ZbayApp/ZbayLite/issues/443
          inputPlaceholder={`#${channelName} as @${user?.nickname}`}
          onChange={value => {
            onInputChange(value)
          }}
          onKeyPress={message => {
            onEnterKeyPress(message)
          }}
          infoClass={infoClass}
          setInfoClass={setInfoClass}
        />
      </Grid>
    </Page>
  )
}

export default ChannelComponent
