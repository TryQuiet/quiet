import React from 'react'
import * as Yup from 'yup'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'
import { Identity } from '@zbayapp/nectar/lib/sagas/identity/identity.slice'

const useStyles = makeStyles((theme) => ({
  createUsernameContainer: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 24,
    paddingRight: 24,
    borderRadius: 4,
    backgroundColor: theme.palette.colors.veryLightGray
  },
  container: {
    marginTop: theme.spacing(1)
  },
  textField: {
    width: '100%',
    height: 60
  },
  icon: {
    width: 60,
    height: 60,
    justifyContent: 'center'
  },
  usernameIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center'
  },
  link: {
    cursor: 'pointer',
    color: theme.palette.colors.linkBlue
  },
  info: {
    color: theme.palette.colors.darkGray
  },
  title: {
    marginBottom: 24
  },
  iconBackground: {
    margin: 0,
    padding: 0
  },
  iconBox: {
    margin: 0,
    padding: 5,
    width: 60,
    height: 56,
    backgroundColor: theme.palette.colors.gray30
  },
  adornedEnd: {
    padding: 0
  },
  copyInput: {
    borderRight: `1px solid ${theme.palette.colors.inputGray}`,
    paddingTop: 18,
    paddingBottom: 18,
    paddingLeft: 16
  },
  addressDiv: {
    marginTop: 24
  }
}))

Yup.addMethod(Yup.mixed, 'validateMessage', function (checkNickname) {
  return this.test(
    'test',
    'Sorry, username already taken. Please choose another',
    async function (value: string) {
      const isUsernameTaken = await checkNickname(value)
      return !isUsernameTaken
    }
  )
})

interface AccountSettingsFormProps {
  user: Identity
}

export const AccountSettingsForm: React.FC<AccountSettingsFormProps> = ({
  user
}) => {
  const classes = useStyles({})
  return (
    <Grid container direction='column'>
      <Grid item className={classes.title}>
        <Typography variant='h3'>Account</Typography>
      </Grid>
      <Grid container justify='center'>
        <Grid container xs item className={classes.createUsernameContainer}>
          <Grid item xs={12}>
            <Typography variant='h4'>@{user ? user.zbayNickname : ''}</Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default AccountSettingsForm
