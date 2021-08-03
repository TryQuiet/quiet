import React, { useEffect } from 'react'
import { Scrollbars } from 'rc-scrollbars'
import { DateTime } from 'luxon'
import * as R from 'ramda'
import List from '@material-ui/core/List'
import { makeStyles } from '@material-ui/core/styles'

import { MessageType } from '../../../../shared/static.types'
import ChannelMessage from '../../../containers/widgets/channels/ChannelMessage'
import WelcomeMessage from './WelcomeMessage'
import ChannelItemTransferMessage from '../../../containers/widgets/channels/ItemTransferMessage'
import ChannelAdMessage from '../../../containers/widgets/channels/ListingMessage'
import MessagesDivider from '../MessagesDivider'
import UserRegisteredMessage from './UserRegisteredMessage'
import ChannelRegisteredMessage from './ChannelRegisteredMessage'

import { UsersStore } from './../../../store/handlers/users'

import { DisplayableMessage } from './../../../zbay/messages.types'
import { loadNextMessagesLimit } from '../../../../shared/static'

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

const messagesTypesToDisplay = [1, 2, 4, 11, 41]
const welcomeMessages = {
  offer: (item, username) =>
    `This is a private conversation with @${username} about their #${item} offer. Feel free to ask them a question about the product or provide other details about your purchase!`,
  main:
    "Congrats! You created a channel. You can share the channel link with others by accessing the “•••” menu at the top. Once you're registered as the channel owner (this can take a few minutes) you’ll be able to publish your channel and change its settings. Have a great time!"
}
interface IChannelMessagesProps {
  messages: DisplayableMessage[]
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
  users?: UsersStore
  onLinkedChannel?: (arg0: any) => void
  publicChannels?: any
  onRescan?: () => void
  contentRect?: string
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
  isOwner,
  scrollPosition,
  setScrollPosition,
  newMessagesLoading,
  setNewMessagesLoading,
  contactId,
  usersRegistration,
  publicChannelsRegistration,
  users,
  channelId,
  onLinkedChannel,
  publicChannels,
  isNewUser,
  isDev
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
    groupedMessages = R.groupBy<DisplayableMessage>(msg => {
      const d = new Date(msg.createdAt * 1000)
      d.setHours(0)
      d.setMinutes(0)
      d.setSeconds(0)
      return (d.getTime() / 1000).toString()
    })(
      messages
        .filter(msg => messagesTypesToDisplay.includes(msg.type))
        .concat(usersRegistration)
        .concat(publicChannelsRegistration)
        .sort((a, b) => Math.floor(a.createdAt) - Math.floor(b.createdAt))
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
        {isOwner && <WelcomeMessage message={welcomeMessages.main} />}
        {/* {isOffer && !showLoader && (
          <WelcomeMessage message={welcomeMessages['offer'](tag, username)} />
        )} */}
        {Object.keys(groupedMessages || []).map(key => {
          const messagesArray = groupedMessages[key]
          const today = DateTime.utc()
          const groupName = DateTime.fromSeconds(parseInt(key)).toFormat('cccc, LLL d')
          const displayTitle = DateTime.fromSeconds(parseInt(key)).hasSame(today, 'day')
            ? 'Today'
            : groupName
          return (
            <>
              <MessagesDivider title={displayTitle} />
              {messagesArray.map(msg => {
                const MessageComponent = typeToMessageComponent[msg.type]
                if (!msg.type) {
                  if (msg.keys) {
                    return (
                      <ChannelRegisteredMessage
                        message={msg}
                        address={users[msg.owner] ? users[msg.owner].address : ''}
                        username={
                          users[msg.owner]
                            ? users[msg.owner].nickname
                            : `anon${msg.owner.substring(0, 16)}`
                        }
                        onChannelClick={() => {
                          onLinkedChannel(publicChannels[msg.name])
                        }}
                      />
                    )
                  } else if (!isDev && msg.nickname.startsWith('dev99')) {
                    return
                  } else {
                    return <UserRegisteredMessage message={msg} />
                  }
                }
                return <MessageComponent key={msg.id} message={msg} contactId={contactId} />
              })}
            </>
          )
        })}
        {/* {isDM && name && (
          <Grid container className={classes.root}>
            <Grid item xs className={classes.item}>
              <Typography variant='caption' className={classes.info}>
                {isConnected ? (
                  <span>
                    Connected to <span className={classes.bold}>@{name}</span> via Tor. Your message
                    will be sent directly, not via Zcash memo.
                  </span>
                ) : (
                  <span>
                      Disconnected from <span className={classes.bold}>@{name}</span>. Your message
                    will be sent via Zcash memo.
                  </span>
                )}
              </Typography>
            </Grid>
          </Grid>
        )} */}
        {isNewUser && (
          <WelcomeMessage
            message={
              <span>
                Welcome to Zbay! To start quickly, Zbay includes username and channel registration
                data in the app itself. To verify this data, which takes ~1 hour but may add some
                security,
                <span className={classes.link}>
                  {' '}
                  restart & re-sync
                </span>
                . Otherwise, say hi and introduce yourself!
              </span>
            }
          />
        )}
      </List>
    </Scrollbars>
  )
}

const typeToMessageComponent = {
  [MessageType.BASIC]: ChannelMessage,
  [MessageType.ITEM_BASIC]: ChannelMessage,
  [MessageType.ITEM_TRANSFER]: ChannelItemTransferMessage,
  [MessageType.TRANSFER]: ChannelItemTransferMessage,
  [MessageType.AD]: ChannelAdMessage
}

ChannelMessages.defaultProps = {
  messages: [],
  usersRegistration: [],
  publicChannelsRegistration: [],
  isOwner: false,
  isDM: false
}

export default ChannelMessages
