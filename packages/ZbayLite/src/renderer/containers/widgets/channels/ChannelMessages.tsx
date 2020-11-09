import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as R from "ramda";

import ChannelMessagesComponent from "../../../components/widgets/channels/ChannelMessages";
import channelSelectors from "../../../store/selectors/channel";
import dmQueueMessages from "../../../store/selectors/directMessagesQueue";
import queueMessages from "../../../store/selectors/messagesQueue";
import userSelector from "../../../store/selectors/users";
import contactsSelectors from "../../../store/selectors/contacts";
import nodeSelector from "../../../store/selectors/node";
import appSelectors from "../../../store/selectors/app";
import ownedChannelsSelectors from "../../../store/selectors/ownedChannels";
import publicChannelsSelector from "../../../store/selectors/publicChannels";
import { MessageType } from "../../../../shared/static.types";
import zcashChannels from "../../../zcash/channels";
import channelHandlers from "../../../store/handlers/channel";
import appHandlers from "../../../store/handlers/app";
import electronStore from "../../../../shared/electronStore";

// TODO: This will be removed
interface IMsg {
  firstName: string;
  publicKey: string;
  lastName: string;
  nickname: string;
  address: string;
  createdAt: number;
}
interface IMessages {
  createdAt: number;
  timestamp: number;
}

export const ChannelMessages = ({ tab, contentRect }) => {
  const [scrollPosition, setScrollPosition] = React.useState(-1);
  const [isRescanned, setIsRescanned] = React.useState(true);

  const dispatch = useDispatch();
  const qMessages = useSelector(queueMessages.queue);
  const qDmMessages = useSelector(dmQueueMessages.queue);
  const contactId = useSelector(channelSelectors.id);

  const triggerScroll = qDmMessages.size + qMessages.size > 0;

  const onLinkedChannel = (props) =>
    dispatch(channelHandlers.epics.linkChannelRedirect(props));
  const setDisplayableLimit = (arg0?: number) =>
    dispatch(channelHandlers.actions.setDisplayableLimit(arg0));
  const onRescan = () => dispatch(appHandlers.epics.restartAndRescan());

  const messages = useSelector(contactsSelectors.directMessages(contactId))
    .visibleMessages;
  const messagesLength = useSelector(
    contactsSelectors.messagesLength(contactId)
  );
  const displayableMessageLimit = useSelector(
    channelSelectors.displayableMessageLimit
  );
  const isOwner = useSelector(ownedChannelsSelectors.isOwner);
  const channelId = useSelector(channelSelectors.channelId);
  const users = useSelector(userSelector.users);
  const loader = useSelector(channelSelectors.loader);
  const publicChannels = useSelector(publicChannelsSelector.publicChannels);
  const network = useSelector(nodeSelector.network);
  const isInitialLoadFinished = useSelector(appSelectors.isInitialLoadFinished);

  useEffect(() => {
    setScrollPosition(-1);
    setIsRescanned(!electronStore.get(`channelsToRescan.${channelId}`));
  }, [channelId, contactId]);
  useEffect(() => {
    if (triggerScroll) {
      setScrollPosition(-1);
    }
  }, [triggerScroll]);
  useEffect(() => {
    if (scrollPosition === 0 && displayableMessageLimit < messagesLength) {
      setDisplayableLimit(displayableMessageLimit + 5);
    }
  }, [scrollPosition]);
  const oldestMessage = messages ? messages[messages.length - 1] : null;
  let usersRegistration = [];
  let _publicChannelsRegistration = [];
  let publicChannelsRegistration;
  if (channelId === zcashChannels.general[network].address) {
    if (oldestMessage) {
      usersRegistration = Array.from(Object.values(users)).filter(
        (msg: IMsg) => msg.createdAt >= oldestMessage.createdAt
      );
      _publicChannelsRegistration = Array.from(
        Object.values(publicChannels)
      ).filter((msg: IMessages) => msg.timestamp >= oldestMessage.createdAt);
      publicChannelsRegistration = R.clone(_publicChannelsRegistration);
      for (const ch of publicChannelsRegistration) {
        delete Object.assign(ch, { createdAt: parseInt(ch["timestamp"]) })[
          "timestamp"
        ];
      }
    }
  }
  const isNewUser = electronStore.get("isNewUser");

  return (
    <ChannelMessagesComponent
      scrollPosition={scrollPosition}
      isRescanned={isRescanned}
      isNewUser={isNewUser}
      onRescan={onRescan}
      channelId={channelId}
      messages={
        tab === 0
          ? messages
          : messages.filter((msg) => msg.type === MessageType.AD)
      }
      contactId={contactId}
      contentRect={contentRect}
      isOwner={isOwner}
      publicChannelsRegistration={publicChannelsRegistration}
      usersRegistration={usersRegistration}
      users={users}
      onLinkedChannel={onLinkedChannel}
      publicChannels={publicChannels}
      isInitialLoadFinished={loader.loading ? false : isInitialLoadFinished}
    />
  );
};

export default ChannelMessages;
