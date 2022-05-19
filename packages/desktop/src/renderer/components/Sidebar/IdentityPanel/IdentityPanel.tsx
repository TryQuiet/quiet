import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Button } from '@material-ui/core'
import Typography from '@material-ui/core/Typography'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { useModal } from '../../../containers/hooks'
import { capitalizeFirstLetter } from '../../../../utils/functions/capitalize'
import { Community } from '@quiet/state-manager'

const useStyles = makeStyles(theme => ({
  root: {
    marginTop: theme.spacing(1),
    paddingLeft: 16,
    paddingRight: 16
  },
  button: {
    color: theme.palette.colors.white,
    padding: 0,
    textAlign: 'left',
    opacity: 0.8,
    '&:hover': {
      opacity: 1,
      backgroundColor: 'inherit'
    }
  },
  buttonLabel: {
    justifyContent: 'flex-start',
    textTransform: 'none'
  },
  nickname: {
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
  const classes = useStyles({})

  let communityName = ''
  if (currentCommunity?.name) {
    communityName = capitalizeFirstLetter(currentCommunity.name)
  }

  return (
    <div className={classes.root}>
      <Button
        onClick={event => {
          event.persist()
          accountSettingsModal.handleOpen()
        }}
        component='span'
        classes={{ root: classes.button, label: classes.buttonLabel }}
        data-testid={'settings-panel-button'}>
        <Typography variant='h4' className={classes.nickname}>
          {communityName}
        </Typography>
        <ExpandMoreIcon fontSize='small' />
      </Button>
    </div>
  )
}

export default IdentityPanel
