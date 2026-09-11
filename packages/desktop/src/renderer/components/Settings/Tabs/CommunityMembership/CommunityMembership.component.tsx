import React, { FC, useEffect, useState } from 'react'
import { styled } from '@mui/material/styles'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { List } from '@mui/material'
import { UserProfile } from '@quiet/types'
import UserSearchFuzzy from '../../../widgets/userSearch/UserSearchFuzzySearch'
import { DmChannelUserData } from '../../../Sidebar/DirectMessagesPanel/DirectMessagesPanel'
import CommunityMemberListItem from './CommunityMemberListItem'
import { SelectableListOption } from '../../../widgets/userSearch/UserSearch.types'
import { createLogger } from '../../../../logger'

const PREFIX = 'CommunityMembership'

const classes = {
  title: `${PREFIX}title`,
  titleDiv: `${PREFIX}titleDiv`,
  link: `${PREFIX}link`,
  button: `${PREFIX}button`,
  bold: `${PREFIX}bold`,
  componentContainer: `${PREFIX}componentContainer`,
  memberContainer: `${PREFIX}memberContainer`,
  eyeIcon: `${PREFIX}eyeIcon`,
  wrapper: `${PREFIX}wrapper`,
  divider: `${PREFIX}divider`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`& .${classes.title}`]: {},
  [`& .${classes.wrapper}`]: {
    maxWidth: '100%',
  },
  [`& .${classes.titleDiv}`]: {
    marginBottom: 24,
  },
  [`& .${classes.link}`]: {
    marginTop: '16px',
    fontSize: '13px',
    letterSpacing: '-0.4px',
    overflowWrap: 'break-word',
    inlineSize: 'calc(100% - 40px);',
  },
  [`& .${classes.button}`]: {
    marginTop: 24,
    textTransform: 'none',
    width: '100%',
    height: 60,
    color: theme.palette.colors.white,
    backgroundColor: theme.palette.colors.quietBlue,
    '&:hover': {
      opacity: 0.7,
      backgroundColor: theme.palette.colors.quietBlue,
    },
  },
  [`& .${classes.bold}`]: {
    fontWeight: 'bold',
  },

  [`& .${classes.componentContainer}`]: {
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'baseline',
    alignContent: 'stretch',
    maxWidth: '375px',
    position: 'relative',
    gap: 16,
  },

  [`& .${classes.memberContainer}`]: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'baseline',
    alignContent: 'stretch',
    maxWidth: '375px',
    position: 'relative',
    flex: 1,
  },

  [`& .${classes.eyeIcon}`]: {
    margin: '5px',
    top: '8px',
    position: 'absolute',
    right: '0',
  },

  [`& .${classes.divider}`]: {
    marginTop: 8,
    marginBottom: 8,
    borderBottom: `1px solid ${theme.palette.colors.border01}`,
  },
}))

export interface CommunityMembershipComponentProps {
  userProfiles: Record<string, UserProfile>
  me: UserProfile | undefined
  connectedPeers: string[]
  openUserProfilePanel: (userProfile: UserProfile | undefined) => void
  open: boolean
}

const LOGGER = createLogger('CommunityMembershipComponent')

const getUserDataForUser = (
  userProfile: UserProfile,
  me: UserProfile | undefined,
  connectedPeers: string[]
): DmChannelUserData | undefined => {
  if (me != null && userProfile.userId === me.userId) {
    return {
      connected: true,
      user: userProfile,
    }
  }

  const connected =
    userProfile.userData != null &&
    userProfile.userData.peerId != null &&
    connectedPeers.includes(userProfile.userData.peerId)
  return {
    connected,
    user: userProfile,
  }
}

const SEARCH_PLACEHOLDER_TEXT = 'Search for users in your community'

export const CommunityMembershipComponent: FC<CommunityMembershipComponentProps> = ({
  userProfiles,
  me,
  connectedPeers,
  openUserProfilePanel,
  open,
}) => {
  LOGGER.debug('Creating community membership component')
  const [visibleUsers, setVisibleUsers] = useState<UserProfile[]>([])
  const [options, setOptions] = useState<SelectableListOption[]>([])

  const _initializeOptions = () => {
    LOGGER.debug('Initializing membership options', Object.values(userProfiles).length)
    const initialOptions: SelectableListOption[] = []
    let index = 0
    for (const user of Object.values(userProfiles)) {
      const mutable = true
      const selected = false
      const hide = false
      initialOptions.push({ label: user.nickname, id: user.userId, selected, index, mutable, hide })
      index++
    }
    LOGGER.debug('Initialized membership options', initialOptions.length)
    setOptions(initialOptions)
  }

  useEffect(() => {
    if (open) {
      _initializeOptions()
      setVisibleUsers(Object.values(userProfiles))
    } else {
      setOptions([])
      setVisibleUsers([])
    }
  }, [open])

  const handleUserSearchInputChange = (visibleOptions: SelectableListOption[]) => {
    setVisibleUsers(visibleOptions.map(option => userProfiles[option.id]))
  }

  return (
    <StyledGrid container direction='column'>
      <Grid container item justifyContent='space-between' alignItems='center' className={classes.titleDiv}>
        <Grid item className={classes.title}>
          <Typography variant='h3' data-testid='community-membership-title'>
            Community membership
          </Typography>
        </Grid>
      </Grid>
      <Grid item container className={classes.componentContainer}>
        <Grid item display={'flex'} flex={1} data-testid='community-membership-search'>
          <UserSearchFuzzy
            me={me}
            options={options}
            setOptions={setOptions}
            placeholderText={SEARCH_PLACEHOLDER_TEXT}
            handleInputChange={handleUserSearchInputChange}
          />
        </Grid>
        <Grid item container display={'flex'} flexDirection={'column'}>
          <List disablePadding data-testid='community-membership-list'>
            {visibleUsers.map(user => {
              const userData = getUserDataForUser(user, me, connectedPeers)
              return (
                <Grid container>
                  <Grid container item>
                    <CommunityMemberListItem
                      userData={userData}
                      me={me}
                      openUserProfile={openUserProfilePanel}
                      selected={false}
                    />
                  </Grid>
                  <Grid container item className={classes.divider}>
                    <li />
                  </Grid>
                </Grid>
              )
            })}
          </List>
        </Grid>
      </Grid>
    </StyledGrid>
  )
}
