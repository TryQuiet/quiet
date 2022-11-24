import React from 'react'
import { styled } from '@mui/material/styles'
import { Button } from '@mui/material'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useModal } from '../../../containers/hooks'
import { capitalizeFirstLetter } from '../../../../utils/functions/capitalize'
import { Community } from '@quiet/state-manager'

const PREFIX = 'IdentityPanel';

const classes = {
  root: `${PREFIX}-root`,
  button: `${PREFIX}-button`,
  buttonLabel: `${PREFIX}-buttonLabel`,
  nickname: `${PREFIX}-nickname`
};

const Root = styled('div')((
  {
    theme
  }
) => ({
  [`&.${classes.root}`]: {
    marginTop: theme.spacing(1),
    paddingLeft: 16,
    paddingRight: 16
  },

  [`& .${classes.button}`]: {
    color: theme.palette.colors.white,
    padding: 0,
    textAlign: 'left',
    opacity: 0.8,
    '&:hover': {
      opacity: 1,
      backgroundColor: 'inherit'
    }
  },

  [`& .${classes.buttonLabel}`]: {
    justifyContent: 'flex-start',
    textTransform: 'none'
  },

  [`& .${classes.nickname}`]: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 175,
    whiteSpace: 'nowrap'
  }
}));

export interface IdentityPanelProps {
  currentCommunity: Community
  accountSettingsModal: ReturnType<typeof useModal>
}

export const IdentityPanel: React.FC<IdentityPanelProps> = ({
  currentCommunity,
  accountSettingsModal
}) => {


  let communityName = ''
  if (currentCommunity?.name) {
    communityName = capitalizeFirstLetter(currentCommunity.name)
  }

  return (
    <Root className={classes.root}>
      <Button
        onClick={event => {
          event.persist()
          accountSettingsModal.handleOpen()
        }}
        component='span'
        classes={{ root: classes.button }} // label: classes.buttonLabel
        data-testid={'settings-panel-button'}>
        <Typography variant='h4' className={classes.nickname}>
          {communityName}
        </Typography>
        <ExpandMoreIcon fontSize='small' />
      </Button>
    </Root>
  );
}

export default IdentityPanel
