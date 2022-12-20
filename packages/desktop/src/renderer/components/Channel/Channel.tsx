import React, { useCallback, useEffect } from 'react'

import { shell, ipcRenderer } from 'electron'

import { useDispatch, useSelector } from 'react-redux'
import {
  identity,
  messages,
  publicChannels,
  connection,
  communities,
  files,
  FileMetadata,
  CancelDownload,
  FileContent,
  network
} from '@quiet/state-manager'

import ChannelComponent, { ChannelComponentProps } from './ChannelComponent'

import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import {
  FilePreviewData,
  UploadFilesPreviewsProps
} from './File/UploadingPreview'

import { getFilesData } from '../../../utils/functions/fileData'

import { FileActionsProps } from './File/FileComponent/FileComponent'

const Channel = () => {
  const dispatch = useDispatch()

  const user = useSelector(identity.selectors.currentIdentity)

  const currentChannelAddress = useSelector(publicChannels.selectors.currentChannelAddress)
  const currentChannelName = useSelector(publicChannels.selectors.currentChannelName)

  const currentChannelMessagesCount = useSelector(
    publicChannels.selectors.currentChannelMessagesCount
  )

  const currentChannelDisplayableMessages = useSelector(
    publicChannels.selectors.currentChannelMessagesMergedBySender
  )

  const newestCurrentChannelMessage = useSelector(
    publicChannels.selectors.newestCurrentChannelMessage
  )

  const downloadStatusesMapping = useSelector(files.selectors.downloadStatuses)

  const communityId = useSelector(communities.selectors.currentCommunityId)
  const initializedCommunities = useSelector(network.selectors.initializedCommunities)

  const isCommunityInitialized = Boolean(initializedCommunities[communityId])

  const pendingMessages = useSelector(messages.selectors.messagesSendingStatus)

  const channelSettingsModal = useModal(ModalName.channelSettingsModal)
  const channelInfoModal = useModal(ModalName.channelInfo)
  const uploadedFileModal = useModal<{ src: string }>(ModalName.uploadedFileModal)

  const [uploadingFiles, setUploadingFiles] = React.useState<FilePreviewData>({})

  const filesRef = React.useRef<FilePreviewData>()

  const onInputChange = useCallback(
    (_value: string) => {
      // TODO https://github.com/TryQuiet/ZbayLite/issues/442
    },
    [dispatch]
  )

  const onInputEnter = useCallback(
    (message: string) => {
      // Send message out of input value
      if (message) {
        dispatch(messages.actions.sendMessage({ message }))
      }
      // Upload files, then send corresponding message (contaning cid) for each of them
      Object.values(filesRef.current).forEach((fileData: FileContent) => {
        dispatch(files.actions.uploadFile(fileData))
      })
      // Reset file previews for input state
      setUploadingFiles({})
    },
    [dispatch]
  )

  React.useEffect(() => {
    filesRef.current = uploadingFiles
  }, [uploadingFiles])

  const lazyLoading = useCallback(
    (load: boolean) => {
      dispatch(messages.actions.lazyLoading({ load }))
    },
    [dispatch]
  )

  const handleFileDrop = useCallback((item: { files: any[] }) => {
    if (item) {
      updateUploadingFiles(getFilesData(item.files.map(i => i.path)))
    }
  }, [])

  const removeFilePreview = (id: string) =>
    setUploadingFiles(existingFiles => {
      delete existingFiles[id]
      const updatedExistingFiles = { ...existingFiles }
      return updatedExistingFiles
    })

  const updateUploadingFiles = (filesData: FilePreviewData) => {
    setUploadingFiles(existingFiles => {
      const updatedFiles = { ...existingFiles, ...filesData }
      return updatedFiles
    })
  }

  const handleClipboardFiles = (imageBuffer, ext, name) => {
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
      ext: ext
    })
  }

  useEffect(() => {
    ipcRenderer.on('writeTempFileReply', (_event, arg) => {
      setUploadingFiles(existingFiles => {
        const updatedFiles = {
          ...existingFiles,
          [arg.id]: {
            ext: arg.ext,
            name: arg.id,
            path: arg.path
          }
        }

        return updatedFiles
      })
    })
  }, [])

  useEffect(() => {
    ipcRenderer.on('openedFiles', (e, filesData: FilePreviewData) => {
      updateUploadingFiles(filesData)
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

  const downloadFile = useCallback((media: FileMetadata) => {
    dispatch(files.actions.downloadFile(media))
  }, [dispatch])

  const cancelDownload = useCallback((cancelDownload: CancelDownload) => {
    dispatch(files.actions.cancelDownload(cancelDownload))
  }, [dispatch])

  useEffect(() => {
    dispatch(messages.actions.resetCurrentPublicChannelCache())
  }, [currentChannelAddress])

  const channelComponentProps: ChannelComponentProps = {
    user: user,
    channelAddress: currentChannelAddress,
    channelName: currentChannelName,
    channelSettingsModal: channelSettingsModal,
    channelInfoModal: channelInfoModal,
    messages: {
      count: currentChannelMessagesCount,
      groups: currentChannelDisplayableMessages
    },
    newestMessage: newestCurrentChannelMessage,
    pendingMessages: pendingMessages,
    downloadStatuses: downloadStatusesMapping,
    lazyLoading: lazyLoading,
    onDelete: function (): void {},
    onInputChange: onInputChange,
    onInputEnter: onInputEnter,
    openUrl: openUrl,
    mutedFlag: false,
    notificationFilter: '',
    openNotificationsTab: function (): void {},
    handleFileDrop: handleFileDrop,
    openFilesDialog: openFilesDialog,
    isCommunityInitialized: isCommunityInitialized,
    handleClipboardFiles: handleClipboardFiles,
    uploadedFileModal: uploadedFileModal
  }

  const uploadFilesPreviewProps: UploadFilesPreviewsProps = {
    filesData: uploadingFiles,
    removeFile: removeFilePreview
  }

  const fileActionsProps: FileActionsProps = {
    openContainingFolder: openContainingFolder,
    downloadFile: downloadFile,
    cancelDownload: cancelDownload
  }

  return (
    <>
      {currentChannelAddress && (
        <ChannelComponent {...channelComponentProps} {...uploadFilesPreviewProps} {...fileActionsProps} />
      )}
    </>
  )
}

export default Channel
