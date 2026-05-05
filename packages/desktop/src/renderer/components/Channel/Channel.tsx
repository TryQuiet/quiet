import React, { useCallback, useEffect, useState } from 'react'

import { shell, ipcRenderer } from 'electron'

import { useDispatch, useSelector } from 'react-redux'
import { users, messages, publicChannels, communities, files, network, settings } from '@quiet/state-manager'
import {
  FileMetadata,
  CancelDownload,
  FileContent,
  FilePreviewData,
  ChannelType,
  UserProfile,
  CreateChannelPayload,
  EMPTY_CHANNEL_ID,
} from '@quiet/types'

import ChannelComponent, { ChannelComponentProps } from './ChannelComponent'

import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import { UploadFilesPreviewsProps } from './File/FileAttachmentPreview'

import { generateDmChannelId, getFilesData, isDefined } from '@quiet/common'

import { FileActionsProps } from './File/FileComponent/FileComponent'

import { useContextMenu } from '../../../hooks/useContextMenu'
import { MenuName } from '../../../const/MenuNames.enum'
import { createLogger } from '../../logger'
import _ from 'lodash'
import NewDirectMessageComponent, {
  NewDirectMessageComponentProps,
} from '../NewDirectMessage/NewDirectMessage.component'

const logger = createLogger('Channel')

const Channel = () => {
  const dispatch = useDispatch()

  const myUserProfile = useSelector(users.selectors.myUserProfile)
  const userProfiles = useSelector(users.selectors.userProfiles)
  const currentChannelId = useSelector(publicChannels.selectors.currentChannelId)
  const currentChannelName = useSelector(publicChannels.selectors.currentChannelName)
  const currentChannel = useSelector(publicChannels.selectors.currentChannel)
  const generalChannel = useSelector(publicChannels.selectors.generalChannel)
  const prevChannelId = useSelector(publicChannels.selectors.prevChannelId)
  const channels = useSelector(publicChannels.selectors.publicChannels)
  const isNewMessageOpen = useSelector(publicChannels.selectors.isNewMessageOpen)

  const currentChannelMessagesCount = useSelector(publicChannels.selectors.currentChannelMessagesCount)

  const currentChannelDisplayableMessages = useSelector(publicChannels.selectors.currentChannelMessagesMergedBySender)

  const newestCurrentChannelMessage = useSelector(publicChannels.selectors.newestCurrentChannelMessage)

  const downloadStatusesMapping = useSelector(files.selectors.downloadStatuses)
  const maxAutodownloadSizeBytes = useSelector(settings.selectors.maxAutodownloadBytes)

  const community = useSelector(communities.selectors.currentCommunity)

  const initializedCommunities = useSelector(network.selectors.initializedCommunities)
  const isCommunityInitialized = Boolean(community && initializedCommunities[community.id])

  const pendingGeneralChannelRecreationSelector = useSelector(publicChannels.selectors.pendingGeneralChannelRecreation)

  const pendingGeneralChannelRecreation =
    pendingGeneralChannelRecreationSelector &&
    (currentChannelName === 'general' || currentChannelName === '') &&
    currentChannelMessagesCount === 0

  const pendingMessages = useSelector(messages.selectors.messagesSendingStatus)

  const uploadedFileModal = useModal<{ src: string }>(ModalName.uploadedFileModal)
  const { handleOpen: duplicatedUsernameModalHandleOpen } = useModal(ModalName.duplicatedUsernameModal)
  const { handleOpen: unregisteredUsernameModalHandleOpen } = useModal(ModalName.unregisteredUsernameModal)

  const [attachingFiles, setAttachingFiles] = React.useState<FilePreviewData>({})
  const [channelName, setChannelName] = useState<string>()
  const [members, setMembers] = useState<UserProfile[]>([])
  const [me, setMe] = useState<UserProfile | undefined>(myUserProfile)

  const filesRef = React.useRef<FilePreviewData>({})

  const contextMenu = useContextMenu(MenuName.Channel)

  useEffect(() => {
    if (currentChannel == null) return
    logger.info('Channel data', currentChannel)
    setChannelName(currentChannelName)
  }, [currentChannel, currentChannelName])

  useEffect(() => {
    if (currentChannel == null || currentChannel.memberIds == null) {
      setMembers(Object.values(userProfiles))
      return
    }
    setMembers(currentChannel.memberIds.map(memberId => userProfiles[memberId]).filter(isDefined) ?? [])
  }, [userProfiles, currentChannel, currentChannelId])

  const onInputChange = useCallback((_value: string) => {
    // TODO https://github.com/TryQuiet/ZbayLite/issues/442
  }, [])

  useEffect(() => {
    setMe(myUserProfile)
  }, [myUserProfile])

  const onInputEnter = useCallback(
    (message: string) => {
      // Send message out of input value
      if (message) {
        dispatch(messages.actions.sendMessage({ message }))
      }
      // Upload files, then send corresponding message (contaning cid) for each of them
      Object.values(filesRef.current).forEach((fileData: FileContent) => {
        dispatch(files.actions.attachFile(fileData))
      })
      // Reset file previews for input state
      setAttachingFiles({})
    },
    [dispatch]
  )

  useEffect(() => {
    filesRef.current = attachingFiles
  }, [attachingFiles])

  const lazyLoading = useCallback(
    (load: boolean) => {
      dispatch(messages.actions.lazyLoading({ load }))
    },
    [dispatch]
  )

  const handleFileDrop = useCallback((item: { files: any[] }) => {
    if (item) {
      updateAttachingFiles(
        getFilesData(
          item.files.map(droppedFile => {
            return { path: droppedFile.path }
          })
        )
      )
    }
  }, [])

  const removeFilePreview = (id: string) =>
    setAttachingFiles(existingFiles => {
      delete existingFiles[id]
      const updatedExistingFiles = { ...existingFiles }
      return updatedExistingFiles
    })

  const updateAttachingFiles = (filesData: FilePreviewData) => {
    setAttachingFiles(existingFiles => {
      const updatedFiles = { ...existingFiles, ...filesData }
      return updatedFiles
    })
  }

  const handleClipboardFiles = (imageBuffer: ArrayBuffer, ext: string, name: string) => {
    let id: string
    // create id for images in clipboard with default name 'image.png'
    if (name === 'image') {
      id = `${Date.now()}_${Math.random().toString(36).substring(0, 20)}`
    } else {
      id = name
    }
    ipcRenderer.send('writeTempFile', {
      fileName: `${id}${ext}`,
      fileBuffer: new Uint8Array(imageBuffer),
      ext: ext,
    })
  }

  useEffect(() => {
    ipcRenderer.on('writeTempFileReply', (_event, arg) => {
      setAttachingFiles(existingFiles => {
        const updatedFiles = {
          ...existingFiles,
          [arg.id]: {
            ext: arg.ext,
            name: arg.name,
            path: arg.path,
          },
        }

        return updatedFiles
      })
    })
  }, [])

  useEffect(() => {
    ipcRenderer.on('openedFiles', (e, filesData: FilePreviewData) => {
      updateAttachingFiles(filesData)
    })
  }, [])

  const openFilesDialog = useCallback(() => {
    ipcRenderer.send('openUploadFileDialog')
  }, [])

  const openUrl = useCallback((url: string) => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    shell.openExternal(url)
  }, [])

  const openContainingFolder = useCallback((path: string) => {
    shell.showItemInFolder(path)
  }, [])

  const downloadFile = useCallback(
    (media: FileMetadata) => {
      dispatch(files.actions.downloadFile(media))
    },
    [dispatch]
  )

  const cancelDownload = useCallback(
    (cancelDownload: CancelDownload) => {
      dispatch(files.actions.cancelDownload(cancelDownload))
    },
    [dispatch]
  )

  const openContextMenu = useCallback(() => {
    contextMenu.handleOpen()
  }, [contextMenu])

  useEffect(() => {
    dispatch(messages.actions.resetCurrentPublicChannelCache())
  }, [currentChannelId])

  const closeNewMessageWindow = () => {
    dispatch(publicChannels.actions.setNewMessageOpen({ isOpen: false }))
    dispatch(publicChannels.actions.setCurrentChannel({ channelId: prevChannelId }))
  }

  const generateDmChannelIdFromMemberIds = (
    memberIds: string[],
    me: UserProfile
  ): { uniqueMemberIds: string[]; channelId: string } => {
    const uniqueMemberIds = _.uniq([...memberIds, me.userId]).sort()
    return {
      channelId: generateDmChannelId(uniqueMemberIds),
      uniqueMemberIds,
    }
  }

  const handleNewMessageInputChange = (members: UserProfile[]) => {
    logger.warn('Handling new message input', members)
    const memberIds = members.map(member => member.userId)
    if (me == null || members.length === 0) {
      dispatch(publicChannels.actions.setCurrentChannel({ channelId: EMPTY_CHANNEL_ID }))
      return
    }
    const { channelId: dmChannelId } = generateDmChannelIdFromMemberIds(memberIds, me)
    if (channels.find(channel => channel.id === dmChannelId)) {
      logger.warn('Found dm channel', dmChannelId)
      dispatch(publicChannels.actions.setCurrentChannel({ channelId: dmChannelId }))
    } else {
      dispatch(publicChannels.actions.setCurrentChannel({ channelId: EMPTY_CHANNEL_ID }))
    }
  }

  const setOrCreateDmChannel = useCallback(
    (memberIds: string[]) => {
      if (me == null || memberIds.length === 0) {
        dispatch(publicChannels.actions.setCurrentChannel({ channelId: EMPTY_CHANNEL_ID }))
        return
      }

      const { channelId, uniqueMemberIds } = generateDmChannelIdFromMemberIds(memberIds, me)
      const dmChannel = channels.find(channel => channel.id === channelId)
      if (dmChannel != null) {
        dispatch(publicChannels.actions.setNewMessageOpen({ isOpen: false }))
        dispatch(
          publicChannels.actions.setCurrentChannel({
            channelId,
          })
        )
      } else {
        const payload: CreateChannelPayload = {
          id: channelId,
          name: channelId,
          type: ChannelType.DM,
          description: 'foo',
          public: false,
          memberIds: uniqueMemberIds,
        }
        dispatch(publicChannels.actions.createChannel(payload))
        dispatch(publicChannels.actions.setNewMessageOpen({ isOpen: false }))
        dispatch(
          publicChannels.actions.setCurrentChannel({
            channelId,
          })
        )
      }
    },
    [dispatch, me, channels]
  )

  if (!currentChannelId) return null
  if (!channelName) return null
  if (!isNewMessageOpen && currentChannelId === EMPTY_CHANNEL_ID) return null

  const channelComponentProps: ChannelComponentProps = {
    user: me,
    channelId: currentChannelId,
    channelType: currentChannel?.type ?? ChannelType.CHANNEL,
    channelName,
    members,
    isPublic: currentChannel?.public ?? true,
    messages: {
      count: currentChannelMessagesCount,
      groups: currentChannelDisplayableMessages,
    },
    newestMessage: newestCurrentChannelMessage,
    pendingMessages: pendingMessages,
    downloadStatuses: downloadStatusesMapping,
    maxAutodownloadSizeBytes,
    lazyLoading: lazyLoading,
    onInputChange: onInputChange,
    onInputEnter: onInputEnter,
    openUrl: openUrl,
    handleFileDrop: handleFileDrop,
    openFilesDialog: openFilesDialog,
    isCommunityInitialized: isCommunityInitialized,
    handleClipboardFiles: handleClipboardFiles,
    uploadedFileModal: uploadedFileModal,
    openContextMenu: openContextMenu,
    pendingGeneralChannelRecreation: pendingGeneralChannelRecreation,
    unregisteredUsernameModalHandleOpen,
    duplicatedUsernameModalHandleOpen,
  }

  const newDirectMessageComponentProps: NewDirectMessageComponentProps = {
    user: me,
    userProfiles,
    channelId: currentChannelId,
    channelType: currentChannel?.type ?? ChannelType.CHANNEL,
    channelName,
    isPublic: currentChannel?.public ?? true,
    messages: {
      count: currentChannelMessagesCount,
      groups: currentChannelDisplayableMessages,
    },
    newestMessage: newestCurrentChannelMessage,
    pendingMessages: pendingMessages,
    downloadStatuses: downloadStatusesMapping,
    maxAutodownloadSizeBytes,
    lazyLoading: lazyLoading,
    onInputChange: onInputChange,
    onInputEnter: onInputEnter,
    openUrl: openUrl,
    handleFileDrop: handleFileDrop,
    openFilesDialog: openFilesDialog,
    isCommunityInitialized: isCommunityInitialized,
    handleClipboardFiles: handleClipboardFiles,
    uploadedFileModal: uploadedFileModal,
    openContextMenu: openContextMenu,
    pendingGeneralChannelRecreation: pendingGeneralChannelRecreation,
    unregisteredUsernameModalHandleOpen,
    duplicatedUsernameModalHandleOpen,
    handleInputChange: handleNewMessageInputChange,
    handleClose: closeNewMessageWindow,
    setOrCreateDmChannel,
  }

  const uploadFilesPreviewProps: UploadFilesPreviewsProps = {
    filesData: attachingFiles,
    removeFile: removeFilePreview,
  }

  const fileActionsProps: FileActionsProps = {
    openContainingFolder: openContainingFolder,
    downloadFile: downloadFile,
    cancelDownload: cancelDownload,
  }

  return (
    <>
      {isNewMessageOpen ? (
        <NewDirectMessageComponent
          {...newDirectMessageComponentProps}
          {...uploadFilesPreviewProps}
          {...fileActionsProps}
          key={'new-message'}
        />
      ) : (
        currentChannelId && (
          <ChannelComponent
            {...channelComponentProps}
            {...uploadFilesPreviewProps}
            {...fileActionsProps}
            key={currentChannelId}
          />
        )
      )}
    </>
  )
}

export default Channel
