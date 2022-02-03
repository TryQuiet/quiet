import React from 'react'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'rc-scrollbars'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'

import UserListItem from './UserListItem'

const useStyles = makeStyles(() => ({
  title: {
    marginBottom: 24
  }
}))

interface BlockedUsersProps {
  blockedUsers: string[]
  unblockUser: (key: string) => void
  users: { [pubKey: string]: { nickname: string } }
}

export const BlockedUsers: React.FC<BlockedUsersProps> = ({ blockedUsers, unblockUser, users }) => {
  const classes = useStyles({})
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

export default BlockedUsers
