import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { identity, messages, publicChannels, connection, communities, FileContent } from '@quiet/state-manager'

import ChannelComponent, { ChannelComponentProps } from './ChannelComponent'

import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import { FilePreviewData, UploadFilesPreviewsProps } from '../widgets/channels/UploadedFilesPreviews'
import { ipcRenderer } from 'electron'
import { getFileData } from '../../../utils/functions/fileData'

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

  const [initEvent, _setInitEvent] = React.useState(true)
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
        console.log('Uploading file', fileData)
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
        const files = item.files
        const droppedFiles = {}
        files.forEach((file) => {
          Object.assign(droppedFiles, getFileData(file.path))
        })
        console.log('dropping files', droppedFiles)
        updateUploadingFiles(droppedFiles)
      }
    },
    [],
  )

  const removeFilePreview = (id: string) => setUploadingFiles(existingFiles => {
    console.log('Deleting id', id)
    console.log('Existing files', existingFiles)
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

  useEffect(() => {
    if (initEvent) {
      ipcRenderer.on('openedFiles', (e, filesData: FilePreviewData) => {
        updateUploadingFiles(filesData)
      })
    }
  }, [initEvent])

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
    onDelete: function (): void {},
    onInputChange: onInputChange,
    onInputEnter: onInputEnter,
    mutedFlag: false,
    notificationFilter: '',
    openNotificationsTab: function (): void { },
    handleFileDrop: handleFileDrop,
    isCommunityInitialized: isCommunityInitialized
  }

  const uploadFilesPreviewProps: UploadFilesPreviewsProps = {
    filesData: uploadingFiles,
    removeFile: removeFilePreview,
    unsupportedFileModal: unsupportedFileModal
  }

  return (
    <>
      {currentChannelAddress && (
        <ChannelComponent {...channelComponentProps} {...uploadFilesPreviewProps}/>
      )}
    </>
  )
}

export default Channel
