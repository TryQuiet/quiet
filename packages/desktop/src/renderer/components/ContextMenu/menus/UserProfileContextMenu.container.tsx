import React, { FC, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'rc-scrollbars'
import { styled, Grid, List, Typography } from '@mui/material'

import { identity, users } from '@quiet/state-manager'

import { useContextMenu } from '../../../../hooks/useContextMenu'
import { useModal } from '../../../containers/hooks'
import { ContextMenu, ContextMenuItemList } from '../ContextMenu.component'
import { ContextMenuItemProps, ContextMenuProps } from '../ContextMenu.types'
import { MenuName } from '../../../../const/MenuNames.enum'
import { ModalName } from '../../../sagas/modals/modals.types'
import Jdenticon from '../../Jdenticon/Jdenticon'

const PREFIX = 'UserProfileContextMenu'

const classes = {
  profilePhotoContainer: `${PREFIX}profilePhotoContainer`,
  profilePhoto: `${PREFIX}profilePhoto`,
  profilePhotoError: `${PREFIX}profilePhotoError`,
  nickname: `${PREFIX}nickname`,
  editUsernameField: `${PREFIX}editUsernameField`,
  editUsernameFieldLabel: `${PREFIX}editUsernameFieldLabel`,
  editPhotoButton: `${PREFIX}editPhotoButton`,
}

const StyledContextMenuContent = styled(Grid)(() => ({
  zIndex: 9002,
  flex: 1,

  [`& .${classes.profilePhotoContainer}`]: {
    padding: '24px 16px 16px 16px',
  },

  [`& .${classes.profilePhoto}`]: {
    width: '96px',
    height: '96px',
    borderRadius: '8px',
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
    fontSize: '16px',
    fontStyle: 'normal',
    fontWeight: '500',
  },

  [`& .${classes.editUsernameFieldLabel}`]: {
    color: '#4C4C4C',
    margin: '0px 16px 8px 16px',
    fontSize: '14px',
    fontWeight: '400',
    fontFamily: 'Rubik, sans-serif',
  },

  [`& .${classes.editUsernameField}`]: {
    color: '#33333380',
    background: '#F0F0F0',
    margin: '0px 16px',
    padding: '16px',
    border: '1px solid #B3B3B3',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '400',
    fontFamily: 'Rubik, sans-serif',
  },

  [`& .${classes.editPhotoButton}`]: {
    background: 'inherit',
    padding: '6px 12px',
    borderRadius: '16px',
    border: '1px solid #B3B3B3',
    fontSize: '14px',
    fontWeight: '400',
    textTransform: 'none',
    fontFamily: 'Rubik, sans-serif',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#B3B3B31A',
    },
  },
}))

/**
 * Context menu view that switches between user profile subviews.
 */
export const UserProfileContextMenu: FC = () => {
  const [route, setRoute] = useState('userProfile')

  const views: Map<string, JSX.Element> = new Map()
  views.set('userProfile', <UserProfileMenuProfileComponent setRoute={setRoute} />)
  views.set('userProfile/edit', <UserProfileMenuEditComponent setRoute={setRoute} />)
  return views.get(route) || (views.get('userProfile') as JSX.Element)
}

/**
 * Context menu view that allows the user to view their user profile
 * and associated actions (e.g. edit profile)
 */
export const UserProfileMenuProfileComponent: FC<{ setRoute: (route: string) => void }> = ({ setRoute }) => {
  const currentIdentity = useSelector(identity.selectors.currentIdentity)
  const userProfile = useSelector(users.selectors.myUserProfile)
  const username = currentIdentity?.nickname || ''
  const pubKey = useSelector(identity.selectors.currentPubKey)
  const contextMenu = useContextMenu(MenuName.UserProfile)

  return (
    <UserProfileMenuProfileView
      username={username}
      pubKey={pubKey}
      userProfile={userProfile}
      contextMenu={contextMenu}
      setRoute={setRoute}
    />
  )
}

export interface UserProfileMenuProfileViewProps {
  username: string
  pubKey?: string
  userProfile?: { profile: { photo: string } }
  contextMenu: {
    // FIXME: should be boolean; useContextMenu typing is broken
    visible: boolean
    handleOpen: (args?: object | undefined) => any
    handleClose: () => any
  }
  setRoute: (route: string) => void
}

export const UserProfileMenuProfileView: FC<UserProfileMenuProfileViewProps> = ({
  username,
  pubKey,
  userProfile,
  contextMenu,
  setRoute,
}) => {
  const items: ContextMenuItemProps[] = [
    {
      title: 'Edit profile',
      action: () => {
        setRoute('userProfile/edit')
      },
    },
  ]

  const [contentRef, setContentRef] = useState<HTMLDivElement | null>(null)
  const scrollbarRef = useRef(null)
  const [offset, setOffset] = useState(0)

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
                      {userProfile?.profile.photo ? (
                        <img
                          className={classes.profilePhoto}
                          src={userProfile?.profile.photo}
                          alt={'Your user profile image'}
                        />
                      ) : (
                        <Jdenticon
                          value={pubKey}
                          size='96'
                          style={{
                            width: '96px',
                            height: '96px',
                            background: '#F3F0F6',
                            borderRadius: '8px',
                            marginBottom: '16px',
                          }}
                        />
                      )}
                      <Typography variant='body2' className={classes.nickname}>
                        {username}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <ContextMenuItemList items={items} />
                    </Grid>
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
 * A button that shows a file input dialog for uploading a profile
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
        accept='image/png, image/jpeg, image/gif'
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
  const currentIdentity = useSelector(identity.selectors.currentIdentity)
  const userProfile = useSelector(users.selectors.myUserProfile)
  const username = currentIdentity?.nickname || ''
  const pubKey = useSelector(identity.selectors.currentPubKey)
  const contextMenu = useContextMenu(MenuName.UserProfile)
  const onSaveUserProfile = ({ photo }: { photo: File }) => {
    dispatch(users.actions.saveUserProfile({ photo }))
  }

  return (
    <UserProfileMenuEditView
      username={username}
      pubKey={pubKey}
      userProfile={userProfile}
      contextMenu={contextMenu}
      setRoute={setRoute}
      onSaveUserProfile={onSaveUserProfile}
    />
  )
}

export interface UserProfileMenuEditViewProps {
  username: string
  pubKey?: string
  userProfile?: { profile: { photo: string } }
  contextMenu: {
    visible: boolean
    handleOpen: (args?: object | undefined) => any
    handleClose: () => any
  }
  setRoute: (route: string) => void
  onSaveUserProfile: ({ photo }: { photo: File }) => void
}

export const UserProfileMenuEditView: FC<UserProfileMenuEditViewProps> = ({
  username,
  pubKey,
  userProfile,
  contextMenu,
  setRoute,
  onSaveUserProfile,
}) => {
  const [error, setError] = useState<string>('')

  const [contentRef, setContentRef] = useState<HTMLDivElement | null>(null)
  const scrollbarRef = useRef(null)
  const [offset, setOffset] = useState(0)

  const adjustOffset = () => {
    if (!contentRef?.clientWidth) return
    if (contentRef.clientWidth > 800) {
      setOffset((contentRef.clientWidth - 800) / 2)
    }
  }

  const getImageSize = (file: File) => {
    return new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image()

      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  const onChange = async (photo?: File) => {
    if (!photo) {
      return
    }

    let width: number, height: number

    try {
      ;({ width, height } = await getImageSize(photo))
    } catch (err) {
      const msg = 'Failed to get image size'
      console.error(msg)
      setError(msg)
      return
    }

    if (width === 0 || height === 0) {
      const msg = `Image has invalid dimensions: width: ${width}, height: ${height}`
      console.error(msg)
      setError(msg)
      return
    }

    if (width > 200 || height > 200) {
      const msg = 'Image dimensions must be less than or equal to 200px by 200px'
      console.error(msg)
      setError(msg)
      return
    }

    // 200 KB = 204800 B limit
    if (photo.size > 204800) {
      const msg = 'Image size must be less than or equal to 200KB'
      console.error(msg)
      setError(msg)
      return
    }

    setError('')
    onSaveUserProfile({ photo })
  }

  React.useEffect(() => {
    if (contentRef) {
      window.addEventListener('resize', adjustOffset)
      adjustOffset()
    }
  }, [contentRef])

  return (
    <ContextMenu title='Edit profile' handleBack={() => setRoute('userProfile')} {...contextMenu}>
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
                      {userProfile?.profile.photo ? (
                        <img
                          className={classes.profilePhoto}
                          src={userProfile?.profile.photo}
                          alt={'Your user profile image'}
                        />
                      ) : (
                        <Jdenticon
                          value={pubKey}
                          size='96'
                          style={{
                            width: '96px',
                            height: '96px',
                            background: '#F3F0F6',
                            borderRadius: '8px',
                            marginBottom: '16px',
                          }}
                        />
                      )}
                      <EditPhotoButton onChange={onChange} />
                      <span className={error ? classes.profilePhotoError + ' show' : classes.profilePhotoError}>
                        {error}
                      </span>
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
