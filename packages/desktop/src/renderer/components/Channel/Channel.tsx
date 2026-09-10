import React, { useCallback, useEffect } from 'react'

import { shell, ipcRenderer, webUtils } from 'electron'

import { useDispatch, useSelector } from 'react-redux'
import { users, messages, publicChannels, communities, files, network, settings } from '@quiet/state-manager'
import { FileMetadata, CancelDownload, FileContent, FilePreviewData } from '@quiet/types'

import ChannelComponent, { ChannelComponentProps } from './ChannelComponent'

import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import { UploadFilesPreviewsProps } from './File/FileAttachmentPreview'

import { getFilesData } from '@quiet/common'

import { FileActionsProps } from './File/FileComponent/FileComponent'

import { useContextMenu } from '../../../hooks/useContextMenu'
import { MenuName } from '../../../const/MenuNames.enum'

const ChannelContent = () => {
  const dispatch = useDispatch()

  const user = useSelector(users.selectors.myUserProfile)
  const currentChannelId = useSelector(publicChannels.selectors.currentChannelId)
  const currentChannelName = useSelector(publicChannels.selectors.currentChannelName)
  const currentChannel = useSelector(publicChannels.selectors.currentChannel)
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

  const filesRef = React.useRef<FilePreviewData>({})

  const contextMenu = useContextMenu(MenuName.Channel)

  const onInputChange = useCallback((_value: string) => {
    // TODO https://github.com/TryQuiet/ZbayLite/issues/442
  }, [])

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

  React.useEffect(() => {
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
            path: webUtils.getPathForFile(arg),
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

  if (!currentChannelId) return null

  const channelComponentProps: ChannelComponentProps = {
    user: user,
    channelId: currentChannelId,
    channelName: currentChannelName,
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
      {currentChannelId && (
        <ChannelComponent
          {...channelComponentProps}
          {...uploadFilesPreviewProps}
          {...fileActionsProps}
          key={currentChannelId}
        />
      )}
    </>
  )
}

const Channel = () => {
  const channelId = useSelector(publicChannels.selectors.currentChannelId)
  return <ChannelContent key={channelId} />
}

export default Channel
