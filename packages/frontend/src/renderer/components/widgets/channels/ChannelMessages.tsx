import React from 'react'
import { Dictionary } from '@reduxjs/toolkit'

import { makeStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'

import MessagesDivider from '../MessagesDivider'
import BasicMessageComponent from './BasicMessage'

import SpinnerLoader from '../../ui/Spinner/SpinnerLoader'

import { MessagesDailyGroups, MessageSendingStatus } from '@quiet/nectar'

import type { DropTargetMonitor } from 'react-dnd'
import { useDrop } from 'react-dnd'
import { NativeTypes } from 'react-dnd-html5-backend'

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
    padding: '0 4px',
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
  },
  drop: {
    overflow: 'scroll',
    overflowX: 'hidden',
    height: '100%',
    backgroundColor: 'red',
    // opacity: '20%'
  }
}))

export const fetchingChannelMessagesText = 'Fetching channel messages...'

export interface IChannelMessagesProps {
  messages?: MessagesDailyGroups
  pendingMessages?: Dictionary<MessageSendingStatus>
  scrollbarRef
  onScroll: () => void
  onDrop: (files) => void
}

export const ChannelMessagesComponent: React.FC<IChannelMessagesProps> = ({
  messages = {},
  pendingMessages = {},
  scrollbarRef,
  onScroll,
  onDrop
}) => {
  const classes = useStyles({})

  const [{ canDrop, isOver }, drop] = useDrop(
    () => ({
      accept: [NativeTypes.FILE],
      drop(item: { files: any[] }) {
        if (onDrop) {
          onDrop(item)
        }
      },
      canDrop(item: any) {
        // console.log('canDrop', item.files, item.items)
        return true
      },
      hover(item: any) {
        // console.log('hover', item.files, item.items)
      },
      collect: (monitor: DropTargetMonitor) => {
        const item = monitor.getItem() as any
        if (item) {
          console.log('collect', item.files, item.items)
        }

        return {
          isOver: monitor.isOver(),
          canDrop: monitor.canDrop(),
        }
      },
    }),
    [onDrop],
  )

  const isActive = canDrop && isOver
  console.log('isActive', isActive)

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
      <List disablePadding className={classes.list} id='messages-scroll' ref={drop}>
        {Object.keys(messages).map(day => {
          return (
            <div key={day}>
              <MessagesDivider title={day} />
              {messages[day].map(items => {
                const data = items[0]
                return <BasicMessageComponent key={data.id} messages={items} pendingMessages={pendingMessages} />
              })}
            </div>
          )
        })}
      </List>
    </div>
  )
}

export default ChannelMessagesComponent
