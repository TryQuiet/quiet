import React, { useState, useEffect, useLayoutEffect } from 'react'

import { styled } from '@mui/material/styles'
import { Grid } from '@mui/material'

import Page from '../ui/Page/Page'
import PageHeader from '../ui/Page/PageHeader'

import ChannelHeaderComponent from '../widgets/channels/ChannelHeader'
import ChannelMessagesComponent from '../widgets/channels/ChannelMessages'
import ChannelInputComponent from '../widgets/channels/ChannelInput'

import { INPUT_STATE } from '../widgets/channels/ChannelInput/InputState.enum'

import { ChannelMessage, DownloadStatus, Identity, MessagesDailyGroups, MessageSendingStatus } from '@quiet/types'

import { useResizeDetector } from 'react-resize-detector'
import { Dictionary } from '@reduxjs/toolkit'

import UploadFilesPreviewsComponent, { UploadFilesPreviewsProps } from './File/UploadingPreview'

import { DropZoneComponent } from './DropZone/DropZoneComponent'

import { NewMessagesInfoComponent } from './NewMessagesInfo/NewMessagesInfoComponent'

import { FileActionsProps } from './File/FileComponent/FileComponent'
import { UseModalType } from '../../containers/hooks'
import { HandleOpenModalType } from '../widgets/userLabel/UserLabel.types'
import { defaultLogger } from '../../logger'
import ChannelNetworkStatus from '../widgets/channels/ChannelNetworkStatus'

const ChannelMessagesWrapperStyled = styled(Grid)(({ theme }) => ({
  position: 'relative',
  height: 0,
  backgroundColor: theme.palette.background.default,
}))

export interface ChannelComponentProps {
  user: Identity
  channelId: string
  channelName: string
  messages: {
    count: number
    groups: MessagesDailyGroups
  }
  newestMessage: ChannelMessage
  pendingMessages: Dictionary<MessageSendingStatus>
  downloadStatuses?: Dictionary<DownloadStatus>
  lazyLoading: (load: boolean) => void
  onInputChange: (value: string) => void
  onInputEnter: (message: string) => void
  openUrl: (url: string) => void
  openFilesDialog: () => void
  handleFileDrop: (arg: any) => void
  isCommunityInitialized: boolean
  connectedPeers: string[] | undefined
  communityPeerList: string[] | undefined
  lastConnectedTime: number
  allPeersDisconnectedTime: number | undefined
  handleClipboardFiles: (arg: ArrayBuffer, ext: string, name: string) => void
  uploadedFileModal?: UseModalType<{
    src: string
  }>
  openContextMenu?: () => void
  enableContextMenu?: boolean
  pendingGeneralChannelRecreation: boolean
  unregisteredUsernameModalHandleOpen: HandleOpenModalType
  duplicatedUsernameModalHandleOpen: HandleOpenModalType
}

const enum ScrollPosition {
  TOP = 0,
  MIDDLE = -1,
  BOTTOM = 1,
}

export const ChannelComponent: React.FC<ChannelComponentProps & UploadFilesPreviewsProps & FileActionsProps> = ({
  user,
  channelId,
  channelName,
  messages,
  newestMessage,
  pendingMessages,
  downloadStatuses = {},
  lazyLoading,
  onInputChange,
  onInputEnter,
  openUrl,
  removeFile,
  handleFileDrop,
  filesData,
  isCommunityInitialized = true,
  connectedPeers,
  communityPeerList,
  lastConnectedTime,
  allPeersDisconnectedTime,
  openFilesDialog,
  handleClipboardFiles,
  uploadedFileModal,
  openContainingFolder,
  downloadFile,
  cancelDownload,
  openContextMenu,
  enableContextMenu = true,
  pendingGeneralChannelRecreation,
  unregisteredUsernameModalHandleOpen,
  duplicatedUsernameModalHandleOpen,
}) => {
  const [lastSeenMessage, setLastSeenMessage] = useState<string>()
  const [newMessagesInfo, setNewMessagesInfo] = useState<boolean>(false)

  const [infoClass, setInfoClass] = useState<string>('')

  const [scrollPosition, setScrollPosition] = React.useState(ScrollPosition.BOTTOM)

  const memoizedScrollHeight = React.useRef<number>()

  const [mathMessagesRendered, onMathMessageRendered] = React.useState<number>(0)

  const checkForConnectedPeers = (connectedPeers: string[] | undefined) => {
    if (connectedPeers && connectedPeers.length > 0) {
      return true
    }
    return false
  }

  const checkForCommunityPeers = (peerList: string[] | undefined) => {
    defaultLogger.info(peerList, peerList?.length)
    if (peerList && peerList.length > 1) {
      return true
    }
    return false
  }

  const [isConnectedToOtherPeers, onConnectedPeersChange] = React.useState<boolean>(
    checkForConnectedPeers(connectedPeers)
  )

  const [communityHasPeers, onCommunityPeerListChanged] = React.useState<boolean>(
    checkForCommunityPeers(communityPeerList)
  )

  useEffect(() => {
    onConnectedPeersChange(checkForConnectedPeers(connectedPeers))
  }, [connectedPeers])

  useEffect(() => {
    onCommunityPeerListChanged(checkForCommunityPeers(communityPeerList))
  }, [communityPeerList])

  const updateMathMessagesRendered = () => {
    // To rerender Channel on each call
    onMathMessageRendered(mathMessagesRendered + 1)
  }

  useEffect(() => {
    if (scrollPosition === ScrollPosition.BOTTOM) {
      scrollBottom()
    }
  }, [mathMessagesRendered])

  const onResize = React.useCallback(() => {
    scrollBottom()
  }, [])

  const { ref: scrollbarRef } = useResizeDetector<HTMLDivElement>({ onResize })
  const scrollBottom = () => {
    if (!scrollbarRef?.current?.scrollTo) return
    setNewMessagesInfo(false)
    memoizedScrollHeight.current = 0
    scrollbarRef.current.scrollTo({
      behavior: 'auto',
      top: Math.abs(scrollbarRef.current.clientHeight - scrollbarRef.current.scrollHeight),
    })
  }

  const onEnterKeyPress = (message: string) => {
    // Send message and files
    onInputEnter(message)
    // Go back to the bottom if scroll is at the top or in the middle
    setScrollPosition(ScrollPosition.BOTTOM)
  }

  /* Get scroll position and save it to the state as 0 (top), 1 (bottom) or -1 (middle) */
  const onScroll = React.useCallback(() => {
    if (!scrollbarRef.current) return
    const top = scrollbarRef.current?.scrollTop === 0
    const bottom =
      Math.floor(scrollbarRef.current?.scrollHeight - scrollbarRef.current?.scrollTop) <=
      Math.floor(scrollbarRef.current?.clientHeight)

    let position = ScrollPosition.MIDDLE
    if (top) position = ScrollPosition.TOP
    if (bottom) position = ScrollPosition.BOTTOM

    // Clear new messages info when scrolled back to bottom
    if (bottom) {
      setNewMessagesInfo(false)
    }
    setScrollPosition(position)
  }, [])

  /* Keep scroll position in certain cases */
  useLayoutEffect(() => {
    // Keep scroll at the bottom when new message arrives
    if (scrollbarRef.current && scrollPosition === ScrollPosition.BOTTOM) {
      scrollBottom()
    }
    // Keep scroll position when new chunk of messages is being loaded
    if (scrollbarRef.current && scrollPosition === ScrollPosition.TOP && memoizedScrollHeight.current !== undefined) {
      scrollbarRef.current.scrollTop = scrollbarRef.current.scrollHeight - memoizedScrollHeight.current
    }
  }, [messages])

  /* Lazy loading messages - top (load) */
  useEffect(() => {
    if (!scrollbarRef.current) return
    if (scrollbarRef.current.scrollHeight < scrollbarRef.current.clientHeight) return
    if (scrollbarRef.current && scrollPosition === ScrollPosition.TOP) {
      /* Cache scroll height before loading new messages (to keep the scroll position after re-rendering) */
      memoizedScrollHeight.current = scrollbarRef.current.scrollHeight
      lazyLoading(true)
    }
  }, [scrollPosition])

  /* Lazy loading messages - bottom (trim) */
  useEffect(() => {
    if (!scrollbarRef.current) return
    if (scrollbarRef.current.scrollHeight < scrollbarRef.current.clientHeight) return
    if (scrollbarRef.current && scrollPosition === ScrollPosition.BOTTOM) {
      lazyLoading(false)
    }
  }, [scrollPosition, messages.count])

  useEffect(() => {
    if (!scrollbarRef.current) return
    if (
      Math.floor(scrollbarRef.current?.scrollHeight - scrollbarRef.current?.scrollTop) - 1 >=
        Math.floor(scrollbarRef.current?.clientHeight) &&
      lastSeenMessage !== newestMessage.id
    ) {
      setNewMessagesInfo(true)
    }
  }, [scrollPosition, lastSeenMessage, messages])

  useEffect(() => {
    if (scrollPosition === ScrollPosition.BOTTOM && newestMessage) {
      setLastSeenMessage(newestMessage?.id)
    }
  }, [scrollPosition, messages])

  useEffect(() => {
    scrollBottom()
  }, [channelId])

  return (
    <Page>
      <PageHeader>
        <ChannelHeaderComponent
          channelName={channelName}
          openContextMenu={openContextMenu}
          enableContextMenu={enableContextMenu}
        />
      </PageHeader>
      <DropZoneComponent channelName={channelName} handleFileDrop={handleFileDrop}>
        <ChannelMessagesWrapperStyled item xs>
          <NewMessagesInfoComponent scrollBottom={scrollBottom} show={newMessagesInfo} />
          <ChannelMessagesComponent
            messages={messages.groups}
            pendingMessages={pendingMessages}
            connectedPeers={connectedPeers}
            communityPeerList={communityPeerList}
            lastConnectedTime={lastConnectedTime}
            allPeersDisconnectedTime={allPeersDisconnectedTime}
            downloadStatuses={downloadStatuses}
            scrollbarRef={scrollbarRef}
            onScroll={onScroll}
            uploadedFileModal={uploadedFileModal}
            openUrl={openUrl}
            openContainingFolder={openContainingFolder}
            downloadFile={downloadFile}
            cancelDownload={cancelDownload}
            onMathMessageRendered={updateMathMessagesRendered}
            pendingGeneralChannelRecreation={pendingGeneralChannelRecreation}
            unregisteredUsernameModalHandleOpen={unregisteredUsernameModalHandleOpen}
            duplicatedUsernameModalHandleOpen={duplicatedUsernameModalHandleOpen}
          />
        </ChannelMessagesWrapperStyled>
        <ChannelNetworkStatus
          channelName={channelName}
          isConnectedToOtherPeers={isConnectedToOtherPeers}
          communityHasPeers={communityHasPeers}
        />
        <Grid item>
          <ChannelInputComponent
            channelId={channelId}
            channelName={channelName}
            // TODO https://github.com/TryQuiet/ZbayLite/issues/443
            inputPlaceholder={`#${channelName} as @${user?.nickname}`}
            onChange={value => {
              onInputChange(value)
            }}
            onKeyPress={message => {
              onEnterKeyPress(message)
            }}
            openFilesDialog={openFilesDialog}
            infoClass={infoClass}
            setInfoClass={setInfoClass}
            inputState={
              isCommunityInitialized && Boolean(messages.count) ? INPUT_STATE.AVAILABLE : INPUT_STATE.NOT_CONNECTED
            }
            handleClipboardFiles={handleClipboardFiles}
            handleOpenFiles={handleFileDrop}
          >
            <UploadFilesPreviewsComponent filesData={filesData} removeFile={id => removeFile(id)} />
          </ChannelInputComponent>
        </Grid>
      </DropZoneComponent>
    </Page>
  )
}

export default ChannelComponent
