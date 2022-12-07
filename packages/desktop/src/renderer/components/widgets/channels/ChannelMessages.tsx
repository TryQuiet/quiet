import React, { useCallback, useEffect, useRef } from 'react'
import { styled } from '@mui/material/styles'
import { Dictionary } from '@reduxjs/toolkit'
import List from '@mui/material/List'

import MessagesDivider from '../MessagesDivider'
import BasicMessageComponent from './BasicMessage'

import SpinnerLoader from '../../ui/Spinner/SpinnerLoader'

import { DownloadStatus, MessagesDailyGroups, MessageSendingStatus } from '@quiet/state-manager'

import { UseModalTypeWrapper } from '../../../containers/hooks'

import { FileActionsProps } from '../../Channel/File/FileComponent/FileComponent'

const PREFIX = 'ChannelMessagesComponent'

const classes = {
  spinner: `${PREFIX}spinner`,
  scroll: `${PREFIX}scroll`,
  list: `${PREFIX}list`,
  link: `${PREFIX}link`,
  info: `${PREFIX}info`,
  item: `${PREFIX}item`,
  bold: `${PREFIX}bold`
}

const Root = styled('div')((
  {
    theme
  }
) => ({
  [`& .${classes.spinner}`]: {
    top: '50%',
    textAlign: 'center',
    position: 'relative',
    transform: 'translate(0, -50%)'
  },

  [`&.${classes.scroll}`]: {
    overflow: 'scroll',
    overflowX: 'hidden',
    height: '100%'
  },

  [`& .${classes.list}`]: {
    backgroundColor: theme.palette.colors.white,
    width: '100%'
  },

  [`& .${classes.link}`]: {
    color: theme.palette.colors.lushSky,
    cursor: 'pointer'
  },

  [`& .${classes.info}`]: {
    color: theme.palette.colors.trueBlack,
    letterSpacing: '0.4px'
  },

  [`& .${classes.item}`]: {
    backgroundColor: theme.palette.colors.gray03,
    padding: '9px 16px'
  },

  [`& .${classes.bold}`]: {
    fontWeight: 'bold'
  }
}))

export const fetchingChannelMessagesText = 'Fetching channel messages...'

export interface IChannelMessagesProps {
  messages?: MessagesDailyGroups
  pendingMessages?: Dictionary<MessageSendingStatus>
  downloadStatuses?: Dictionary<DownloadStatus>
  scrollbarRef
  onScroll: () => void
  openUrl: (url: string) => void
  uploadedFileModal?: ReturnType<
  UseModalTypeWrapper<{
    src: string
  }>['types']
  >
}

export const ChannelMessagesComponent: React.FC<IChannelMessagesProps & FileActionsProps> = ({
  messages = {},
  pendingMessages = {},
  downloadStatuses = {},
  scrollbarRef,
  onScroll,
  uploadedFileModal,
  openUrl,
  openContainingFolder,
  downloadFile,
  cancelDownload
}) => {
  const listRef = useRef<HTMLUListElement>()

  const handleKeyDown = useCallback<(evt: KeyboardEvent) => void>(
    evt => {
      switch (evt.key) {
        case 'ArrowUp':
          listRef.current?.focus()
          break
        case 'ArrowDown':
          listRef.current?.focus()
          break
      }
    },
  [listRef]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, false)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, false)
    }
  }, [handleKeyDown])

  return (
    <Root
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
      <List disablePadding className={classes.list} id='messages-scroll' ref={listRef} tabIndex={0}>
        {Object.keys(messages).map(day => {
          return (
            <div key={day}>
              <MessagesDivider title={day} />
              {messages[day].map(items => {
                const data = items[0]
                return (
                  <BasicMessageComponent
                    key={data.id}
                    messages={items}
                    pendingMessages={pendingMessages}
                    downloadStatuses={downloadStatuses}
                    uploadedFileModal={uploadedFileModal}
                    openUrl={openUrl}
                    openContainingFolder={openContainingFolder}
                    downloadFile={downloadFile}
                    cancelDownload={cancelDownload}
                  />
                )
              })}
            </div>
          )
        })}
      </List>
    </Root>
  )
}

export default ChannelMessagesComponent
