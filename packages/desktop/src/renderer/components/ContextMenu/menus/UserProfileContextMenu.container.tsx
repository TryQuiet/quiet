import React, { FC, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'rc-scrollbars'
import { styled, Button, Grid, List, Typography, useTheme } from '@mui/material'

import { findDmChannelWithMembers } from '@quiet/common'
import { identity, publicChannels, users } from '@quiet/state-manager'
import { UserProfile } from '@quiet/types'

import { useContextMenu } from '../../../../hooks/useContextMenu'
import { ContextMenu, ContextMenuItemList } from '../ContextMenu.component'
import { MenuName } from '../../../../const/MenuNames.enum'
import ProfilePhoto from '../../ProfilePhoto/ProfilePhoto'
import { createLogger } from '../../../logger'
import { webUtils } from 'electron'

const logger = createLogger('userProfileContextMenu:container')

/** Stands in before any profile has been opened, so the closed drawer is still mounted. */
const EMPTY_PROFILE: UserProfile = { userId: '', nickname: '' }

const PREFIX = 'UserProfileContextMenu'

const classes = {
  profilePhotoContainer: `${PREFIX}profilePhotoContainer`,
  profilePhoto: `${PREFIX}profilePhoto`,
  profilePhotoError: `${PREFIX}profilePhotoError`,
  nickname: `${PREFIX}nickname`,
  editUsernameField: `${PREFIX}editUsernameField`,
  editUsernameFieldLabel: `${PREFIX}editUsernameFieldLabel`,
  editPhotoButton: `${PREFIX}editPhotoButton`,
  messageButton: `${PREFIX}messageButton`,
}

/** Figma BnANosC1KGMUvm8oU2Dr0i, Profile-view 849:7386. */
const AVATAR_SIZE = 160
const BUTTON_HEIGHT = 32
const MESSAGE = 'Message'
/**
 * Secondary button colours. The border is a mid grey that reads against either background, so it
 * is the design's #B3B3B3 in both themes; the label and the fill follow the theme, because the
 * design's white fill and near-black label are the dark theme's colours exactly inverted.
 */
const BUTTON_BORDER = '#B3B3B3'
/** The design's hover is #F7F7F7 — a wash a shade off the light background. */
const BUTTON_HOVER_LIGHT = '#F7F7F7'
const BUTTON_HOVER_DARK = 'rgba(255,255,255,0.08)'

const StyledContextMenuContent = styled(Grid)(({ theme }) => ({
  zIndex: 9002,
  flex: 1,

  [`& .${classes.profilePhotoContainer}`]: {
    padding: '24px 16px 16px 16px',
  },

  // Avatar 160 at a twelfth of its size in radius, name 28/34 — Figma BnANosC1KGMUvm8oU2Dr0i,
  // Profile-view 849:7386. It was 96 at radius 8 with a 16px name, a whole step small.
  [`& .${classes.profilePhoto}`]: {
    width: `${AVATAR_SIZE}px`,
    height: `${AVATAR_SIZE}px`,
    borderRadius: `${AVATAR_SIZE / 12}px`,
    marginBottom: '16px',
  },

  [`& .${classes.profilePhotoError}`]: {
    marginTop: '16px',
    textAlign: 'center',
    display: 'hidden',
  },

  [`& .${classes.profilePhotoError}.show`]: {
    display: 'inline-block',
  },

  [`& .${classes.nickname}`]: {
    fontSize: '28px',
    lineHeight: '34px',
    fontStyle: 'normal',
    fontWeight: '400',
    textAlign: 'center',
    overflowWrap: 'anywhere',
  },

  /**
   * Design library Button, Small + Secondary (3505:10206): 32 tall, radius 16, 6/12 padding, a
   * 14/20 label — white with a #B3B3B3 border, going to #F7F7F7 on hover. Not purple: purple is
   * the Primary variant, and MUI's `outlined` paints both border and label with the theme's
   * primary unless told otherwise. Its padding and minWidth are overridden for the same reason —
   * inherited, they make the button taller and wider than the design's 103x32.
   */
  [`& .${classes.messageButton}`]: {
    height: BUTTON_HEIGHT,
    minHeight: BUTTON_HEIGHT,
    minWidth: 0,
    padding: '6px 12px',
    borderRadius: BUTTON_HEIGHT / 2,
    fontSize: 14,
    lineHeight: '20px',
    textTransform: 'none',
    marginTop: 16,
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.default,
    border: `1px solid ${BUTTON_BORDER}`,
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? BUTTON_HOVER_DARK : BUTTON_HOVER_LIGHT,
      border: `1px solid ${BUTTON_BORDER}`,
    },
  },

  [`& .${classes.editUsernameFieldLabel}`]: {
    margin: '0px 16px 8px 16px',
    fontSize: '14px',
    fontWeight: '400',
    fontFamily: 'Rubik, sans-serif',
  },

  [`& .${classes.editUsernameField}`]: {
    background: theme.palette.background.paper,
    margin: '0px 16px',
    padding: '16px',
    border: `1px solid ${theme.palette.colors.border02}`,
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '400',
    fontFamily: 'Rubik, sans-serif',
  },

  [`& .${classes.editPhotoButton}`]: {
    background: 'inherit',
    padding: '6px 12px',
    borderRadius: '16px',
    border: `1px solid ${theme.palette.colors.border02}`,
    fontSize: '14px',
    fontWeight: '400',
    textTransform: 'none',
    fontFamily: 'Rubik, sans-serif',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.background.paper,
    },
  },
}))

export interface UserProfileContextMenuArgs {
  userProfile?: UserProfile
}

/**
 * Context menu view that switches between user profile subviews.
 */
export const UserProfileContextMenu: FC = () => {
  const dispatch = useDispatch()
  const contextMenu = useContextMenu<UserProfileContextMenuArgs>(MenuName.UserProfile)
  const userProfile = contextMenu.userProfile
  const [route, setRoute] = useState('userProfile')
  const myUserProfile = useSelector(users.selectors.myUserProfile)
  const channels = useSelector(publicChannels.selectors.publicChannels)
  // Kept so the panel still has something to draw while it is sliding closed.
  const [lastProfile, setLastProfile] = useState<UserProfile | undefined>(undefined)
  useEffect(() => {
    if (userProfile != null) setLastProfile(userProfile)
  }, [userProfile])

  /**
   * The panel slides in and out, which needs the drawer mounted on both sides of the change. This
   * component is mounted for the app's whole life but returned null until a profile arrived, so
   * the drawer appeared already open and MUI had no closed-to-open transition to run — the panel
   * simply blinked into place. Holding the last profile keeps it rendered while it animates away,
   * and the empty stand-in keeps it rendered (closed) before the first profile is ever opened.
   *
   * Everything below reads this rather than the live value, or the panel would change what it says
   * — losing Edit profile, gaining Message — midway through sliding out.
   */
  const shownProfile = userProfile ?? lastProfile ?? EMPTY_PROFILE
  const isMyProfile = myUserProfile != null && myUserProfile.userId === shownProfile.userId

  /**
   * A DM is created together with its first message, so there is nothing to create here. Either the
   * conversation already exists, in which case open it, or the composer opens with this person
   * already chosen and the message they type is what brings the DM into being.
   */
  const handleMessage = () => {
    if (myUserProfile == null || shownProfile.userId === '') {
      logger.error('Cannot start a DM without both parties')
      return
    }
    const existing = findDmChannelWithMembers([shownProfile.userId], myUserProfile.userId, channels)
    contextMenu.handleClose()
    if (existing != null) {
      dispatch(publicChannels.actions.setCurrentChannel({ channelId: existing.id }))
      dispatch(publicChannels.actions.setNewMessageOpen({ isOpen: false }))
      return
    }
    dispatch(publicChannels.actions.setNewMessageOpen({ isOpen: true, recipientIds: [shownProfile.userId] }))
  }
  // Use a selector to make the user profile view reactive
  const userProfileSelector = useSelector(users.selectors.getUserProfileById(userProfile?.userId || ''))

  const views: Map<string, JSX.Element> = new Map()
  views.set(
    'userProfile',
    <UserProfileMenuProfileView
      username={shownProfile.nickname}
      userId={shownProfile.userId}
      userProfile={userProfileSelector || shownProfile}
      contextMenu={contextMenu}
      setRoute={setRoute}
      isMyProfile={isMyProfile}
      handleMessage={handleMessage}
    />
  )
  if (isMyProfile) {
    views.set('userProfile/edit', <UserProfileMenuEditComponent setRoute={setRoute} />)
  }
  return views.get(route) || (views.get('userProfile') as JSX.Element)
}

/**
 * Context menu view that allows the user to view their user profile
 * and associated actions (e.g. edit profile)
 */
export const UserProfileMenuProfileComponent: FC<{ setRoute: (route: string) => void }> = ({ setRoute }) => {
  const userProfile = useSelector(users.selectors.myUserProfile)
  const username = userProfile?.nickname || ''
  const userId = userProfile?.userId || ''
  const contextMenu = useContextMenu(MenuName.UserProfile)

  return (
    <UserProfileMenuProfileView
      username={username}
      userId={userId}
      userProfile={userProfile}
      contextMenu={contextMenu}
      setRoute={setRoute}
    />
  )
}

export interface UserProfileMenuProfileViewProps {
  username: string
  userId: string
  userProfile?: UserProfile
  contextMenu: {
    visible: boolean
    handleOpen: (args?: object | undefined) => any
    handleClose: () => any
  }
  setRoute: (route: string) => void
  isMyProfile?: boolean
  /** Starts or opens the DM with this person; absent on your own profile. */
  handleMessage?: () => void
}

export const UserProfileMenuProfileView: FC<UserProfileMenuProfileViewProps> = ({
  username,
  userId,
  userProfile,
  contextMenu,
  setRoute,
  isMyProfile = false,
  handleMessage,
}) => {
  const [contentRef, setContentRef] = useState<HTMLDivElement | null>(null)
  const scrollbarRef = useRef(null)
  const [offset, setOffset] = useState(0)
  const theme = useTheme()

  const adjustOffset = () => {
    if (!contentRef?.clientWidth) return
    if (contentRef.clientWidth > 800) {
      setOffset((contentRef.clientWidth - 800) / 2)
    }
  }

  React.useEffect(() => {
    if (contentRef) {
      window.addEventListener('resize', adjustOffset)
      adjustOffset()
    }
  }, [contentRef])

  return (
    <ContextMenu title='Profile' {...contextMenu}>
      <StyledContextMenuContent
        container
        ref={ref => {
          if (ref) {
            setContentRef(ref)
          }
        }}
      >
        <Grid item xs>
          <AutoSizer>
            {({ width, height }) => {
              const maxWidth = width > 632 ? 632 : width
              return (
                <Scrollbars
                  ref={scrollbarRef}
                  autoHideTimeout={500}
                  style={{ width: maxWidth + offset, height: height }}
                >
                  <Grid container direction='column'>
                    <Grid container direction='column' className={classes.profilePhotoContainer} alignItems='center'>
                      <ProfilePhoto
                        userProfile={userProfile}
                        userId={userId}
                        className={classes.profilePhoto}
                        size={96}
                      />
                      <Typography className={classes.nickname} data-testid={'userProfileNickname'}>
                        {username}
                      </Typography>
                      {/* One surface. Your own profile keeps Message as well as Edit profile: a DM
                          with just yourself is a real conversation in Quiet — the e2e suite covers
                          "Owner creates DM with self" — so it serves as a note to self. */}
                      {handleMessage != null && (
                        <Button
                          className={classes.messageButton}
                          variant='outlined'
                          onClick={handleMessage}
                          data-testid={'userProfileMessage'}
                        >
                          {MESSAGE}
                        </Button>
                      )}
                    </Grid>
                    {isMyProfile && (
                      <Grid item>
                        <ContextMenuItemList
                          items={[
                            {
                              title: 'Edit profile',
                              action: () => setRoute('userProfile/edit'),
                            },
                          ]}
                        />
                      </Grid>
                    )}
                  </Grid>
                </Scrollbars>
              )
            }}
          </AutoSizer>
        </Grid>
      </StyledContextMenuContent>
    </ContextMenu>
  )
}

/**
 * A button that shows a file input dialog for attaching a profile
 * photo and passes the chosen file to a callback.
 */
export const EditPhotoButton: FC<{ onChange: (photo?: File) => void }> = ({ onChange }) => {
  const fileInput = React.useRef<HTMLInputElement>(null)

  return (
    <button className={classes.editPhotoButton} onClick={evt => fileInput.current?.click()}>
      <Typography variant='body2' style={{ lineHeight: '20px' }}>
        Edit photo
      </Typography>
      <input
        ref={fileInput}
        type='file'
        data-testid='user-profile-edit-photo-input'
        onChange={evt => onChange(evt.target.files?.[0])}
        // Value needs to be cleared to allow the user
        // to upload the same image more than once
        onClick={evt => {
          ;(evt.target as HTMLInputElement).value = ''
        }}
        accept='image/png, image/jpeg'
        hidden
      />
    </button>
  )
}

/**
 * Context menu view that allows the user to edit their user profile
 */
export const UserProfileMenuEditComponent: FC<{ setRoute: (route: string) => void }> = ({ setRoute }) => {
  const dispatch = useDispatch()
  const userProfile = useSelector(users.selectors.myUserProfile)
  const username = userProfile?.nickname || ''
  const userId = userProfile?.userId || ''
  const contextMenu = useContextMenu(MenuName.UserProfile)
  const saveUserProfileError = useSelector(users.selectors.saveUserProfileError)
  const onSaveUserProfile = ({ photo }: { photo: File }) => {
    // since on electron 32+ .path is undefined on File, we need to set the path property before sneding the profile pic to the backend
    // @ts-ignore
    photo.path = webUtils.getPathForFile(photo)
    dispatch(users.actions.saveUserProfile({ photo }))
  }

  React.useEffect(() => {
    return () => {
      dispatch(users.actions.setSaveUserProfileError(null))
    }
  }, [dispatch])

  return (
    <UserProfileMenuEditView
      username={username}
      userId={userId}
      userProfile={userProfile}
      contextMenu={contextMenu}
      setRoute={setRoute}
      onSaveUserProfile={onSaveUserProfile}
      errorBanner={saveUserProfileError}
    />
  )
}

export interface UserProfileMenuEditViewProps {
  username: string
  userId: string
  userProfile?: UserProfile
  contextMenu: {
    visible: boolean
    handleOpen: (args?: object | undefined) => any
    handleClose: () => any
  }
  setRoute: (route: string) => void
  onSaveUserProfile: ({ photo }: { photo: File }) => void
  errorBanner?: string | null
}

export const UserProfileMenuEditView: FC<UserProfileMenuEditViewProps> = ({
  username,
  userId,
  userProfile,
  contextMenu,
  setRoute,
  onSaveUserProfile,
  errorBanner,
}) => {
  const [contentRef, setContentRef] = useState<HTMLDivElement | null>(null)
  const scrollbarRef = useRef(null)
  const [offset, setOffset] = useState(0)

  const theme = useTheme()

  const adjustOffset = () => {
    if (!contentRef?.clientWidth) return
    if (contentRef.clientWidth > 800) {
      setOffset((contentRef.clientWidth - 800) / 2)
    }
  }

  const { handleClose, ...ctxMenu } = contextMenu

  const handleCloseWrapped = () => {
    setRoute('userProfile')
    handleClose()
  }

  const onChange = async (photo?: File) => {
    if (!photo) {
      return
    }

    onSaveUserProfile({ photo })
  }

  React.useEffect(() => {
    if (contentRef) {
      window.addEventListener('resize', adjustOffset)
      adjustOffset()
    }
  }, [contentRef])

  return (
    <ContextMenu
      title='Edit profile'
      handleBack={() => setRoute('userProfile')}
      handleClose={handleCloseWrapped}
      {...ctxMenu}
    >
      <StyledContextMenuContent
        container
        ref={ref => {
          if (ref) {
            setContentRef(ref)
          }
        }}
      >
        <Grid item xs>
          <AutoSizer>
            {({ width, height }) => {
              const maxWidth = width > 632 ? 632 : width
              return (
                <Scrollbars
                  ref={scrollbarRef}
                  autoHideTimeout={500}
                  style={{ width: maxWidth + offset, height: height }}
                >
                  <Grid container direction='column'>
                    {/* Error banner for saveUserProfile error */}
                    {errorBanner && (
                      <Grid
                        item
                        style={{
                          background: '#ffebee',
                          color: '#b71c1c',
                          padding: '12px 16px',
                          borderRadius: 8,
                          margin: '8px 16px',
                        }}
                      >
                        <Typography variant='body2'>{errorBanner}</Typography>
                      </Grid>
                    )}
                    <Grid container direction='column' className={classes.profilePhotoContainer} alignItems='center'>
                      <ProfilePhoto
                        userProfile={userProfile}
                        userId={userId}
                        className={classes.profilePhoto}
                        size={96}
                      />
                      <EditPhotoButton onChange={onChange} />
                    </Grid>
                    <label htmlFor='username' className={classes.editUsernameFieldLabel}>
                      Username
                    </label>
                    <input type='text' id='name' className={classes.editUsernameField} value={username} disabled />
                  </Grid>
                </Scrollbars>
              )
            }}
          </AutoSizer>
        </Grid>
      </StyledContextMenuContent>
    </ContextMenu>
  )
}

export default UserProfileContextMenu
