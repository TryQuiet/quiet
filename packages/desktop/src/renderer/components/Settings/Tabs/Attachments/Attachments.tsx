import React, { type FC, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { settings } from '@quiet/state-manager'

import { AttachmentsComponent } from './AttachmentsComponent'

export const Attachments: FC = () => {
  const maxAutoDownloadBytes = useSelector(settings.selectors.maxAutodownloadBytes)
  const dispatch = useDispatch()
  const setMaxAutodownloadBytes = useCallback(
    (option: number) => {
      dispatch(settings.actions.setMaxAutodownloadBytes(option))
    },
    [dispatch]
  )

  return (
    <AttachmentsComponent
      maxAutodownloadBytes={maxAutoDownloadBytes}
      setMaxAutodownloadBytes={setMaxAutodownloadBytes}
    />
  )
}
