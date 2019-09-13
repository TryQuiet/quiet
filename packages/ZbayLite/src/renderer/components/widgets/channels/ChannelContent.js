import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'
import RootRef from '@material-ui/core/RootRef'
import { withContentRect } from 'react-measure'

import ChannelMessages from '../../../containers/widgets/channels/ChannelMessages'

const styles = {
  fullHeight: {
    height: '100%',
    backgroundImage: 'linear-gradient(318deg, #ffffff, #eae5ed)'
  }
}

// TODO: filter by spent
export const ChannelContent = ({
  classes,
  channelId,
  inputState,
  contactId,
  signerPubKey,
  measureRef,
  contentRect
}) => {
  return (
    <RootRef rootRef={measureRef}>
      <Grid item className={classes.fullHeight}>
        <ChannelMessages
          channelId={channelId}
          contactId={contactId}
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
  signerPubKey: PropTypes.string,
  measureRef: PropTypes.func.isRequired,
  contentRect: PropTypes.object.isRequired
}

export default R.compose(
  withStyles(styles),
  withContentRect('bounds')
)(ChannelContent)
