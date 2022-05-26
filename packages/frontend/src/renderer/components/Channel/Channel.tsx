import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { identity, messages, publicChannels } from '@quiet/nectar'

import ChannelComponent, { ChannelComponentProps } from './ChannelComponent'

import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import { FilePreviewData, UploadFilesPreviewsProps } from '../widgets/channels/UploadedFilesPreviews'
import { ipcRenderer } from 'electron'

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

  const pendingMessages = useSelector(
    messages.selectors.messagesSendingStatus
  )

  const channelSettingsModal = useModal(ModalName.channelSettingsModal)
  const channelInfoModal = useModal(ModalName.channelInfo)

  const [initEvent, _setInitEvent] = React.useState(true)
  const [uploadingFiles, setUploadingFiles] = React.useState<FilePreviewData>({})

  const filesRef = React.useRef<FilePreviewData>()

  const onInputChange = useCallback(
    (_value: string) => {
      // TODO https://github.com/ZbayApp/ZbayLite/issues/442
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
        const files = item.files
        console.log('setting dropped files', files)
        // TODO: convert
        // setUploadingFiles(files)
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

  useEffect(() => {
    if (initEvent) {
      ipcRenderer.on('openedFiles', (e, filesData: FilePreviewData) => {
        setUploadingFiles(existingFiles => {
          const updatedFiles = { ...existingFiles, ...filesData }
          return updatedFiles
        })
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
    handleFileDrop: handleFileDrop
  }

  const uploadFilesPreviewProps: UploadFilesPreviewsProps = {
    filesData: uploadingFiles,
    removeFile: removeFilePreview
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
