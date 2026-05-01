import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'

import { styled } from '@mui/material/styles'
import { Grid } from '@mui/material'

import Page from '../ui/Page/Page'
import PageHeader from '../ui/Page/PageHeader'

import ChannelHeaderComponent from '../widgets/channels/ChannelHeader'
import ChannelMessagesComponent from '../widgets/channels/ChannelMessages'
import ChannelInputComponent from '../widgets/channels/ChannelInput'

import { INPUT_STATE } from '../widgets/channels/ChannelInput/InputState.enum'

import {
  ChannelMessage,
  ChannelType,
  DownloadStatus,
  EMPTY_CHANNEL_ID,
  MessagesDailyGroups,
  MessageSendingStatus,
  PublicChannelStorage,
  UserProfile,
} from '@quiet/types'

import { useResizeDetector } from 'react-resize-detector'
import { Dictionary } from '@reduxjs/toolkit'

import UploadFilesPreviewsComponent, { UploadFilesPreviewsProps } from '../Channel/File/FileAttachmentPreview'

import { DropZoneComponent } from '../Channel/DropZone/DropZoneComponent'

import { NewMessagesInfoComponent } from '../Channel/NewMessagesInfo/NewMessagesInfoComponent'

import { FileActionsProps } from '../Channel/File/FileComponent/FileComponent'
import { UseModalType } from '../../containers/hooks'
import { HandleOpenModalType } from '../widgets/userLabel/UserLabel.types'
import NewMessageGroupHeader from '../widgets/channels/NewMessageGroup/NewMessageGroupHeader'
import NewMessageGroupSearch from '../widgets/channels/NewMessageGroup/NewMessageGroupSearch'
import { createLogger } from '../../logger'

const ChannelMessagesWrapperStyled = styled(Grid)(({ theme }) => ({
  position: 'relative',
  height: 0,
  backgroundColor: theme.palette.background.default,
}))

export interface NewDirectMessageComponentProps {
  user: UserProfile | undefined
  userProfiles: Record<string, UserProfile>
  channelId: string
  channelName: string
  channelType: ChannelType
  isPublic: boolean
  handleClose: () => void
  handleInputChange: (selectedUsers: UserProfile[]) => void
  setOrCreateDmChannel: (memberIds: string[]) => void
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
  openFilesDialog: () => void
  handleFileDrop: (arg: any) => void
  isCommunityInitialized: boolean
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

const logger = createLogger('NewDirectMessageComponent')

const EMPTY_CHANNEL_PLACEHOLDER_TEXT = ''
const ERROR_EMPTY_INPUT_NEW_DM = 'Enter a message to send when creating a new DM'
const ERROR_CANT_DETERMINE_MEMBERSHIP = `Can't determine membership of this DM because your user profile was undefined`

export const NewDirectMessageComponent: React.FC<
  NewDirectMessageComponentProps & UploadFilesPreviewsProps & FileActionsProps
> = ({
  user,
  userProfiles,
  handleInputChange,
  handleClose,
  channelId,
  channelName,
  channelType,
  isPublic,
  setOrCreateDmChannel,
  messages,
  newestMessage,
  pendingMessages,
  downloadStatuses = {},
  maxAutodownloadSizeBytes,
  lazyLoading,
  onInputChange,
  onInputEnter,
  openUrl,
  removeFile,
  handleFileDrop,
  filesData,
  isCommunityInitialized = true,
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
  const [scrollPosition, setScrollPosition] = useState(ScrollPosition.BOTTOM)
  const [mathMessagesRendered, onMathMessageRendered] = useState<number>(0)
  const [selectedMembers, setSelectedMembers] = useState<UserProfile[]>([])
  const [inputPlaceholderText, setInputPlaceholderText] = useState<string>(EMPTY_CHANNEL_PLACEHOLDER_TEXT)
  const [inputErrorMessage, setInputErrorMessage] = useState<string | undefined>(undefined)
  const [potentialChannelName, setPotentialChannelName] = useState<string | undefined>(undefined)

  const memoizedScrollHeight = useRef<number>()

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
    logger.warn('Setting or creating dm channel and sending message', message, selectedMembers, user)
    if (user == null) {
      setInputErrorMessage(ERROR_CANT_DETERMINE_MEMBERSHIP)
      return
    }
    if (channelId === EMPTY_CHANNEL_ID && message === '') {
      setInputErrorMessage(ERROR_EMPTY_INPUT_NEW_DM)
      return
    }
    setOrCreateDmChannel(selectedMembers.map(member => member.userId))
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

  const handleUserSearchInputChange = (members: UserProfile[]) => {
    setSelectedMembers(members)
    handleInputChange(members)
  }

  useEffect(() => {
    if (selectedMembers.length === 0) {
      setInputPlaceholderText(EMPTY_CHANNEL_PLACEHOLDER_TEXT)
      return
    }
    if (channelId !== EMPTY_CHANNEL_ID) {
      setInputPlaceholderText(`${channelName}${user ? ` as @${user?.nickname}` : ''}`)
      return
    }
    const _potentialChannelName = selectedMembers.map(member => member.nickname).join(', ')
    setPotentialChannelName(_potentialChannelName)
    setInputPlaceholderText(`${_potentialChannelName}${user ? ` as @${user?.nickname}` : ''}`)
  }, [selectedMembers, channelId, channelName, user, potentialChannelName])

  return (
    <Page>
      <PageHeader>
        <Grid display='flex' flexDirection='column' gap='8px'>
          <NewMessageGroupHeader userProfiles={userProfiles} me={user} handleClose={handleClose} />
          <NewMessageGroupSearch
            userProfiles={userProfiles}
            me={user}
            handleInputChange={handleUserSearchInputChange}
          />
        </Grid>
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
            openContainingFolder={openContainingFolder}
            downloadFile={downloadFile}
            cancelDownload={cancelDownload}
            onMathMessageRendered={updateMathMessagesRendered}
            pendingGeneralChannelRecreation={pendingGeneralChannelRecreation}
            unregisteredUsernameModalHandleOpen={unregisteredUsernameModalHandleOpen}
            duplicatedUsernameModalHandleOpen={duplicatedUsernameModalHandleOpen}
            allowEmpty={true}
          />
        </ChannelMessagesWrapperStyled>
        <Grid item>
          <ChannelInputComponent
            channelId={channelId}
            channelName={channelName}
            // TODO https://github.com/TryQuiet/ZbayLite/issues/443
            inputPlaceholder={inputPlaceholderText}
            onChange={value => {
              setInputErrorMessage(undefined)
              onInputChange(value)
            }}
            onKeyPress={message => {
              onEnterKeyPress(message)
            }}
            openFilesDialog={openFilesDialog}
            infoClass={infoClass}
            setInfoClass={setInfoClass}
            inputState={INPUT_STATE.AVAILABLE}
            inputStateErrorMessage={inputErrorMessage}
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

export default NewDirectMessageComponent
