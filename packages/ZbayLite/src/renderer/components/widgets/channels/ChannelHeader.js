import React from 'react'
import PropTypes from 'prop-types'
import Immutable from 'immutable'
import * as R from 'ramda'

import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import SearchIcon from '@material-ui/icons/Search'

import ChannelMenuAction from '../../../containers/widgets/channels/ChannelMenuAction'
import ChannelInfoModal from '../../../containers/widgets/channels/ChannelInfoModal'
import SpentFilterAction from './SpentFilterAction'
import IconButton from '../../ui/IconButton'

const styles = theme => ({
  root: {
    minHeight: '100%',
    padding: `0 ${2 * theme.spacing.unit}px`
  },
  title: {
    fontSize: '0.9rem',
    lineHeight: '1.66'
  },
  subtitle: {
    fontSize: '0.64rem',
    lineHeight: '1.66'
  },
  spendButton: {
    fontSize: 13
  },
  iconButton: {
    padding: 6
  },
  actions: {
    width: 180
  }
})

// TODO: [reafactoring] we should have channel stats for unread and members count
export const ChannelHeader = ({ classes, channel }) => (
  <Grid container alignItems='center' justify='space-between' className={classes.root} direction='row'>
    <Grid item>
      <Typography variant='subtitle1' className={classes.title}>
        {channel.get('name')}
      </Typography>
      {
        !R.isNil(channel.get('members')) ? (
          <Typography variant='caption' className={classes.subtitle}>
            {channel.get('members').toFormat(0)}
          </Typography>
        ) : null
      }
    </Grid>
    <Grid item container className={classes.actions} justify='space-between' alignItems='center'>
      <Grid item>
        <SpentFilterAction />
      </Grid>
      <Grid item>
        <IconButton className={classes.iconButton}>
          <SearchIcon />
        </IconButton>
      </Grid>
      <Grid item>
        <ChannelMenuAction />
        <ChannelInfoModal />
      </Grid>
    </Grid>
  </Grid>
)

ChannelHeader.propTypes = {
  classes: PropTypes.object.isRequired,
  channel: PropTypes.instanceOf(Immutable.Map).isRequired
}

ChannelHeader.defaultProps = {
  channel: Immutable.Map()
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ChannelHeader)
