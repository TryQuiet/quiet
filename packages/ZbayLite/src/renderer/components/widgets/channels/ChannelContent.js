import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'
import RootRef from '@material-ui/core/RootRef'
import { withContentRect } from 'react-measure'

import { channelTypeToMessages } from '../../pages/ChannelMapping'

const styles = theme => ({
  fullHeight: {
    height: '100%',
    backgroundColor: theme.palette.colors.white
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
  offer
}) => {
  const ChannelMessages = channelTypeToMessages[channelType]
  return (
    <RootRef rootRef={measureRef}>
      <Grid item className={classes.fullHeight}>
        <ChannelMessages
          channelId={channelId}
          contactId={contactId}
          offer={offer}
          signerPubKey={signerPubKey}
          inputState={inputState}
          contentRect={contentRect}
        />
      </Grid>
    </RootRef>
  )
}
ChannelContent.propTypes = {
  classes: PropTypes.object.isRequired,
  channelId: PropTypes.string,
  contactId: PropTypes.string,
  inputState: PropTypes.number,
  channelType: PropTypes.number.isRequired,
  signerPubKey: PropTypes.string,
  measureRef: PropTypes.func.isRequired,
  contentRect: PropTypes.object.isRequired
}

export default R.compose(
  withStyles(styles),
  withContentRect('bounds'),
  React.memo
)(ChannelContent)
