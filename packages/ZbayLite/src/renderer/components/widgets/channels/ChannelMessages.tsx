import React, { useEffect } from 'react'
import { Scrollbars } from 'rc-scrollbars'
import { DateTime } from 'luxon'
import * as R from 'ramda'
import List from '@material-ui/core/List'
import { makeStyles } from '@material-ui/core/styles'

import ChannelMessage from '../../../containers/widgets/channels/ChannelMessage'
import MessagesDivider from '../MessagesDivider'

import { loadNextMessagesLimit } from '../../../../shared/static'
import { DisplayableMessage } from '@zbayapp/nectar/lib/sagas/publicChannels/publicChannels.types'

const useStyles = makeStyles(theme => ({
  list: {
    backgroundColor: theme.palette.colors.white,
    padding: '0 4px',
    width: '100%'
  },
  link: {
    color: theme.palette.colors.lushSky,
    cursor: 'pointer'
  },
  info: {
    color: theme.palette.colors.trueBlack,
    letterSpacing: '0.4px'
  },
  root: {
    width: '100%',
    padding: '8px 16px'
  },
  item: {
    backgroundColor: theme.palette.colors.gray03,
    padding: '9px 16px'
  },
  bold: {
    fontWeight: 'bold'
  }
}))

interface IChannelMessagesProps {
  messages?: any[]
  isOwner?: boolean
  contactId?: string
  usersRegistration?: any[]
  publicChannelsRegistration?: any[]
  isDM?: boolean
  isNewUser?: boolean // required?
  scrollPosition?: number
  setScrollPosition?: (arg?: any) => void
  newMessagesLoading?: boolean
  setNewMessagesLoading?: (arg: boolean) => void
  users?: any
  onLinkedChannel?: (arg0: any) => void
  publicChannels?: any
  onRescan?: () => void
  contentRect?: {
    bounds: {
      height: number
    }
  }
  isInitialLoadFinished?: boolean
  channelId?: string
  name?: string
  isConnected?: boolean
  isDev?: boolean
}

// const renderView = props => {
// Note: flex breaks scroll handle position
//   const style = {
//     ...props.style,
//     display: 'flex',
//     flexDirection: 'column-reverse'
//   }
// return <div {...props} style={style} />
// }

// TODO: scrollbar smart pagination
export const ChannelMessages: React.FC<IChannelMessagesProps> = ({
  messages,
  scrollPosition,
  setScrollPosition,
  newMessagesLoading,
  setNewMessagesLoading,
  usersRegistration,
  publicChannelsRegistration,
  channelId
}) => {
  const classes = useStyles({})
  const msgRef = React.useRef<HTMLUListElement>()
  const scrollbarRef = React.useRef<Scrollbars>()

  // TODO work on scroll behavior
  // React.useEffect(() => {
  //   setTimeout(() => {
  //     setLastScrollHeight(scrollbarRef.current.getScrollHeight())
  //   }, 0)
  // }, [contactId])
  // React.useEffect(() => {
  //   if (scrollbarRef.current) {
  //     const currentHeight = scrollbarRef.current.getScrollHeight()
  //     setLastScrollHeight(currentHeight)
  //     scrollbarRef.current.scrollTop(currentHeight - lastScrollHeight)
  //   }
  // }, [messages.size])

  const onScrollFrame = React.useCallback(
    e => {
      setScrollPosition(e.top)
    },
    [setScrollPosition]
  )

  let groupedMessages: { [key: string]: DisplayableMessage[] }
  if (messages.length !== 0) {
    groupedMessages = R.groupBy<any>(msg => {
      if (msg.createdAt.split('').indexOf(',') === -1) {
        return 'Today'
      }
      return msg.createdAt.split(',')[0]
    })(
      messages
        .concat(usersRegistration)
        .concat(publicChannelsRegistration)
        .sort((a, b) => Math.floor(a.createdAt) - Math.floor(b.createdAt)).reverse()
    )
  }

  useEffect(() => {
    /** Scroll to the bottom on entering the channel or resizing window */
    if (scrollbarRef.current && (scrollPosition === -1 || scrollPosition === 1)) {
      setTimeout(() => {
        scrollbarRef.current.scrollToBottom()
      })
    }
    const eventListener = () => {
      if (scrollbarRef.current) scrollbarRef.current.scrollToBottom()
    }
    window.addEventListener('resize', eventListener)
    return () => window.removeEventListener('resize', eventListener)
  }, [channelId, groupedMessages, scrollbarRef])

  // useEffect(() => {
  //   /** Note: This was used before (it pulls messages to the bottom of channel) but currently it enlarges rendering view in scrollbar
  //    * creating empty space above already loaded messages */
  //   if (msgRef.current && scrollbarRef.current) {
  //     const margin =
  //       msgRef.current.offsetHeight < scrollbarRef.current.getClientHeight()
  //         ? scrollbarRef.current.getClientHeight() - msgRef.current.offsetHeight
  //         : 0
  //     setOffset(margin)
  //   }
  // }, [msgRef, scrollbarRef])

  useEffect(() => {
    /** Set new position of a scrollbar handle */
    if (scrollbarRef.current && newMessagesLoading) {
      const oneMessageHeight = scrollbarRef.current.getScrollHeight() / messages.length
      const newMessagesBlockHeight = oneMessageHeight * loadNextMessagesLimit
      setTimeout(() => {
        scrollbarRef.current.scrollTop(newMessagesBlockHeight)
      })
      setNewMessagesLoading(false)
    }
  }, [newMessagesLoading])

  return (
    <Scrollbars
      ref={scrollbarRef}
      autoHideTimeout={500}
      // renderView={renderView}
      onScrollFrame={onScrollFrame}>
      <List
        disablePadding
        ref={msgRef}
        id='messages-scroll'
        className={classes.list}>
        {/* // style={{ marginTop: offset }}> */}
        {Object.keys(groupedMessages || []).map(key => {
          const messagesArray = groupedMessages[key]
          const today = DateTime.utc()
          const groupName = key
          const displayTitle = DateTime.fromSeconds(parseInt(key)).hasSame(today, 'day')
            ? 'Today'
            : groupName
          return (
            <>
              <MessagesDivider title={displayTitle} />
              {messagesArray.map(msg => {
                const MessageComponent = ChannelMessage
                return <MessageComponent key={msg.id} message={msg} />
              })}
            </>
          )
        })}
      </List>
    </Scrollbars>
  )
}

ChannelMessages.defaultProps = {
  messages: [],
  usersRegistration: [],
  publicChannelsRegistration: [],
  isOwner: false,
  isDM: false
}

export default ChannelMessages
