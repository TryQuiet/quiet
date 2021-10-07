import React from 'react'
import { Typography } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'rc-scrollbars'

import Modal from '../../ui/Modal/Modal'
import UserListItem from './UserListItem'

const useStyles = makeStyles(() => ({
  root: {
    padding: 32,
    height: '100%',
    width: '100%'
  },
  fullContainer: {
    width: '100%',
    height: '100%'
  },
  title: {
    marginBottom: 24
  }
}))

interface AddModeratorProps {
  open: boolean
  handleClose: () => void
  members: any[]
  users: {
    member: {
      nickname: string
    }
  }
  addModerator: (name: string) => void
}

export const AddModerator: React.FC<AddModeratorProps> = ({
  open,
  handleClose,
  members,
  users,
  addModerator
}) => {
  const classes = useStyles({})
  const channelsArray = Array.from(members)
  const options = channelsArray.map(member => {
    if (users.member) {
      return users.member.nickname
    } else {
      return member
    }
  })
  const [input, setInput] = React.useState('')
  return (
    <Modal
      open={open}
      handleClose={() => {
        handleClose()
      }}
      title=''
      fullPage
    >
      <Grid className={classes.root}>
        <Grid
          container
          justify='flex-start'
          direction='column'
          className={classes.fullContainer}
        >
          <Typography variant='h3' className={classes.title}>
            Add a moderator
          </Typography>

          <TextField
            id='outlined-helperText'
            placeholder='Search for usernames'
            variant='outlined'
            onChange={e => setInput(e.target.value)}
          />
          <AutoSizer>
            {({ width, height }) => (
              <Scrollbars
                autoHideTimeout={500}
                style={{ width: width, height: height, overflowX: 'hidden' }}
              >
                {options
                  .filter(nickname => nickname ? nickname.startsWith(input || '') : false)
                  .map(nickname => {
                    return (
                      <UserListItem
                        key={nickname}
                        disableConfirmation
                        name={nickname.substring(0, 20)}
                        actionName='Add a moderator'
                        action={() => {
                          if (
                            Object.keys(users).find(key => users[key] === nickname)
                          ) {
                            addModerator(
                              Object.keys(users).find(key => users[key] === nickname)
                            )
                          } else {
                            addModerator(nickname)
                          }
                          handleClose()
                        }}
                      />
                    )
                  })}
              </Scrollbars>
            )}
          </AutoSizer>
        </Grid>
      </Grid>
    </Modal>
  )
}

export default AddModerator
