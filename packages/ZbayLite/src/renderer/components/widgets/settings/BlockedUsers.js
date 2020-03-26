import React from 'react'
import PropTypes from 'prop-types'
import Immutable from 'immutable'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

import UserListItem from '../channelSettings/UserListItem'

const styles = theme => ({
  title: {},
  titleDiv: {
    marginBottom: 24
  },
  alignLabel: {
    marginTop: 3
  },
  labelDiv: {
    marginTop: 16,
    marginBottom: 50
  },
  itemName: {
    fontSize: 14
  },
  imageHostsDiv: {
    marginTop: 32
  }
})

export const BlockedUsers = ({ classes, blockedUsers, users, unblock }) => {
  const blockedAddresses = Array.from(blockedUsers.keys()).filter(address =>
    users.find(user => user.address === address)
  )
  return (
    <Grid container direction='column'>
      <Grid
        container
        item
        justify='space-between'
        alignItems='center'
        className={classes.titleDiv}
      >
        <Grid item className={classes.title}>
          <Typography variant='h3'>BlockedUsers</Typography>
        </Grid>
      </Grid>
      {blockedAddresses.map(address => {
        return (
          <Grid item>
            <UserListItem
              name={users.find(user => user.address === address).nickname}
              actionName='unblock'
              classes={{ name: classes.itemName }}
              prefix='@'
              action={() => {
                unblock(address)
              }}
            />
          </Grid>
        )
      })}
    </Grid>
  )
}
BlockedUsers.propTypes = {
  classes: PropTypes.object.isRequired,
  blockedUsers: PropTypes.instanceOf(Immutable.Map).isRequired,
  users: PropTypes.instanceOf(Immutable.Map).isRequired,
  unblock: PropTypes.func.isRequired
}
BlockedUsers.defaultProps = {}

export default withStyles(styles)(BlockedUsers)
