import React, { useState, useEffect, useLayoutEffect } from 'react'

import { styled } from '@mui/material/styles'
import { Grid } from '@mui/material'

import Page from '../ui/Page/Page'
import PageHeader from '../ui/Page/PageHeader'

import ChannelHeaderComponent from '../widgets/channels/ChannelHeader'
import ChannelMessagesComponent from '../widgets/channels/ChannelMessages'
import { ChannelLinkNavigation } from '../widgets/channels/TextMessage'
import ChannelInputComponent from '../widgets/channels/ChannelInput'

import { INPUT_STATE } from '../widgets/channels/ChannelInput/InputState.enum'

import {
  ChannelMessage,
  ChannelType,
  DownloadStatus,
  MessagesDailyGroups,
  MessageSendingStatus,
  UserProfile,
} from '@quiet/types'

import { useResizeDetector } from 'react-resize-detector'
import { Dictionary } from '@reduxjs/toolkit'

import UploadFilesPreviewsComponent, { UploadFilesPreviewsProps } from './File/FileAttachmentPreview'

import { DropZoneComponent } from './DropZone/DropZoneComponent'

import { NewMessagesInfoComponent } from './NewMessagesInfo/NewMessagesInfoComponent'

import { FileActionsProps } from './File/FileComponent/FileComponent'
import { UseModalType } from '../../containers/hooks'
import { HandleOpenModalType } from '../widgets/userLabel/UserLabel.types'

const ChannelMessagesWrapperStyled = styled(Grid)(({ theme }) => ({
  position: 'relative',
  height: 0,
  backgroundColor: theme.palette.background.default,
}))

export interface ChannelComponentProps {
  user: UserProfile | undefined
  channelId: string
  channelName: string
  channelType: ChannelType
  members: UserProfile[]
  isPublic: boolean
  messages: {
    count: number
    groups: MessagesDailyGroups
  }
  newestMessage: ChannelMessage
  pendingMessages: Dictionary<MessageSendingStatus>
  downloadStatuses?: Dictionary<DownloadStatus>
  maxAutodownloadSizeBytes: number
  lazyLoading: (load: boolean) => void
  onInputChange: (value: string) => void
  onInputEnter: (message: string) => void
  openUrl: (url: string) => void
  channelLinks?: ChannelLinkNavigation
  openFilesDialog: () => void
  handleFileDrop: (arg: any) => void
  isCommunityInitialized: boolean
  currentChannelSubscribed?: boolean
  handleClipboardFiles: (arg: ArrayBuffer, ext: string, name: string) => void
  uploadedFileModal?: UseModalType<{
    src: string
  }>
  openContextMenu?: () => void
  enableContextMenu?: boolean
  pendingGeneralChannelRecreation: boolean
  unregisteredUsernameModalHandleOpen: HandleOpenModalType
  openUserProfile?: (userId: string) => void
  duplicatedUsernameModalHandleOpen: HandleOpenModalType
  /** Presence for a DM, from `isDmConnected`. Omitted on a channel. */
  dmConnected?: boolean
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
  channelType,
  members,
  isPublic,
  messages,
  newestMessage,
  pendingMessages,
  downloadStatuses = {},
  maxAutodownloadSizeBytes,
  lazyLoading,
  onInputChange,
  onInputEnter,
  openUrl,
  channelLinks,
  removeFile,
  handleFileDrop,
  filesData,
  isCommunityInitialized = true,
  currentChannelSubscribed = true,
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
  openUserProfile,
  duplicatedUsernameModalHandleOpen,
  dmConnected,
}) => {
  const [lastSeenMessage, setLastSeenMessage] = useState<string>()
  const [newMessagesInfo, setNewMessagesInfo] = useState<boolean>(false)

  const [infoClass, setInfoClass] = useState<string>('')

  const [scrollPosition, setScrollPosition] = React.useState(ScrollPosition.BOTTOM)
  // Where the reader is, as far as onResize is concerned. Kept apart from scrollPosition
  // because the scroll event from our own scrollTo() can be evaluated after a resize has
  // already changed the geometry, which would report a reader who never left the bottom
  // as being in the middle. Only the reader's own scrolling moves this ref.
  const readerPositionRef = React.useRef(ScrollPosition.BOTTOM)
  // scrollTop of the last position we scrolled to ourselves. A scroll event that lands
  // exactly there is ours; anything else is the reader. A time window does not work: under
  // slow rendering our own event can arrive long after the call, and a key press right
  // after a resize would be mistaken for ours.
  const programmaticScrollTop = React.useRef<number | null>(null)
  // Container geometry at the last scroll event. A scroll event that arrives together with a
  // change in clientHeight or scrollHeight was caused by layout (the browser clamping or
  // anchoring scrollTop after a resize or content change), not by the reader, and it can be
  // delivered before the resize observer fires.
  const lastGeometry = React.useRef<{ clientHeight: number; scrollHeight: number } | null>(null)
  const rememberGeometry = () => {
    if (!scrollbarRef.current) return
    const { clientHeight, scrollHeight } = scrollbarRef.current
    lastGeometry.current = { clientHeight, scrollHeight }
  }
  const scrollProgrammatically = (top: number) => {
    programmaticScrollTop.current = top
    rememberGeometry()
    return top
  }

  const memoizedScrollHeight = React.useRef<number>()

  const [mathMessagesRendered, onMathMessageRendered] = React.useState<number>(0)

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
    // A resize is not the reader asking for the newest message: keep it in view only if
    // they were already at the bottom. The resize observer fires asynchronously, so a
    // PageUp/PageDown or wheel that landed in between must win.
    rememberGeometry()
    if (readerPositionRef.current === ScrollPosition.BOTTOM) {
      scrollBottom()
    }
  }, [])

  const { ref: scrollbarRef } = useResizeDetector<HTMLDivElement>({ onResize })
  const scrollBottom = () => {
    if (!scrollbarRef?.current?.scrollTo) return
    setNewMessagesInfo(false)
    memoizedScrollHeight.current = 0
    readerPositionRef.current = ScrollPosition.BOTTOM
    scrollbarRef.current.scrollTo({
      behavior: 'auto',
      top: scrollProgrammatically(Math.abs(scrollbarRef.current.clientHeight - scrollbarRef.current.scrollHeight)),
    })
  }

  const onEnterKeyPress = (message: string) => {
    // Send message and files
    onInputEnter(message)
    // Go back to the bottom if scroll is at the top or in the middle
    readerPositionRef.current = ScrollPosition.BOTTOM
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
    const { clientHeight, scrollHeight } = scrollbarRef.current
    const geometryChanged =
      lastGeometry.current !== null &&
      (lastGeometry.current.clientHeight !== clientHeight || lastGeometry.current.scrollHeight !== scrollHeight)
    rememberGeometry()
    const ours =
      programmaticScrollTop.current !== null &&
      Math.abs(scrollbarRef.current.scrollTop - programmaticScrollTop.current) <= 1
    if (!ours && !geometryChanged) {
      readerPositionRef.current = position
    }
  }, [])

  /* Keep scroll position in certain cases */
  useLayoutEffect(() => {
    // Keep scroll at the bottom when new message arrives
    if (scrollbarRef.current && scrollPosition === ScrollPosition.BOTTOM) {
      scrollBottom()
    }
    // Keep scroll position when new chunk of messages is being loaded
    if (scrollbarRef.current && scrollPosition === ScrollPosition.TOP && memoizedScrollHeight.current !== undefined) {
      scrollbarRef.current.scrollTop = scrollProgrammatically(
        scrollbarRef.current.scrollHeight - memoizedScrollHeight.current
      )
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
          channelType={channelType}
          members={members}
          me={user}
          isPublic={isPublic}
          openContextMenu={openContextMenu}
          enableContextMenu={enableContextMenu}
          memberCount={members.length}
          openUserProfile={openUserProfile}
          dmConnected={dmConnected}
        />
      </PageHeader>
      <DropZoneComponent channelName={channelName} handleFileDrop={handleFileDrop}>
        <ChannelMessagesWrapperStyled item xs>
          <NewMessagesInfoComponent scrollBottom={scrollBottom} show={newMessagesInfo} />
          <ChannelMessagesComponent
            messages={messages.groups}
            pendingMessages={pendingMessages}
            downloadStatuses={downloadStatuses}
            maxAutodownloadSizeBytes={maxAutodownloadSizeBytes}
            scrollbarRef={scrollbarRef}
            onScroll={onScroll}
            uploadedFileModal={uploadedFileModal}
            openUrl={openUrl}
            channelLinks={channelLinks}
            openContainingFolder={openContainingFolder}
            downloadFile={downloadFile}
            cancelDownload={cancelDownload}
            onMathMessageRendered={updateMathMessagesRendered}
            pendingGeneralChannelRecreation={pendingGeneralChannelRecreation}
            unregisteredUsernameModalHandleOpen={unregisteredUsernameModalHandleOpen}
            openUserProfile={openUserProfile}
            duplicatedUsernameModalHandleOpen={duplicatedUsernameModalHandleOpen}
            allowEmpty={false}
          />
        </ChannelMessagesWrapperStyled>
        <Grid item>
          <ChannelInputComponent
            channelId={channelId}
            channelName={channelName}
            // TODO https://github.com/TryQuiet/ZbayLite/issues/443
            inputPlaceholder={`${channelType == null || channelType === ChannelType.CHANNEL ? '#' : ''}${channelName}${user ? ` as @${user?.nickname}` : ''}`}
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
              isCommunityInitialized && currentChannelSubscribed ? INPUT_STATE.AVAILABLE : INPUT_STATE.NOT_CONNECTED
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
