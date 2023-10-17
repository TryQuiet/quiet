import React, { useCallback, useEffect, useRef } from 'react'
import { styled } from '@mui/material/styles'
import { Dictionary } from '@reduxjs/toolkit'
import List from '@mui/material/List'

import MessagesDivider from '../MessagesDivider'
import BasicMessageComponent from './BasicMessage'

import SpinnerLoader from '../../ui/Spinner/SpinnerLoader'

import { DownloadStatus, MessagesDailyGroups, MessageSendingStatus } from '@quiet/state-manager'

import { UseModalType } from '../../../containers/hooks'

import { FileActionsProps } from '../../Channel/File/FileComponent/FileComponent'
import { HandleOpenModalType, UserLabelType } from '../userLabel/UserLabel.types'

const PREFIX = 'ChannelMessagesComponent'

const classes = {
  spinner: `${PREFIX}spinner`,
  scroll: `${PREFIX}scroll`,
  list: `${PREFIX}list`,
  link: `${PREFIX}link`,
  info: `${PREFIX}info`,
  item: `${PREFIX}item`,
  bold: `${PREFIX}bold`,
}

const Root = styled('div')(({ theme }) => ({
  [`& .${classes.spinner}`]: {
    top: '50%',
    textAlign: 'center',
    position: 'relative',
    transform: 'translate(0, -50%)',
  },

  [`&.${classes.scroll}`]: {
    overflow: 'scroll',
    overflowX: 'hidden',
    height: '100%',
  },

  [`& .${classes.list}`]: {
    backgroundColor: theme.palette.colors.white,
    width: '100%',
  },

  [`& .${classes.link}`]: {
    color: theme.palette.colors.lushSky,
    cursor: 'pointer',
  },

  [`& .${classes.info}`]: {
    color: theme.palette.colors.trueBlack,
    letterSpacing: '0.4px',
  },

  [`& .${classes.item}`]: {
    backgroundColor: theme.palette.colors.gray03,
    padding: '9px 16px',
  },

  [`& .${classes.bold}`]: {
    fontWeight: 'bold',
  },
}))

export const fetchingChannelMessagesText = 'Fetching channel messages...'

export const deletingChannelMessage = 'Deleting channel...'

export interface IChannelMessagesProps {
  messages?: MessagesDailyGroups
  pendingMessages?: Dictionary<MessageSendingStatus>
  downloadStatuses?: Dictionary<DownloadStatus>
  scrollbarRef: React.RefObject<HTMLDivElement>
  onScroll: () => void
  openUrl: (url: string) => void
  uploadedFileModal?: UseModalType<{
    src: string
  }>
  onMathMessageRendered?: () => void
  pendingGeneralChannelRecreation?: boolean
  unregisteredUsernameModalHandleOpen: HandleOpenModalType
  duplicatedUsernameModalHandleOpen: HandleOpenModalType
  communityName: string
  ownerNickname: string
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
  cancelDownload,
  onMathMessageRendered,
  pendingGeneralChannelRecreation = false,
  unregisteredUsernameModalHandleOpen,
  duplicatedUsernameModalHandleOpen,
  communityName,
  ownerNickname,
}) => {
  const spinnerMessage = pendingGeneralChannelRecreation ? deletingChannelMessage : fetchingChannelMessagesText
  const listRef = useRef<HTMLUListElement>(null)

  const handleKeyDown = useCallback<(evt: KeyboardEvent) => void>(
    evt => {
      if (!scrollbarRef.current) return
      switch (evt.key) {
        case 'ArrowUp':
        case 'ArrowDown':
          break
        case 'PageUp':
          listRef.current?.focus()
          scrollbarRef.current.scrollTop -= 40
          break
        case 'PageDown':
          listRef.current?.focus()
          scrollbarRef.current.scrollTop += 40
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
    <Root className={classes.scroll} ref={scrollbarRef} onScroll={onScroll} data-testid='channelContent'>
      {Object.values(messages).length < 1 && (
        <SpinnerLoader size={40} message={spinnerMessage} className={classes.spinner} color={'black'} />
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
                    onMathMessageRendered={onMathMessageRendered}
                    unregisteredUsernameModalHandleOpen={unregisteredUsernameModalHandleOpen}
                    duplicatedUsernameModalHandleOpen={duplicatedUsernameModalHandleOpen}
                    communityName={communityName}
                    ownerNickname={ownerNickname}
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
