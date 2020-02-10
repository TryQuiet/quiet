import React from 'react'
import * as R from 'ramda'
import Jdenticon from 'react-jdenticon'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import { withStyles } from '@material-ui/core/styles'
import { Grid, Typography } from '@material-ui/core'

const styles = theme => ({
  root: {
    paddingTop: 10,
    paddingLeft: 16
  },
  avatarDiv: {
    maxHeight: 18,
    maxWidth: 18,
    borderRadius: 4,
    backgroundColor: theme.palette.colors.grayBackgroud
  },
  alignAvatar: {
    width: 17,
    height: 17,
    marginLeft: 1,
    marginTop: 1
  },
  data: {
    marginLeft: 9
  },
  highlight: {
    backgroundColor: theme.palette.colors.lushSky,
    color: theme.palette.colors.white
  },
  name: {
    marginTop: -4
  },
  caption: {
    lineHeight: '18px',
    fontSize: 12,
    letterSpacing: 0.4,
    color: 'rgba(0,0,0,0.6)'
  },
  captionHighlight: {
    color: 'rgba(255,255,255,0.6)'
  }
})

export const MentionElement = ({
  classes,
  name,
  participant,
  highlight,
  onMouseEnter,
  channelName,
  onClick
}) => {
  return (
    <Grid
      container
      className={classNames({
        [classes.root]: true,
        [classes.highlight]: highlight
      })}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <Grid item className={classes.avatarDiv}>
        <div className={classes.alignAvatar}>
          <Jdenticon size='17' value={name} />
        </div>
      </Grid>
      <Grid item xs className={classes.data}>
        <Typography variant='h5' className={classes.name}>
          {name}
        </Typography>
        {participant && (
          <Typography
            variant='body2'
            className={classNames({
              [classes.caption]: true,
              [classes.captionHighlight]: highlight
            })}
          >{`Participant in ${channelName}`}</Typography>
        )}
      </Grid>
    </Grid>
  )
}
MentionElement.propTypes = {
  classes: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
  onMouseEnter: PropTypes.func.isRequired,
  channelName: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  participant: PropTypes.bool,
  highlight: PropTypes.bool
}
MentionElement.defaultProps = {
  participant: false,
  highlight: false
}
export default R.compose(React.memo, withStyles(styles))(MentionElement)
