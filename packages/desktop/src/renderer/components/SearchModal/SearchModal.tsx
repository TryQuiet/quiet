import React, { useCallback, useEffect, useState } from 'react'
import { publicChannels } from '@quiet/state-manager'
import { useDispatch, useSelector } from 'react-redux'
import SearchModalComponent from './SearchModelComponent'
import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'

const SearchModal = () => {
  const dispatch = useDispatch()
  const [channelInput, setChannelInput] = useState<string>('')
  const searchChannelModal = useModal(ModalName.searchChannelModal)

  const dynamicSearchedChannelsSelector = useSelector(
    publicChannels.selectors.dynamicSearchedChannels(channelInput)
  )

  const setCurrentChannel = useCallback(
    (address: string) => {
      dispatch(
        publicChannels.actions.setCurrentChannel({
          channelAddress: address
        })
      )
      searchChannelModal.handleClose()
    },
    [dispatch]
  )

  const handleKeyDown = useCallback<(evt: KeyboardEvent) => void>(evt => {
    if ((evt.metaKey || evt.ctrlKey) && evt.key === 'k') {
      evt.preventDefault()
      searchChannelModal.handleOpen()
    }
    if ((evt.metaKey || evt.ctrlKey) && evt.key === 't') {
      evt.preventDefault()
      searchChannelModal.handleOpen()
    }
    if (evt.key === 'Escape') {
      evt.preventDefault()
      searchChannelModal.handleClose()
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, false)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, false)
    }
  }, [handleKeyDown])

  if (dynamicSearchedChannelsSelector.length === 0) return
  return (
    <SearchModalComponent
      {...searchChannelModal}
      setCurrentChannel={setCurrentChannel}
      setChannelInput={setChannelInput}
      dynamicSearchedChannelsSelector={dynamicSearchedChannelsSelector}
      channelInput={channelInput}
    />
  )
}

export default SearchModal
