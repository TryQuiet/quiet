import React from 'react'
import PropTypes from 'prop-types'
import Immutable from 'immutable'
import { Scrollbars } from 'react-custom-scrollbars'
import { DateTime } from 'luxon'
import * as R from 'ramda'
import List from '@material-ui/core/List'
import { withStyles } from '@material-ui/core/styles'

import { messageType } from '../../../../shared/static'
import ChannelMessage from '../../../containers/widgets/channels/ChannelMessage'
import WelcomeMessage from './WelcomeMessage'
import RescanMessage from '../../../containers/widgets/channels/RescanMessage'
import ChannelItemTransferMessage from '../../../containers/widgets/channels/ItemTransferMessage'
import ChannelAdMessage from '../../../containers/widgets/channels/ListingMessage'
import MessagesDivider from '../MessagesDivider'
import UserRegisteredMessage from './UserRegisteredMessage'
import ChannelRegisteredMessage from './ChannelRegisteredMessage'

const styles = theme => ({
  list: {
    backgroundColor: theme.palette.colors.white,
    padding: '0 4px',
    width: '100%'
  }
})

const messagesTypesToDisplay = [1, 2, 4, 11, 41]
const welcomeMessages = {
  offer: (item, username) =>
    `This is a private conversation with @${username} about their #${item} offer. Feel free to ask them a question about the product or provide other details about your purchase!`,
  main: `Congrats! You created a channel. You can make your channel public or share the channel link with others by accessing the “•••” menu at the top. You’ll also find a bunch of other settings. Have a great time!`
}
// TODO: scrollbar smart pagination
export const ChannelMessages = ({
  classes,
  messages,
  contentRect,
  isOwner,
  setScrollPosition,
  scrollPosition,
  contactId,
  isOffer,
  usersRegistration,
  publicChannelsRegistration,
  users,
  onLinkedChannel,
  publicChannels,
  isInitialLoadFinished,
  isRescanned,
  isDM
}) => {
  const scrollbarRef = React.useRef()
  // const [lastScrollHeight, setLastScrollHeight] = React.useState(0)
  // if (scrollbarRef.current) {
  //   console.log(scrollbarRef.current.getValues())
  // }
  const getScrollbarRef = ref => {
    if (ref !== null) {
      scrollbarRef.current = ref
      if (scrollPosition === -1 || scrollPosition === 1) {
        ref.scrollToBottom()
      }
    }
  }
  const msgRef = React.useRef()
  const [offset, setOffset] = React.useState(0)
  const updateSize = () => {
    setOffset(0)
  }
  React.useEffect(() => {
    window.addEventListener('resize', updateSize)
  }, [])
  // TODO work on scroll behavior
  // React.useEffect(() => {
  //   setTimeout(() => {
  //     setLastScrollHeight(scrollbarRef.current.getScrollHeight())
  //   }, 0)
  // }, [contactId])
  // React.useEffect(() => {
  //   console.log('tick')

  //   if (scrollbarRef.current) {
  //     console.log(scrollbarRef.current)
  //     const currentHeight = scrollbarRef.current.getScrollHeight()
  //     console.log(lastScrollHeight)
  //     console.log(currentHeight)
  //     console.log(`######################`)

  //     setLastScrollHeight(currentHeight)
  //     scrollbarRef.current.scrollTop(currentHeight - lastScrollHeight)
  //   }
  // }, [messages.size])
  React.useEffect(() => {
    if (msgRef.current && scrollbarRef.current) {
      const margin =
        msgRef.current.offsetHeight < scrollbarRef.current.getClientHeight()
          ? scrollbarRef.current.getClientHeight() - msgRef.current.offsetHeight
          : 0
      setOffset(margin)
    }
  })
  // let username
  // let tag
  // if (isOffer) {
  //   const msg = messages.toJS()[0]
  //   tag = msg.message.tag
  //   username = msg.sender.username
  //   username = msg.sender.username
  // }
  let groupedMessages = []
  if (messages.size !== 0) {
    groupedMessages = R.groupBy(msg => {
      return DateTime.fromFormat(
        DateTime.fromSeconds(msg.createdAt).toFormat('cccc, LLL d'),
        'cccc, LLL d'
      ).toSeconds()
    })(
      messages
        .filter(msg => messagesTypesToDisplay.includes(msg.type))
        .concat(usersRegistration)
        .concat(publicChannelsRegistration)
        .sortBy(o => o.createdAt)
    )
  }
  return (
    <Scrollbars
      ref={getScrollbarRef}
      autoHideTimeout={500}
      onScrollFrame={e => {
        setScrollPosition(e.top)
      }}
    >
      <List
        disablePadding
        ref={msgRef}
        id='messages-scroll'
        className={classes.list}
        style={{ marginTop: offset }}
      >
        {isOwner && <WelcomeMessage message={welcomeMessages['main']} />}
        {!isRescanned && !isDM && <RescanMessage />}
        {/* {isOffer && !showLoader && (
          <WelcomeMessage message={welcomeMessages['offer'](tag, username)} />
        )} */}
        {Array.from(groupedMessages).map(args => {
          const today = DateTime.utc()
          const groupName = DateTime.fromSeconds(args[0]).toFormat(
            'cccc, LLL d'
          )
          const displayTitle = DateTime.fromSeconds(args[0]).hasSame(
            today,
            'day'
          )
            ? 'Today'
            : groupName
          return (
            <>
              <MessagesDivider title={displayTitle} />
              {args[1].map(msg => {
                const MessageComponent = typeToMessageComponent[msg.type]
                if (!msg.type) {
                  if (msg.keys) {
                    return (
                      <ChannelRegisteredMessage
                        message={msg}
                        address={
                          users.get(msg.owner)
                            ? users.get(msg.owner).address
                            : ''
                        }
                        username={
                          users.get(msg.owner)
                            ? users.get(msg.owner).nickname
                            : `anon${msg.owner.substring(0, 16)}`
                        }
                        onChannelClick={() => {
                          onLinkedChannel(publicChannels.get(msg.name))
                        }}
                      />
                    )
                  } else {
                    return <UserRegisteredMessage message={msg} />
                  }
                }
                return (
                  <MessageComponent
                    key={msg.id}
                    message={msg}
                    contactId={contactId}
                  />
                )
              })}
            </>
          )
        })}
      </List>
    </Scrollbars>
  )
}

const typeToMessageComponent = {
  [messageType.BASIC]: ChannelMessage,
  [messageType.ITEM_BASIC]: ChannelMessage,
  [messageType.ITEM_TRANSFER]: ChannelItemTransferMessage,
  [messageType.TRANSFER]: ChannelItemTransferMessage,
  [messageType.AD]: ChannelAdMessage
}

ChannelMessages.propTypes = {
  classes: PropTypes.object.isRequired,
  usersRegistration: PropTypes.array.isRequired,
  publicChannelsRegistration: PropTypes.array.isRequired,
  contactId: PropTypes.string,
  isOwner: PropTypes.bool.isRequired,
  isDM: PropTypes.bool,
  isInitialLoadFinished: PropTypes.bool.isRequired,
  isOffer: PropTypes.bool.isRequired,
  messages: PropTypes.instanceOf(Immutable.List).isRequired,
  contentRect: PropTypes.shape({
    bounds: PropTypes.shape({
      height: PropTypes.number
    }).isRequired
  })
}

ChannelMessages.defaultProps = {
  messages: Immutable.List(),
  usersRegistration: [],
  publicChannelsRegistration: [],
  isOwner: false,
  isOffer: false,
  isDM: false
}

export default React.memo(withStyles(styles)(ChannelMessages))
