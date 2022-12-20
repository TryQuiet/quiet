import React from 'react'

import { styled } from '@mui/material/styles'

import { Grid } from '@mui/material'

import dotsIcon from '../../../static/images/zcash/dots-icon.svg'
import MenuAction from '../../ui/MenuAction/MenuAction'
import MenuActionItem from '../../ui/MenuAction/MenuActionItem'

const PREFIX = 'ChannelMenuActionComponent'

const classes = {
  menuList: `${PREFIX}menuList`,
  icon: `${PREFIX}icon`,
  sublabel: `${PREFIX}sublabel`
}

const StyledMenuAction = styled(MenuAction)((
  {
    theme
  }
) => ({
  [`& .${classes.menuList}`]: {
    padding: `${theme.spacing(1.5)} 0`
  },

  [`& .${classes.icon}`]: {
    width: 30,
    height: 30
  },

  [`& .${classes.sublabel}`]: {
    color: theme.palette.colors.darkGray,
    letterSpacing: 0.4,
    fontSize: 12,
    lineHeight: '18px'
  }
}))

export interface ChannelMenuActionProps {
  onInfo: () => void
  onMute?: () => void
  onUnmute?: () => void
  onDelete: () => void
  onSettings: () => void
  mutedFlag: boolean
  disableSettings?: boolean
  notificationFilter: string
  openNotificationsTab: () => void
}

export const ChannelMenuActionComponent: React.FC<ChannelMenuActionProps> = ({
  onInfo,
  onMute,
  onUnmute,
  onDelete,
  onSettings,
  mutedFlag,
  disableSettings = false,
  notificationFilter,
  openNotificationsTab
}) => {
  const [openDialog, setOpenDialog] = React.useState(false)
  return (
    <StyledMenuAction
      icon={dotsIcon}
      iconHover={dotsIcon}
      offset='0 8'
    >
      <MenuActionItem onClick={onInfo} title='Info & Invites' />

      <MenuActionItem
        onClick={e => {
          e.preventDefault()
          setOpenDialog(true)
        }}
        closeAfterAction={false}
        title='Remove'
      />

      {!disableSettings
        ? (
          <MenuActionItem onClick={onSettings} title='Settings' />
        )
        : (
          <span />
        )}
      {!disableSettings
        ? (
          <MenuActionItem
            onClick={() => {
              openNotificationsTab()
              onSettings()
            }}
            title={
              <Grid container direction='column'>
                <Grid item>Notifications</Grid>
                <Grid item className={classes.sublabel}>
                  {notificationFilter}
                </Grid>
              </Grid>
            }
          />
        )
        : (
          <span />
        )}
      <MenuActionItem
        onClick={mutedFlag ? onUnmute : onMute}
        title={mutedFlag ? 'Unmute' : 'Mute'}
      />
      {/* <ConfirmModal
        open={openDialog}
        title={'Are you sure you want to remove this channel?'}
        actionName='Yes'
        cancelName='No'
        handleClose={() => setOpenDialog(false)}
        handleAction={onDelete}
      /> */}
    </StyledMenuAction>
  )
}

export default ChannelMenuActionComponent
