import React, { useEffect, useState } from 'react'
import classNames from 'classnames'

import { styled, ThemeProvider, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'

import { createLogger } from '../../../logger'
import ChannelTypeIcon from './ChannelTypeIcon'
import { ChannelType, UserProfile } from '@quiet/types'
import ProfilePhoto from '../../ProfilePhoto/ProfilePhoto'
import _ from 'lodash'
import {
  Autocomplete,
  AutocompleteChangeDetails,
  AutocompleteChangeReason,
  autocompleteClasses,
  createTheme,
  IconButton,
  TextField,
  Theme,
} from '@mui/material'
import { Box } from '../../ui'
import CloseIcon from '@mui/icons-material/Close'

const PREFIX = 'NewMessageGroupHeader'

const classes = {
  root: `${PREFIX}root`,
  title: `${PREFIX}title`,
  subtitle: `${PREFIX}subtitle`,
  subtitleSmall: `${PREFIX}subtitleSmall`,
  spendButton: `${PREFIX}spendButton`,
  actions: `${PREFIX}actions`,
  switch: `${PREFIX}switch`,
  tab: `${PREFIX}tab`,
  tabs: `${PREFIX}tabs`,
  selected: `${PREFIX}selected`,
  indicator: `${PREFIX}indicator`,
  descriptionDiv: `${PREFIX}descriptionDiv`,
  wrapper: `${PREFIX}wrapper`,
  iconDiv: `${PREFIX}iconDiv`,
  iconButton: `${PREFIX}iconButton`,
  bold: `${PREFIX}bold`,
  menu: `${PREFIX}menu`,
  lock: `${PREFIX}lock`,
  avatar: `${PREFIX}avatar`,
  username: `${PREFIX}username`,
  autocompleteBox: `${PREFIX}autocompleteBox`,
  autocompleteBoxSelected: `${PREFIX}autocompleteBoxSelected`,
}

const Root = styled('div')(({ theme }) => ({
  [`& .${classes.root}`]: {
    height: '75px',
    paddingLeft: 20,
    paddingRight: 24,
    borderBottom: `1px solid ${theme.palette.colors.border01}`,
  },

  [`& .${classes.title}`]: {
    fontSize: '1rem',
    lineHeight: '1.68',
  },

  [`& .${classes.subtitle}`]: {
    fontSize: '0.8rem',
  },

  [`& .${classes.subtitleSmall}`]: {
    fontSize: '0.7rem',
    lineHeight: '0.9',
  },

  [`& .${classes.spendButton}`]: {
    fontSize: 13,
  },

  [`& .${classes.actions}`]: {},

  [`& .${classes.switch}`]: {
    maxWidth: 138,
    marginRight: 18,
    borderRadius: 4,
    borderStyle: 'solid',
    borderColor: theme.palette.colors.gray03,
  },

  [`& .${classes.tab}`]: {
    fontSize: 12,
    minHeight: 22,
    width: 65,
    minWidth: 0,
    lineHeight: '18px',
    padding: 0,
    textTransform: 'none',
    backgroundColor: theme.palette.colors.gray03,
    color: theme.palette.colors.gray40,
    fontWeight: 'normal',
  },

  [`& .${classes.tabs}`]: {
    minHeight: 0,
  },

  [`& .${classes.indicator}`]: {
    maxHeight: 0,
  },

  [`& .${classes.descriptionDiv}`]: {
    top: 75,
    padding: '12px 25px 12px 20px',
    backgroundColor: theme.palette.background.default,
    boxShadow: theme.shadows[2],
  },

  [`&.${classes.wrapper}`]: {},

  [`& .${classes.iconDiv}`]: {
    marginLeft: 12,
  },

  [`& .${classes.iconButton}`]: {
    padding: 0,
  },

  [`& .${classes.bold}`]: {
    fontWeight: 500,
  },

  [`& .${classes.menu}`]: {
    padding: '20px',
    cursor: 'pointer',
  },

  [`& .${classes.lock}`]: {
    marginRight: -2,
    marginLeft: -2,
  },

  [`& .${classes.avatar}`]: {
    width: theme.componentSizes.avatar.small,
    height: theme.componentSizes.avatar.small,
    marginRight: 0,
    paddingBottom: 0,
    borderRadius: 4,
    background: theme.palette.background.paper,
    marginBottom: 0,
    fontSize: '1rem',
    lineHeight: '1.68',
  },

  [`& .${classes.username}`]: {
    fontWeight: 400,
    paddingLeft: 0,
    paddingRight: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 150,
    fontSize: '1rem',
    whiteSpace: 'nowrap',
    lineHeight: 1.68,
  },

  [`& .${classes.autocompleteBox}`]: {
    borderRadius: '8px',
    margin: '5px',
    [`&.${autocompleteClasses.option}`]: {
      padding: '8px',
    },
  },

  [`& .${classes.autocompleteBoxSelected}`]: {
    backgroundColor: theme.palette.colors.darkPurple,
  },
}))

export interface NewMessageGroupHeaderProps {
  me: UserProfile | undefined
  userProfiles: Record<string, UserProfile>
  handleClose: () => void
}

interface AutoCompleteOption {
  id: string
  label: string
  index: number
  selected: boolean
}

interface CloseButtonProps {
  handleClose: () => void
}

const CloseButton: React.FC<CloseButtonProps> = ({ handleClose }) => {
  return (
    <Grid>
      <IconButton
        className={classes.iconButton}
        onClick={event => {
          event.persist()
          handleClose()
        }}
        edge='end'
        data-testid={`new-message-close-button`}
        size='large'
      >
        <CloseIcon />
      </IconButton>
    </Grid>
  )
}

const logger = createLogger('channels:NewMessageGroupHeader')

export const NewMessageGroupHeader: React.FC<NewMessageGroupHeaderProps> = ({ userProfiles, me, handleClose }) => {
  const theme = useTheme()
  const debounce = (fn: () => void, ms: number) => {
    let timer: ReturnType<typeof setTimeout> | null
    return (_: any) => {
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => {
        timer = null
        fn.apply(this)
      }, ms)
    }
  }

  const [wrapperWidth, setWrapperWidth] = React.useState(0)

  React.useEffect(() => {
    setWrapperWidth(window.innerWidth - 300)
  })

  React.useEffect((): any => {
    const handleResize = debounce(function handleResize() {
      setWrapperWidth(window.innerWidth - 300)
    }, 200)

    window.addEventListener('resize', handleResize)

    return window.removeEventListener('resize', handleResize)
  })

  const DMProfilePhoto: React.FC<{ members: UserProfile[]; me: UserProfile | undefined }> = ({ members, me }) => {
    const notMe = _.find(members, member => member.userId !== me?.userId)
    if (notMe) {
      return (
        <ProfilePhoto
          userProfile={notMe}
          userId={notMe.userId}
          size={theme.componentSizes.avatar.small}
          style={{
            paddingBottom: 0,
            padding: 0,
            marginLeft: 0,
            marginRight: 2,
            marginBottom: 0,
            fontSize: '1rem',
            lineHeight: '1.68',
            borderRadius: 4,
          }}
        />
      )
    } else if (me) {
      return (
        <ProfilePhoto
          userProfile={me}
          userId={me.userId}
          size={theme.componentSizes.avatar.small}
          style={{
            paddingBottom: 0,
            padding: 0,
            marginLeft: 0,
            marginRight: 2,
            marginBottom: 0,
            fontSize: '1rem',
            lineHeight: '1.68',
            borderRadius: 4,
          }}
        />
      )
    }
    return <></>
  }

  return (
    <Root className={classes.wrapper}>
      <Grid container className={classes.root} justifyContent='space-between' alignItems='center' direction='row'>
        <Grid item>
          <Grid item container alignItems='center'>
            <Grid item>
              <Grid
                container
                item
                justifyContent='stretch'
                alignItems='stretch'
                alignContent='center'
                display='flex'
                flexDirection='row'
                flex={1}
              >
                <Grid item alignItems='center' flex={10}>
                  <Typography
                    noWrap
                    variant='subtitle1'
                    className={classNames({
                      [classes.title]: true,
                      [classes.bold]: true,
                    })}
                    data-testid={'new-message-header-title'}
                  >
                    New message
                  </Typography>
                </Grid>
                <Grid item flex={2}>
                  <CloseButton handleClose={handleClose} />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Root>
  )
}

export default NewMessageGroupHeader
