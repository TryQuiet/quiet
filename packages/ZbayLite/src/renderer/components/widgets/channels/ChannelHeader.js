import React from 'react'
import PropTypes from 'prop-types'
import Immutable from 'immutable'
import * as R from 'ramda'

import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import ChannelInfoModal from '../../../containers/widgets/channels/ChannelInfoModal'
import DirectMessagesInfoModal from '../../../containers/widgets/channels/DirectMessagesInfoModal'
import { CHANNEL_TYPE } from '../../../components/pages/ChannelTypes'
import ChannelMenuAction from '../../../containers/widgets/channels/ChannelMenuAction'
import OfferMenuActions from '../../../containers/widgets/channels/OfferMenuActions'
import DirectMessagesMenuActions from '../../../containers/widgets/channels/DirectMessagesMenuActions'

const styles = theme => ({
  root: {
    minHeight: '100%',
    paddingTop: 16,
    paddingBottom: 36,
    paddingLeft: 20,
    paddingRight: 24
  },
  title: {
    fontSize: '1rem',
    lineHeight: '1.66'
  },
  subtitle: {
    fontSize: '0.8rem'
  },
  spendButton: {
    fontSize: 13
  },
  actions: {
    width: 180
  }
})

export const channelTypeToActions = {
  [CHANNEL_TYPE.OFFER]: OfferMenuActions,
  [CHANNEL_TYPE.DIRECT_MESSAGE]: DirectMessagesMenuActions,
  [CHANNEL_TYPE.NORMAL]: ChannelMenuAction
}

// TODO: [reafactoring] we should have channel stats for unread and members count

export const ChannelHeader = ({ classes, channel, directMessage, offer, members, channelType }) => {
  const ActionsMenu = channelTypeToActions[channelType]
  return (
    <Grid
      container
      alignItems='center'
      justify='space-between'
      className={classes.root}
      direction='row'
    >
      <Grid item>
        <Typography variant='subtitle1' className={classes.title}>
          {channel.get('name')}
        </Typography>
        {!R.isNil(members) ? (
          <Typography variant='caption' className={classes.subtitle}>
            {members.size} Members
          </Typography>
        ) : null}
      </Grid>
      <Grid item container className={classes.actions} justify='flex-end' alignItems='center'>
        <Grid item>
          <ActionsMenu directMessage={directMessage} offer={offer} />
          {directMessage ? <DirectMessagesInfoModal /> : <ChannelInfoModal />}
        </Grid>
      </Grid>
    </Grid>
  )
}

ChannelHeader.propTypes = {
  classes: PropTypes.object.isRequired,
  directMessage: PropTypes.bool.isRequired,
  channelType: PropTypes.number.isRequired,
  channel: PropTypes.instanceOf(Immutable.Map).isRequired,
  members: PropTypes.instanceOf(Set)
}

ChannelHeader.defaultProps = {
  channel: Immutable.Map(),
  directMessage: false,
  channelType: 3
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ChannelHeader)
