import React from 'react'
import PropTypes from 'prop-types'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'react-custom-scrollbars'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import Immutable from 'immutable'

import UserListItem from './UserListItem'

const styles = theme => ({
  title: {},
  addModerator: {
    color: theme.palette.colors.lushSky,
    '&:hover': {
      color: theme.palette.colors.trueBlack
    },
    cursor: 'pointer'
  },
  titleDiv: {
    marginBottom: 24
  }
})

export const Moderators = ({
  classes,
  moderators,
  users,
  openAddModerator,
  removeModerator
}) => {
  return (
    <AutoSizer>
      {({ width, height }) => (
        <Scrollbars
          autoHideTimeout={500}
          style={{ width: width, height: height, overflowX: 'hidden' }}
        >
          <Grid container direction='column'>
            <Grid
              container
              item
              justify='space-between'
              alignItems='center'
              className={classes.titleDiv}
            >
              <Grid item className={classes.title}>
                <Typography variant='h3'>Moderators</Typography>
              </Grid>
              <Grid
                item
                className={classes.addModerator}
                onClick={openAddModerator}
              >
                <Typography variant='body2'>+ Add a moderator</Typography>
              </Grid>
            </Grid>
            {moderators.map(pubKey => {
              const userData = users.get(pubKey)
              return (
                <Grid item>
                  <UserListItem
                    name={
                      userData ? userData.nickname : pubKey.substring(0, 15)
                    }
                    actionName='Remove'
                    action={() => removeModerator(pubKey)}
                  />
                </Grid>
              )
            })}
          </Grid>
        </Scrollbars>
      )}
    </AutoSizer>
  )
}
Moderators.propTypes = {
  classes: PropTypes.object.isRequired,
  moderators: PropTypes.instanceOf(Immutable.List).isRequired,
  users: PropTypes.instanceOf(Immutable.Map).isRequired,
  openAddModerator: PropTypes.func.isRequired,
  removeModerator: PropTypes.func.isRequired
}
Moderators.defaultProps = {}

export default withStyles(styles)(Moderators)
