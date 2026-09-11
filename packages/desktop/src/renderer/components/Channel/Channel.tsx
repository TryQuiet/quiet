import React, { useCallback, useEffect, useState } from 'react'

import { shell, ipcRenderer, webUtils } from 'electron'
import { openExternal } from '../../openExternal'

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

import { generateDmMemberHash, getFilesData, isDefined } from '@quiet/common'

import { FileActionsProps } from './File/FileComponent/FileComponent'

import { useContextMenu } from '../../../hooks/useContextMenu'
import { MenuName } from '../../../const/MenuNames.enum'
import { createLogger } from '../../logger'
import _ from 'lodash'
import NewDirectMessageComponent, { NewDirectMessageComponentProps } from './NewDirectMessage.component'

const logger = createLogger('Channel')

const ChannelContent = () => {
  const dispatch = useDispatch()

  const myUserProfile = useSelector(users.selectors.myUserProfile)
  const userProfiles = useSelector(users.selectors.userProfiles)
  const currentChannelId = useSelector(publicChannels.selectors.currentChannelId)
  const currentChannelName = useSelector(publicChannels.selectors.currentChannelName)
  const currentChannel = useSelector(publicChannels.selectors.currentChannel)
  const prevChannelId = useSelector(publicChannels.selectors.prevChannelId)
  const channels = useSelector(publicChannels.selectors.publicChannels)
  const isNewMessageOpen = useSelector(publicChannels.selectors.isNewMessageOpen)
  const currentChannelSubscribed = useSelector(publicChannels.selectors.currentChannelSubscribed)

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
  const [channelName, setChannelName] = useState<string>('')
  const [members, setMembers] = useState<UserProfile[]>([])
  const [me, setMe] = useState<UserProfile | undefined>(myUserProfile)

  const filesRef = React.useRef<FilePreviewData>({})

  const contextMenu = useContextMenu(MenuName.Channel)
  useEffect(() => {
    if (currentChannel) setChannelName(currentChannelName)
  }, [currentChannel, currentChannelName, currentChannelId])

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
      if (!currentChannelId) return
      // Send message out of input value
      if (message) {
        dispatch(messages.actions.sendMessage({ message, channelId: currentChannelId }))
      }
      // Upload files, then send corresponding message (contaning cid) for each of them
      Object.values(filesRef.current).forEach((fileData: FileContent) => {
        dispatch(files.actions.attachFile({ ...fileData, channelId: currentChannelId }))
      })
      // Reset file previews for input state
      setAttachingFiles({})
    },
    [dispatch, currentChannelId]
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
            return { path: webUtils.getPathForFile(droppedFile) }
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
      channelId: currentChannelId,
    })
  }

  useEffect(() => {
    const onTempFile = (_event: Electron.IpcRendererEvent, arg: any) => {
      if (arg.channelId !== currentChannelId) return
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
    }
    ipcRenderer.on('writeTempFileReply', onTempFile)
    return () => {
      ipcRenderer.removeListener('writeTempFileReply', onTempFile)
    }
  }, [currentChannelId])

  useEffect(() => {
    const onOpenedFiles = (_event: Electron.IpcRendererEvent, filesData: FilePreviewData, channelId: string) => {
      if (channelId !== currentChannelId) return
      updateAttachingFiles(filesData)
    }
    ipcRenderer.on('openedFiles', onOpenedFiles)
    return () => {
      ipcRenderer.removeListener('openedFiles', onOpenedFiles)
    }
  }, [currentChannelId])

  const openFilesDialog = useCallback(() => {
    ipcRenderer.send('openUploadFileDialog', currentChannelId)
  }, [currentChannelId])

  const openUrl = useCallback((url: string) => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    openExternal(url)
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
  ): { uniqueMemberIds: string[]; memberIdHash: string } => {
    const uniqueMemberIds = _.uniq([...memberIds, me.userId]).sort()
    return {
      memberIdHash: generateDmMemberHash(uniqueMemberIds),
      uniqueMemberIds,
    }
  }

  const handleNewMessageInputChange = (members: UserProfile[]) => {
    logger.debug('New message - Handling member ID change')
    const memberIds = members.map(member => member.userId)
    if (me == null || members.length === 0) {
      dispatch(publicChannels.actions.setCurrentChannel({ channelId: EMPTY_CHANNEL_ID }))
      return
    }
    const { memberIdHash } = generateDmChannelIdFromMemberIds(memberIds, me)
    const existingDmChannel = channels.find(channel => channel.memberIdHash === memberIdHash)
    if (existingDmChannel != null) {
      logger.debug('New message - Found existing DM channel')
      dispatch(publicChannels.actions.setCurrentChannel({ channelId: existingDmChannel.id }))
    } else {
      dispatch(publicChannels.actions.setCurrentChannel({ channelId: EMPTY_CHANNEL_ID }))
    }
  }

  const setOrCreateDmChannel = useCallback(
    (memberIds: string[], firstMessage: string) => {
      if (me == null || memberIds.length === 0) {
        logger.debug('Setting channel ID to empty - missing own user profile or member IDs was empty')
        dispatch(publicChannels.actions.setCurrentChannel({ channelId: EMPTY_CHANNEL_ID }))
        return
      }

      const { memberIdHash, uniqueMemberIds } = generateDmChannelIdFromMemberIds(memberIds, me)
      const dmChannel = channels.find(channel => channel.memberIdHash === memberIdHash)
      if (dmChannel != null) {
        logger.debug('Found existing DM channel')
        dispatch(publicChannels.actions.setNewMessageOpen({ isOpen: false }))
        dispatch(
          publicChannels.actions.setCurrentChannel({
            channelId: dmChannel.id,
          })
        )
        if (currentChannelId === dmChannel.id) onInputEnter(firstMessage)
        else dispatch(messages.actions.sendMessage({ channelId: dmChannel.id, message: firstMessage }))
      } else {
        logger.debug('Creating new DM channel')
        if (community == null || community.teamId == null) {
          logger.error(`Community or team ID was undefined, can't create DM channel`)
          return
        }
        const payload: CreateChannelPayload = {
          name: memberIdHash,
          type: ChannelType.DM,
          description: 'DM channel',
          public: false,
          memberIds: uniqueMemberIds,
          teamId: community.teamId,
        }
        logger.debug('Running create channel action')
        dispatch(publicChannels.actions.createChannel({ ...payload, firstMessage }))
      }
    },
    [dispatch, me, channels, community, currentChannelId, onInputEnter]
  )

  if (!currentChannelId) {
    logger.warn('Current channel ID is nullish')
    return null
  }
  if (!channelName && !isNewMessageOpen) {
    logger.warn('Channel name is nullish')
    return null
  }
  if (!isNewMessageOpen && currentChannelId === EMPTY_CHANNEL_ID) {
    logger.warn('New message view is closed but current channel ID is considered empty')
    return null
  }

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
    currentChannelSubscribed: currentChannelSubscribed,
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
    channelName,
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
    handleClipboardFiles: handleClipboardFiles,
    uploadedFileModal: uploadedFileModal,
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

const Channel = () => {
  const channelId = useSelector(publicChannels.selectors.currentChannelId)
  const newMessageOpen = useSelector(publicChannels.selectors.isNewMessageOpen)
  return <ChannelContent key={newMessageOpen ? 'new-dm' : channelId} />
}

export default Channel
