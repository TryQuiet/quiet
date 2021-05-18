import React from 'react'
import PropTypes from 'prop-types'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'rc-scrollbars'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

import UserListItem from './UserListItem'

const styles = theme => ({
  title: {
    marginBottom: 24
  }
})

export const BlockedUsers = ({ classes, blockedUsers, unblockUser, users }) => {
  return (
    <AutoSizer>
      {({ width, height }) => (
        <Scrollbars
          autoHideTimeout={500}
          style={{ width: width, height: height, overflowX: 'hidden' }}
        >
          <Grid container direction='column'>
            <Grid item className={classes.title}>
              <Typography variant='h3'>Blocked users</Typography>
            </Grid>
            {blockedUsers.map(pubKey => {
              const userData = users[pubKey]
              return (
                <Grid item key={pubKey}>
                  <UserListItem
                    name={
                      userData ? userData.nickname : pubKey.substring(0, 15)
                    }
                    actionName='Unblock'
                    action={() => unblockUser(pubKey)}
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
BlockedUsers.propTypes = {
  classes: PropTypes.object.isRequired,
  blockedUsers: PropTypes.array.isRequired,
  users: PropTypes.array.isRequired,
  unblockUser: PropTypes.func.isRequired
}
BlockedUsers.defaultProps = {}

export default withStyles(styles)(BlockedUsers)
