import React from 'react'
import { styled } from '@mui/material/styles'
import { Button } from '@mui/material'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useModal } from '../../../containers/hooks'
import { Community } from '@quiet/types'

const PREFIX = 'IdentityPanel'

const classes = {
  root: `${PREFIX}root`,
  button: `${PREFIX}button`,
  nickname: `${PREFIX}nickname`
}

const IdentityPanelButtonStyled = styled('div')((
  {
    theme
  }
) => ({
  marginTop: theme.spacing(1),
  paddingLeft: 16,
  paddingRight: 16,

  [`& .${classes.button}`]: {
    color: theme.palette.colors.white,
    padding: 0,
    textAlign: 'left',
    opacity: 0.8,
    justifyContent: 'flex-start',
    textTransform: 'capitalize',
    '&:hover': {
      opacity: 1,
      backgroundColor: 'inherit'
    }
  },

  [`& .${classes.nickname}`]: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 175,
    whiteSpace: 'nowrap'
  }
}))

export interface IdentityPanelProps {
  currentCommunity: Community
  accountSettingsModal: ReturnType<typeof useModal>
}

export const IdentityPanel: React.FC<IdentityPanelProps> = ({
  currentCommunity,
  accountSettingsModal
}) => {
  const communityName = currentCommunity?.name || ''
  return (
    <IdentityPanelButtonStyled>
      <Button
        onClick={event => {
          event.persist()
          accountSettingsModal.handleOpen()
        }}
        component='span'
        classes={{ root: classes.button }}
        data-testid={'settings-panel-button'}>
        <Typography variant='h4' className={classes.nickname}>
          {communityName}
        </Typography>
        <ExpandMoreIcon fontSize='small' />
      </Button>
    </IdentityPanelButtonStyled>
  )
}

export default IdentityPanel
