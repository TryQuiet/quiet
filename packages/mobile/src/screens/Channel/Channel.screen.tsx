import React, { FC, useCallback, useEffect, useState } from 'react'
import { BackHandler, Linking } from 'react-native'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { Chat } from '../../components/Chat/Chat.component'
import { communities, publicChannels, messages, files, users, errors, connection } from '@quiet/state-manager'
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
import { Asset } from 'react-native-image-picker'
import { generateDmMemberHash, getFilesData } from '@quiet/common'
import { createLogger } from '../../utils/logger'

const logger = createLogger('ChannelScreen')

/**
 * Leaves the channel screen for the community home. Rendered rather than dispatched inline so the
 * navigation happens in an effect, after the render that discovered there is nothing to show.
 */
const ReturnHome: FC = () => {
  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(navigationActions.navigation({ screen: ScreenNames.AppHomeScreen }))
    dispatch(publicChannels.actions.setCurrentChannel({ channelId: '' }))
  }, [dispatch])
  return null
}

const ChannelScreenContent: FC = () => {
  const dispatch = useDispatch()
  const store = useStore()

  // The DM rows in the home nav still go straight to the conversation; only a person shown inside
  // a message or a read-only list leads to their profile.
  const openUserProfile = useCallback(
    (userId: string) => {
      dispatch(navigationActions.navigation({ screen: ScreenNames.UserProfileScreen, params: { userId } }))
    },
    [dispatch]
  )

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
    dispatch(
      publicChannels.actions.setNewMessageOpen({
        isOpen: false,
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
  const newMessageRecipientIds = useSelector(publicChannels.selectors.newMessageRecipientIds)

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

  const isUserConnected = useSelector(connection.selectors.isUserConnected)
  const isTorInitialized = useSelector(connection.selectors.isTorInitialized)

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
      const channelId = currentChannel?.id
      if (!channelId) return
      // Whitespace-only input has nothing to send, but any attached files below
      // still go out.
      if (message.trim()) {
        dispatch(messages.actions.sendMessage({ message, channelId }))
      }
      // Attach files, then send corresponding message (contaning cid) for each of them
      Object.values(filesRef.current).forEach(async (fileData: FileContent) => {
        if (!fileData.path) return
        dispatch(files.actions.attachFile({ ...fileData, channelId }))
      })
      // Reset file previews for input state
      setAttachingFiles({})
    },
    [dispatch, currentChannel?.id]
  )

  useEffect(() => {
    if (currentChannelId !== EMPTY_CHANNEL_ID) {
      dispatch(messages.actions.resetCurrentPublicChannelCache())
    }
  }, [currentChannelId])

  /**
   * Change to an existing DM channel if possible or create a new DM channel when sending a message on the
   * new chat view
   */
  const createOrSetDmChannelAction = useCallback(
    (memberIds: string[], firstMessage: string) => {
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
      const memberHash = generateDmMemberHash(uniquedMemberIds)
      const existing = channels.find(channel => channel.type === ChannelType.DM && channel.memberIdHash === memberHash)
      // Validate channel name
      if (existing) {
        logger.debug('Found existing DM channel', existing.id)
        dispatch(publicChannels.actions.setCurrentChannel({ channelId: existing.id }))
        dispatch(publicChannels.actions.setNewMessageOpen({ isOpen: false }))
        dispatch(messages.actions.sendMessage({ channelId: existing.id, message: firstMessage }))
        return
      }

      if (community == null || community.teamId == null) {
        throw new Error(`Can't create channel when community isn't initialized`)
      }

      logger.debug('Creating DM channel')
      dispatch(
        publicChannels.actions.createChannel({
          name: memberHash,
          firstMessage,
          description: `Empty`,
          public: false,
          type: ChannelType.DM,
          teamId: community.teamId,
          memberIds: uniquedMemberIds,
        })
      )
    },
    [dispatch, me, community, channels]
  )

  /**
   * Update the channel ID in-place to show messages from an existing DM when changing user selection on new chat view
   *
   * This only ever describes what the *open* composer has selected. Pointing the current channel at
   * EMPTY_CHANNEL_ID once the composer has closed strands the screen: nothing is being composed and
   * no channel is current, which is the one state this screen cannot draw. That is how sending the
   * first message of a new DM white-screened the app — the conversation was created and the message
   * delivered, then a late selection sync overwrote the brand new channel id with the empty
   * sentinel, and the screen rendered nothing until the app was restarted.
   *
   * The guard therefore reads the store rather than this closure. A copy of this callback taken
   * while the composer was open — one already held by an effect, say — must not still be willing to
   * reset the channel once it has closed, and a captured `isNewMessageOpen` would be.
   */
  const setDmChannelOnSelection = useCallback(
    (selectedIds: string[]) => {
      if (!publicChannels.selectors.isNewMessageOpen(store.getState())) return
      if (channels == null || selectedIds.length === 0) {
        dispatch(publicChannels.actions.setCurrentChannel({ channelId: EMPTY_CHANNEL_ID }))
        return
      }
      const withMe = me != null ? [...selectedIds, me.userId] : selectedIds
      const memberHash = generateDmMemberHash(withMe)
      const existing = channels.find(channel => channel.type === ChannelType.DM && channel.memberIdHash === memberHash)
      dispatch(publicChannels.actions.setCurrentChannel({ channelId: existing?.id ?? EMPTY_CHANNEL_ID }))
    },
    [dispatch, store, channels, me]
  )

  const [imagePreview, setImagePreview] = useState<FileMetadata | null>(null)

  const openUrl = useCallback((url: string) => {
    void Linking.openURL(url)
  }, [])

  /**
   * Nothing is being composed and the current channel id names no channel we have. There is no
   * conversation to draw, and rendering nothing leaves the user on a blank screen they cannot get
   * off without restarting the app, so send them back to the list they came from.
   *
   * EMPTY_CHANNEL_ID specifically means "the composer settled on no conversation"; a real id that
   * simply has not replicated yet is a different, transient state and still renders nothing for
   * that moment rather than navigating away underneath the user.
   */
  if (!isNewMessageOpen && !currentChannel) {
    if (currentChannelId === EMPTY_CHANNEL_ID) {
      logger.warn('No conversation to show and none being composed; returning to the community home')
      return <ReturnHome />
    }
    return null
  }

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
      newChatRecipientIds={newMessageRecipientIds}
      openUserProfile={openUserProfile}
      userProfiles={userProfiles}
      me={me}
      messages={{
        count: channelMessagesCount,
        groups: channelMessages,
      }}
      isUserConnected={isUserConnected}
      isTorInitialized={isTorInitialized}
      pendingMessages={pendingMessages}
      downloadStatuses={downloadStatusesMapping}
      downloadFile={downloadFile}
      cancelDownload={cancelDownload}
      imagePreview={imagePreview}
      setImagePreview={setImagePreview}
      openImagePreview={setImagePreview}
      updateImageAttachments={updateImageAttachments}
      removeFilePreview={removeFilePreview}
      openUrl={openUrl}
      uploadedFiles={attachingFiles}
      ready={isWebsocketConnected}
      duplicatedUsernameHandleBack={duplicatedUsernameHandleBack}
      unregisteredUsernameHandleBack={unregisteredUsernameHandleBack}
      createOrSetDmChannelAction={createOrSetDmChannelAction}
      setDmChannelOnSelection={setDmChannelOnSelection}
    />
  )
}

export const ChannelScreen: FC = () => {
  const channel = useSelector(publicChannels.selectors.currentChannel)
  const isNewMessageOpen = useSelector(publicChannels.selectors.isNewMessageOpen)
  // Text refs, pending sends and file previews belong to the channel where they started.
  //
  // While the new-message view is open the current channel id deliberately churns as recipients are
  // picked (setDmChannelOnSelection points it at the matching DM, or at EMPTY_CHANNEL_ID when the
  // selection is empty). Re-keying on it there remounts this subtree and wipes the in-progress
  // recipient selection, which made a tapped recipient immediately appear unselected.
  return <ChannelScreenContent key={isNewMessageOpen ? 'new-message' : channel?.id} />
}
