import React, { FC, useCallback, useEffect, useState } from 'react'
import { BackHandler, Linking } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { Chat } from '../../components/Chat/Chat.component'
import { communities, publicChannels, messages, files, users, errors } from '@quiet/state-manager'
import {
  CancelDownload,
  ChannelType,
  EMPTY_CHANNEL_ID,
  ErrorCodes,
  ErrorMessages,
  FileContent,
  FileMetadata,
  FilePreviewData,
  SocketActions,
} from '@quiet/types'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { UseContextMenuType, useContextMenu } from '../../hooks/useContextMenu'
import { MenuName } from '../../const/MenuNames.enum'
import { initSelectors } from '../../store/init/init.selectors'
import { DocumentPickerResponse } from 'react-native-document-picker'
import { Asset } from 'react-native-image-picker'
import { generateDmChannelId, generateDmChannelName, getFilesData } from '@quiet/common'
import { createLogger } from '../../utils/logger'

const logger = createLogger('ChannelScreen')

export const ChannelScreen: FC = () => {
  const dispatch = useDispatch()

  const handleBackButton = useCallback(() => {
    dispatch(
      navigationActions.navigation({
        screen: ScreenNames.AppHomeScreen,
      })
    )
    dispatch(
      publicChannels.actions.setCurrentChannel({
        channelId: '', // Necessary for marking channels as unread on channel's list
      })
    )
    return true
  }, [dispatch])

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackButton)
    return () => {
      subscription.remove()
    }
  }, [handleBackButton])

  const currentChannel = useSelector(publicChannels.selectors.currentChannel)

  const currentChannelName = useSelector(publicChannels.selectors.currentChannelName)

  const currentChannelId = useSelector(publicChannels.selectors.currentChannelId)

  const channels = useSelector(publicChannels.selectors.publicChannels)

  const isNewMessageOpen = useSelector(publicChannels.selectors.isNewMessageOpen)

  const channelMessagesCount = useSelector(publicChannels.selectors.currentChannelMessagesCount)

  const channelMessages = useSelector(publicChannels.selectors.currentChannelMessagesMergedBySender)

  const pendingMessages = useSelector(messages.selectors.messagesSendingStatus)

  const downloadStatusesMapping = useSelector(files.selectors.downloadStatuses)

  const isWebsocketConnected = useSelector(initSelectors.isWebsocketConnected)

  const isOwner = useSelector(communities.selectors.isOwner)

  const userProfiles = useSelector(users.selectors.userProfiles)

  const me = useSelector(users.selectors.myUserProfile)

  const communityError = useSelector(errors.selectors.currentCommunityErrors)

  const community = useSelector(communities.selectors.currentCommunity)

  const error = communityError[SocketActions.CREATE_CHANNEL]

  let contextMenu: UseContextMenuType<Record<string, unknown>> | null = useContextMenu(MenuName.Channel)

  if (!isWebsocketConnected || (!isOwner && currentChannel?.public) || isNewMessageOpen) {
    contextMenu = null
  }

  const unregisteredUsernameContextMenu = useContextMenu(MenuName.UnregisteredUsername)

  const [attachingFiles, setAttachingFiles] = React.useState<FilePreviewData>({})
  const filesRef = React.useRef<FilePreviewData>({})
  React.useEffect(() => {
    filesRef.current = attachingFiles
  }, [attachingFiles])

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

  const loadMessages = useCallback(
    (load: boolean) => {
      dispatch(messages.actions.lazyLoading({ load }))
    },
    [dispatch]
  )

  // Files
  const updateFileAttachments = (files: DocumentPickerResponse[]) => {
    const filesData: FilePreviewData = getFilesData(
      files.map(fileObj => {
        return {
          path: fileObj.fileCopyUri || fileObj.uri,
          isTmp: !fileObj.copyError,
        }
      })
    )

    // FilePreviewData
    setAttachingFiles(existingFiles => {
      const updatedFiles = { ...existingFiles, ...filesData }
      return updatedFiles
    })
  }

  const updateImageAttachments = (assets: Asset[]) => {
    const assetData: FilePreviewData = getFilesData(
      assets.map(assetObj => {
        return {
          path: assetObj.uri || assetObj.originalPath || '',
          isTmp: false,
        }
      })
    )

    // FilePreviewData
    setAttachingFiles(existingFiles => {
      const updatedFiles = { ...existingFiles, ...assetData }
      return updatedFiles
    })
  }

  const removeFilePreview = (id: string) =>
    setAttachingFiles(existingFiles => {
      delete existingFiles[id]
      const updatedExistingFiles = { ...existingFiles }
      return updatedExistingFiles
    })

  // User Label

  const duplicatedUsernameHandleBack = useCallback(() => {
    dispatch(
      navigationActions.navigation({
        screen: ScreenNames.DuplicatedUsernameScreen,
      })
    )
  }, [dispatch])

  const unregisteredUsernameHandleBack = useCallback(
    (username: string) => {
      unregisteredUsernameContextMenu.handleOpen({ username })
    },
    [unregisteredUsernameContextMenu]
  )

  const sendMessageAction = React.useCallback(
    async (message: string) => {
      if (message) {
        dispatch(messages.actions.sendMessage({ message }))
      }
      // Attach files, then send corresponding message (contaning cid) for each of them
      Object.values(filesRef.current).forEach(async (fileData: FileContent) => {
        if (!fileData.path) return
        dispatch(files.actions.attachFile(fileData))
      })
      // Reset file previews for input state
      setAttachingFiles({})
    },
    [dispatch]
  )

  useEffect(() => {
    if (currentChannelId !== EMPTY_CHANNEL_ID) {
      dispatch(messages.actions.resetCurrentPublicChannelCache())
    }
  }, [currentChannelId])

  const createOrSetDmChannelAction = useCallback(
    (memberIds: string[]) => {
      logger.debug('Setting or creating dm channel', memberIds)
      if (memberIds.length === 0 || me === undefined) {
        logger.error('Member IDs was empty or me profile was nullish')
        dispatch(
          errors.actions.addError({
            type: SocketActions.CREATE_CHANNEL,
            code: ErrorCodes.BAD_REQUEST,
            message: ErrorMessages.GENERAL,
            community: community?.id,
          })
        )
        return
      }

      const uniquedMemberIds = [...new Set([...memberIds, me.userId])]
      const dmId = generateDmChannelId(uniquedMemberIds)
      // Validate channel name
      if (channels.some(channel => channel.id === dmId)) {
        logger.debug('Found existing DM channel', dmId)
        dispatch(publicChannels.actions.setCurrentChannel({ channelId: dmId }))
        dispatch(publicChannels.actions.setNewMessageOpen({ isOpen: false }))
        return
      }

      if (community == null || community.teamId == null) {
        throw new Error(`Can't create channel when community isn't initialized`)
      }

      logger.debug('Creating DM channel', dmId, uniquedMemberIds)
      dispatch(
        publicChannels.actions.createChannel({
          name: dmId,
          description: `Empty`,
          id: dmId,
          public: false,
          type: ChannelType.DM,
          teamId: community.teamId,
          memberIds: uniquedMemberIds,
        })
      )
      dispatch(publicChannels.actions.setCurrentChannel({ channelId: dmId }))
      dispatch(publicChannels.actions.setNewMessageOpen({ isOpen: false }))
    },
    [dispatch]
  )

  const [imagePreview, setImagePreview] = useState<FileMetadata | null>(null)

  const openUrl = useCallback((url: string) => {
    void Linking.openURL(url)
  }, [])

  if (!isNewMessageOpen && !currentChannel) return null

  return (
    <Chat
      contextMenu={contextMenu}
      sendMessageAction={sendMessageAction}
      loadMessagesAction={loadMessages}
      handleBackButton={handleBackButton}
      channel={currentChannel}
      channelName={currentChannelName}
      channelId={currentChannelId}
      newChat={isNewMessageOpen}
      userProfiles={userProfiles}
      me={me}
      messages={{
        count: channelMessagesCount,
        groups: channelMessages,
      }}
      pendingMessages={pendingMessages}
      downloadStatuses={downloadStatusesMapping}
      downloadFile={downloadFile}
      cancelDownload={cancelDownload}
      imagePreview={imagePreview}
      setImagePreview={setImagePreview}
      openImagePreview={setImagePreview}
      updateFileAttachments={updateFileAttachments}
      updateImageAttachments={updateImageAttachments}
      removeFilePreview={removeFilePreview}
      openUrl={openUrl}
      uploadedFiles={attachingFiles}
      ready={isWebsocketConnected}
      duplicatedUsernameHandleBack={duplicatedUsernameHandleBack}
      unregisteredUsernameHandleBack={unregisteredUsernameHandleBack}
      createOrSetDmChannelAction={createOrSetDmChannelAction}
    />
  )
}
