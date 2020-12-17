import React, { useEffect } from "react";
import { Scrollbars } from "react-custom-scrollbars";
import { DateTime } from "luxon";
import * as R from "ramda";
import List from "@material-ui/core/List";
import { makeStyles } from "@material-ui/core/styles";
import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'

import { MessageType } from "../../../../shared/static.types";
import ChannelMessage from "../../../containers/widgets/channels/ChannelMessage";
import WelcomeMessage from "./WelcomeMessage";
import RescanMessage from "../../../containers/widgets/channels/RescanMessage";
import ChannelItemTransferMessage from "../../../containers/widgets/channels/ItemTransferMessage";
import ChannelAdMessage from "../../../containers/widgets/channels/ListingMessage";
import MessagesDivider from "../MessagesDivider";
import UserRegisteredMessage from "./UserRegisteredMessage";
import ChannelRegisteredMessage from "./ChannelRegisteredMessage";

import { UsersStore } from "./../../../store/handlers/users";

import { DisplayableMessage } from "./../../../zbay/messages.types";

const useStyles = makeStyles((theme) => ({
  list: {
    backgroundColor: theme.palette.colors.white,
    padding: "0 4px",
    width: "100%",
  },
  link: {
    color: theme.palette.colors.lushSky,
    cursor: "pointer",
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
    fontWeight: 'bold',
  }
}));

const messagesTypesToDisplay = [1, 2, 4, 11, 41];
const welcomeMessages = {
  offer: (item, username) =>
    `This is a private conversation with @${username} about their #${item} offer. Feel free to ask them a question about the product or provide other details about your purchase!`,
  main: `Congrats! You created a channel. You can share the channel link with others by accessing the “•••” menu at the top. Once you're registered as the channel owner (this can take a few minutes) you’ll be able to publish your channel and change its settings. Have a great time!`,
};
interface IChannelMessagesProps {
  messages: Array<DisplayableMessage>;
  isOwner: boolean;
  contactId?: string;
  usersRegistration: Array<any>;
  publicChannelsRegistration: Array<any>;
  isDM?: boolean;
  isRescanned: boolean; //required?;
  isNewUser: boolean; //required?
  scrollPosition: number;
  setScrollPosition: (arg?: any) => void;
  users: UsersStore;
  onLinkedChannel: (arg0: any) => void;
  publicChannels: any;
  onRescan: () => void;
  contentRect: string;
  isInitialLoadFinished: boolean;
  channelId: string;
  name?: string;
  isConnected?: boolean
}

const renderView = (props) => {
  const style = {
    ...props.style,
    display: "flex",
    flexDirection: "column-reverse",
  };
  return <div {...props} style={style} />;
};

// TODO: scrollbar smart pagination
export const ChannelMessages: React.FC<IChannelMessagesProps> = ({
  messages,
  isOwner,
  scrollPosition,
  setScrollPosition,
  contactId,
  usersRegistration,
  publicChannelsRegistration,
  users,
  channelId,
  onLinkedChannel,
  publicChannels,
  isRescanned,
  isDM,
  onRescan,
  isNewUser,
  name,
  isConnected
}) => {

  const classes = useStyles({});
  const msgRef = React.useRef<HTMLUListElement>();
  const scrollbarRef = React.useRef<Scrollbars>();
  const [offset, setOffset] = React.useState(0);

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
    (e) => {
      setScrollPosition(e.top);
    },
    [setScrollPosition]
  );

  let groupedMessages: { [key: string]: DisplayableMessage[] };
  if (messages.length !== 0) {
    groupedMessages = R.groupBy<DisplayableMessage>((msg) => {
      return DateTime.fromFormat(
        DateTime.fromSeconds(msg.createdAt).toFormat("cccc, LLL d"),
        "cccc, LLL d"
      )
        .toSeconds()
        .toString();
    })(
      messages
        .filter((msg) => messagesTypesToDisplay.includes(msg.type))
        .concat(usersRegistration)
        .concat(publicChannelsRegistration)
        .sort((a, b) => a.createdAt - b.createdAt)
    );
  }

  useEffect(() => {
    if (
      scrollbarRef.current &&
      (scrollPosition === -1 || scrollPosition === 1)
    ) {
      scrollbarRef.current.scrollToBottom();
    }
    const eventListener = () => {
      if (scrollbarRef.current) scrollbarRef.current.scrollToBottom();
    };
    window.addEventListener("resize", eventListener);
    return () => window.removeEventListener("resize", eventListener);
  }, [channelId, groupedMessages, scrollbarRef]);

  React.useEffect(() => {
    if (msgRef.current && scrollbarRef.current) {
      const margin =
        msgRef.current.offsetHeight < scrollbarRef.current.getClientHeight()
          ? scrollbarRef.current.getClientHeight() - msgRef.current.offsetHeight
          : 0;
      setOffset(margin);
    }
  }, [msgRef, scrollbarRef]);

  return (
    <Scrollbars
      ref={scrollbarRef}
      autoHideTimeout={500}
      renderView={renderView}
      onScrollFrame={onScrollFrame}>
      <List
        disablePadding
        ref={msgRef}
        id='messages-scroll'
        className={classes.list}
        style={{ marginTop: offset }}>
        {isOwner && <WelcomeMessage message={welcomeMessages['main']} />}

        {!isRescanned && !isDM && <RescanMessage />}
        {/* {isOffer && !showLoader && (
          <WelcomeMessage message={welcomeMessages['offer'](tag, username)} />
        )} */}
        {Object.keys(groupedMessages || []).map((key, i) => {
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
                  } else {
                    return <UserRegisteredMessage message={msg} />
                  }
                }
                return <MessageComponent key={msg.id} message={msg} contactId={contactId} />
              })}
            </>
          )
        })}
        {isDM && name && (
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
        )}
        {isNewUser && (
          <WelcomeMessage
            message={
              <span>
                Welcome to Zbay! To start quickly, Zbay includes username and channel registration
                data in the app itself. To verify this data, which takes ~1 hour but may add some
                security,
                <span className={classes.link} onClick={onRescan}>
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
};

const typeToMessageComponent = {
  [MessageType.BASIC]: ChannelMessage,
  [MessageType.ITEM_BASIC]: ChannelMessage,
  [MessageType.ITEM_TRANSFER]: ChannelItemTransferMessage,
  [MessageType.TRANSFER]: ChannelItemTransferMessage,
  [MessageType.AD]: ChannelAdMessage,
};

ChannelMessages.defaultProps = {
  messages: [],
  usersRegistration: [],
  publicChannelsRegistration: [],
  isOwner: false,
  isDM: false,
};

export default ChannelMessages;
