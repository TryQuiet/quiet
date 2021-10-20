import React from 'react'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'

import UserListItem from '../channelSettings/UserListItem'
import { User } from '@zbayapp/nectar/lib/sagas/users/users.slice'
import { Contact } from '../../../store/handlers/contacts'

const useStyles = makeStyles(() => ({
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
}))

interface BlockedUsersProps {
  blockedUsers: User[]
  users: Contact[]
  unblock: (address: string) => void
}

export const BlockedUsers: React.FC<BlockedUsersProps> = ({ blockedUsers, users, unblock }) => {
  const classes = useStyles({})
  const blockedAddresses = Array.from(Object.keys(blockedUsers)).filter(address =>
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

export default BlockedUsers
