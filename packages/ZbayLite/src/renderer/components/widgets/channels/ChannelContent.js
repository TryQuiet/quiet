import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'
import RootRef from '@material-ui/core/RootRef'
import { withContentRect } from 'react-measure'

import { channelTypeToMessages } from '../../pages/ChannelMapping'
import InviteMentionInfo from './ChannelInput/InviteMentionInfo'
import { CHANNEL_TYPE } from '../../pages/ChannelTypes'

const styles = theme => ({
  fullHeight: {
    height: '100%',
    backgroundColor: theme.palette.colors.white
  },
  mentionsDiv: {
    marginBottom: 8
  }
})

// TODO: filter by spent
export const ChannelContent = ({
  classes,
  channelId,
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
          mentions.get(channelId) &&
          mentions.get(channelId).map(mention => (
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
ChannelContent.propTypes = {
  classes: PropTypes.object.isRequired,
  channelId: PropTypes.string,
  contactId: PropTypes.string,
  inputState: PropTypes.number,
  tab: PropTypes.number,
  channelType: PropTypes.number.isRequired,
  signerPubKey: PropTypes.string,
  measureRef: PropTypes.func.isRequired,
  sendInvitation: PropTypes.func.isRequired,
  removeMention: PropTypes.func.isRequired,
  contentRect: PropTypes.object.isRequired,
  mentions: PropTypes.object.isRequired
}

export default R.compose(
  withStyles(styles),
  withContentRect('bounds'),
  React.memo
)(ChannelContent)
