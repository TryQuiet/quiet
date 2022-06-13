import React from 'react'
import { Dictionary } from '@reduxjs/toolkit'

import { makeStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'

import MessagesDivider from '../MessagesDivider'
import BasicMessageComponent from './BasicMessage'

import SpinnerLoader from '../../ui/Spinner/SpinnerLoader'

import { MessagesDailyGroups, MessageSendingStatus } from '@quiet/state-manager'
import { useModal, UseModalTypeWrapper } from '../../../containers/hooks'

const useStyles = makeStyles(theme => ({
  spinner: {
    top: '50%',
    textAlign: 'center',
    position: 'relative',
    transform: 'translate(0, -50%)'
  },
  scroll: {
    overflow: 'scroll',
    overflowX: 'hidden',
    height: '100%'
  },
  list: {
    backgroundColor: theme.palette.colors.white,
    width: '100%'
  },
  link: {
    color: theme.palette.colors.lushSky,
    cursor: 'pointer'
  },
  info: {
    color: theme.palette.colors.trueBlack,
    letterSpacing: '0.4px'
  },
  root: {
    width: '100%',
    padding: '8px 16px'
  },
  item: {
    backgroundColor: theme.palette.colors.gray03,
    padding: '9px 16px'
  },
  bold: {
    fontWeight: 'bold'
  }
}))

export const fetchingChannelMessagesText = 'Fetching channel messages...'

export interface IChannelMessagesProps {
  messages?: MessagesDailyGroups
  pendingMessages?: Dictionary<MessageSendingStatus>
  scrollbarRef
  onScroll: () => void
  uploadedFileModal?: ReturnType<UseModalTypeWrapper<{
    src: string
  }>['types']>
}

export const ChannelMessagesComponent: React.FC<IChannelMessagesProps> = ({
  messages = {},
  pendingMessages = {},
  scrollbarRef,
  onScroll,
  uploadedFileModal
}) => {
  const classes = useStyles({})

  return (
    <div
      className={classes.scroll}
      ref={scrollbarRef}
      onScroll={onScroll}
      data-testid='channelContent'>
      {Object.values(messages).length < 1 && (
        <SpinnerLoader
          size={40}
          message={fetchingChannelMessagesText}
          className={classes.spinner}
          color={'black'}
        />
      )}
      <List disablePadding className={classes.list} id='messages-scroll'>
        {Object.keys(messages).map(day => {
          return (
            <div key={day}>
              <MessagesDivider title={day} />
              {messages[day].map(items => {
                const data = items[0]
                return <BasicMessageComponent
                  key={data.id}
                  messages={items}
                  pendingMessages={pendingMessages}
                  uploadedFileModal={uploadedFileModal}
                />
              })}
            </div>
          )
        })}
      </List>
    </div>
  )
}

export default ChannelMessagesComponent
