import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { Typography } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'rc-scrollbars'

import Modal from '../../ui/Modal/Modal'
import UserListItem from './UserListItem'

const styles = theme => ({
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
})
export const AddModerator = ({
  classes,
  open,
  handleClose,
  members,
  users,
  addModerator
}) => {
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
                            users.findKey(user => user.nickname === nickname)
                          ) {
                            addModerator(
                              users.findKey(user => user.nickname === nickname)
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

AddModerator.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  addModerator: PropTypes.func.isRequired,
  members: PropTypes.instanceOf(Array).isRequired,
  users: PropTypes.object.isRequired
}
export default R.compose(React.memo, withStyles(styles))(AddModerator)
