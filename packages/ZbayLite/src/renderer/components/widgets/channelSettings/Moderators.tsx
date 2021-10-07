import React from 'react'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'rc-scrollbars'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'

import UserListItem from './UserListItem'
import { User } from '@zbayapp/nectar/lib/sagas/users/users.slice'

const useStyles = makeStyles((theme) => ({
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
}))

interface ModeratorsProps {
  moderators: any[]
  users: User
  openAddModerator: () => void
  removeModerator: (key: string) => void
}

export const Moderators: React.FC<ModeratorsProps> = ({
  moderators,
  users,
  openAddModerator,
  removeModerator
}) => {
  const classes = useStyles({})
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
              const userData = users[pubKey]
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

export default Moderators
