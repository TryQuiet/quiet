import React from 'react'

import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import RootRef from '@material-ui/core/RootRef'

import { channelTypeToMessages } from '../../pages/ChannelMapping'
import InviteMentionInfo from './ChannelInput/InviteMentionInfo'
import { CHANNEL_TYPE } from '../../pages/ChannelTypes'
import { Mentions } from '../../../store/handlers/mentions'

const useStyles = makeStyles((theme) => ({
  fullHeight: {
    height: '100%',
    backgroundColor: theme.palette.colors.white
  },
  mentionsDiv: {
    marginBottom: 8
  }
}))

interface ChannelMessagesProps {
  inputState: string
  contactId: string
  signerPubKey: string
  measureRef: () => void
  contentRect: string
  channelType: CHANNEL_TYPE
  offer: string
  tab: (arg: number) => void
  mentions: { channelId: Mentions[] }
  removeMention: (name: string) => void
  sendInvitation: (name: string) => void
}

export const ChannelContent: React.FC<ChannelMessagesProps> = ({
  inputState,
  contactId,
  signerPubKey,
  measureRef,
  contentRect,
  channelType,
  offer,
  tab,
  mentions,
  removeMention,
  sendInvitation
}) => {
  const classes = useStyles({})
  const ChannelMessages = channelTypeToMessages[channelType]
  return (
    <Grid item container direction='column' className={classes.fullHeight}>
      <Grid item xs>
        <RootRef rootRef={measureRef}>
          <ChannelMessages
            tab={tab}
            contactId={contactId}
            offer={offer}
            signerPubKey={signerPubKey}
            inputState={inputState}
            contentRect={contentRect}
          />
        </RootRef>
      </Grid>
      <Grid item className={classes.mentionsDiv}>
        {channelType === CHANNEL_TYPE.NORMAL &&
          mentions.channelId &&
          mentions.channelId.map(mention => (
            <Grid item>
              <InviteMentionInfo
                nickname={mention.nickname}
                timeStamp={mention.timeStamp}
                handleClose={() => {
                  removeMention(mention.nickname)
                }}
                handleInvite={() => {
                  sendInvitation(mention.nickname)
                }}
              />
            </Grid>
          ))}
      </Grid>
    </Grid>
  )
}

export default ChannelContent
