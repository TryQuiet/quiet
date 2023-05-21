import React, { FC } from 'react'

import { styled } from '@mui/material/styles'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import * as Yup from 'yup'

import { Identity } from '@quiet/state-manager'

const PREFIX = 'AccountSettingsForm'

const classes = {
  createUsernameContainer: `${PREFIX}createUsernameContainer`,
  container: `${PREFIX}container`,
  textField: `${PREFIX}textField`,
  icon: `${PREFIX}icon`,
  usernameIcon: `${PREFIX}usernameIcon`,
  link: `${PREFIX}link`,
  info: `${PREFIX}info`,
  title: `${PREFIX}title`,
  iconBackground: `${PREFIX}iconBackground`,
  iconBox: `${PREFIX}iconBox`,
  adornedEnd: `${PREFIX}adornedEnd`,
  copyInput: `${PREFIX}copyInput`,
  addressDiv: `${PREFIX}addressDiv`
}

const StyledGrid = styled(Grid)((
  {
    theme
  }
) => ({
  [`& .${classes.createUsernameContainer}`]: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 24,
    paddingRight: 24,
    borderRadius: 4,
    backgroundColor: theme.palette.colors.veryLightGray
  },

  [`& .${classes.container}`]: {
    marginTop: theme.spacing(1)
  },

  [`& .${classes.textField}`]: {
    width: '100%',
    height: 60
  },

  [`& .${classes.icon}`]: {
    width: 60,
    height: 60,
    justifyContent: 'center'
  },

  [`& .${classes.usernameIcon}`]: {
    width: 32,
    height: 32,
    justifyContent: 'center'
  },

  [`& .${classes.link}`]: {
    cursor: 'pointer',
    color: theme.palette.colors.linkBlue
  },

  [`& .${classes.info}`]: {
    color: theme.palette.colors.darkGray
  },

  [`& .${classes.title}`]: {
    marginBottom: 24
  },

  [`& .${classes.iconBackground}`]: {
    margin: 0,
    padding: 0
  },

  [`& .${classes.iconBox}`]: {
    margin: 0,
    padding: 5,
    width: 60,
    height: 56,
    backgroundColor: theme.palette.colors.gray30
  },

  [`& .${classes.adornedEnd}`]: {
    padding: 0
  },

  [`& .${classes.copyInput}`]: {
    borderRight: `1px solid ${theme.palette.colors.inputGray}`,
    paddingTop: 18,
    paddingBottom: 18,
    paddingLeft: 16
  },

  [`& .${classes.addressDiv}`]: {
    marginTop: 24
  }
}))

Yup.addMethod(Yup.mixed, 'validateMessage', function (checkNickname: (val: string) => Promise<boolean>) {
  return this.test(
    'test',
    'Sorry, username already taken. Please choose another',
    async function (value: string) {
      const isUsernameTaken = await checkNickname(value)
      return !isUsernameTaken
    }
  )
})

interface AccountSettingsProps {
  user: Identity
}

export const AccountSettingsComponent: FC<AccountSettingsProps> = ({
  user
}) => {
  return (
    <StyledGrid container direction='column'>
      <Grid item className={classes.title}>
        <Typography variant='h3'>Account</Typography>
      </Grid>
      <Grid container justifyContent='center'>
        <Grid container xs item className={classes.createUsernameContainer}>
          <Grid item xs={12}>
            <Typography variant='h4'>@{user ? user.nickname : ''}</Typography>
          </Grid>
        </Grid>
      </Grid>
    </StyledGrid>
  )
}

export default AccountSettingsComponent
