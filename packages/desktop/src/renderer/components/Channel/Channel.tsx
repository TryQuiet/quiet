import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { identity, messages, publicChannels, connection, communities, FileContent } from '@quiet/state-manager'

import ChannelComponent, { ChannelComponentProps } from './ChannelComponent'

import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import { FilePreviewData, UploadFilesPreviewsProps } from '../widgets/channels/UploadedFilesPreviews'
import { ipcRenderer } from 'electron'
import { getFilesData } from '../../../utils/functions/fileData'

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

  const communityId = useSelector(communities.selectors.currentCommunityId)
  const initializedCommunities = useSelector(connection.selectors.initializedCommunities)

  const isCommunityInitialized = Boolean(initializedCommunities[communityId])

  const pendingMessages = useSelector(
    messages.selectors.messagesSendingStatus
  )

  const channelSettingsModal = useModal(ModalName.channelSettingsModal)
  const channelInfoModal = useModal(ModalName.channelInfo)

  const [uploadingFiles, setUploadingFiles] = React.useState<FilePreviewData>({})

  const filesRef = React.useRef<FilePreviewData>()
  const unsupportedFileModal = useModal<{
    unsupportedFiles: FileContent[]
    title: string
    sendOtherContent: string
    textContent: string
    tryZipContent: string
  }>(ModalName.unsupportedFileModal)

  const onInputChange = useCallback(
    (_value: string) => {
      // TODO https://github.com/TryQuiet/ZbayLite/issues/442
    },
    [dispatch]
  )

  const onInputEnter = useCallback(
    (message: string) => {
      if (message) {
        dispatch(messages.actions.sendMessage({ message }))
      }
      Object.values(filesRef.current).forEach(fileData => {
        dispatch(messages.actions.uploadFile(fileData))
      })
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

  const handleFileDrop = useCallback(
    (item: { files: any[] }) => {
      if (item) {
        updateUploadingFiles(getFilesData(item.files.map((i) => i.path)))
      }
    },
    []
  )

  const removeFilePreview = (id: string) => setUploadingFiles(existingFiles => {
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
    pendingMessages: pendingMessages,
    lazyLoading: lazyLoading,
    onDelete: function (): void { },
    onInputChange: onInputChange,
    onInputEnter: onInputEnter,
    mutedFlag: false,
    notificationFilter: '',
    openNotificationsTab: function (): void { },
    handleFileDrop: handleFileDrop,
    openFilesDialog: openFilesDialog,
    isCommunityInitialized: isCommunityInitialized,
    handleClipboardFiles: handleClipboardFiles
  }

  const uploadFilesPreviewProps: UploadFilesPreviewsProps = {
    filesData: uploadingFiles,
    removeFile: removeFilePreview,
    unsupportedFileModal: unsupportedFileModal
  }

  return (
    <>
      {currentChannelAddress && (
        <ChannelComponent {...channelComponentProps} {...uploadFilesPreviewProps} />
      )}
    </>
  )
}

export default Channel
