import React from 'react'
import { styled } from '@mui/material/styles'
import Modal from '../ui/Modal/Modal'
import QuietLogo from '../../static/images/quiet-logo.png'
import { Grid } from '@mui/material'

const PREFIX = 'StartingPanelComponent'

const classes = {
  root: `${PREFIX}root`,
  spinner: `${PREFIX}spinner`,
  image: `${PREFIX}image`,
  contentWrapper: `${PREFIX}contentWrapper`,
  heading2: `${PREFIX}heading2`,
  link: `${PREFIX}link`,
  text: `${PREFIX}text`,
  progressBar: `${PREFIX}progressBar`,
  progress: `${PREFIX}progress`,
}

const StyledGrid = styled(Grid)(({ theme, width }) => ({
  [`&.${classes.root}`]: {
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  [`& .${classes.contentWrapper}`]: {
    maxWidth: '320px',
  },
  [`& .${classes.image}`]: {
    width: '95px',
    height: '95px',
    marginBottom: '58px',
  },
  [`& .${classes.heading2}`]: {
    fontSize: '18px',
    marginTop: '12px',
  },
  [`& .${classes.link}`]: {
    color: theme.palette.colors.blue,
    cursor: 'pointer',
    marginTop: '16px',
  },
  [`& .${classes.text}`]: {
    color: theme.palette.colors.black30,
  },
  [`& .${classes.progressBar}`]: {
    backgroundColor: theme.palette.colors.veryLightGray,
    width: '300px',
    height: '4px',
    position: 'relative',
    borderRadius: '100px',
    overflow: 'hidden',
    marginBottom: '16px',
  },
  [`& .${classes.progress}`]: {
    backgroundColor: theme.palette.colors.lushSky,
    width: width,
    height: '4px',
    position: 'relative',
  },
}))

export interface StartingPanelComponentProps {
  open: boolean
  handleClose: () => void
}

const StartingPanelComponent: React.FC<StartingPanelComponentProps> = ({ open, handleClose }) => {
  return (
    <Modal open={open} handleClose={handleClose} isCloseDisabled={true}>
      <StyledGrid container justifyContent='center' alignItems='center' className={classes.root}>
        <Grid
          container
          alignItems='center'
          direction='column'
          className={classes.contentWrapper}
          data-testid='startingPanelComponent'
        >
          <img className={classes.image} src={QuietLogo} />
        </Grid>
      </StyledGrid>
    </Modal>
  )
}

export default StartingPanelComponent
