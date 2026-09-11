import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Dictionary } from '@reduxjs/toolkit'
import List from '@mui/material/List'
import { styled } from '@mui/material/styles'

import FloatingDate from './FloatingDate'
import DateDivider from '../DateDivider'
import BasicMessageComponent from './BasicMessage'
import SpinnerLoader from '../../ui/Spinner/SpinnerLoader'

import {
  CancelDownload,
  DisplayableMessage,
  DownloadStatus,
  FileMetadata,
  MessagesDailyGroups,
  MessageSendingStatus,
  MessageType,
} from '@quiet/types'

import { UseModalType } from '../../../containers/hooks'
import { HandleOpenModalType } from '../userLabel/UserLabel.types'
import { createLogger } from '../../../logger'

const PREFIX = 'ChannelMessagesComponent'

const FETCHING_CHANNEL_MESSAGES = 'Fetching channel messages...'
const DELETING_CHANNEL_MESSAGE = 'Deleting channel...'

const CHANNEL_UI = {
  FLOATING_DATE_HIDE_DELAY: 1000, // ms to wait before hiding floating date
  FLOATING_DATE_OFFSET: 23, // px from top for floating date position
  PAGE_SCROLL_OVERLAP: 0.9, // percentage of viewport to scroll for PageUp/Down
  SPINNER_SIZE: 40, // px size of loading spinner
} as const

const classes = {
  spinner: `${PREFIX}spinner`,
  scroll: `${PREFIX}scroll`,
  list: `${PREFIX}list`,
  link: `${PREFIX}link`,
  item: `${PREFIX}item`,
  bold: `${PREFIX}bold`,
}

const StyledRoot = styled('div')(({ theme }) => ({
  [`& .${classes.spinner}`]: {
    top: '50%',
    textAlign: 'center',
    position: 'relative',
    transform: 'translate(0, -50%)',
  },
  [`&.${classes.scroll}`]: {
    overflow: 'scroll',
    overflowX: 'hidden',
    height: '100%',
  },
  [`& .${classes.list}`]: {
    backgroundColor: theme.palette.background.default,
    width: '100%',
  },
  [`& .${classes.link}`]: {
    color: theme.palette.primary.main,
    cursor: 'pointer',
  },
  [`& .${classes.item}`]: {
    backgroundColor: theme.palette.grey[100],
    padding: '9px 16px',
  },
  [`& .${classes.bold}`]: {
    fontWeight: 'bold',
  },
}))

interface Props {
  messages?: MessagesDailyGroups
  pendingMessages?: Dictionary<MessageSendingStatus>
  downloadStatuses?: Dictionary<DownloadStatus>
  maxAutodownloadSizeBytes: number
  scrollbarRef: React.RefObject<HTMLDivElement>
  onScroll: () => void
  openUrl: (url: string) => void
  openContainingFolder?: (path: string) => void
  downloadFile?: (media: FileMetadata) => void
  cancelDownload?: (cancelDownload: CancelDownload) => void
  uploadedFileModal?: UseModalType<{ src: string }>
  onMathMessageRendered?: () => void
  pendingGeneralChannelRecreation?: boolean
  unregisteredUsernameModalHandleOpen: HandleOpenModalType
  duplicatedUsernameModalHandleOpen: HandleOpenModalType
  allowEmpty: boolean
}

const logger = createLogger('ChannelMessages')

export const ChannelMessagesComponent: React.FC<Props> = ({
  messages = {},
  pendingMessages = {},
  downloadStatuses = {},
  maxAutodownloadSizeBytes,
  allowEmpty,
  scrollbarRef,
  onScroll,
  uploadedFileModal,
  openUrl,
  openContainingFolder,
  downloadFile,
  cancelDownload,
  onMathMessageRendered,
  pendingGeneralChannelRecreation = false,
  unregisteredUsernameModalHandleOpen,
  duplicatedUsernameModalHandleOpen,
}) => {
  const scrollTimerRef = useRef<number | null>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const [isScrolling, setIsScrolling] = useState(false)
  const [userHasInitiatedScroll, setUserHasInitiatedScroll] = useState(false)
  const [currentDay, setCurrentDay] = useState<string>('')
  const isAutoScrollingRef = useRef(false)
  const prevMessagesRef = useRef(messages)

  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const spinnerMessage = pendingGeneralChannelRecreation ? DELETING_CHANNEL_MESSAGE : FETCHING_CHANNEL_MESSAGES

  Object.keys(messages).forEach(day => {
    if (!dayRefs.current[day]) {
      dayRefs.current[day] = null
    }
  })

  const updateFloatingDate = useCallback(() => {
    logger.warn('Messages', messages)

    if (!scrollbarRef.current) return
    const containerRect = scrollbarRef.current.getBoundingClientRect()
    const floatPos = containerRect.top + CHANNEL_UI.FLOATING_DATE_OFFSET

    let bestDay = ''
    let bestTop = Number.NEGATIVE_INFINITY

    for (const day of Object.keys(dayRefs.current)) {
      const node = dayRefs.current[day]
      if (!node) continue
      const rect = node.getBoundingClientRect()
      if (rect.top <= floatPos && rect.top > bestTop) {
        bestTop = rect.top
        bestDay = day
      }
    }

    setCurrentDay(bestDay)
  }, [scrollbarRef])

  const handleScroll = useCallback(() => {
    onScroll()
    if (!scrollbarRef.current) return

    if (isAutoScrollingRef.current) {
      return
    }

    if (!userHasInitiatedScroll) return

    updateFloatingDate()

    setIsScrolling(true)
    if (scrollTimerRef.current) {
      window.clearTimeout(scrollTimerRef.current)
    }
    scrollTimerRef.current = window.setTimeout(() => {
      setIsScrolling(false)
    }, CHANNEL_UI.FLOATING_DATE_HIDE_DELAY)
  }, [onScroll, updateFloatingDate, userHasInitiatedScroll])

  const handleWheel = useCallback(() => {
    setUserHasInitiatedScroll(true)
  }, [])

  useEffect(() => {
    const handleKeyDown = (evt: KeyboardEvent) => {
      if (!scrollbarRef.current) return

      if (evt.key === 'PageUp' || evt.key === 'PageDown') {
        evt.preventDefault()

        const scrollAmount = scrollbarRef.current.clientHeight * CHANNEL_UI.PAGE_SCROLL_OVERLAP

        setUserHasInitiatedScroll(true)
        scrollbarRef.current.scrollTop += evt.key === 'PageUp' ? -scrollAmount : scrollAmount
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [scrollbarRef])

  useEffect(() => {
    const el = scrollbarRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll)
    el.addEventListener('wheel', handleWheel)
    return () => {
      el.removeEventListener('scroll', handleScroll)
      el.removeEventListener('wheel', handleWheel)
    }
  }, [scrollbarRef, handleScroll, handleWheel])

  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) {
        window.clearTimeout(scrollTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (messages !== prevMessagesRef.current) {
      isAutoScrollingRef.current = true

      const timer = setTimeout(() => {
        isAutoScrollingRef.current = false
      }, 300)

      prevMessagesRef.current = messages

      return () => clearTimeout(timer)
    }
  }, [messages])

  const _setDatePillValue = (messages: MessagesDailyGroups, _currentDay: string) => {
    const days = Object.keys(messages)
    if (days.length === 1) {
      const messagesForDay = Object.values(messages)[0]
      if (
        messagesForDay.length === 1 &&
        messagesForDay[0].length === 1 &&
        messagesForDay[0][0].type === MessageType.Empty
      ) {
        return 'This is the start of your conversation'
      }
    }

    return _currentDay
  }

  return (
    <StyledRoot className={classes.scroll} ref={scrollbarRef} data-testid='channelContent'>
      {Object.values(messages).length < 1 &&
        (!allowEmpty ? (
          <SpinnerLoader
            size={CHANNEL_UI.SPINNER_SIZE}
            message={spinnerMessage}
            className={classes.spinner}
            color='black'
          />
        ) : (
          <></>
        ))}

      <FloatingDate title={currentDay} isVisible={userHasInitiatedScroll && isScrolling} />

      <List disablePadding className={classes.list} id='messages-scroll' ref={listRef}>
        {Object.keys(messages).map(day => (
          <div
            key={day}
            ref={el => {
              dayRefs.current[day] = el
            }}
          >
            <DateDivider title={_setDatePillValue(messages, day)} />
            {messages[day].map(items => {
              let id: string | undefined = undefined
              for (const data of items) {
                if (data.type !== MessageType.Empty) {
                  id = data.id
                  break
                }
              }
              if (id == undefined) return <></>
              return (
                <BasicMessageComponent
                  key={id}
                  messages={items}
                  pendingMessages={pendingMessages}
                  downloadStatuses={downloadStatuses}
                  maxAutodownloadSizeBytes={maxAutodownloadSizeBytes}
                  uploadedFileModal={uploadedFileModal}
                  openUrl={openUrl}
                  openContainingFolder={openContainingFolder}
                  downloadFile={downloadFile}
                  cancelDownload={cancelDownload}
                  onMathMessageRendered={onMathMessageRendered}
                  unregisteredUsernameModalHandleOpen={unregisteredUsernameModalHandleOpen}
                  duplicatedUsernameModalHandleOpen={duplicatedUsernameModalHandleOpen}
                />
              )
            })}
          </div>
        ))}
      </List>
    </StyledRoot>
  )
}

export { FETCHING_CHANNEL_MESSAGES, DELETING_CHANNEL_MESSAGE }
export default ChannelMessagesComponent
